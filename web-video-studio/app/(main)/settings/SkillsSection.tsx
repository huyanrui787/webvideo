"use client";

import { useState } from "react";
import type { Skill } from "@/lib/skills";

interface SkillsSectionProps {
  skills: Skill[];
  mainSkillId: string;
  skillsRoot: string;
  enabledSkills: Set<string>;
  onToggle: (id: string, on: boolean) => void;
  isDirty: (id: string) => boolean;
}

export function SkillsSection({
  skills, mainSkillId, skillsRoot, enabledSkills, onToggle, isDirty,
}: SkillsSectionProps) {
  const [testState, setTestState] = useState<{ status: "idle" | "running" | "done" | "error"; result?: string }>({ status: "idle" });
  const [firstProjectId, setFirstProjectId] = useState<string | null>(null);

  async function handleTest() {
    if (testState.status === "running") return;
    if (!firstProjectId) {
      try {
        const r = await fetch("/api/projects");
        const list = r.ok ? await r.json() : [];
        if (!Array.isArray(list) || !list[0]?.id) {
          setTestState({ status: "error", result: "没有可用项目来测试，请先创建一个项目" });
          return;
        }
        setFirstProjectId(list[0].id);
      } catch {
        setTestState({ status: "error", result: "获取项目列表失败" });
        return;
      }
    }
    setTestState({ status: "running" });
    try {
      const res = await fetch(`/api/projects/${firstProjectId}/test-skills`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "请求失败");
      setTestState({ status: "done", result: data.reply });
    } catch (err) {
      setTestState({ status: "error", result: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-t1 mb-1">可用 Skills</h2>
      <p className="text-sm text-t3 mb-3">
        勾选要启用的 Skill，AI 在生成内容时会参考它们的工作流。变更自动保存，对所有项目生效。
      </p>
      {skillsRoot && (
        <p className="text-[11px] text-t4 mb-4 font-mono break-all">
          扫描根目录：{skillsRoot}（新增 skill 后需要重启 Studio 才能扫到）
        </p>
      )}

      {skills.length === 0 ? (
        <div className="text-sm text-t3 py-6 text-center">扫描中…</div>
      ) : (
        <div className="flex flex-col gap-2">
          {skills.map((s) => {
            const checked = enabledSkills.has(s.id);
            const isMain = (s as { role?: string }).role === "main" || s.id === mainSkillId;
            const dirty = isDirty(s.id);
            return (
              <label
                key={s.id}
                className={[
                  "flex items-start gap-3 rounded-xl border-2 px-4 py-3 transition-all cursor-pointer",
                  checked
                    ? "border-accent bg-surface2"
                    : "border-bd bg-modal hover:border-bd-hover",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isMain}
                  onChange={(e) => onToggle(s.id, e.target.checked)}
                  className="mt-1 w-4 h-4 shrink-0 accent-[var(--accent)] disabled:opacity-50"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-t1">{s.name}</p>
                    {s.version && <span className="text-[10px] text-t3 font-mono">v{s.version}</span>}
                    {s.category && (
                      <span className="text-[10px] text-t3 bg-surface3 px-1.5 py-0.5 rounded">
                        {s.category}
                      </span>
                    )}
                    {isMain && (
                      <span className="text-[10px] text-accent-text bg-accent px-1.5 py-0.5 rounded font-medium">
                        主 Skill · 不可关
                      </span>
                    )}
                    {dirty && !isMain && (
                      <span className="text-[10px] text-t3 animate-pulse">保存中…</span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-xs text-t3 mt-1 leading-relaxed">{s.description}</p>
                  )}
                  <p className="text-[10px] text-t4 mt-1 font-mono break-all">{s.id}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleTest}
          disabled={testState.status === "running" || skills.length === 0}
          className="text-xs px-3 py-1.5 rounded-lg border border-bd text-t2 hover:bg-surface2 disabled:opacity-40 transition-colors"
        >
          {testState.status === "running" ? "测试中…" : "测试一下"}
        </button>
        <span className="text-xs text-t3">
          用当前启用的 skills 让 AI 列一份清单，确认它确实看到了
        </span>
      </div>
      {testState.result && (
        <div className={`mt-3 p-3 rounded-lg text-xs whitespace-pre-wrap ${testState.status === "error" ? "bg-red-50 text-red-700" : "bg-surface2 text-t2"}`}>
          {testState.result}
        </div>
      )}
    </div>
  );
}
