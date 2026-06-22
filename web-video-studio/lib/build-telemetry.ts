/**
 * Build Telemetry — structured failure capture, pattern analysis, self-improvement.
 *
 * Every blueprint validation failure, compilation error, and tsc rejection is
 * logged as a structured event. Periodic analysis surfaces:
 *   - Templates with highest failure rates
 *   - Validation rules that fire too often (design issue or AI misunderstanding)
 *   - Missing template gaps (AI frequently falls back to Tier 2/3 for same patterns)
 *   - Compiler bugs (valid blueprint → broken code)
 *
 * The analysis output feeds directly into system improvements:
 *   → template slot descriptions need clarification
 *   → validation rule is too strict / too loose
 *   → new template needed for recurring pattern
 *   → system prompt needs updated guidance
 */

import fs from "fs";
import path from "path";
import { getProjectsDir } from "@/lib/env";

// ═══════════════════════════════════════════════════════════════════════════════
// Event Types
// ═══════════════════════════════════════════════════════════════════════════════

export type FailureStage = "validation" | "compilation" | "tsc" | "registry";

export type RootCause =
  | "template_slot_unclear"       // AI misinterpreted what a slot expects
  | "template_missing"            // no template fits this content pattern
  | "validation_rule_too_strict"  // L3 rule rejected legitimate content
  | "validation_rule_too_loose"   // validator passed something that tsc later rejected
  | "ai_format_error"             // AI produced structurally invalid JSON
  | "ai_content_error"            // AI wrote wrong content for the slot type
  | "compiler_bug"                // valid blueprint → broken generated code
  | "tsc_type_mismatch"           // generated code has type errors
  | "registry_corruption"         // chapters.ts got into a bad state
  | "unknown";

