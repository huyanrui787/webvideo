import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import type { ProjectType } from "@/lib/db/schema";
import { ensureProjectDir } from "@/lib/projects";
import { getUserId, getUserRole } from "@/lib/api-helpers";
import { nanoid } from "nanoid";
import { desc, eq, isNull, or } from "drizzle-orm";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = getUserRole(req);

  // Admin sees all projects (including legacy null-userId ones)
  // Regular users only see their own
  const rows = await db
    .select()
    .from(projects)
    .where(
      role === "admin"
        ? or(eq(projects.userId, userId), isNull(projects.userId))
        : eq(projects.userId, userId)
    )
    .orderBy(desc(projects.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, projectType, projectFormat, articleContent, drawPrompt } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Map projectFormat → projectType when not explicitly given
  const resolvedType: ProjectType =
    (projectType as ProjectType) ??
    (projectFormat === "draw" ? "illustration-video" : "article");

  // Use drawPrompt as initial article content when in draw mode
  const initialContent = drawPrompt || articleContent || "";

  // Inherit user preferences: chat model (DeepSeek) + coding model (Claude)
  const userPrefs = await db
    .select({ preferredModel: users.preferredModel, preferredCodingModel: users.preferredCodingModel })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  const chatModel = userPrefs?.preferredModel ?? "deepseek-v4-pro";
  const codeModel = userPrefs?.preferredCodingModel ?? "claude-sonnet-4-6";

  const id = nanoid(10);
  const now = Math.floor(Date.now() / 1000);

  await db.insert(projects).values({
    id,
    userId,
    title: title.trim(),
    status: "writing",
    projectType: resolvedType,
    model: chatModel,
    codingModel: codeModel,
    createdAt: now,
    updatedAt: now,
  });

  ensureProjectDir(id);

  // Auto-scaffold: start VIte + React project immediately in background
  const { startScaffold } = await import("@/lib/scaffold");
  startScaffold(id, "midnight-press", "landscape", resolvedType === "illustration-video" ? "video" : (projectFormat ?? "video"));

  // Write initial article content if provided
  if (initialContent) {
    const { writeProjectFile } = await import("@/lib/projects");
    writeProjectFile(id, "article.md", initialContent);
  }

  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });

  return NextResponse.json(project, { status: 201 });
}
