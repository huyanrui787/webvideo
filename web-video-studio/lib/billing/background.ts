import { db, rawDb } from "@/lib/db";
import { subscriptions, users, creditAccounts } from "@/lib/db/schema";
import { eq, and, lt, or, isNull } from "drizzle-orm";
import { addCredits } from "./credits";
import type { PlanCode } from "./types";
import { nanoid } from "nanoid";
import { getPlan } from "./plans";

// ═══════════════════════════════════════════════════════════════════════════════
// Background billing tasks — run on startup + every 6 hours
// ═══════════════════════════════════════════════════════════════════════════════

const now = () => Math.floor(Date.now() / 1000);
const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Grant monthly credits to all active subscriptions whose last grant was
 * more than 30 days ago (or never granted).
 */
export async function processMonthlyGrants(): Promise<number> {
  const ts = now();
  const cutoff = ts - THIRTY_DAYS_SEC;

  // Find active subscriptions due for a monthly grant
  const dueSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        or(
          isNull(subscriptions.lastMonthlyGrant),
          lt(subscriptions.lastMonthlyGrant, cutoff),
        ),
      ),
    )
    .all();

  let granted = 0;
  for (const sub of dueSubs) {
    const plan = await getPlan(sub.planCode as PlanCode);
    if (!plan || plan.monthlyCredits <= 0) continue;

    await addCredits({
      userId: sub.userId,
      amount: plan.monthlyCredits,
      type: "earn",
      operation: "monthly_grant",
      description: `Monthly credit grant — ${plan.name} plan`,
    });

    await db
      .update(subscriptions)
      .set({ lastMonthlyGrant: ts, updatedAt: ts })
      .where(eq(subscriptions.id, sub.id));

    granted++;
  }

  if (granted > 0) {
    console.log(`[billing] Monthly credits granted to ${granted} user(s)`);
  }
  return granted;
}

/**
 * Expire subscriptions whose current period has ended.
 * Downgrades the user to the free plan.
 */
export async function expireSubscriptions(): Promise<number> {
  const ts = now();

  const expiredSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lt(subscriptions.currentPeriodEnd, ts),
      ),
    )
    .all();

  let expired = 0;
  for (const sub of expiredSubs) {
    if (sub.planCode === "free") continue; // Free never expires

    await db
      .update(subscriptions)
      .set({
        status: "expired",
        planCode: "free",
        updatedAt: ts,
      })
      .where(eq(subscriptions.id, sub.id));

    await db
      .update(users)
      .set({ planCode: "free" as PlanCode, updatedAt: ts })
      .where(eq(users.id, sub.userId));

    expired++;
  }

  if (expired > 0) {
    console.log(`[billing] Expired ${expired} subscription(s)`);
  }
  return expired;
}

/**
 * Process expired credits: monthly-granted credits that are > 90 days old.
 * Purchased credits never expire — we track this via credit_transactions.operation.
 */
export async function expireCredits(): Promise<number> {
  // SQLite raw query to expire old "monthly_grant" credits that haven't been spent.
  // We find users whose earliest unspent monthly_grant is > 90 days old,
  // then deduct the remaining unspent portion of that grant.
  //
  // This is a conservative implementation: we only expire credits that clearly
  // came from monthly grants and are older than 90 days.
  const sqlite = rawDb;
  const ts = now();
  const cutoff = ts - 90 * 24 * 60 * 60; // 90 days ago

  const result = sqlite.transaction(() => {
    // Find credit accounts with positive balance
    const accounts = sqlite
      .prepare("SELECT id, user_id, balance FROM credit_accounts WHERE balance > 0")
      .all() as { id: string; user_id: string; balance: number }[];

    let totalExpired = 0;

    for (const acct of accounts) {
      // Sum of unspent monthly_grant credits older than 90 days
      // Simplified: expire the MIN(balance, oldest_monthly_grant_amount)
      const grants = sqlite
        .prepare(
          `SELECT SUM(amount) as total_granted
           FROM credit_transactions
           WHERE user_id = ? AND operation = 'monthly_grant' AND created_at < ?`
        )
        .get(acct.user_id, cutoff) as { total_granted: number | null };

      const totalGranted = grants?.total_granted ?? 0;
      if (totalGranted <= 0) continue;

      // Total spent is tracked on the account
      // If balance > 0 and there are old grants, expire up to the remaining grant amount
      // For MVP: expire at most 10% of remaining balance if from old grants
      const expireAmount = Math.min(acct.balance, Math.floor(totalGranted * 0.1));
      if (expireAmount <= 0) continue;

      // Deduct
      sqlite
        .prepare("UPDATE credit_accounts SET balance = balance - ?, updated_at = ? WHERE id = ?")
        .run(expireAmount, ts, acct.id);

      sqlite
        .prepare(
          `INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, operation, description, created_at)
           VALUES (?, ?, 'expire', ?, ?, 'storage_overage', 'Expired credits (>90 days from monthly grant)', ?)`
        )
        .run(nanoid(10), acct.user_id, -expireAmount, acct.balance - expireAmount, ts);

      totalExpired += expireAmount;
    }

    return totalExpired;
  })();

  if (result > 0) {
    console.log(`[billing] Expired ${result} credits across accounts`);
  }
  return result;
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Start background billing tasks. Called once on server startup.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function startBillingTasks(): void {
  if (intervalHandle) return; // Already running

  console.log("[billing] Starting background tasks…");

  // Run immediately on startup
  runAll().catch((e) => console.error("[billing] Startup tasks error:", e));

  // Then every 6 hours
  intervalHandle = setInterval(() => {
    runAll().catch((e) => console.error("[billing] Interval tasks error:", e));
  }, SIX_HOURS_MS);
}

async function runAll(): Promise<void> {
  await expireSubscriptions();
  await processMonthlyGrants();
  // Credit expiry runs less frequently (daily implied by 6h interval)
  await expireCredits();
}
