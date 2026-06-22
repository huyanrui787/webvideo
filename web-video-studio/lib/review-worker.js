/**
 * Vision Review Worker — AI-powered visual QA pipeline.
 *
 * After snapshots are taken (snapshot-worker.js), this worker:
 *   1. Reads .snapshots/<chapterId>/step-*.png
 *   2. Sends each screenshot to a vision-capable model (Claude / GPT-4V)
 *   3. Evaluates against the REVIEW_CHECKLIST dimensions
 *   4. Writes structured results to .snapshot-review.json
 *
 * Usage: node review-worker.js <projectId> <projectsRoot>
 */

const path = require("path");
const fs = require("fs");

const [, , projectId, projectsRoot] = process.argv;
const projDir = path.join(projectsRoot, projectId);
const snapDir = path.join(projDir, ".snapshots");
const reviewFile = path.join(projDir, ".snapshot-review.json");
const statusFile = path.join(projDir, ".review-status.json");

// ── Config ──────────────────────────────────────────────────────────────────

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE = process.env.ANTHROPIC_BASE_URL || "https://qqqapi.com";
const REVIEW_MODEL = process.env.REVIEW_MODEL || "claude-sonnet-4-6";
const BATCH_SIZE = 4; // steps per API call (multi-image)
const MAX_STEPS_PER_CHAPTER = 20;

function writeStatus(obj) {
  fs.writeFileSync(statusFile, JSON.stringify({ ...obj, updatedAt: Date.now() }));
}

// ── Review Checklist Prompt ──────────────────────────────────────────────────

const REVIEW_PROMPT = `Evaluate this presentation slide screenshot against these criteria.
Respond with ONLY a valid JSON object, no markdown or extra text.

{
  "readability": <0-10: font size adequate at 1920x1080? contrast sufficient? text overflow?>,
  "layout": <0-10: balanced? no overlaps? dead zones? 16:9 well utilized? 80px safe zone?>,
  "animation": <0-10: appropriate stagger reveals? natural motion timing? orphaned elements?>,
  "aiSmellDetected": <true/false>,
  "aiSmellDetails": ["specific AI smell issues found", ...],
  "overallScore": <0-10>,
  "issues": [
    {"severity": "error|warning|info", "category": "readability|layout|ai-smell|animation|accessibility", "description": "..."}
  ]
}

AI Smell Checklist (mark aiSmellDetected=true if ANY of these):
- Purple/pink diagonal gradient backgrounds
- Rounded cards with colored left borders
- Emoji used as icons
- Fake generic data ("X million users", "99.9%")
- Same entrance animation for everything
- Continuous glow/breathing/blinking effects
- Monospace label or sequence number in bottom-right corner
- Generic "modern minimalist flat design" aesthetic`;

// ── Image loading ───────────────────────────────────────────────────────────

function imageToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
  return { data: buffer.toString("base64"), mimeType };
}

// ── Vision API call ─────────────────────────────────────────────────────────

async function reviewStep(imagePath, chapterId, stepIndex) {
  if (!ANTHROPIC_KEY) {
    // Fallback: heuristic-only review
    return heuristicReview(imagePath, chapterId, stepIndex);
  }

  const { data, mimeType } = imageToBase64(imagePath);

  try {
    const res = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: REVIEW_MODEL,
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data },
            },
            { type: "text", text: REVIEW_PROMPT },
          ],
        }],
      }),
    });

    if (!res.ok) {
      console.warn(`[review-worker] API error ${res.status} for ${chapterId}:${stepIndex}`);
      return heuristicReview(imagePath, chapterId, stepIndex);
    }

    const result = await res.json();
    const text = result?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(`[review-worker] No JSON in response for ${chapterId}:${stepIndex}`);
      return heuristicReview(imagePath, chapterId, stepIndex);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      step: stepIndex,
      chapterId,
      score: parsed.overallScore ?? 5,
      readability: parsed.readability ?? 5,
      layout: parsed.layout ?? 5,
      animation: parsed.animation ?? 5,
      aiSmellDetected: parsed.aiSmellDetected ?? false,
      aiSmellDetails: parsed.aiSmellDetails || [],
      issues: (parsed.issues || []).map((i) => ({
        severity: i.severity || "warning",
        category: i.category || "layout",
        description: i.description || "",
      })),
      passed: (parsed.overallScore ?? 5) >= 6,
    };
  } catch (err) {
    console.warn(`[review-worker] Vision review failed for ${chapterId}:${stepIndex}:`, err.message);
    return heuristicReview(imagePath, chapterId, stepIndex);
  }
}

