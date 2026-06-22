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