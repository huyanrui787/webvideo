import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─── Users ───────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "user";
export type PreferredModel =
  // Anthropic
  | "claude-sonnet-4-6"
  | "claude-opus-4-8"
  // DeepSeek
  | "deepseek-chat"
  | "deepseek-reasoner"
  | "deepseek-v4-flash"
  | "deepseek-v4-pro"
  // OpenAI-compatible
  | "gpt-4o"
  | "gpt-4o-mini"
  // Future: extend with more provider models as they are added to the registry
export type PreferredTtsProvider = "minimax" | "openai";

export type PlanCode = "free" | "starter" | "pro" | "enterprise";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(), // bcrypt hash
  role: text("role").$type<UserRole>().notNull().default("user"),
  planCode: text("plan_code").$type<PlanCode>().notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  preferredModel: text("preferred_model")
    .$type<PreferredModel>()
    .notNull()
    .default("deepseek-v4-pro"),
  preferredCodingModel: text("preferred_coding_model")
    .$type<PreferredModel>()
    .notNull()
    .default("claude-sonnet-4-6"),
  workflowMode: text("workflow_mode").$type<"quick" | "detailed">().notNull().default("quick"),
  illustrationsEnabled: text("illustrations_enabled").notNull().default("true"),
  preferredTtsProvider: text("preferred_tts_provider")
    .$type<PreferredTtsProvider>()
    .default("minimax"),
  preferredTtsVoice: text("preferred_tts_voice"),
  enabledSkills: text("enabled_skills").notNull().default("[]"), // JSON string[] of skill ids
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "writing"
  | "plan_checkpoint"
  | "illustration_planning"
  | "building"
  | "illustrating"
  | "animating"
  | "typesetting"
  | "audio_checkpoint"
  | "audio"
  | "done";

export type DevMode = "sequential" | "parallel" | "hybrid";

export type ProjectType =
  | "article"
  | "data-story"
  | "code-tour"
  | "math-video"
  | "product-demo"
  | "timeline-story"
  | "resume"
  | "illustration-video"
  | "illustrated-article"
  | "animation-video";

export type ProjectFormat = "video" | "graphic" | "manim" | "resume" | "draw";

export type Orientation = "landscape" | "portrait";

