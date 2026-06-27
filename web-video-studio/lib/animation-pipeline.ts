/**
 * Server-side animation pipeline orchestrator.
 *
 * Triggered automatically when ProjectSetStatus("animating") is called
 * for animation-video projects. Also used by the gen-anim API route for
 * manual retries.
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
import { animationShots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { projectDir } from "@/lib/projects";
import { publishProjectEvent } from "@/lib/events";

/** Import shots from animations.json into DB. Idempotent — skips if already imported. */
export async function importShotsFromAnimations(projectId: string): Promise<number> {
  const animPath = path.join(projectDir(projectId), "animations.json");
  if (!fs.existsSync(animPath)) throw new Error("animations.json not found");
  const animData = JSON.parse(fs.readFileSync(animPath, "utf-8"));
  const shots: any[] = animData.shots ?? [];
  if (shots.length === 0) throw new Error("No shots in animations.json");

  // Idempotent: skip if already imported
  const existing = await db
    .select({ id: animationShots.id })
    .from(animationShots)
    .where(eq(animationShots.projectId, projectId))
    .limit(1);
  if (existing.length > 0) return shots.length;

  const { nanoid } = await import("nanoid");
  const now = Math.floor(Date.now() / 1000);
  const records = shots.map((s: any, i: number) => ({
    id: nanoid(),
    projectId,
    chapterId: s.chapterId ?? s.chapter ?? "",
    stepIdx: s.stepIdx ?? s.narrationIndex ?? (() => { const m = String(s.id ?? "").match(/step-(\d+)/); return m ? parseInt(m[1], 10) - 1 : i; })(),
    theme: s.theme ?? "cinematic",
    structureType: (s.structureType ?? s.structure ?? s.composition ?? "concept-metaphor") as any,
    videoPrompt: (s.videoPrompt ?? s.coreIdea ?? s.description ?? "").slice(0, 300),
    elements: JSON.stringify(s.elements ?? []),
    labels: JSON.stringify(s.labels ?? s.annotations ?? []),
    styleHint: s.styleHint ?? null,
    videoStyle: s.videoStyle ?? null,
    sortOrder: i,
    generationStatus: "pending" as const,
    createdAt: now,
  }));
  await db.insert(animationShots).values(records);
  console.log(`[animation-pipeline] Imported ${records.length} shots for ${projectId}`);
  return records.length;
}

/** Spawn the generate-animations.ts script as a detached background process. */
export function spawnAnimationGeneration(projectId: string): void {
  const pDir = projectDir(projectId);
  const lockFile = path.join(pDir, ".gen-anim-lock");

  // Guard: don't spawn if already running
  if (fs.existsSync(lockFile)) {
    try {
      const pid = parseInt(fs.readFileSync(lockFile, "utf-8").trim(), 10);
      process.kill(pid, 0); // Check if PID is alive
      console.log(`[animation-pipeline] Already running (PID ${pid}) for ${projectId}`);
      return;
    } catch {
      // Stale lock — clean up
      try { fs.unlinkSync(lockFile); } catch {}
    }
  }

  // Write gen-started marker
  fs.writeFileSync(path.join(pDir, ".gen-anim-started"), String(Date.now()));

  const cwd = path.resolve(projectDir(""), "..");
  // Resolve API key: env var → .env.local → .env → error
  let key = process.env.T2V_API_KEY;
  if (!key) {
    for (const envFile of [".env.local", ".env"]) {
      try {
        const contents = fs.readFileSync(path.join(cwd, envFile), "utf-8");
        const m = contents.match(/T2V_API_KEY=(\S+)/);
        if (m) { key = m[1]; break; }
      } catch {}
    }
  }
  if (!key) { console.error(`[animation-pipeline] No T2V_API_KEY found — video generation will use stub provider`); }
  const baseUrl = process.env.T2V_BASE_URL || "";

  const child = spawn("/bin/bash", ["-c",
    `npx tsx scripts/generate-animations.ts ${projectId}`
  ], {
    cwd,
    env: { ...process.env, T2V_API_KEY: key || "", T2V_BASE_URL: baseUrl },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  child.stdout?.on("data", (d: Buffer) => console.log(`[gen-anim:${projectId}]`, d.toString().trimEnd()));
  child.stderr?.on("data", (d: Buffer) => console.error(`[gen-anim:${projectId}] ERR:`, d.toString().trimEnd()));
  child.unref();

  publishProjectEvent(projectId, "status-change", { status: "animating", substatus: "generating" });
  console.log(`[animation-pipeline] Spawned generation for ${projectId}`);
}
