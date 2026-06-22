import { db } from "@/lib/db";
import { plans, subscriptions, creditAccounts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { PlanCode, PlanInfo, SubscriptionInfo, FeatureFlag } from "./types";

// ─── Plan queries ──────────────────────────────────────────────────────────────

/** Get a single plan by code. Returns null if not found. */
export async function getPlan(code: PlanCode): Promise<PlanInfo | null> {
  const row = await db.query.plans.findFirst({
    where: (p, { eq }) => eq(p.code, code),
  });
  if (!row) return null;
  return planRowToInfo(row);
}

/** List all active plans, sorted by sortOrder. */
export async function listPlans(): Promise<PlanInfo[]> {
  const rows = await db.query.plans.findMany({
    where: (p, { eq }) => eq(p.isActive, true),
    orderBy: (p, { asc }) => [asc(p.sortOrder)],
  });
  return rows.map(planRowToInfo);
}

function planRowToInfo(row: NonNullable<Awaited<ReturnType<typeof db.query.plans.findFirst>>>): PlanInfo {
  let features: FeatureFlag[] = [];
  try { features = JSON.parse(row.features); } catch { /* keep [] */ }
  return {
    code: row.code as PlanCode,
    name: row.name,
    monthlyPrice: row.monthlyPrice,
    annualPrice: row.annualPrice,
    monthlyCredits: row.monthlyCredits,
    maxProjects: row.maxProjects,
    maxParallelBuilds: row.maxParallelBuilds,
    storageMb: row.storageMb,
    maxExportRes: row.maxExportRes as "720p" | "1080p" | "4k",
    watermark: row.watermark,
    features,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

// ─── Subscription queries ──────────────────────────────────────────────────────

/** Get the active subscription for a user. */
export async function getUserSubscription(
  userId: string,
): Promise<SubscriptionInfo | null> {
  const row = await db.query.subscriptions.findFirst({
    where: (s, { eq }) => eq(s.userId, userId),
  });
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    planCode: row.planCode as PlanCode,
    billingCycle: row.billingCycle as SubscriptionInfo["billingCycle"],
    status: row.status as SubscriptionInfo["status"],
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    lastMonthlyGrant: row.lastMonthlyGrant,
    stripeSubscriptionId: row.stripeSubscriptionId,
  };
}

/** Get the user's effective plan (resolved via subscription → plans table).
 *  Falls back to free plan if no active subscription exists. */
export async function getUserPlan(userId: string): Promise<PlanInfo> {
  const sub = await getUserSubscription(userId);
  if (!sub || sub.status === "expired") {
    return (await getPlan("free"))!;
  }
  const plan = await getPlan(sub.planCode);
  return plan ?? (await getPlan("free"))!;
}

/** Check if the user's subscription has expired and downgrade if needed. */
export async function checkAndExpireSubscription(userId: string): Promise<void> {
  const sub = await getUserSubscription(userId);
  if (!sub) return;
  if (
    sub.status === "active" &&
    sub.currentPeriodEnd < Math.floor(Date.now() / 1000)
  ) {
    await db
      .update(subscriptions)
      .set({
        status: "expired",
        planCode: "free",
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(subscriptions.userId, userId));

    // Also update the users table for quick lookups
    await db
      .update(users)
      .set({ planCode: "free" as PlanCode, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(users.id, userId));
  }
}

// ─── Feature check ─────────────────────────────────────────────────────────────

/** Returns true if the user's current plan includes the given feature. */
export async function hasFeature(userId: string, feature: FeatureFlag): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan.features.includes(feature);
}

/** Returns the user's credit balance. */
export async function getCreditBalance(userId: string): Promise<number> {
  const account = await db.query.creditAccounts.findFirst({
    where: (a, { eq }) => eq(a.userId, userId),
  });
  return account?.balance ?? 0;
}

/** Create a credit account for a new user if one doesn't exist. */
export async function ensureCreditAccount(
  userId: string,
  initialBalance: number = 0,
): Promise<void> {
  const existing = await db.query.creditAccounts.findFirst({
    where: (a, { eq }) => eq(a.userId, userId),
  });
  if (existing) return;

  const now = Math.floor(Date.now() / 1000);
  await db.insert(creditAccounts).values({
    id: nanoid(10),
    userId,
    balance: initialBalance,
    totalEarned: initialBalance,
    totalSpent: 0,
    updatedAt: now,
  });
}
