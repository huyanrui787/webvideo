// ─── Plan codes ─────────────────────────────────────────────────────────────────

export type PlanCode = "free" | "starter" | "pro" | "enterprise";

export type BillingCycle = "monthly" | "annual";

export type SubscriptionStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "past_due";

// ─── Feature flags (stored in plans.features JSON array) ──────────────────────

export type FeatureFlag =
  | "no_watermark"
  | "all_tts"
  | "all_models"
  | "parallel_builds"
  | "4k_export"
  | "custom_themes"
  | "custom_branding"
  | "api_access"
  | "priority_ai"
  | "dedicated_support";

// ─── Credit transaction types ─────────────────────────────────────────────────

export type CreditTxType = "earn" | "spend" | "refund" | "expire";

/**
 * `operation` values for credit_transactions.
 * Keeping the set explicit so the audit log is self-describing.
 */
export type CreditOperation =
  | "ai_chat"              // AI conversation (billable per 1K tokens)
  | "ai_code"              // AI chapter/code generation (parallel build)
  | "image_gen"            // Image generation (FAL)
  | "image_illustrate"     // Batch illustration per image
  | "tts"                  // TTS narration synthesis
  | "render"               // Final video render (per minute)
  | "storage_overage"      // Monthly storage overage charge
  | "monthly_grant"        // Monthly subscription credit stipend
  | "subscription_grant"   // One-time grant on subscription activation
  | "signup_bonus"         // Free credits on registration
  | "package_purchase"     // Credit package top-up
  | "admin_grant"          // Admin manual credit grant
  | "refund";              // General refund

// ─── Payment provider ─────────────────────────────────────────────────────────

export type PaymentProvider = "stripe" | "wechat";

export type OrderType = "subscription" | "credits";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired";

// ─── Plan info (computed from DB rows) ────────────────────────────────────────

export interface PlanInfo {
  code: PlanCode;
  name: string;
  monthlyPrice: number;        // cents (USD)
  annualPrice: number;         // cents (USD)
  monthlyCredits: number;
  maxProjects: number;          // -1 = unlimited
  maxParallelBuilds: number;   // -1 = unlimited
  storageMb: number;           // -1 = unlimited
  maxExportRes: "720p" | "1080p" | "4k";
  watermark: boolean;
  features: FeatureFlag[];
  isActive: boolean;
  sortOrder: number;
}

export interface CreditPackageInfo {
  id: string;
  credits: number;
  priceCents: number;
  label: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CreditAccountInfo {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface SubscriptionInfo {
  id: string;
  userId: string;
  planCode: PlanCode;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  lastMonthlyGrant: number | null;
  stripeSubscriptionId: string | null;
}

// ─── Credit deduction params ──────────────────────────────────────────────────

export interface CreditDeduction {
  userId: string;
  amount: number;
  operation: CreditOperation;
  description: string;
  refId?: string;
  metadata?: Record<string, unknown>;
}