export type VisualStyle = "standard" | "whiteboard";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  status: text("status").$type<ProjectStatus>().notNull().default("writing"),
  theme: text("theme").default("midnight-press"),
  devMode: text("dev_mode").$type<DevMode>().default("hybrid"),
  projectType: text("project_type").$type<ProjectType>(),
  projectFormat: text("project_format").$type<ProjectFormat>().default("video"),
  orientation: text("orientation").$type<Orientation>().default("landscape"),
  mainSkillId: text("main_skill_id").notNull().default("web-video-presentation"),
  visualStyle: text("visual_style").$type<VisualStyle>().default("standard"),
  miaodaAppId: text("miaoda_app_id"),
  miaodaUrl: text("miaoda_url"),
  model: text("model").$type<PreferredModel>().default("deepseek-v4-pro"),
  codingModel: text("coding_model").$type<PreferredModel>().default("claude-sonnet-4-6"),
  ttsProvider: text("tts_provider").default("minimax"),
  ttsVoice: text("tts_voice"),
  thumbnailUrl: text("thumbnail_url"),
  styleConfig: text("style_config").default("{}"),
  // Batch linkage
  batchId: text("batch_id").references(() => batches.id),
  batchIndex: integer("batch_index"),
  autoMode: integer("auto_mode", { mode: "boolean" }).notNull().default(false),
  errorMessage: text("error_message"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// ─── Library Assets ───────────────────────────────────────────────────────────

export const libraryAssets = sqliteTable("library_assets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  type: text("type").$type<"image" | "video">().notNull(),
  size: integer("size").notNull(),
  tags: text("tags").notNull().default("[]"), // JSON string array
  caption: text("caption").notNull().default(""),
  durationSec: integer("duration_sec"),       // video only, null for images
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type LibraryAsset = typeof libraryAssets.$inferSelect;
export type NewLibraryAsset = typeof libraryAssets.$inferInsert;

// ─── Project ↔ Library refs ───────────────────────────────────────────────────

export const projectAssetRefs = sqliteTable("project_asset_refs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  assetId: text("asset_id").notNull().references(() => libraryAssets.id),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ProjectAssetRef = typeof projectAssetRefs.$inferSelect;

// ─── Chat Messages ────────────────────────────────────────────────────────────
// Each row stores one UI message (role + parts as JSON) for a project.

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  role: text("role").$type<"user" | "assistant">().notNull(),
  parts: text("parts").notNull(), // JSON: UIMessagePart[]
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ChatMessage = typeof chatMessages.$inferSelect;


export const tokenUsage = sqliteTable("token_usage", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  summary: text("summary").notNull().default(""),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type TokenUsage = typeof tokenUsage.$inferSelect;
export type NewTokenUsage = typeof tokenUsage.$inferInsert;

// ─── Effect Sketches ──────────────────────────────────────────────────────────
// Built-in and (future) user-contributed visual effects for AI to reference.

export const effectSketches = sqliteTable("effect_sketches", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  tagline: text("tagline").notNull(),
  category: text("category").notNull(),
  useCases: text("use_cases").notNull().default("[]"),   // JSON string[]
  techTags: text("tech_tags").notNull().default("[]"),   // JSON string[]
  aiHint: text("ai_hint").notNull().default(""),         // one-liner for AI system prompt
  sourceType: text("source_type").notNull().default("builtin"), // "builtin" | "user"
  approvedAt: integer("approved_at"),                    // null = pending
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type EffectSketch = typeof effectSketches.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// Billing & Subscription
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Plans ─────────────────────────────────────────────────────────────────────

export type BillingCycle = "monthly" | "annual";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "past_due";

export const plans = sqliteTable("plans", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  monthlyPrice: integer("monthly_price").notNull(),
  annualPrice: integer("annual_price").notNull(),
  monthlyCredits: integer("monthly_credits").notNull(),
  maxProjects: integer("max_projects").notNull(),          // -1 = unlimited
  maxParallelBuilds: integer("max_parallel_builds").notNull(),
  storageMb: integer("storage_mb").notNull(),
  maxExportRes: text("max_export_res").notNull(),          // "720p" | "1080p" | "4k"
  watermark: integer("watermark", { mode: "boolean" }).notNull(),
  features: text("features").notNull().default("[]"),      // JSON string[] of feature flags
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Plan = typeof plans.$inferSelect;

// ─── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  planCode: text("plan_code").notNull().references(() => plans.code),
  billingCycle: text("billing_cycle").$type<BillingCycle>().notNull().default("monthly"),
  status: text("status").$type<SubscriptionStatus>().notNull().default("active"),
  currentPeriodStart: integer("current_period_start").notNull(),
  currentPeriodEnd: integer("current_period_end").notNull(),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
  lastMonthlyGrant: integer("last_monthly_grant"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// ─── Credit Accounts ─────────────────────────────────────────────────────────

export const creditAccounts = sqliteTable("credit_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  balance: integer("balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type CreditAccount = typeof creditAccounts.$inferSelect;

// ─── Credit Transactions ──────────────────────────────────────────────────────

export type CreditTxType = "earn" | "spend" | "refund" | "expire";

export const creditTransactions = sqliteTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").$type<CreditTxType>().notNull(),
  amount: integer("amount").notNull(),                     // positive for earn, negative for spend
  balanceAfter: integer("balance_after").notNull(),
  operation: text("operation").notNull(),
  description: text("description").notNull(),
  refId: text("ref_id"),                                   // projectId, paymentOrderId, etc.
  metadata: text("metadata").default("{}"),                 // JSON for extra context
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;

// ─── Credit Packages ──────────────────────────────────────────────────────────

export const creditPackages = sqliteTable("credit_packages", {
  id: text("id").primaryKey(),
  credits: integer("credits").notNull(),
  priceCents: integer("price_cents").notNull(),
  label: text("label"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type CreditPackage = typeof creditPackages.$inferSelect;

// ─── Payment Orders ───────────────────────────────────────────────────────────

export type PaymentProvider = "stripe" | "wechat";
export type OrderType = "subscription" | "credits";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

export const paymentOrders = sqliteTable("payment_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").$type<PaymentProvider>().notNull(),
  orderType: text("order_type").$type<OrderType>().notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),

  // Subscription orders
  planCode: text("plan_code"),
  billingCycle: text("billing_cycle").$type<BillingCycle>(),

  // Credit purchase orders
  creditPackageId: text("credit_package_id").references(() => creditPackages.id),
  creditsAmount: integer("credits_amount"),

  // Provider-specific
  providerOrderId: text("provider_order_id"),              // Stripe PaymentIntent / WeChat out_trade_no
  providerSessionId: text("provider_session_id"),          // Stripe Checkout Session ID
  providerPayload: text("provider_payload").default("{}"), // JSON blob

  // WeChat-specific
  wxCodeUrl: text("wx_code_url"),
  wxTransactionId: text("wx_transaction_id"),

  status: text("status").$type<PaymentStatus>().notNull().default("pending"),
  paidAt: integer("paid_at"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type NewPaymentOrder = typeof paymentOrders.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Batch & Scheduled Tasks
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Batches ─────────────────────────────────────────────────────────────────────

export type BatchSourceType = "url_list" | "topic_list" | "rss" | "csv_upload";
export type BatchStatus = "pending" | "running" | "done" | "partial" | "cancelled";

export const batches = sqliteTable("batches", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  sourceType: text("source_type").$type<BatchSourceType>().notNull(),
  sourceConfig: text("source_config").notNull().default("{}"), // JSON
  projectConfig: text("project_config").notNull().default("{}"), // JSON: theme/model/format defaults
  status: text("status").$type<BatchStatus>().notNull().default("pending"),
  total: integer("total").notNull().default(0),
  done: integer("done").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  scheduledTaskId: text("scheduled_task_id"), // nullable — only set when created by a scheduled task
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  finishedAt: integer("finished_at"),
});

export type Batch = typeof batches.$inferSelect;
export type NewBatch = typeof batches.$inferInsert;

// ─── Scheduled Tasks ────────────────────────────────────────────────────────────

export type ScheduleSourceType = "rss" | "topic_pool" | "url_watchlist";

export const scheduledTasks = sqliteTable("scheduled_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  cron: text("cron").notNull(),
  sourceType: text("source_type").$type<ScheduleSourceType>().notNull(),
  sourceConfig: text("source_config").notNull().default("{}"),   // JSON
  projectConfig: text("project_config").notNull().default("{}"), // JSON
  lastRunAt: integer("last_run_at"),
  nextRunAt: integer("next_run_at"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type NewScheduledTask = typeof scheduledTasks.$inferInsert;

// ─── Task Runs ──────────────────────────────────────────────────────────────────

export type TaskRunStatus = "running" | "done" | "error";

export const taskRuns = sqliteTable("task_runs", {
  id: text("id").primaryKey(),
  scheduledTaskId: text("scheduled_task_id").notNull().references(() => scheduledTasks.id),
  batchId: text("batch_id").references(() => batches.id),
  status: text("status").$type<TaskRunStatus>().notNull().default("running"),
  result: text("result").default("{}"), // JSON
  startedAt: integer("started_at")
    .notNull()
    .default(sql`(unixepoch())`),
  finishedAt: integer("finished_at"),
});

export type TaskRun = typeof taskRuns.$inferSelect;
export type NewTaskRun = typeof taskRuns.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Resume
// ═══════════════════════════════════════════════════════════════════════════════

export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id).unique(),
  data: text("data").notNull().default("{}"), // JSON: structured resume data
  theme: text("theme").notNull().default("minimal"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Illustration Shots (for illustration-video & illustrated-article modes)
// ═══════════════════════════════════════════════════════════════════════════════

export type ShotStatus =
  | "pending"
  | "prompting"
  | "generating"
  | "done"
  | "error";

export type StructureType =
  | "Workflow"
  | "系统局部"
  | "前后对比"
  | "角色状态"
  | "概念隐喻"
  | "方法分层"
  | "地图路线"
  | "小漫画分镜";

export const illustrationShots = sqliteTable("illustration_shots", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  chapterId: text("chapter_id").notNull(),
  stepIdx: integer("step_idx").notNull().default(0),
  theme: text("theme").notNull(),
  structureType: text("structure_type").$type<StructureType>().notNull(),
  coreIdea: text("core_idea").notNull(),
  xiaoheiAction: text("xiaohei_action"),
  elements: text("elements").notNull().default("[]"),
  labels: text("labels").notNull().default("[]"),
  promptEn: text("prompt_en"),
  styleHint: text("style_hint"),
  assetFilename: text("asset_filename"),
  assetUrl: text("asset_url"),
  generationStatus: text("generation_status")
    .$type<ShotStatus>()
    .notNull()
    .default("pending"),
  generationError: text("generation_error"),
  kenBurnsScale: integer("ken_burns_scale"),
  kenBurnsPanX: integer("ken_burns_pan_x").default(0),
  kenBurnsPanY: integer("ken_burns_pan_y").default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type IllustrationShot = typeof illustrationShots.$inferSelect;
export type NewIllustrationShot = typeof illustrationShots.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Animation Shots (for animation-video mode — T2V generation)
// ═══════════════════════════════════════════════════════════════════════════════

export const animationShots = sqliteTable("animation_shots", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  chapterId: text("chapter_id").notNull(),
  stepIdx: integer("step_idx").notNull().default(0),
  theme: text("theme").notNull(),
  structureType: text("structure_type").$type<StructureType>().notNull(),
  videoPrompt: text("video_prompt").notNull(),
  elements: text("elements").notNull().default("[]"),
  labels: text("labels").notNull().default("[]"),
  promptEn: text("prompt_en"),
  styleHint: text("style_hint"),
  videoStyle: text("video_style"),
  assetFilename: text("asset_filename"),
  assetUrl: text("asset_url"),
  generationStatus: text("generation_status")
    .$type<ShotStatus>()
    .notNull()
    .default("pending"),
  generationError: text("generation_error"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type AnimationShot = typeof animationShots.$inferSelect;
export type NewAnimationShot = typeof animationShots.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Article Layouts (for illustrated-article mode — typesetting phase)
// ═══════════════════════════════════════════════════════════════════════════════

export const articleLayouts = sqliteTable("article_layouts", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().unique().references(() => projects.id),
  blocks: text("blocks").notNull().default("[]"),
  themeConfig: text("theme_config").notNull().default("{}"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ArticleLayout = typeof articleLayouts.$inferSelect;
export type NewArticleLayout = typeof articleLayouts.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// Article Layout Types (used by lib/article-layout.ts and components)
// ═══════════════════════════════════════════════════════════════════════════════

export type BlockType = "paragraph" | "heading" | "illustration" | "divider" | "quote";

export interface LayoutBlock {
  id: string;
  type: BlockType;
  // For paragraph / heading / quote blocks:
  content?: string;
  // For illustration blocks:
  shotId?: string;
  illustrationUrl?: string;
  caption?: string;
  width?: "full" | "wide" | "normal";
  // Common:
  spacingBefore?: "normal" | "large" | "none";
  // Allow dynamic access
  [key: string]: unknown;
}