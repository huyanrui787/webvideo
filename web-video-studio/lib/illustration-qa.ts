/**
 * QA checklist for illustration-video mode.
 * After image generation, these checks can be run automatically.
 *
 * Note: This is a heuristic module. It does NOT call external image analysis APIs —
 * it checks metadata and prompt quality based on the shot record and generation result.
 * Full visual QA requires an image-capable model (Claude Vision / GPT-4V).
 */

import type { IllustrationShot } from "@/lib/db/schema";

export interface QAResult {
  passed: boolean;
  checks: QACheck[];
  score: number; // 0-100
}

export interface QACheck {
  name: string;
  passed: boolean;
  detail: string;
  severity: "error" | "warning";
}

/**
 * Run QA on a generated shot. Checks metadata quality + prompt quality.
 * Returns a score and list of checks.
 */
export function checkShot(shot: IllustrationShot): QAResult {
  const checks: QACheck[] = [];

  // 1. Generation status check
  checks.push({
    name: "生成状态",
    passed: shot.generationStatus === "done",
    detail: shot.generationStatus === "done" ? "生成成功" : `状态异常: ${shot.generationStatus}`,
    severity: "error",
  });

  // 2. Asset file exists check (requires file system access)
  if (shot.assetFilename) {
    checks.push({
      name: "文件命名",
      passed: shot.assetFilename.endsWith(".png"),
      detail: shot.assetFilename.endsWith(".png") ? "格式正确 (.png)" : "格式不是 PNG",
      severity: "error",
    });
  } else {
    checks.push({
      name: "文件保存",
      passed: false,
      detail: "未保存文件",
      severity: "error",
    });
  }

  // 3. Prompt quality checks
  if (shot.promptEn) {
    checks.push({
      name: "背景描述",
      passed: /white background/i.test(shot.promptEn),
      detail: /white background/i.test(shot.promptEn) ? "已指定纯白背景" : "缺少纯白背景约束",
      severity: "error",
    });

    checks.push({
      name: "小黑角色",
      passed: /小黑/.test(shot.promptEn),
      detail: /小黑/.test(shot.promptEn) ? "已包含小黑角色" : "缺少小黑角色描述",
      severity: "error",
    });

    checks.push({
      name: "尺寸规格",
      passed: /16:9|16:9/.test(shot.promptEn),
      detail: /16:9/.test(shot.promptEn) ? "已指定 16:9" : "缺少 16:9 尺寸约束",
      severity: "warning",
    });

    checks.push({
      name: "禁止渐变",
      passed: /no gradients/i.test(shot.promptEn),
      detail: /no gradients/i.test(shot.promptEn) ? "已禁止渐变" : "未明确禁止渐变",
      severity: "warning",
    });

    checks.push({
      name: "留白约束",
      passed: /empty.*(space|white)|35%|40.*60/.test(shot.promptEn),
      detail: /empty.*(space|white)|35%|40.*60/.test(shot.promptEn) ? "已指定留白/主体比例" : "缺少留白约束",
      severity: "warning",
    });
  } else {
    checks.push({
      name: "Prompt 存在",
      passed: false,
      detail: "未生成 prompt",
      severity: "error",
    });
  }

  // 4. Metadata completeness
  const elements = safeParse(shot.elements);
  const labels = safeParse(shot.labels);
  checks.push({
    name: "元素数量",
    passed: elements.length >= 2,
    detail: elements.length >= 2 ? `${elements.length} 个元素` : "元素少于 2 个（可能画面空洞）",
    severity: "warning",
  });
  checks.push({
    name: "标注数量",
    passed: labels.length <= 8,
    detail: labels.length <= 8 ? `${labels.length} 个标注` : `标注过多 (${labels.length} > 8)`,
    severity: "error",
  });

  // Scoring
  const errorCount = checks.filter((c) => c.severity === "error" && !c.passed).length;
  const warningCount = checks.filter((c) => c.severity === "warning" && !c.passed).length;
  const totalWeight = checks.length;
  const passedWeight = checks.filter((c) => c.passed).length + checks.filter((c) => c.severity === "warning" && !c.passed).length * 0.5;
  const score = Math.round((passedWeight / totalWeight) * 100);

  return {
    passed: errorCount === 0,
    checks,
    score,
  };
}

/**
 * Run QA on all shots in a project, return a summary.
 */
export function summarizeQA(results: QAResult[]): {
  totalShots: number;
  passedShots: number;
  averageScore: number;
  commonIssues: string[];
} {
  const passedShots = results.filter((r) => r.passed).length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  // Collect common failing checks
  const failCounts = new Map<string, number>();
  for (const r of results) {
    for (const c of r.checks) {
      if (!c.passed) {
        failCounts.set(c.name, (failCounts.get(c.name) ?? 0) + 1);
      }
    }
  }
  const commonIssues = [...failCounts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name} (${count}/${results.length})`);

  return { totalShots: results.length, passedShots, averageScore: avgScore, commonIssues };
}

function safeParse(raw: string): unknown[] {
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}
