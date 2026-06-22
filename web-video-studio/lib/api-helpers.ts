import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Get userId from middleware-injected header.
 */
export function getUserId(req: Request): string | null {
  return req.headers.get("x-user-id");
}

export function getUserRole(req: Request): "admin" | "user" {
  return (req.headers.get("x-user-role") as "admin" | "user") ?? "user";
}

/**
 * Verify the requesting user owns (or is admin of) the given project.
 * Returns the project on success, or a NextResponse error to return immediately.
 */
export async function requireProjectAccess(
  req: Request,
  projectId: string,
): Promise<{ project: Awaited<ReturnType<typeof db.query.projects.findFirst>>; error: null } | { project: null; error: NextResponse }> {
  const userId = getUserId(req);
  if (!userId) {
    return { project: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const project = await db.query.projects.findFirst({
    where: (p, { eq }) => eq(p.id, projectId),
  });

  if (!project) {
    return { project: null, error: NextResponse.json({ error: "Project not found" }, { status: 404 }) };
  }

  const role = getUserRole(req);
  // admin can access any project; users only their own
  if (role !== "admin" && project.userId && project.userId !== userId) {
    return { project: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { project, error: null };
}

// ─── Billing helpers ───────────────────────────────────────────────────────────

/**
 * Standard 402 response for insufficient credits.
 */
export function creditRequiredError(
  balance: number,
  needed: number,
): NextResponse {
  return NextResponse.json(
    {
      error: "积分不足",
      code: "INSUFFICIENT_CREDITS",
      balance,
      needed,
      shortfall: needed - balance,
    },
    { status: 402 },
  );
}

/**
 * Standard 403 response for feature not in plan.
 */
export function featureRequiredError(
  feature: string,
  currentPlan: string,
): NextResponse {
  return NextResponse.json(
    {
      error: `此功能需要升级套餐`,
      code: "FEATURE_NOT_IN_PLAN",
      requiredFeature: feature,
      currentPlan,
    },
    { status: 403 },
  );
}

/**
 * Standard 403 response for project limit reached.
 */
export function projectLimitError(
  limit: number,
  current: number,
): NextResponse {
  return NextResponse.json(
    {
      error: `项目数已达上限（${limit}），请升级套餐以创建更多项目`,
      code: "PROJECT_LIMIT_REACHED",
      limit,
      current,
    },
    { status: 403 },
  );
}