export interface BuildTelemetryEvent {
  timestamp: number;
  projectId: string;             // anonymized hash, not raw ID
  chapterId: string;
  stage: FailureStage;
  rootCause: RootCause;
  // What was being attempted
  templateUsed?: string;
  stepIndex?: number;
  blueprintHash: string;         // sha256 first 12 chars — links related events
  // What went wrong
  errorSummary: string;          // 1-line classification
  errorDetail: string;           // full error message
  issues: Array<{
    level: "error" | "warning";
    step: number | null;
    field: string;
    message: string;
  }>;
  // Was it eventually fixed?
  resolvedInSameSession: boolean;
  retryCount: number;
  finalFix?: string;             // what the AI changed to fix it (if known)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Event storage
// ═══════════════════════════════════════════════════════════════════════════════

function telemetryDir(): string {
  const dir = path.join(getProjectsDir(), "..", ".telemetry");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function dailyLogPath(): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(telemetryDir(), `build-events-${date}.jsonl`);
}

let _buffer: BuildTelemetryEvent[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Record a build failure event. Events are buffered and flushed to disk
 * every 5 seconds (or on process exit) to avoid I/O contention during
 * parallel builds.
 */
export function recordBuildEvent(event: Omit<BuildTelemetryEvent, "timestamp" | "resolvedInSameSession" | "retryCount">): void {
  const full: BuildTelemetryEvent = {
    ...event,
    timestamp: Date.now(),
    resolvedInSameSession: false,
    retryCount: 0,
  };
  _buffer.push(full);

  // Flush every 5s
  if (!_flushTimer) {
    _flushTimer = setTimeout(flushEvents, 5000);
  }
}

/** Mark a previous failure as resolved (the fix retry succeeded) */
export function markResolved(chapterId: string, blueprintHash: string, fixDescription?: string): void {
  // Update buffered events
  for (const evt of _buffer) {
    if (evt.chapterId === chapterId && evt.blueprintHash === blueprintHash) {
      evt.resolvedInSameSession = true;
      if (fixDescription) evt.finalFix = fixDescription;
    }
  }
  // Also try to update persisted events
  updatePersistedEvent(chapterId, blueprintHash, fixDescription);
}

function updatePersistedEvent(chapterId: string, blueprintHash: string, fixDescription?: string): void {
  const logPath = dailyLogPath();
  if (!fs.existsSync(logPath)) return;

  try {
    const lines = fs.readFileSync(logPath, "utf-8").split("\n").filter(Boolean);
    const updated: string[] = [];
    for (const line of lines) {
      const evt = JSON.parse(line) as BuildTelemetryEvent;
      if (evt.chapterId === chapterId && evt.blueprintHash === blueprintHash) {
        evt.resolvedInSameSession = true;
        if (fixDescription) evt.finalFix = fixDescription;
      }
      updated.push(JSON.stringify(evt));
    }
    fs.writeFileSync(logPath, updated.join("\n") + "\n");
  } catch { /* best-effort */ }
}

function flushEvents(): void {
  if (_buffer.length === 0) return;
  const logPath = dailyLogPath();
  const lines = _buffer.map((e) => JSON.stringify(e)).join("\n") + "\n";
  fs.appendFileSync(logPath, lines, "utf-8");
  _buffer = [];
  _flushTimer = null;
}

// Flush on process exit
if (typeof process !== "undefined") {
  process.on("exit", () => { flushEvents(); });
  process.on("SIGTERM", () => { flushEvents(); process.exit(); });
  process.on("SIGINT", () => { flushEvents(); process.exit(); });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Root cause classification
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze validation errors and classify the root cause.
 * This is the core intelligence — it looks at error patterns and determines
 * whether the fault lies with the template design, the AI, or the validator.
 */
export function classifyRootCause(
  stage: FailureStage,
  templateUsed: string | undefined,
  issues: Array<{ level: string; step: number | null; field: string; message: string }>
): RootCause {
  if (stage === "compilation") {
    // Compile errors are almost always compiler bugs or template issues
    const msg = issues.map((i) => i.message).join(" ");
    if (/template.*not found/i.test(msg)) return "template_missing";
    if (/import|module|export/i.test(msg)) return "compiler_bug";
    if (/cannot read|undefined|null|typeError/i.test(msg)) return "compiler_bug";
    return "compiler_bug";
  }

  if (stage === "tsc") {
    // tsc errors → the generated code has type mismatches
    const msg = issues.map((i) => i.message).join(" ");
    if (/is not assignable/i.test(msg)) return "tsc_type_mismatch";
    if (/cannot find module|import/i.test(msg)) return "compiler_bug";
    if (/property.*does not exist/i.test(msg)) return "tsc_type_mismatch";
    return "tsc_type_mismatch";
  }

  // Validation stage — classify by field and message pattern
  const messages = issues.map((i) => i.message).join(" ");
  const fields = issues.map((i) => i.field);

  // Template slot schema errors → likely AI filling wrong type
  if (fields.some((f) => f.includes("slots."))) {
    if (/required/i.test(messages)) return "ai_content_error";
    if (/expected.*received/i.test(messages)) return "ai_content_error";
    return "template_slot_unclear";
  }

  // Hardcoded values in custom CSS → validation_rule_too_strict or ai_format_error
  if (/hardcoded|deprecated/i.test(messages)) {
    return "validation_rule_too_strict";
  }

  // Empty required fields → AI missed filling a slot
  if (/requires a non-empty/i.test(messages)) {
    return "ai_content_error";
  }

  // Structural issues (wrong mode, missing layout)
  if (/mode|layout.*missing/i.test(messages)) {
    return "ai_format_error";
  }

  return "unknown";
}

// ═══════════════════════════════════════════════════════════════════════════════
// Pattern analysis
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnalysisReport {
  periodDays: number;
  totalEvents: number;
  resolvedRate: number;            // % of failures that were eventually resolved
  byStage: Record<FailureStage, number>;
  byRootCause: Record<RootCause, number>;
  byTemplate: Record<string, { failures: number; resolved: number }>;
  topErrors: Array<{ message: string; count: number; rootCause: RootCause }>;
  recurringGaps: string[];         // content patterns that repeatedly fail
  suggestions: ImprovementSuggestion[];
}

export interface ImprovementSuggestion {
  priority: "high" | "medium" | "low";
  target: string;                  // file path or template ID
  action: string;                  // what to do
  evidence: string;                // data supporting this suggestion
  autoFixable: boolean;            // can the system fix it automatically?
}

/**
 * Analyze all telemetry from the last N days and generate an improvement report.
 */
export function analyzeTelemetry(periodDays: number = 7): AnalysisReport {
  const cutoff = Date.now() - periodDays * 86400_000;
  const events = loadEvents(cutoff);

  if (events.length === 0) {
    return {
      periodDays,
      totalEvents: 0,
      resolvedRate: 1,
      byStage: {} as Record<FailureStage, number>,
      byRootCause: {} as Record<RootCause, number>,
      byTemplate: {},
      topErrors: [],
      recurringGaps: [],
      suggestions: [],
    };
  }

  // Aggregations
  const byStage: Record<string, number> = {};
  const byRootCause: Record<string, number> = {};
  const byTemplate: Record<string, { failures: number; resolved: number }> = {};
  const errorFrequency: Record<string, { count: number; rootCause: RootCause }> = {};

  let resolved = 0;

  for (const evt of events) {
    byStage[evt.stage] = (byStage[evt.stage] ?? 0) + 1;
    byRootCause[evt.rootCause] = (byRootCause[evt.rootCause] ?? 0) + 1;

    const tmpl = evt.templateUsed ?? "none";
    if (!byTemplate[tmpl]) byTemplate[tmpl] = { failures: 0, resolved: 0 };
    byTemplate[tmpl].failures++;
    if (evt.resolvedInSameSession) {
      byTemplate[tmpl].resolved++;
      resolved++;
    }

    const key = evt.errorSummary;
    if (!errorFrequency[key]) errorFrequency[key] = { count: 0, rootCause: evt.rootCause };
    errorFrequency[key].count++;
  }

  const topErrors = Object.entries(errorFrequency)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 20)
    .map(([message, { count, rootCause }]) => ({ message, count, rootCause }));

  // Recurring gaps: templates that AI frequently tries but don't exist
  const recurringGaps = findRecurringGaps(events);

  // Generate suggestions
  const suggestions = generateSuggestions(events, byTemplate, topErrors, recurringGaps);

  return {
    periodDays,
    totalEvents: events.length,
    resolvedRate: events.length > 0 ? Math.round(resolved / events.length * 100) / 100 : 0,
    byStage: byStage as Record<FailureStage, number>,
    byRootCause: byRootCause as Record<RootCause, number>,
    byTemplate,
    topErrors,
    recurringGaps,
    suggestions,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Internal analysis helpers
// ═══════════════════════════════════════════════════════════════════════════════

function loadEvents(cutoff: number): BuildTelemetryEvent[] {
  const dir = telemetryDir();
  const files = fs.readdirSync(dir).filter((f) => f.startsWith("build-events-") && f.endsWith(".jsonl"));

  const events: BuildTelemetryEvent[] = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      for (const line of content.split("\n").filter(Boolean)) {
        const evt = JSON.parse(line) as BuildTelemetryEvent;
        if (evt.timestamp >= cutoff) events.push(evt);
      }
    } catch { /* skip corrupted files */ }
  }

  return events;
}

function findRecurringGaps(events: BuildTelemetryEvent[]): string[] {
  // Look for patterns where AI tried Tier 2/3 composed or custom mode but failed
  // This signals missing templates
  const gaps = new Map<string, number>();

  for (const evt of events) {
    if (evt.rootCause === "template_missing") {
      // Extract the content pattern from error detail
      const key = evt.errorDetail.slice(0, 80);
      gaps.set(key, (gaps.get(key) ?? 0) + 1);
    }
  }

  return [...gaps.entries()]
    .filter(([, count]) => count >= 3) // 3+ occurrences = pattern
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key);
}

function generateSuggestions(
  events: BuildTelemetryEvent[],
  byTemplate: Record<string, { failures: number; resolved: number }>,
  topErrors: Array<{ message: string; count: number; rootCause: RootCause }>,
  recurringGaps: string[]
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];

