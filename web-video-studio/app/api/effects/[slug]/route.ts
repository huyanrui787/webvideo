import { db } from "@/lib/db";
import { effectSketches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { getUserId } from "@/lib/api-helpers";
import { getSkill, MAIN_SKILL_ID } from "@/lib/skills";

const SKILL_ROOT = getSkill(MAIN_SKILL_ID)?.path ?? "";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const rows = await db
    .select()
    .from(effectSketches)
    .where(eq(effectSketches.slug, slug))
    .limit(1);

  if (rows.length === 0) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const row = rows[0];

  // Also read the code file if it exists
  const codePath = path.join(SKILL_ROOT, "showcase-effects", slug, "code.tsx");
  const code = fs.existsSync(codePath) ? fs.readFileSync(codePath, "utf-8") : null;

  return Response.json({
    ...row,
    useCases: JSON.parse(row.useCases) as string[],
    techTags: JSON.parse(row.techTags) as string[],
    code,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;

  await db.delete(effectSketches).where(eq(effectSketches.slug, slug));

  // Remove code file
  const effectDir = path.join(SKILL_ROOT, "showcase-effects", slug);
  if (fs.existsSync(effectDir)) {
    fs.rmSync(effectDir, { recursive: true, force: true });
  }

  return Response.json({ ok: true });
}