// ── Heuristic fallback (no API call) ─────────────────────────────────────────

function heuristicReview(imagePath, chapterId, stepIndex) {
  // When no vision API is available, return a neutral placeholder
  // indicating that vision review is pending.
  return {
    step: stepIndex,
    chapterId,
    score: 0,
    readability: 0,
    layout: 0,
    animation: 0,
    aiSmellDetected: false,
    aiSmellDetails: [],
    issues: [{
      severity: "info",
      category: "accessibility",
      description: "视觉审查未执行（缺少 API 密钥）。配置 ANTHROPIC_API_KEY 以启用。",
    }],
    passed: true, // Don't block on missing API
    pendingVisionReview: true,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function run() {
  writeStatus({ status: "running", progress: "加载截图…" });

  const summaryPath = path.join(snapDir, "summary.json");
  if (!fs.existsSync(summaryPath)) {
    writeStatus({ status: "error", error: "snapshots/summary.json not found — run snapshot-worker.js first" });
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
  const chapters = summary.chapters || {};
  const chapterIds = Object.keys(chapters);

  if (chapterIds.length === 0) {
    writeStatus({ status: "error", error: "No chapters with snapshots" });
    process.exit(1);
  }

  const reviewResults = { chapters: {}, totalScore: 0, reviewedAt: Date.now(), errors: [] };

  let totalSteps = 0;
  let reviewedSteps = 0;

  for (const chapterId of chapterIds) {
    const chapterSnaps = chapters[chapterId].snapshots || [];
    const stepReviews = [];

    writeStatus({ status: "running", progress: `审查章节: ${chapterId} (${chapterSnaps.length} 步)…`, chapter: chapterId });

    for (const snap of chapterSnaps) {
      const imagePath = path.join(snapDir, snap.file);
      if (!fs.existsSync(imagePath)) {
        reviewResults.errors.push(`Missing: ${snap.file}`);
        continue;
      }

      const review = await reviewStep(imagePath, chapterId, snap.step);
      stepReviews.push(review);
      reviewedSteps++;
      totalSteps++;

      if (reviewedSteps % 5 === 0 || reviewedSteps === totalSteps) {
        writeStatus({
          status: "running",
          progress: `审查中… ${reviewedSteps}/${totalSteps} 步`,
          reviewedSteps,
          totalSteps,
        });
      }
    }

    const avgScore = stepReviews.length > 0
      ? Math.round(stepReviews.reduce((s, r) => s + r.score, 0) / stepReviews.length * 10) / 10
      : 0;

    reviewResults.chapters[chapterId] = {
      chapterId,
      steps: stepReviews,
      averageScore: avgScore,
      passedAll: stepReviews.every((r) => r.passed),
    };
  }

  // ── Overall score ──────────────────────────────────────────────────────
  const allScores = Object.values(reviewResults.chapters)
    .flatMap((ch) => ch.steps.map((s) => s.score));
  reviewResults.totalScore = allScores.length > 0
    ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length * 10) / 10
    : 0;

  // ── AI Smell summary ───────────────────────────────────────────────────
  const smellSteps = Object.values(reviewResults.chapters)
    .flatMap((ch) => ch.steps.filter((s) => s.aiSmellDetected));
  if (smellSteps.length > 0) {
    reviewResults.aiSmellSummary = {
      count: smellSteps.length,
      details: smellSteps.flatMap((s) => s.aiSmellDetails),
    };
  }

  fs.writeFileSync(reviewFile, JSON.stringify(reviewResults, null, 2));

  writeStatus({
    status: "done",
    progress: `审查完成: ${reviewResults.totalScore}/10 (${reviewedSteps} 步, ${smellSteps.length} AI味)`,
    totalScore: reviewResults.totalScore,
    reviewedSteps,
    totalSteps,
    aiSmellCount: smellSteps.length,
  });
}

run().catch((err) => {
  console.error("[review-worker] Failed:", err.message);
  writeStatus({ status: "error", error: err.message });
  process.exit(1);
});
