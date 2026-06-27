/**
 * Server-side illustration pipeline orchestrator.
 *
 * Triggered automatically when ProjectSetStatus("illustrating") is called
 * for illustration-video / illustrated-article projects. Also used by the
 * gen-ill API route for manual retries.
 *
 * Flow:
 *   import shots → spawn generation script → script auto-advances to "done"
 *
 * No frontend polling, no triggerRef, no chat injection.
 */
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { db } from "@/lib/db";
import { illustrationShots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { projectDir } from "@/lib/projects";
import { publishProjectEvent } from "@/lib/events";

/** Import shots from illustrations.json into DB. Idempotent — skips if already imported. */
export async function importShotsFromIllustrations(projectId: string): Promise<number> {
  const illPath = path.join(projectDir(projectId), "illustrations.json");
  if (!fs.existsSync(illPath)) throw new Error("illustrations.json not found");
  const illData = JSON.parse(fs.readFileSync(illPath, "utf-8"));
  const shots: any[] = illData.shots ?? [];
  if (shots.length === 0) throw new Error("No shots in illustrations.json");

  // Idempotent: skip if already imported
  const existing = await db
    .select({ id: illustrationShots.id })
    .from(illustrationShots)
    .where(eq(illustrationShots.projectId, projectId))
    .limit(1);
  if (existing.length > 0) return shots.length;

  const { nanoid } = await import("nanoid");
  const now = Math.floor(Date.now() / 1000);
  const records = shots.map((s: any, i: number) => ({
    id: nanoid(),
    projectId,
    chapterId: s.chapterId ?? s.chapter ?? "",
    stepIdx: s.stepIdx ?? s.stepHint ?? (() => { const m = String(s.id ?? "").match(/step-(\d+)/); return m ? parseInt(m[1], 10) - 1 : i; })(),
    theme: s.theme ?? "midnight-press",
    structureType: (s.structureType ?? s.structure ?? s.composition ?? "concept-metaphor") as any,
    coreIdea: (s.coreIdea ?? s.anchorMoment ?? s.description ?? "").slice(0, 200),
    xiaoheiAction: s.xiaoheiAction ?? null,
    elements: JSON.stringify(s.elements ?? []),
    labels: JSON.stringify(s.labels ?? s.annotations ?? []),
    styleHint: s.styleHint ?? s.prompt ?? null,
    sortOrder: i,
    generationStatus: "pending" as const,
    createdAt: now,
  }));
  await db.insert(illustrationShots).values(records);
  console.log(`[illustration-pipeline] Imported ${records.length} shots for ${projectId}`);
  return records.length;
}

/** Spawn the generate-illustrations.ts script as a detached background process. */
export function spawnIllustrationGeneration(projectId: string): void {
  const pDir = projectDir(projectId);
  const lockFile = path.join(pDir, ".gen-lock");

  // Guard: don't spawn if already running
  if (fs.existsSync(lockFile)) {
    try {
      const pid = parseInt(fs.readFileSync(lockFile, "utf-8").trim(), 10);
      process.kill(pid, 0); // Check if PID is alive
      console.log(`[illustration-pipeline] Already running (PID ${pid}) for ${projectId}`);
      return;
    } catch {
      // Stale lock — clean up
      try { fs.unlinkSync(lockFile); } catch {}
    }
  }

  // Write gen-started marker
  fs.writeFileSync(path.join(pDir, ".gen-started"), String(Date.now()));

  const cwd = path.resolve(projectDir(""), "..");
  // Resolve API key: env var → .env.local → .env → error
  let key = process.env.GPT_IMAGE_KEY;
  if (!key) {
    for (const envFile of [".env.local", ".env"]) {
      try {
        const contents = fs.readFileSync(path.join(cwd, envFile), "utf-8");
        const m = contents.match(/GPT_IMAGE_KEY=(\S+)/);
        if (m) { key = m[1]; break; }
      } catch {}
    }
  }
  if (!key) { console.error(`[illustration-pipeline] No GPT_IMAGE_KEY found — image generation will fail`); }
  const baseUrl = process.env.GPT_IMAGE_BASE_URL || "https://qqqapi.com";

  const child = spawn("/bin/bash", ["-c",
    `npx tsx scripts/generate-illustrations.ts ${projectId}`
  ], {
    cwd,
    env: { ...process.env, GPT_IMAGE_KEY: key || "", GPT_IMAGE_BASE_URL: baseUrl },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  child.stdout?.on("data", (d: Buffer) => console.log(`[gen-ill:${projectId}]`, d.toString().trimEnd()));
  child.stderr?.on("data", (d: Buffer) => console.error(`[gen-ill:${projectId}] ERR:`, d.toString().trimEnd()));
  child.unref();

  publishProjectEvent(projectId, "status-change", { status: "illustrating", substatus: "generating" });
  console.log(`[illustration-pipeline] Spawned generation for ${projectId}`);
}