  // ── 1. Templates with high failure rates ────────────────────────────
  for (const [templateId, stats] of Object.entries(byTemplate)) {
    if (templateId === "none") continue;
    const failRate = stats.failures > 0 ? (stats.failures - stats.resolved) / stats.failures : 0;
    if (stats.failures >= 5 && failRate > 0.3) {
      suggestions.push({
        priority: "high",
        target: `lib/chapter-blueprint/templates/${templateId}.ts`,
        action: `Template "${templateId}" 失败率 ${Math.round(failRate * 100)}%（${stats.failures}次失败/${stats.resolved}次解决）。检查 slot 描述是否清晰，或增加更详细的使用示例。`,
        evidence: `${stats.failures} failures in analysis period`,
        autoFixable: false,
      });
    }
  }

  // ── 2. Frequent "ai_content_error" → slot descriptions unclear ──────
  const contentErrors = topErrors.filter((e) => e.rootCause === "ai_content_error");
  if (contentErrors.length >= 3) {
    suggestions.push({
      priority: "high",
      target: "lib/agent/system-prompt.ts",
      action: `AI 频繁填错槽位内容（${contentErrors.reduce((s, e) => s + e.count, 0)}次）。在 system prompt 中增加每个模板的槽位使用示例，特别是数据类型和格式要求。`,
      evidence: contentErrors.map((e) => `"${e.message}" (${e.count}次)`).join(", "),
      autoFixable: false,
    });
  }

