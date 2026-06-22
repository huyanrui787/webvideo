/**
 * pruneMessages — 语义感知的上下文裁剪
 *
 * 所有 Skill 相关的路径约定（planFiles、chapterDirPattern 等）
 * 通过 SkillContext 传入，不在此文件硬编码。
 */

import type { SkillContext } from "@/lib/agent/skill-context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMsg = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPart = any;

export interface PruneContext {
  /** project status at the time of this request */
  status: string;
  /** chapters already registered — ids like "01-coldopen" */
  completedChapterIds: Set<string>;
  /** the chapter currently being worked on */
  activeChapterId: string | null;
  /** Skill context from manifest.json (planFiles, alwaysKeepFiles, chapterDirPattern) */
  skill: SkillContext;
}

function toolName(part: AnyPart): string {
  return String(part.type ?? "").replace(/^tool-/, "");
}

function isTool(part: AnyPart, name?: string): boolean {
  const t = String(part.type ?? "");
  if (!t.startsWith("tool-")) return false;
  return name ? toolName(part) === name : true;
}

function hasOutput(part: AnyPart): boolean {
  return part.output !== undefined || part.state === "output-available" || part.state === "result";
}

function getOutput(part: AnyPart): string {
  const out = part.output ?? part.result;
  if (typeof out === "string") return out;
  if (out && typeof out === "object") {
    if (out.content) return String(out.content);
    if (out.error) return `[error] ${out.error}`;
    if (out.files) return JSON.stringify(out.files);
    return JSON.stringify(out);
  }
  return "";
}

function getInput(part: AnyPart): Record<string, string> {
  return part.input ?? part.toolInput ?? {};
}

function replaceOutput(part: AnyPart, summary: string): AnyPart {
  const clone = { ...part };
  const summaryObj = { content: summary };
  if (clone.output !== undefined) clone.output = summaryObj;
  if (clone.result !== undefined) clone.result = summaryObj;
  return clone;
}

function isChapterFile(filePath: string, chapterDirPattern: string | null): boolean {
  if (!chapterDirPattern) return false;
  return filePath.includes(chapterDirPattern) || filePath.includes("/chapters/");
}

function chapterIdFromPath(filePath: string, chapterDirPattern: string | null): string | null {
  // Try the skill-declared pattern first, then fall back to a generic match
  const patterns = chapterDirPattern
    ? [chapterDirPattern + "/([^/]+)/", "chapters/([^/]+)/"]
    : ["chapters/([^/]+)/"];
  for (const pat of patterns) {
    const m = filePath.match(new RegExp(pat));
    if (m) return m[1];
  }
  return null;
}

