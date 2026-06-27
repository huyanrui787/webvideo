import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  projects,
  chatMessages,
  tokenUsage,
  projectAssetRefs,
  resumes,
  illustrationShots,
  articleLayouts,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { DevMode, Orientation, ProjectStatus, PreferredModel } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/api-helpers";
import { projectDir } from "@/lib/projects";
import { getSkill, MAIN_SKILL_ID } from "@/lib/skills";
import fs from "fs";
import path from "path";

function getThemesDir(): string {
  const s = getSkill(MAIN_SKILL_ID);
  if (s) return path.join(s.path, "themes");
  return path.join(process.cwd(), "../skills/main/web-video-presentation/themes");
}

const THEMES_DIR = getThemesDir();

/** If the presentation/ is already scaffolded, overwrite tokens.css with the new theme. */
function syncThemeTokens(projectId: string, themeId: string): void {
  const tokensTarget = path.join(projectDir(projectId), "presentation/src/styles/tokens.css");
  const tokensSrc = path.join(THEMES_DIR, themeId, "tokens.css");
  if (fs.existsSync(tokensTarget) && fs.existsSync(tokensSrc)) {
    fs.copyFileSync(tokensSrc, tokensTarget);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { project, error } = await requireProjectAccess(req, id);
  if (error) return error;
  return NextResponse.json(project);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (body.theme !== undefined) allowed.theme = body.theme;
  if (body.devMode !== undefined) allowed.devMode = body.devMode as DevMode;
  if (body.status !== undefined) allowed.status = body.status as ProjectStatus;
  if (body.orientation !== undefined) allowed.orientation = body.orientation as Orientation;
  if (body.ttsProvider !== undefined) allowed.ttsProvider = body.ttsProvider;
  if (body.ttsVoice !== undefined) allowed.ttsVoice = body.ttsVoice;
  if (body.model !== undefined) allowed.model = body.model as PreferredModel;
  if (body.codingModel !== undefined) allowed.codingModel = body.codingModel as PreferredModel;
  if (body.title !== undefined && typeof body.title === "string" && body.title.trim()) allowed.title = body.title.trim();
  allowed.updatedAt = Math.floor(Date.now() / 1000);

  // ════════════════════════════════════════════════════════════════════
  // Building gate: for illustration / animation projects, verify media generated
  // ════════════════════════════════════════════════════════════════════
  if (body.status === "building") {
    const project = await db.query.projects.findFirst({ where: (p, { eq }) => eq(p.id, id) });
    const isIllust = project?.projectType === "illustration-video" || project?.projectType === "illustrated-article";
    const isAnim = project?.projectType === "animation-video";
    if (isIllust) {
      // ... illustration gate (unchanged)
      const illPath = path.join(projectDir(id), "illustrations.json");
      if (!fs.existsSync(illPath)) {
        return NextResponse.json(
          { error: "illustrations.json 不存在。请先规划插图 shots。", code: "ILLUSTRATIONS_MISSING" },
          { status: 409 }
        );
      }
      const illData = JSON.parse(fs.readFileSync(illPath, "utf-8"));
      const shotCount = illData.shots?.length ?? 0;
      if (shotCount === 0) {
        return NextResponse.json(
          { error: "illustrations.json 中无 shot。请重新规划插图。", code: "ILLUSTRATIONS_EMPTY" },
          { status: 409 }
        );
      }

      // 2. Check illust-timeline.json exists
      const tlPath = path.join(projectDir(id), "illust-timeline.json");
      if (!fs.existsSync(tlPath)) {
        return NextResponse.json(
          { error: `illust-timeline.json 不存在。请先调用 /illustrations/generate 生成 ${shotCount} 张插画。`, code: "TIMELINE_MISSING", shotCount },
          { status: 409 }
        );
      }

      // 3. Verify actual image files
      const tlData = JSON.parse(fs.readFileSync(tlPath, "utf-8"));
      const timeline = tlData.timeline ?? [];
      const missingFiles: string[] = [];
      for (const entry of timeline) {
        if (!entry.assetUrl) continue;
        const urlPath = entry.assetUrl.replace(/^\/api\/projects\/[^/]+\/assets\//, "");
        const filePath = path.join(projectDir(id), urlPath);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(entry.shotId ?? "unknown");
        }
      }
      if (missingFiles.length > 0) {
        return NextResponse.json(
          { error: `${missingFiles.length} 张插画文件不存在: ${missingFiles.join(", ")}。请重新调用 /illustrations/generate。`, code: "IMAGE_FILES_MISSING", missingFiles },
          { status: 409 }
        );
      }

      // All checks passed
      console.log(`[building-gate] PASSED: ${timeline.length}/${shotCount} images verified for project ${id}`);
    }

    if (isAnim) {
      // 1. Check animations.json exists with shots
      const animPath = path.join(projectDir(id), "animations.json");
      if (!fs.existsSync(animPath)) {
        return NextResponse.json(
          { error: "animations.json 不存在。请先规划动画 shots。", code: "ANIMATIONS_MISSING" },
          { status: 409 }
        );
      }
      const animData = JSON.parse(fs.readFileSync(animPath, "utf-8"));
      const shotCount = animData.shots?.length ?? 0;
      if (shotCount === 0) {
        return NextResponse.json(
          { error: "animations.json 中无 shot。请重新规划动画。", code: "ANIMATIONS_EMPTY" },
          { status: 409 }
        );
      }

      // 2. Check anim-timeline.json exists
      const tlPath = path.join(projectDir(id), "anim-timeline.json");
      if (!fs.existsSync(tlPath)) {
        return NextResponse.json(
          { error: `anim-timeline.json 不存在。请等待系统自动生成 ${shotCount} 个视频。`, code: "TIMELINE_MISSING", shotCount },
          { status: 409 }
        );
      }

      // 3. Verify actual video files
      const tlData = JSON.parse(fs.readFileSync(tlPath, "utf-8"));
      const timeline = tlData.timeline ?? [];
      const missingFiles: string[] = [];
      for (const entry of timeline) {
        if (!entry.assetUrl) continue;
        const urlPath = entry.assetUrl.replace(/^\/api\/projects\/[^/]+\/assets\//, "");
        const filePath = path.join(projectDir(id), urlPath);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(entry.shotId ?? "unknown");
        }
      }
      if (missingFiles.length > 0) {
        return NextResponse.json(
          { error: `${missingFiles.length} 个视频文件不存在: ${missingFiles.join(", ")}。请重新触发生视频。`, code: "VIDEO_FILES_MISSING", missingFiles },
          { status: 409 }
        );
      }

      console.log(`[building-gate] PASSED: ${timeline.length}/${shotCount} videos verified for project ${id}`);
    }
  }

  await db.update(projects).set(allowed).where(eq(projects.id, id));

  // Sync tokens.css when theme changes and presentation is already scaffolded
  if (body.theme) syncThemeTokens(id, body.theme as string);

  const updated = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  // Delete child records first (SQLite FKs don't cascade by default)
  await db.delete(chatMessages).where(eq(chatMessages.projectId, id));
  await db.delete(tokenUsage).where(eq(tokenUsage.projectId, id));
  await db.delete(projectAssetRefs).where(eq(projectAssetRefs.projectId, id));
  await db.delete(resumes).where(eq(resumes.projectId, id));
  await db.delete(illustrationShots).where(eq(illustrationShots.projectId, id));
  await db.delete(articleLayouts).where(eq(articleLayouts.projectId, id));

  // Delete project files from disk
  const dir = projectDir(id);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  // Delete the project record itself
  await db.delete(projects).where(eq(projects.id, id));

  return NextResponse.json({ ok: true });
}