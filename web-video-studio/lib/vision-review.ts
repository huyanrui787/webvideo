/**
 * Vision Review — AI-powered visual quality assessment for presentation snapshots.
 *
 * Sends step screenshots to a vision-capable model for automated review.
 * Evaluates: text readability, layout balance, AI smell detection, animation quality.
 */

import path from "path";
import fs from "fs";
import { projectDir } from "@/lib/projects";

// ── Types ──────────────────────────────────────────────────────────────────

export interface VisionReviewVerdict {
  step: number;
  chapterId: string;
  score: number; // 0-10
  issues: VisionIssue[];
  passed: boolean;
}

export interface VisionIssue {
  severity: "error" | "warning" | "info";
  category: "readability" | "layout" | "ai-smell" | "animation" | "accessibility";
  description: string;
}

export interface ChapterReview {
  chapterId: string;
  steps: VisionReviewVerdict[];
  averageScore: number;
  passedAll: boolean;
}

const REVIEW_CHECKLIST = `
Evaluate this presentation slide screenshot against these criteria:

1. TEXT READABILITY (0-10):
   - Are fonts large enough to read at 1920x1080 on screen?
   - Is there sufficient contrast between text and background?
   - Is there any text overflow or truncation?

2. LAYOUT BALANCE (0-10):
   - Are elements overlapping?
   - Are there dead zones (large empty areas) or crowding?
   - Is the 16:9 aspect ratio well utilized?
   - Is padding/margins adequate (80px safe zone)?

3. AI SMELL DETECTION (pass/fail):
   - Purple/pink diagonal gradient backgrounds?
   - Rounded cards with colored left border decorations?
   - Emoji used as icons?
   - Fake data ("X million users", "99.9%", made-up logos)?
   - Same entrance animation used for every element?
   - Continuous ken burns / glow breathing / blinking effects?
   - Mono label / sequence number in bottom-right?

4. ANIMATION QUALITY (0-10):
   - Are staggered reveals appropriate?
   - Is motion timing natural?
   - Are there orphaned elements (animated in but not used)?

Return a JSON response with this structure:
{
  "readability": <0-10>,
  "layout": <0-10>,
  "animation": <0-10>,
  "aiSmellDetected": <true/false>,
  "aiSmellDetails": ["<specific issue>", ...],
  "overallScore": <0-10>,
  "issues": [
    {"severity": "error|warning|info", "category": "...", "description": "..."}
  ]
}
`;

/**
 * Placeholder: In production, this would call the AI vision model.
 * Currently works as a structural checklist that generates issues
 * based on known patterns (CSS checks, token validation results).
 *
 * Full integration requires:
 *   1. Loading snapshots from .snapshots/<chapterId>/step-*.png
 *   2. Sending to vision model (Claude/GPT-4V) with REVIEW_CHECKLIST
 *   3. Parsing JSON response into VisionReviewVerdict[]
 */
export function reviewChecklistPrompt(): string {
  return REVIEW_CHECKLIST;
}

/** Load snapshot summary from disk */
export function loadSnapshotSummary(projectId: string): Record<string, any> | null {
  const summaryPath = path.join(projectDir(projectId), ".snapshots", "summary.json");
  if (!fs.existsSync(summaryPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
  } catch {
    return null;
  }
}

/** Check if snapshots exist for a project */
export function hasSnapshots(projectId: string): boolean {
  return fs.existsSync(path.join(projectDir(projectId), ".snapshots", "summary.json"));
}

/** Write review results to disk */
export function writeReviewResults(
  projectId: string,
  chapters: ChapterReview[]
): void {
  const reviewPath = path.join(projectDir(projectId), ".snapshot-review.json");
  fs.writeFileSync(reviewPath, JSON.stringify({
    chapters,
    reviewedAt: Date.now(),
    totalScore: chapters.length > 0
      ? chapters.reduce((s, c) => s + c.averageScore, 0) / chapters.length
      : 0,
  }, null, 2));
}

/** Load review results from disk */
export function loadReviewResults(projectId: string): Record<string, any> | null {
  const reviewPath = path.join(projectDir(projectId), ".snapshot-review.json");
  if (!fs.existsSync(reviewPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(reviewPath, "utf-8"));
  } catch {
    return null;
  }
}