  // ── 3. "validation_rule_too_strict" → L3 rules catching valid content ─
  const strictRules = events.filter((e) => e.rootCause === "validation_rule_too_strict");
  if (strictRules.length >= 5) {
    const ruleBreakdown = new Map<string, number>();
    for (const evt of strictRules) {
      for (const issue of evt.issues) {
        ruleBreakdown.set(issue.message, (ruleBreakdown.get(issue.message) ?? 0) + 1);
      }
    }
    const topRules = [...ruleBreakdown.entries()].sort(([, a], [, b]) => b - a).slice(0, 3);

    suggestions.push({
      priority: "medium",
      target: "lib/chapter-blueprint/validator.ts",
      action: `L3 校验规则过于严格，频繁拦截合法内容（${strictRules.length}次）。考虑将这些规则从 error 降为 warning：${topRules.map(([msg, c]) => `"${msg.slice(0, 60)}" (${c}次)`).join("; ")}`,
      evidence: `${strictRules.length} events flagged as validation_rule_too_strict`,
      autoFixable: false,
    });
  }

  // ── 4. "compiler_bug" → investigate ──────────────────────────────────
  const compilerBugs = events.filter((e) => e.rootCause === "compiler_bug");
  if (compilerBugs.length > 0) {
    suggestions.push({
      priority: "high",
      target: "lib/chapter-blueprint/compiler.ts",
      action: `编译器产生 ${compilerBugs.length} 次错误（有效 Blueprint → 生成代码失败）。检查 genTemplateLayout/genComposedLayout/genCustomLayout 的边界条件处理。`,
      evidence: compilerBugs.map((e) => e.errorSummary).join("; "),
      autoFixable: false,
    });
  }

  // ── 5. Recurring template gaps → new template needed ─────────────────
  if (recurringGaps.length > 0) {
    suggestions.push({
      priority: "medium",
      target: "lib/chapter-blueprint/templates/",
      action: `检测到 ${recurringGaps.length} 种反复出现的缺失模板模式。最频繁的需求：${recurringGaps.slice(0, 3).join(" | ")}。考虑创建对应的新模板。`,
      evidence: `${recurringGaps.length} recurring gap patterns`,
      autoFixable: false,
    });
  }

