import { NextResponse } from "next/server";
import { listAllSkills, MAIN_SKILL_ID, SKILLS_ROOT } from "@/lib/skills";
import { getUserId } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // No need for project-level writes — just listing what's on disk.
  const skills = listAllSkills().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
    version: s.version,
    hasManifest: s.hasManifest,
    role: s.role,
  }));

  // Fetch the user's enabled list so the UI can render checked state on first paint
  const user = await db
    .select({ enabledSkills: users.enabledSkills })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  let enabled: string[] = [];
  if (user?.enabledSkills) {
    try {
      const parsed = JSON.parse(user.enabledSkills);
      if (Array.isArray(parsed)) enabled = parsed.filter((x): x is string => typeof x === "string");
    } catch { /* ignore */ }
  }
  // Main skill is always enabled regardless of stored value
  if (!enabled.includes(MAIN_SKILL_ID)) enabled.push(MAIN_SKILL_ID);

  return NextResponse.json({
    mainSkillId: MAIN_SKILL_ID,
    mainSkills: skills.filter((s) => s.role === "main"),
    skills,
    enabledSkills: enabled,
  });
}
