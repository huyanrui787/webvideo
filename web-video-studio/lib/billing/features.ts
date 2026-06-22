import { NextResponse } from "next/server";
import { hasFeature, getUserPlan } from "./plans";
import type { FeatureFlag, PlanCode } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// Feature-gating helpers for route handlers
// ═══════════════════════════════════════════════════════════════════════════════

export interface FeatureCheckResult {
  allowed: boolean;
  planCode: PlanCode;
}

/**
 * Check if a user has a specific feature in their current plan.
 * Returns { allowed, planCode } — never throws.
 */
export async function checkFeature(
  userId: string,
  feature: FeatureFlag,
): Promise<FeatureCheckResult> {
  const plan = await getUserPlan(userId);
  return {
    allowed: plan.features.includes(feature),
    planCode: plan.code,
  };
}

/**
 * Require a feature. If not allowed, returns an object with a 403 NextResponse
 * that the caller can return immediately from a route handler.
 *
 * Usage:
 * ```ts
 * const f = await requireFeature(userId, "4k_export");
 * if (!f.allowed) return f.error;
 * ```
 */
export async function requireFeature(
  userId: string,
  feature: FeatureFlag,
): Promise<
  | { allowed: true; planCode: PlanCode }
  | { allowed: false; planCode: PlanCode; error: NextResponse }
> {
  const result = await checkFeature(userId, feature);
  if (result.allowed) {
    return { allowed: true, planCode: result.planCode };
  }
  return {
    allowed: false,
    planCode: result.planCode,
    error: NextResponse.json(
      {
        error: `This feature requires a higher plan.`,
        code: "FEATURE_NOT_IN_PLAN",
        requiredFeature: feature,
        currentPlan: result.planCode,
      },
      { status: 403 },
    ),
  };
}

/**
 * Ensure the user has enough credits for an operation.
 * Returns a 402 response if insufficient.
 *
 * Usage:
 * ```ts
 * const c = await ensureCredits(userId, 5, "image_gen");
 * if (!c.ok) return c.error;
 * ```
 */
export async function ensureCredits(
  userId: string,
  amount: number,
  currentBalance: number,
): Promise<
  | { ok: true }
  | { ok: false; error: NextResponse }
> {
  if (currentBalance >= amount) return { ok: true };
  return {
    ok: false,
    error: NextResponse.json(
      {
        error: "Insufficient credits",
        code: "INSUFFICIENT_CREDITS",
        balance: currentBalance,
        needed: amount,
        shortfall: amount - currentBalance,
      },
      { status: 402 },
    ),
  };
}

/**
 * Create a standardized 402 "insufficient credits" response.
 */
export function creditRequiredError(
  balance: number,
  needed: number,
): NextResponse {
  return NextResponse.json(
    {
      error: "Insufficient credits",
      code: "INSUFFICIENT_CREDITS",
      balance,
      needed,
      shortfall: needed - balance,
    },
    { status: 402 },
  );
}

/**
 * Create a standardized 403 "upgrade required" response for project limits.
 */
export function projectLimitError(
  currentLimit: number,
  currentCount: number,
): NextResponse {
  return NextResponse.json(
    {
      error: "Project limit reached. Upgrade your plan to create more projects.",
      code: "PROJECT_LIMIT_REACHED",
      limit: currentLimit,
      current: currentCount,
    },
    { status: 403 },
  );
}