  // ── 6. tsc type mismatches → generated code issue ────────────────────
  const tscFailures = events.filter((e) => e.rootCause === "tsc_type_mismatch");
  if (tscFailures.length >= 3) {
    suggestions.push({
      priority: "medium",
      target: "lib/chapter-blueprint/compiler.ts",
      action: `生成的代码产生 ${tscFailures.length} 次类型错误。检查 AST builder 生成的 import 语句和组件 props 类型是否完整。`,
      evidence: tscFailures.map((e) => e.errorSummary).join("; "),
      autoFixable: false,
    });
  }

  // Sort by priority
  const priorityRank = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  return suggestions;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Quick helpers for embedding in build pipeline
// ═══════════════════════════════════════════════════════════════════════════════

import { createHash } from "crypto";

export function hashBlueprint(bp: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(bp))
    .digest("hex")
    .slice(0, 12);
}

/**
 * Helper: record a validation failure with auto-classification.
 * Call this from ProjectSetChapter/ProjectSetChapters when validation fails.
 */
export function recordValidationFailure(
  projectId: string,
  chapterId: string,
  bp: unknown,
  templateUsed: string | undefined,
  issues: Array<{ level: string; step: number | null; field: string; message: string }>
): void {
  const rootCause = classifyRootCause("validation", templateUsed, issues);
  recordBuildEvent({
    projectId: hashProjectId(projectId),
    chapterId,
    stage: "validation",
    rootCause,
    templateUsed,
    blueprintHash: hashBlueprint(bp),
    errorSummary: `Validation: ${issues.length} issues — ${rootCause}`,
    errorDetail: issues.map((i) => `[${i.level}] ${i.field}: ${i.message}`).join("\n"),
    issues: issues as BuildTelemetryEvent["issues"],
  });
}

/**
 * Helper: record a compilation failure.
 */
export function recordCompilationFailure(
  projectId: string,
  chapterId: string,
  bp: unknown,
  templateUsed: string | undefined,
  errorMessage: string
): void {
  recordBuildEvent({
    projectId: hashProjectId(projectId),
    chapterId,
    stage: "compilation",
    rootCause: "compiler_bug",
    templateUsed,
    blueprintHash: hashBlueprint(bp),
    errorSummary: `Compilation: ${errorMessage.slice(0, 100)}`,
    errorDetail: errorMessage,
    issues: [{ level: "error", step: null, field: "compiler", message: errorMessage }],
  });
}

/**
 * Helper: record a tsc failure.
 */
export function recordTscFailure(
  projectId: string,
  chapterId: string,
  bp: unknown,
  templateUsed: string | undefined,
  tscErrors: string
): void {
  recordBuildEvent({
    projectId: hashProjectId(projectId),
    chapterId,
    stage: "tsc",
    rootCause: "tsc_type_mismatch",
    templateUsed,
    blueprintHash: hashBlueprint(bp),
    errorSummary: `tsc: ${tscErrors.slice(0, 100)}`,
    errorDetail: tscErrors,
    issues: tscErrors.split("\n").filter(Boolean).map((line) => ({
      level: "error" as const,
      step: null,
      field: "generated.tsx",
      message: line,
    })),
  });
}

function hashProjectId(id: string): string {
  return createHash("sha256").update(id).digest("hex").slice(0, 8);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard summary (for admin UI or periodic review)
// ═══════════════════════════════════════════════════════════════════════════════

export function quickSummary(): string {
  const report = analyzeTelemetry(7);

  if (report.totalEvents === 0) {
    return "📊 过去 7 天无构建失败记录。系统运行良好。";
  }

  const lines: string[] = [
    `📊 过去 ${report.periodDays} 天构建遥测摘要`,
    `   总失败: ${report.totalEvents} | 解决率: ${Math.round(report.resolvedRate * 100)}%`,
    `   按阶段: ${Object.entries(report.byStage).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    `   按根因: ${Object.entries(report.byRootCause).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    "",
  ];

  if (report.suggestions.length > 0) {
    lines.push(`🔧 ${report.suggestions.length} 条改进建议：`);
    for (const sug of report.suggestions) {
      lines.push(`  [${sug.priority}] ${sug.action.slice(0, 120)}`);
    }
  }

  return lines.join("\n");
}
