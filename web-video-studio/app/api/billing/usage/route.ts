import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";
import { getBalance } from "@/lib/billing/credits";
import { getUserPlan } from "@/lib/billing";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getUserPlan(userId);
  const balance = await getBalance(userId);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.userId, userId));
  const projectCount = result[0]?.count ?? 0;

  return NextResponse.json({
    plan: plan.code,
    planName: plan.name,
    credits: {
      balance,
      monthlyGrant: plan.monthlyCredits,
    },
    projects: {
      current: projectCount,
      max: plan.maxProjects === -1 ? "unlimited" : plan.maxProjects,
    },
    storage: {
      maxMb: plan.storageMb === -1 ? "unlimited" : plan.storageMb,
    },
    export: {
      maxRes: plan.maxExportRes,
      watermark: plan.watermark,
    },
    features: plan.features,
  });
}
