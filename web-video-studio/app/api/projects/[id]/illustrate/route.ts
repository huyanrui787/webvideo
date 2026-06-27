import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { projectDir, patchAssetMeta } from "@/lib/projects";
import { requireProjectAccess } from "@/lib/api-helpers";
import { generateImage } from "@/lib/image-gen";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShotItem {
  id: string;
  chapterId: string;
  stepHint: string;
  theme: string;
  structure: string;
  coreIdea: string;
  xiaoheiAction: string;
  elements: string[];
  labels: string[];
}

interface ShotState {
  shot: ShotItem;
  status: "pending" | "generating" | "done" | "error";
  filename?: string;
  assetUrl?: string;
  error?: string;
}

interface IllustrationJob {
  status: "running" | "done" | "error";
  total: number;
  completed: number;
  shots: ShotState[];
}

// ─── In-memory job store ──────────────────────────────────────────────────────

const jobs = new Map<string, IllustrationJob>();

export function getIllustrationJob(projectId: string): IllustrationJob | undefined {
  return jobs.get(projectId);
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildXiaoheiPrompt(shot: ShotItem): string {
  const elements = shot.elements.join(" / ");
  const labels = shot.labels.join(" / ");
  const composition = `小黑 is ${shot.xiaoheiAction}. Main objects: ${elements}.`;

  return `Generate one standalone 16:9 horizontal Chinese article illustration.

Visual DNA:
Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen lines. Lots of empty white space. Sparse red/orange/blue handwritten Chinese annotations. Clean absurd product-sketch feeling. No gradients, no shadows, no paper texture, no complex background, no commercial vector style, no PPT infographic look, no cute mascot poster, no children's illustration, no realistic UI.

Recurring IP character required:
小黑, a small solid-black absurd creature with white dot eyes, tiny thin legs, blank serious expression, slightly uneven hand-drawn body shape. 小黑 must perform the core conceptual action, not decorate the scene. Make 小黑 serious, deadpan, and slightly bizarre, not cute.

Theme:
${shot.theme}

Structure type:
${shot.structure}

Core idea:
${shot.coreIdea}

Composition:
${composition}

Suggested elements:
${elements}

Chinese handwritten labels:
${labels}

Color use:
Black for main line art and 小黑. Orange for main flow/path/arrows. Red only for key warnings/problems/results. Blue only for secondary notes or feedback/system state.

Constraints:
One image explains only one core structure. Keep the main subject around 40%-60% of the canvas. Preserve at least 35% blank white space. Use at most 5-8 short handwritten Chinese labels. Do not write a title in the top-left corner. Do not write the structure type on the image. Do not make it a formal diagram, course slide, or dense explainer. Do not copy prior examples or reuse known case compositions unless explicitly requested; invent a fresh visual metaphor for this specific article. It should be clear but not instructional, interesting but not childish, strange but clean.`;
}

// ─── Async runner ─────────────────────────────────────────────────────────────

async function runJob(projectId: string) {
  const job = jobs.get(projectId);
  if (!job) return;

  const assetsDir = path.join(projectDir(projectId), "assets");
  fs.mkdirSync(assetsDir, { recursive: true });

  await Promise.all(
    job.shots.map(async (shotState, i) => {
      shotState.status = "generating";
      try {
        const prompt = buildXiaoheiPrompt(shotState.shot);
        const { buffer } = await generateImage({ prompt });

        const index = String(i + 1).padStart(2, "0");
        const slug = shotState.shot.id.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
        const filename = `illustration-${index}-${slug}.png`;
        const filePath = path.join(assetsDir, filename);
        fs.writeFileSync(filePath, buffer);

        patchAssetMeta(projectId, filename, {
          caption: `小黑插图 · 第「${shotState.shot.chapterId}」章（${shotState.shot.stepHint}）· ${shotState.shot.coreIdea}`,
          tags: ["illustration", "xiaohei"],
        });

        shotState.status = "done";
        shotState.filename = filename;
        shotState.assetUrl = `/api/projects/${projectId}/assets/${encodeURIComponent(filename)}`;
        job.completed++;
      } catch (err) {
        shotState.status = "error";
        shotState.error = err instanceof Error ? err.message : String(err);
        console.error(`[illustrate] shot ${i + 1} failed:`, err);
        job.completed++;
      }
    })
  );

  job.status = "done";
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = jobs.get(id);
  if (!job) return NextResponse.json({ status: "idle" });
  return NextResponse.json(job);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: accessError } = await requireProjectAccess(req, id);
  if (accessError) return accessError;
  const body = await req.json() as { shotList?: ShotItem[] };
  const shotList = body.shotList;

  if (!shotList || shotList.length === 0) {
    return NextResponse.json({ error: "shotList is required" }, { status: 400 });
  }

  // Already running
  const existing = jobs.get(id);
  if (existing?.status === "running") {
    return NextResponse.json({ status: "running", message: "Already running" });
  }

  const job: IllustrationJob = {
    status: "running",
    total: shotList.length,
    completed: 0,
    shots: shotList.map((shot) => ({ shot, status: "pending" })),
  };
  jobs.set(id, job);

  // Fire-and-forget
  runJob(id).catch((err) => {
    const j = jobs.get(id);
    if (j) { j.status = "error"; }
    console.error("Illustration job error:", err);
  });

  return NextResponse.json({ status: "running" });
}
