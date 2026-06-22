import { db } from "@/lib/db";
import { effectSketches } from "@/lib/db/schema";
import { isNotNull, asc, eq } from "drizzle-orm";
import { getUserId } from "@/lib/api-helpers";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { getSkill, MAIN_SKILL_ID } from "@/lib/skills";

const SKILL_ROOT = getSkill(MAIN_SKILL_ID)?.path ?? "";

export async function GET() {
  const rows = await db
    .select({
      slug: effectSketches.slug,
      title: effectSketches.title,
      tagline: effectSketches.tagline,
      category: effectSketches.category,
      useCases: effectSketches.useCases,
      techTags: effectSketches.techTags,
      aiHint: effectSketches.aiHint,
      usageCount: effectSketches.usageCount,
    })
    .from(effectSketches)
    .where(isNotNull(effectSketches.approvedAt))
    .orderBy(asc(effectSketches.slug));

  const effects = rows.map((r) => ({
    ...r,
    useCases: JSON.parse(r.useCases) as string[],
    techTags: JSON.parse(r.techTags) as string[],
  }));

  return Response.json(effects);
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    slug: string;
    title: string;
    tagline: string;
    category: string;
    useCases: string[];
    techTags: string[];
    aiHint: string;
    effectCode: string;   // the useSeekableCanvas TSX code
    sourceType?: string;
  };

  const { slug, title, tagline, category, useCases, techTags, aiHint, effectCode } = body;

  if (!slug || !title || !effectCode) {
    return Response.json({ error: "slug, title, effectCode required" }, { status: 400 });
  }

  // Slug must be kebab-case
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return Response.json({ error: "slug must be kebab-case (a-z, 0-9, -)" }, { status: 400 });
  }

  // Check for duplicate
  const existing = await db
    .select({ slug: effectSketches.slug })
    .from(effectSketches)
    .where(eq(effectSketches.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return Response.json({ error: `slug "${slug}" already exists` }, { status: 409 });
  }

  // Write code.tsx to Skill directory
  const effectDir = path.join(SKILL_ROOT, "showcase-effects", slug);
  fs.mkdirSync(effectDir, { recursive: true });
  fs.writeFileSync(path.join(effectDir, "code.tsx"), effectCode, "utf-8");

  // Save to DB (auto-approved since admin is creating it)
  const now = Math.floor(Date.now() / 1000);
  await db.insert(effectSketches).values({
    slug,
    title,
    tagline: tagline || title,
    category: category || slug,
    useCases: JSON.stringify(useCases ?? []),
    techTags: JSON.stringify(techTags ?? []),
    aiHint: aiHint || "",
    sourceType: body.sourceType ?? "user",
    approvedAt: now,
    createdAt: now,
  });

  return Response.json({ slug, ok: true });
}

