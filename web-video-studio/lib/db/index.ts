import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import * as schema from "./schema";
import { getDataDir, getDatabasePath } from "@/lib/env";

const dbDir = getDataDir();
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const sqlite = new Database(getDatabasePath());

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

/** Raw better-sqlite3 connection for atomic transactions (billing engine, etc.) */
export const rawDb = sqlite;

// Run migrations inline on startup (simple approach for MVP)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'writing',
    theme TEXT,
    dev_mode TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// Idempotent column additions
for (const col of [
  "ALTER TABLE projects ADD COLUMN miaoda_app_id TEXT",
  "ALTER TABLE projects ADD COLUMN miaoda_url TEXT",
  "ALTER TABLE projects ADD COLUMN project_type TEXT",
  "ALTER TABLE projects ADD COLUMN orientation TEXT",
  "ALTER TABLE projects ADD COLUMN user_id TEXT",
  "ALTER TABLE projects ADD COLUMN tts_provider TEXT DEFAULT 'minimax'",
  "ALTER TABLE projects ADD COLUMN tts_voice TEXT",
]) {
  try { sqlite.exec(col); } catch { /* column already exists */ }
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS library_assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS project_asset_refs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    asset_id TEXT NOT NULL REFERENCES library_assets(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// Idempotent column additions for library_assets
try { sqlite.exec("ALTER TABLE library_assets ADD COLUMN caption TEXT NOT NULL DEFAULT ''"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE library_assets ADD COLUMN duration_sec INTEGER"); } catch { /* exists */ }

// Idempotent column additions for users
try { sqlite.exec("ALTER TABLE users ADD COLUMN preferred_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE users ADD COLUMN preferred_tts_provider TEXT DEFAULT 'minimax'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE users ADD COLUMN preferred_tts_voice TEXT"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE users ADD COLUMN enabled_skills TEXT NOT NULL DEFAULT '[]'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE users ADD COLUMN preferred_coding_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE users ADD COLUMN workflow_mode TEXT NOT NULL DEFAULT 'quick'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE users ADD COLUMN illustrations_enabled TEXT NOT NULL DEFAULT 'true'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE users ADD COLUMN plan_code TEXT NOT NULL DEFAULT 'free'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT"); } catch { /* exists */ }

// Idempotent column additions for projects
try { sqlite.exec("ALTER TABLE projects ADD COLUMN model TEXT DEFAULT 'claude-sonnet-4-6'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE projects ADD COLUMN coding_model TEXT DEFAULT 'claude-sonnet-4-6'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE projects ADD COLUMN project_format TEXT DEFAULT 'video'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE projects ADD COLUMN visual_style TEXT DEFAULT 'standard'"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE token_usage ADD COLUMN summary TEXT NOT NULL DEFAULT ''"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE projects ADD COLUMN thumbnail_url TEXT"); } catch { /* exists */ }
try { sqlite.exec("ALTER TABLE projects ADD COLUMN main_skill_id TEXT NOT NULL DEFAULT 'web-video-presentation'"); } catch { /* exists */ }

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS token_usage (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id),
    model        TEXT NOT NULL,
    input_tokens  INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    role       TEXT NOT NULL,
    parts      TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS effect_sketches (
    slug        TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    tagline     TEXT NOT NULL,
    category    TEXT NOT NULL,
    use_cases   TEXT NOT NULL DEFAULT '[]',
    tech_tags   TEXT NOT NULL DEFAULT '[]',
    ai_hint     TEXT NOT NULL DEFAULT '',
    source_type TEXT NOT NULL DEFAULT 'builtin',
    approved_at INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// Seed built-in effects (idempotent — INSERT OR IGNORE)
const BUILTIN_EFFECTS = [
  { slug: "chart-pie",       title: "饼图·环形图",      tagline: "用比例关系讲清楚市场份额、成分构成、分类占比",           category: "ChartPie",      useCases: ["数据报告","商业汇报","市场分析"],         techTags: ["Canvas 2D","缓动动画","实时渲染"],   aiHint: "展示占比/份额/分类构成时使用，数据 2-8 组为佳" },
  { slug: "chart-bar",       title: "柱状图",            tagline: "展示时间序列变化、类别对比、增长趋势的最直接方式",         category: "ChartBar",      useCases: ["增长趋势","类别对比","年度数据"],         techTags: ["Canvas 2D","渐变填充","动态标注"],   aiHint: "对比多组数值或展示增长/下降趋势时使用" },
  { slug: "chart-line",      title: "折线图",            tagline: "连续时间序列、趋势走向、波动规律的标准表达",               category: "ChartLine",     useCases: ["时间序列","趋势分析","股价走势"],         techTags: ["Canvas 2D","曲线插值","区域填充"],   aiHint: "时序数据、波动趋势、多指标对比时使用" },
  { slug: "geo-globe",       title: "3D地球·飞线",      tagline: "地理分布、跨境连接、全球视野的视觉化表达",               category: "GeoGlobe",      useCases: ["地理分布","国际业务","全球视野"],         techTags: ["Canvas 2D","球面投影","经纬网格"],   aiHint: "展示全球业务、地理分布、跨国连接路径时使用" },
  { slug: "magnetic-field",  title: "磁场线",            tagline: "物理场、力的分布、抽象关系的直观可视化",                 category: "MagneticField", useCases: ["物理科普","理工教学","B站科普"],          techTags: ["Canvas 2D","场线算法","粒子追踪"],   aiHint: "物理科普、电磁/引力场讲解时使用" },
  { slug: "network-graph",   title: "节点网络图",        tagline: "系统架构、知识关联、组织关系的结构化展示",               category: "NetworkGraph",  useCases: ["系统架构","知识图谱","组织关系"],         techTags: ["Canvas 2D","力导向布局","逐步揭示"], aiHint: "展示节点关系、架构图、依赖图时使用，节点建议 ≤12 个" },
  { slug: "particle-field",  title: "粒子场",            tagline: "氛围背景、开场钩子、科技感空间的首选底层动效",           category: "ParticleField", useCases: ["科技氛围","开场钩子","背景底层"],         techTags: ["Canvas 2D","随机行走","密度控制"],   aiHint: "作为科技感背景层、开场首帧氛围营造时使用" },
  { slug: "wave-form",       title: "波形·频谱",         tagline: "信号处理、音频可视化、周期性数据的动态呈现",             category: "WaveForm",      useCases: ["信号处理","音频分析","物理波动"],         techTags: ["Canvas 2D","正弦叠加","频谱柱"],     aiHint: "音频/信号/波动现象讲解时使用" },
  { slug: "counter",         title: "数字滚动·计数器",  tagline: "让数据冲击感瞬间拉满的核心视觉元素",                     category: "Counter",       useCases: ["关键数据","里程碑","数据冲击"],           techTags: ["requestAnimationFrame","缓动函数","格式化"], aiHint: "揭示关键数字、里程碑数据时使用，是 Primitives Counter 的展示扩展版" },
  { slug: "svg-reveal",      title: "SVG路径描边揭示",  tagline: "Logo动画、图标绘制、签名效果的标志性视觉语言",           category: "SvgReveal",     useCases: ["Logo动画","图标揭示","签名效果"],         techTags: ["SVG","strokeDashoffset","路径动画"],  aiHint: "Logo 描边、图标入场、手绘风格揭示时使用" },
  { slug: "typewriter",      title: "打字机·终端",       tagline: "代码讲解、命令演示、技术教程的首选叙事视觉",             category: "TypeWriter",    useCases: ["代码教学","终端演示","技术分享"],         techTags: ["字符串切片","等宽字体","光标闪烁"],   aiHint: "代码/命令行/终端输出展示时使用，是 Primitives TypeWriter 的展示扩展版" },
];

const insertEffect = sqlite.prepare(`
  INSERT OR IGNORE INTO effect_sketches
    (slug, title, tagline, category, use_cases, tech_tags, ai_hint, source_type, approved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'builtin', unixepoch())
`);

for (const e of BUILTIN_EFFECTS) {
  insertEffect.run(
    e.slug, e.title, e.tagline, e.category,
    JSON.stringify(e.useCases), JSON.stringify(e.techTags), e.aiHint
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Billing tables
// ═══════════════════════════════════════════════════════════════════════════════

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    code              TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    monthly_price     INTEGER NOT NULL,
    annual_price      INTEGER NOT NULL,
    monthly_credits   INTEGER NOT NULL,
    max_projects      INTEGER NOT NULL,
    max_parallel_builds INTEGER NOT NULL,
    storage_mb        INTEGER NOT NULL,
    max_export_res    TEXT NOT NULL,
    watermark         INTEGER NOT NULL,
    features          TEXT NOT NULL DEFAULT '[]',
    is_active         INTEGER NOT NULL DEFAULT 1,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at        INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL UNIQUE REFERENCES users(id),
    plan_code           TEXT NOT NULL REFERENCES plans(code),
    billing_cycle       TEXT NOT NULL DEFAULT 'monthly',
    status              TEXT NOT NULL DEFAULT 'active',
    current_period_start INTEGER NOT NULL,
    current_period_end  INTEGER NOT NULL,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    last_monthly_grant  INTEGER,
    stripe_subscription_id TEXT,
    created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at          INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS credit_accounts (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL UNIQUE REFERENCES users(id),
    balance       INTEGER NOT NULL DEFAULT 0,
    total_earned  INTEGER NOT NULL DEFAULT 0,
    total_spent   INTEGER NOT NULL DEFAULT 0,
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS credit_transactions (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id),
    type          TEXT NOT NULL,
    amount        INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    operation     TEXT NOT NULL,
    description   TEXT NOT NULL,
    ref_id        TEXT,
    metadata      TEXT DEFAULT '{}',
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS credit_packages (
    id          TEXT PRIMARY KEY,
    credits     INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    label       TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS payment_orders (
    id                 TEXT PRIMARY KEY,
    user_id            TEXT NOT NULL REFERENCES users(id),
    provider           TEXT NOT NULL,
    order_type         TEXT NOT NULL,
    amount_cents       INTEGER NOT NULL,
    currency           TEXT NOT NULL DEFAULT 'USD',
    plan_code          TEXT,
    billing_cycle      TEXT,
    credit_package_id  TEXT REFERENCES credit_packages(id),
    credits_amount     INTEGER,
    provider_order_id  TEXT,
    provider_session_id TEXT,
    provider_payload   TEXT DEFAULT '{}',
    wx_code_url        TEXT,
    wx_transaction_id  TEXT,
    status             TEXT NOT NULL DEFAULT 'pending',
    paid_at            INTEGER,
    created_at         INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at         INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// ─── Seed plans (idempotent) ─────────────────────────────────────────────────

const PLAN_SEEDS: Array<{
  code: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  maxProjects: number;
  maxParallelBuilds: number;
  storageMb: number;
  maxExportRes: string;
  watermark: number;
  features: string;
  sortOrder: number;
}> = [
  {
    code: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCredits: 100,
    maxProjects: 999,
    maxParallelBuilds: 1,
    storageMb: 500,
    maxExportRes: "720p",
    watermark: 1,
    features: "[]",
    sortOrder: 1,
  },
  {
    code: "starter",
    name: "Starter",
    monthlyPrice: 1900, // $19.00
    annualPrice: 19000, // $190.00
    monthlyCredits: 2000,
    maxProjects: 10,
    maxParallelBuilds: 3,
    storageMb: 5120,
    maxExportRes: "1080p",
    watermark: 0,
    features: JSON.stringify(["no_watermark", "all_tts", "all_models", "parallel_builds"]),
    sortOrder: 2,
  },
  {
    code: "pro",
    name: "Pro",
    monthlyPrice: 4900, // $49.00
    annualPrice: 49000, // $490.00
    monthlyCredits: 10000,
    maxProjects: -1,
    maxParallelBuilds: 6,
    storageMb: 20480,
    maxExportRes: "4k",
    watermark: 0,
    features: JSON.stringify([
      "no_watermark", "all_tts", "all_models", "parallel_builds",
      "4k_export", "custom_themes", "priority_ai",
    ]),
    sortOrder: 3,
  },
  {
    code: "enterprise",
    name: "Enterprise",
    monthlyPrice: 19900, // $199.00
    annualPrice: 199000, // $1,990.00
    monthlyCredits: 50000,
    maxProjects: -1,
    maxParallelBuilds: 12,
    storageMb: 102400,
    maxExportRes: "4k",
    watermark: 0,
    features: JSON.stringify([
      "no_watermark", "all_tts", "all_models", "parallel_builds",
      "4k_export", "custom_themes", "custom_branding", "api_access",
      "priority_ai", "dedicated_support",
    ]),
    sortOrder: 4,
  },
];

const upsertPlan = sqlite.prepare(`
  INSERT OR REPLACE INTO plans
    (code, name, monthly_price, annual_price, monthly_credits,
     max_projects, max_parallel_builds, storage_mb, max_export_res,
     watermark, features, is_active, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
`);

for (const p of PLAN_SEEDS) {
  upsertPlan.run(
    p.code, p.name, p.monthlyPrice, p.annualPrice, p.monthlyCredits,
    p.maxProjects, p.maxParallelBuilds, p.storageMb, p.maxExportRes,
    p.watermark, p.features, p.sortOrder,
  );
}

// ─── Seed credit packages (idempotent) ───────────────────────────────────────

const PACKAGE_SEEDS = [
  { id: "pkg-500",    credits: 500,  priceCents: 499,  label: "小包",       sortOrder: 1 },
  { id: "pkg-1200",   credits: 1200, priceCents: 999,  label: "中包",       sortOrder: 2 },
  { id: "pkg-3000",   credits: 3000, priceCents: 1999, label: "大包・最划算",  sortOrder: 3 },
  { id: "pkg-8000",   credits: 8000, priceCents: 4999, label: "超大包",      sortOrder: 4 },
];

const upsertPackage = sqlite.prepare(`
  INSERT OR REPLACE INTO credit_packages
    (id, credits, price_cents, label, is_active, sort_order)
  VALUES (?, ?, ?, ?, 1, ?)
`);

for (const p of PACKAGE_SEEDS) {
  upsertPackage.run(p.id, p.credits, p.priceCents, p.label, p.sortOrder);
}

// Warm the billing background task scheduler (functions defined in lib/billing/background.ts)

	// Ensure free plan has a generous dev limit (idempotent)
	sqlite.exec("UPDATE plans SET max_projects = 999 WHERE code = 'free' AND max_projects < 10");

// ═══════════════════════════════════════════════════════════════════════════════
// Batch & Scheduled Task tables
// ═══════════════════════════════════════════════════════════════════════════════

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS batches (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    source_type     TEXT NOT NULL,
    source_config   TEXT NOT NULL DEFAULT '{}',
    project_config  TEXT NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'pending',
    total           INTEGER NOT NULL DEFAULT 0,
    done            INTEGER NOT NULL DEFAULT 0,
    failed          INTEGER NOT NULL DEFAULT 0,
    scheduled_task_id TEXT,
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    finished_at     INTEGER
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    enabled         INTEGER NOT NULL DEFAULT 1,
    cron            TEXT NOT NULL,
    source_type     TEXT NOT NULL,
    source_config   TEXT NOT NULL DEFAULT '{}',
    project_config  TEXT NOT NULL DEFAULT '{}',
    last_run_at     INTEGER,
    next_run_at     INTEGER,
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS task_runs (
    id                TEXT PRIMARY KEY,
    scheduled_task_id TEXT NOT NULL REFERENCES scheduled_tasks(id),
    batch_id          TEXT REFERENCES batches(id),
    status            TEXT NOT NULL DEFAULT 'running',
    result            TEXT DEFAULT '{}',
    started_at        INTEGER NOT NULL DEFAULT (unixepoch()),
    finished_at       INTEGER
  )
`);

// Idempotent column additions for projects (batch linkage)
for (const col of [
  "ALTER TABLE projects ADD COLUMN batch_id TEXT",
  "ALTER TABLE projects ADD COLUMN batch_index INTEGER",
  "ALTER TABLE projects ADD COLUMN auto_mode INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE projects ADD COLUMN error_message TEXT",
]) {
  try { sqlite.exec(col); } catch { /* column already exists */ }
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE REFERENCES projects(id),
    data       TEXT NOT NULL DEFAULT '{}',
    theme      TEXT NOT NULL DEFAULT 'minimal',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// ═══════════════════════════════════════════════════════════════════════════════
// Illustration Shots table (for illustration-video & illustrated-article modes)
// ═══════════════════════════════════════════════════════════════════════════════
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS illustration_shots (
    id                TEXT PRIMARY KEY,
    project_id        TEXT NOT NULL REFERENCES projects(id),
    chapter_id        TEXT NOT NULL,
    step_idx          INTEGER NOT NULL DEFAULT 0,
    theme             TEXT NOT NULL,
    structure_type    TEXT NOT NULL,
    core_idea         TEXT NOT NULL,
    xiaohei_action    TEXT,
    elements          TEXT NOT NULL DEFAULT '[]',
    labels            TEXT NOT NULL DEFAULT '[]',
    prompt_en         TEXT,
    asset_filename    TEXT,
    asset_url         TEXT,
    generation_status TEXT NOT NULL DEFAULT 'pending',
    generation_error  TEXT,
    ken_burns_scale   INTEGER,
    ken_burns_pan_x   INTEGER DEFAULT 0,
    ken_burns_pan_y   INTEGER DEFAULT 0,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

sqlite.exec("CREATE INDEX IF NOT EXISTS idx_illustration_shots_project ON illustration_shots(project_id)");
sqlite.exec("CREATE INDEX IF NOT EXISTS idx_illustration_shots_status ON illustration_shots(project_id, generation_status)");

// ═══════════════════════════════════════════════════════════════════════════════
// Article Layouts table (for illustrated-article mode — typesetting phase)
// ═══════════════════════════════════════════════════════════════════════════════
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS article_layouts (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL UNIQUE REFERENCES projects(id),
    blocks       TEXT NOT NULL DEFAULT '[]',
    theme_config TEXT NOT NULL DEFAULT '{}',
    created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

// We import dynamically to avoid circular deps at module-init time.
setTimeout(() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { startBillingTasks } = require("@/lib/billing/background");
    startBillingTasks();
  } catch (e) { console.error("[billing] failed to start background tasks:", e); /* was: billing not yet wired — silently skip */ }
}, 2000);
