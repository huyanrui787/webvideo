import { db, rawDb } from "@/lib/db";
import { creditAccounts, creditTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { CreditOperation, CreditTxType } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// Credit engine — all mutations use SQLite transactions for atomicity
// ═══════════════════════════════════════════════════════════════════════════════

const now = () => Math.floor(Date.now() / 1000);

// ─── Balance ───────────────────────────────────────────────────────────────────

export async function getBalance(userId: string): Promise<number> {
  const account = await db.query.creditAccounts.findFirst({
    where: (a, { eq }) => eq(a.userId, userId),
  });
  return account?.balance ?? 0;
}

// ─── Credit check ──────────────────────────────────────────────────────────────

export async function hasCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getBalance(userId);
  return balance >= amount;
}

// ─── Atomic deduct ─────────────────────────────────────────────────────────────

/**
 * Atomically deduct credits from a user's account.
 * Returns the new balance on success, or null if insufficient funds.
 *
 * Uses a raw SQLite transaction to guarantee atomicity — no race conditions
 * between the SELECT and UPDATE.
 */
export async function deductCredits(params: {
  userId: string;
  amount: number;
  operation: CreditOperation;
  description: string;
  refId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: true; balanceAfter: number } | { success: false }> {
  const { userId, amount, operation, description, refId, metadata } = params;
  if (amount <= 0) return { success: true, balanceAfter: await getBalance(userId) };

  // Use the underlying better-sqlite3 connection for a raw transaction.
  // Drizzle's db.transaction works too, but raw gives us precise control.
  const sqlite = rawDb;
  const ts = now();

  try {
    const result = sqlite.transaction(() => {
      // 1. Lock and read current balance
      const row = sqlite
        .prepare("SELECT id, balance, total_spent FROM credit_accounts WHERE user_id = ?")
        .get(userId) as { id: string; balance: number; total_spent: number } | undefined;

      if (!row || row.balance < amount) return null;

      const newBalance = row.balance - amount;

      // 2. Update credit account
      sqlite
        .prepare("UPDATE credit_accounts SET balance = ?, total_spent = ?, updated_at = ? WHERE id = ?")
        .run(newBalance, row.total_spent + amount, ts, row.id);

      // 3. Insert transaction log
      const txId = nanoid(10);
      sqlite
        .prepare(
          `INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, operation, description, ref_id, metadata, created_at)
           VALUES (?, ?, 'spend', ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          txId, userId, -amount, newBalance, operation,
          description, refId ?? null, JSON.stringify(metadata ?? {}), ts,
        );

      return newBalance;
    })();

    if (result === null) return { success: false };
    return { success: true, balanceAfter: result };
  } catch (err) {
    console.error("[credits] deduct failed:", err);
    return { success: false };
  }
}

// ─── Atomic add (earn / refund / admin grant) ──────────────────────────────────

export async function addCredits(params: {
  userId: string;
  amount: number;
  type: CreditTxType;
  operation: CreditOperation;
  description: string;
  refId?: string;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const { userId, amount, type, operation, description, refId, metadata } = params;
  if (amount <= 0) return await getBalance(userId);

  const sqlite = rawDb;
  const ts = now();

  const newBalance = sqlite.transaction(() => {
    let row = sqlite
      .prepare("SELECT id, balance, total_earned FROM credit_accounts WHERE user_id = ?")
      .get(userId) as { id: string; balance: number; total_earned: number } | undefined;

    // Auto-create account if missing (safety net)
    if (!row) {
      const acctId = nanoid(10);
      sqlite
        .prepare("INSERT INTO credit_accounts (id, user_id, balance, total_earned, total_spent, updated_at) VALUES (?, ?, 0, 0, 0, ?)")
        .run(acctId, userId, ts);
      row = { id: acctId, balance: 0, total_earned: 0 };
    }

    const updated = row.balance + amount;

    sqlite
      .prepare("UPDATE credit_accounts SET balance = ?, total_earned = ?, updated_at = ? WHERE id = ?")
      .run(updated, row.total_earned + amount, ts, row.id);

    const txId = nanoid(10);
    sqlite
      .prepare(
        `INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, operation, description, ref_id, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        txId, userId, type, amount, updated, operation,
        description, refId ?? null, JSON.stringify(metadata ?? {}), ts,
      );

    return updated;
  })();

  return newBalance;
}