export function pruneMessages(messages: AnyMsg[], ctx: PruneContext): AnyMsg[] {
  const { skill } = ctx;
  const planFiles = new Set(skill.planFiles);
  const alwaysKeepFiles = new Set(skill.alwaysKeepFiles);
  const { chapterDirPattern } = skill;

  // ── Compression: three-tier aging summary ─────────────────────────────────
  // Ancient (>30 msg ago) → structured JSON summary
  // Middle (10-30 ago)    → one-line summary
  // Recent (<10 ago)      → keep verbatim
  //
  // Token estimation: CJK chars ×1.5, ASCII ×0.3. Compression fires at 60% util.

  const ANCIENT_CUTOFF = 30;
  const MIDDLE_CUTOFF = 10;
  const TOKEN_BUDGET_RATIO = 0.6; // compress when estimated tokens exceed 60% of ~150K budget
  const ESTIMATED_BUDGET = 150_000;

  function estimateTokens(text: string): number {
    let cjk = 0, ascii = 0;
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code > 0x2e00) cjk++; else ascii++;
    }
    return Math.ceil(cjk * 1.5 + ascii * 0.3);
  }

  // Estimate total tokens across all messages
  let estimatedTotal = 0;
  for (const m of messages) {
    for (const p of (m.parts ?? [])) {
      const t = typeof p.text === "string" ? p.text : (p.content ?? "");
      if (t) estimatedTotal += estimateTokens(String(t));
    }
  }

  if (estimatedTotal > ESTIMATED_BUDGET * TOKEN_BUDGET_RATIO && messages.length > MIDDLE_CUTOFF) {
    const recentMsgs = messages.slice(-MIDDLE_CUTOFF);
    const middleMsgs = messages.slice(-ANCIENT_CUTOFF, -MIDDLE_CUTOFF);
    const ancientMsgs = messages.slice(0, -ANCIENT_CUTOFF);

    // Build structured summary of ancient messages
    const chapterList = [...ctx.completedChapterIds];
    let ancientSummary = `[远古摘要 · ${ancientMsgs.length} 条消息]\n阶段：${ctx.status}\n已完成章节（${chapterList.length}）：${chapterList.join(", ") || "无"}`;

    // Extract key facts from ancient messages: tool names, written files, status changes
    const writtenFiles = new Set<string>();
    for (const m of ancientMsgs) {
      if (m.role !== "assistant") continue;
      for (const p of (m.parts ?? [])) {
        if (String(p.type ?? "").startsWith("tool-")) {
          const inp = p.input ?? p.toolInput ?? {};
          if (inp.path) writtenFiles.add(inp.path);
        }
      }
    }
    if (writtenFiles.size > 0) {
      ancientSummary += `\n写入文件：${[...writtenFiles].slice(0, 10).join(", ")}${writtenFiles.size > 10 ? "等" : ""}`;
    }

    // Middle messages → one-line summary per message
    const middleParts: AnyMsg[] = middleMsgs.map((m, i) => {
      if (m.role === "user") {
        const text = (m.parts ?? []).filter((p: AnyPart) => p.type === "text").map((p: AnyPart) => p.text ?? "").join("").slice(0, 60);
        return { ...m, parts: [{ type: "text", text: `[用户] ${text}${text.length >= 60 ? "…" : ""}` }] };
      }
      if (m.role === "assistant") {
        const toolCount = (m.parts ?? []).filter((p: AnyPart) => String(p.type ?? "").startsWith("tool-")).length;
        return { ...m, parts: [{ type: "text", text: `[AI · ${toolCount} 个操作]` }] };
      }
      return m;
    });

    const summaryMsg: AnyMsg = {
      id: `compressed-ancient-${ancientMsgs.length}`,
      role: "user",
      parts: [{ type: "text", text: ancientSummary }],
    };

    return [summaryMsg, ...middleParts, ...recentMsgs];
  }

  // ── Pass 0: dedup consecutive identical assistant text ────────────────────
  let deduped = messages;
  if (messages.length > 3) {
    deduped = messages.filter((msg, i) => {
      if (i === 0 || msg.role !== "assistant") return true;
      const prev = messages[i - 1];
      if (prev.role !== "assistant") return true;
      const prevText = (prev.parts ?? []).filter((p: AnyPart) => p.type === "text").map((p: AnyPart) => p.text ?? "").join("");
      const thisText = (msg.parts ?? []).filter((p: AnyPart) => p.type === "text").map((p: AnyPart) => p.text ?? "").join("");
      if (prevText && prevText === thisText) return false; // duplicate
      return true;
    });
  }

  // ── Pass 1: scan full history to build indices ─────────────────────────────
  const writtenPaths = new Set<string>();
  const latestReadIdx = new Map<string, { msgIdx: number; partIdx: number }>();
  const latestListIdx = new Map<string, { msgIdx: number; partIdx: number }>();
  let latestTscOkIdx: { msgIdx: number; partIdx: number } | null = null;

  deduped.forEach((msg, mi) => {
    if (msg.role !== "assistant") return;
    (msg.parts ?? []).forEach((part: AnyPart, pi: number) => {
      if (!isTool(part)) return;
      const name = toolName(part);
      const inp = getInput(part);

      if (name === "ProjectWrite" && inp.path) {
        writtenPaths.add(inp.path);
      }
      if (name === "ProjectRead" && inp.path && hasOutput(part)) {
        latestReadIdx.set(inp.path, { msgIdx: mi, partIdx: pi });
      }
      if (name === "ProjectList" && hasOutput(part)) {
        latestListIdx.set(inp.dir ?? ".", { msgIdx: mi, partIdx: pi });
      }
      if (name === "ProjectShell" && hasOutput(part)) {
        const cmd = String(inp.cmd ?? "");
        if (cmd.includes("tsc")) {
          const out = getOutput(part);
          const hasError = out.includes("error TS") || out.includes("Error:");
          if (!hasError) latestTscOkIdx = { msgIdx: mi, partIdx: pi };
        }
      }
    });
  });

  // ── Pass 2: rewrite messages ───────────────────────────────────────────────
  return deduped.map((msg, mi) => {
    if (msg.role !== "assistant") return msg;

    const newParts: AnyPart[] = (msg.parts ?? []).map((part: AnyPart, pi: number) => {
      if (!isTool(part) || !hasOutput(part)) return part;

      const name = toolName(part);
      const inp = getInput(part);

      // ── ProjectRead ────────────────────────────────────────────────────────
      if (name === "ProjectRead" && inp.path) {
        const filePath: string = inp.path;
        const latest = latestReadIdx.get(filePath);

        // Not the latest read → superseded
        if (latest && (latest.msgIdx !== mi || latest.partIdx !== pi)) {
          return replaceOutput(part, `[旧读取已废弃，以最新为准]`);
        }

        // Written after this message → stale
        if (writtenPaths.has(filePath)) {
          const wroteAfter = messages.slice(mi + 1).some((m: AnyMsg) =>
            m.role === "assistant" &&
            (m.parts ?? []).some((p: AnyPart) =>
              isTool(p, "ProjectWrite") && getInput(p).path === filePath
            )
          );
          if (wroteAfter) {
            return replaceOutput(part, `[已被后续写入覆盖，内容失效]`);
          }
        }

        // Completed chapter file (not the active chapter) → single-line summary
        if (isChapterFile(filePath, chapterDirPattern)) {
          const chapId = chapterIdFromPath(filePath, chapterDirPattern);
          if (chapId && ctx.completedChapterIds.has(chapId) && chapId !== ctx.activeChapterId) {
            const out = getOutput(part);
            return replaceOutput(
              part,
              `[章节 ${chapId} 已完成，文件 ${out.split("\n").length} 行 / ${out.length} chars，内容已省略]`
            );
          }
        }

        // Plan files (outline.md / script.md / rhythm.md …) — keep only latest
        if (planFiles.has(filePath)) {
          const latest2 = latestReadIdx.get(filePath);
          if (latest2 && (latest2.msgIdx !== mi || latest2.partIdx !== pi)) {
            return replaceOutput(part, `[旧版本 ${filePath}，已被最新读取替代]`);
          }
        }

        // Large non-essential files → truncate
        const out = getOutput(part);
        if (
          out.length > 4000 &&
          !isChapterFile(filePath, chapterDirPattern) &&
          !planFiles.has(filePath) &&
          !alwaysKeepFiles.has(filePath)
        ) {
          return replaceOutput(
            part,
            out.slice(0, 800) + `\n...[内容已截断，原长 ${out.length} chars]`
          );
        }

        return part;
      }

      // ── ProjectShell ───────────────────────────────────────────────────────
      if (name === "ProjectShell") {
        const cmd = String(inp.cmd ?? "");
        if (cmd.includes("tsc")) {
          const out = getOutput(part);
          const hasError = out.includes("error TS") || out.includes("Error:");
          if (!hasError) {
            const isLatestOk = latestTscOkIdx?.msgIdx === mi && latestTscOkIdx?.partIdx === pi;
            return replaceOutput(part, isLatestOk ? "[typecheck: OK]" : "[typecheck: OK (已省略)]");
          }
          return part; // errors always kept
        }

        // Large non-error shell output → truncate
        // Exception: cat/sed commands targeting Skill reference files are never truncated
        // (CHAPTER-CRAFT.md, PRIMITIVES.md etc. contain quality rules the model must retain)
        const out = getOutput(part);
        const skillRoot = skill.path;
        const isSkillRefRead = skillRoot
          ? (cmd.includes("cat") || cmd.includes("sed")) &&
            cmd.includes(skillRoot) &&
            !cmd.includes("/EXAMPLES/") // EXAMPLES are optional reference, not required rules
          : false;
        if (!isSkillRefRead && out.length > 1500 && !out.includes("error") && !out.includes("Error")) {
          return replaceOutput(
            part,
            out.slice(0, 400) + `\n...[输出已截断，原长 ${out.length} chars]`
          );
        }
        return part;
      }

      // ── ProjectList ────────────────────────────────────────────────────────
      if (name === "ProjectList") {
        const dir = inp.dir ?? ".";
        const latest2 = latestListIdx.get(dir);
        if (latest2 && (latest2.msgIdx !== mi || latest2.partIdx !== pi)) {
          return replaceOutput(part, `[旧目录列表已省略，以最新为准]`);
        }
        return part;
      }

      return part;
    });

    // ── Pass 3: prune large tool inputs ────────────────────────────────────
    const prunedParts = (ctx.status === "building" || ctx.status === "done")
      ? newParts.map((part: AnyPart) => {
          if (!isTool(part)) return part;
          const name = toolName(part);
          const inp = getInput(part);

          // ProjectSetChapters: replace blueprint array with count summary
          if (name === "ProjectSetChapters" && inp.blueprints) {
            const blueprints = Array.isArray(inp.blueprints) ? inp.blueprints : [];
            const done = blueprints.filter((b: any) =>
              ctx.completedChapterIds.has(b.id ?? b.chapterId ?? "")
            ).length;
            if (done === blueprints.length && blueprints.length > 0) {
              const clone = { ...part };
              const summaryInput = { ...inp, blueprints: `[${blueprints.length} 章 blueprint 已全部构建完成，内容省略]` };
              if (clone.input !== undefined) clone.input = summaryInput;
              return clone;
            }
          }

          // ProjectSetChapter: replace completed chapter blueprint
          if (name === "ProjectSetChapter" && inp.blueprint) {
            const bp = inp.blueprint;
            const chapId = bp?.id ?? bp?.chapterId ?? "";
            if (chapId && ctx.completedChapterIds.has(chapId)) {
              const clone = { ...part };
              const summaryInput = { ...inp, blueprint: `[章节 ${chapId} blueprint 已构建，内容省略]` };
              if (clone.input !== undefined) clone.input = summaryInput;
              return clone;
            }
          }

          return part;
        })
      : newParts;

    return { ...msg, parts: prunedParts };
  });
}
