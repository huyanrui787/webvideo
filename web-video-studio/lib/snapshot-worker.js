/**
 * Standalone snapshot worker — takes screenshots of every step in a presentation.
 *
 * Usage: node snapshot-worker.js <projectId> <port> <projectsRoot>
 *
 * Output: <projectDir>/.snapshots/<chapterId>/step-<N>.png
 * Summary: <projectDir>/.snapshots/summary.json
 */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const [, , projectId, portStr, projectsRoot] = process.argv;
const port = parseInt(portStr, 10);
const projDir = path.join(projectsRoot, projectId);
const presDir = path.join(projDir, "presentation");
const snapDir = path.join(projDir, ".snapshots");

function writeSummary(obj) {
  fs.mkdirSync(snapDir, { recursive: true });
  fs.writeFileSync(path.join(snapDir, "summary.json"), JSON.stringify(obj, null, 2));
}

/** Parse chapters.ts to get chapter IDs */
function getChapterIds() {
  const chaptersFile = path.join(presDir, "src/registry/chapters.ts");
  if (!fs.existsSync(chaptersFile)) return [];
  const src = fs.readFileSync(chaptersFile, "utf-8");
  const idRe = /\{\s*id:\s*"([^"]+)"/g;
  const ids = [];
  let m;
  while ((m = idRe.exec(src)) !== null) ids.push(m[1]);
  return ids;
}

/** Get step count for a chapter by reading its narrations file */
function getStepCount(chapterId) {
  const narFile = path.join(presDir, "src/chapters", chapterId, "narrations.ts");
  if (!fs.existsSync(narFile)) return 1;
  const src = fs.readFileSync(narFile, "utf-8");
  // Count string literals in the array
  const strRe = /["'`](?:[^"'`\\]|\\.)*["'`]/g;
  let count = 0;
  while (strRe.exec(src) !== null) count++;
  return Math.max(1, count);
}

async function run() {
  const chapterIds = getChapterIds();
  if (chapterIds.length === 0) {
    console.error("No chapters found");
    process.exit(1);
  }

  fs.mkdirSync(snapDir, { recursive: true });
  const summary = { projectId, chapters: {}, totalSteps: 0, errors: [] };

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", "--use-gl=egl",
      "--enable-gpu-rasterization",
    ],
  });

  try {
    for (const chapterId of chapterIds) {
      const chapterSnapDir = path.join(snapDir, chapterId);
      fs.mkdirSync(chapterSnapDir, { recursive: true });

      const stepCount = getStepCount(chapterId);
      summary.chapters[chapterId] = { stepCount, snapshots: [] };

      // Open fresh page for each chapter
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();

      try {
        // Load presentation in snapshot mode (skips animations, renders final state)
        await page.goto(
          `http://localhost:${port}/?render=1&snapshot=1&chapter=${chapterId}`,
          { waitUntil: "networkidle", timeout: 30000 }
        );
        await page.evaluate(() => document.fonts.ready).catch(() => {});

        for (let step = 0; step < stepCount; step++) {
          // Advance to step
          await page.evaluate((s) => {
            (window).__snapshotStep = s;
            window.dispatchEvent(new CustomEvent("snapshot-step", { detail: s }));
          }, step);

          // Wait for render
          await new Promise((r) => setTimeout(r, 500));

          // Screenshot
          const filename = `step-${String(step).padStart(2, "0")}.png`;
          const filepath = path.join(chapterSnapDir, filename);
          await page.screenshot({ path: filepath, type: "png" });

          summary.chapters[chapterId].snapshots.push({
            step,
            file: `snapshots/${chapterId}/${filename}`,
          });
          summary.totalSteps++;
        }
      } catch (err) {
        summary.errors.push(`Chapter ${chapterId}: ${err.message}`);
      } finally {
        await context.close();
      }
    }

    writeSummary(summary);
    console.log(`Done: ${summary.totalSteps} snapshots across ${chapterIds.length} chapters`);
    if (summary.errors.length > 0) {
      console.error("Errors:", summary.errors.join("\n"));
    }
  } finally {
    await browser.close();
  }

  // ── Auto-trigger vision review if API key is available ─────────
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const reviewWorkerPath = path.join(__dirname, "review-worker.js");
      if (fs.existsSync(reviewWorkerPath)) {
        const { spawn } = require("child_process");
        const child = spawn(
          process.execPath,
          [reviewWorkerPath, projectId, projectsRoot],
          { detached: true, stdio: "ignore" }
        );
        child.unref();
        console.log("[snapshot-worker] Vision review worker started");
      }
    } catch (err) {
      console.warn("[snapshot-worker] Failed to start review worker:", err.message);
    }
  }
}

run().catch((err) => {
  console.error("Snapshot worker failed:", err.message);
  process.exit(1);
});
