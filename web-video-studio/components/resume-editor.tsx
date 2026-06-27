"use client";

import { useState, useEffect } from "react";
import type { ResumeData } from "@/lib/resume-parser";

interface ResumeEditorProps {
  projectId: string;
}

export function ResumeEditor({ projectId }: ResumeEditorProps) {
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("basics");

  useEffect(() => {
    fetch(`/api/projects/${projectId}/resume`)
      .then((r) => r.json())
      .then((d) => {
        if (d.basics) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleParse() {
    if (pasteText.trim().length < 20) return;
    setParsing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/resume/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: pasteText }),
      });
      const d = await res.json();
      if (res.ok && d.basics) {
        setData(d);
        setPasteText("");
      } else {
        alert(d.error ?? "解析失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/resume`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
  }

  async function handleScaffold() {
    await fetch(`/api/projects/${projectId}/resume/scaffold`, { method: "POST" });
  }

  function updateBasics(key: string, value: string) {
    if (!data) return;
    setData({ ...data, basics: { ...data.basics, [key]: value } });
  }

  if (loading) {
    return <div className="p-8 text-sm text-t3">加载中…</div>;
  }

  // No data yet — show input
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <h2 className="text-lg font-semibold text-t1 mb-2">创建在线简历</h2>
          <p className="text-sm text-t2 mb-4">
            粘贴你的简历文字，AI 将自动提取并结构化所有信息。
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-input-bd bg-input-bg px-4 py-3 text-sm text-t1 placeholder:text-input-placeholder outline-none focus:border-amber-600/40 transition-all resize-none mb-4"
            placeholder="粘贴简历内容…&#10;&#10;例如：&#10;张三，高级前端工程师&#10;zhangsan@example.com | 138-0000-0000 | 北京&#10;&#10;工作经历：&#10;字节跳动 高级前端工程师 2022.3 - 至今&#10;- 主导设计并实现了XX系统前端架构&#10;- 带领5人团队完成YY项目从0到1&#10;&#10;教育背景：&#10;北京大学 计算机科学 本科 2018-2022&#10;&#10;技能：React, TypeScript, Node.js, Python"
          />
          <button
            onClick={handleParse}
            disabled={parsing || pasteText.trim().length < 20}
            className="w-full py-2.5 rounded-xl bg-brand text-white font-medium text-sm disabled:opacity-50 transition-all"
          >
            {parsing ? "AI 解析中…" : "AI 解析简历"}
          </button>
        </div>
      </div>
    );
  }

  // Data loaded — show editor
  const sections = [
    { key: "basics", label: "基本信息" },
    { key: "experience", label: `工作经历 (${data.experience?.length ?? 0})` },
    { key: "education", label: `教育背景 (${data.education?.length ?? 0})` },
    { key: "skills", label: `技能 (${data.skills?.length ?? 0})` },
    { key: "projects", label: `项目 (${data.projects?.length ?? 0})` },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: section nav */}
      <div className="w-48 shrink-0 border-r border-bd p-4 space-y-1">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === s.key
                ? "bg-brand/10 text-brand-text font-medium"
                : "text-t2 hover:text-t1 hover:bg-surface"
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="pt-4 border-t border-bd mt-4 space-y-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-50 transition-all"
          >
            {saving ? "保存中…" : "保存"}
          </button>
          <button
            onClick={handleScaffold}
            className="w-full py-2 rounded-lg border border-bd text-sm text-t1 hover:bg-surface transition-all"
          >
            生成网页 →
          </button>
        </div>
      </div>

      {/* Right: editor */}
      <div className="flex-1 overflow-auto p-6">
        {activeSection === "basics" && (
          <div className="max-w-lg space-y-4">
            <h3 className="text-base font-semibold text-t1 mb-4">基本信息</h3>
            {[
              ["name", "姓名"],
              ["label", "职位头衔"],
              ["email", "邮箱"],
              ["phone", "电话"],
              ["location", "所在地"],
              ["website", "个人网站"],
              ["summary", "个人概述"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-t2 mb-1">{label}</label>
                {key === "summary" ? (
                  <textarea
                    value={(data.basics as Record<string, string>)[key] ?? ""}
                    onChange={(e) => updateBasics(key, e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none focus:border-amber-600/40 transition-all resize-none"
                  />
                ) : (
                  <input
                    value={(data.basics as Record<string, string>)[key] ?? ""}
                    onChange={(e) => updateBasics(key, e.target.value)}
                    className="w-full rounded-lg border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none focus:border-amber-600/40 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {activeSection === "experience" && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-t1">工作经历</h3>
            {(data.experience ?? []).map((exp, i) => (
              <div key={i} className="p-4 rounded-xl border border-bd bg-surface">
                <input
                  value={exp.position}
                  onChange={(e) => {
                    const updated = [...(data.experience ?? [])];
                    updated[i] = { ...updated[i], position: e.target.value };
                    setData({ ...data, experience: updated });
                  }}
                  className="w-full bg-transparent text-sm font-semibold text-t1 mb-1 outline-none"
                  placeholder="职位"
                />
                <input
                  value={exp.company}
                  onChange={(e) => {
                    const updated = [...(data.experience ?? [])];
                    updated[i] = { ...updated[i], company: e.target.value };
                    setData({ ...data, experience: updated });
                  }}
                  className="w-full bg-transparent text-sm text-accent mb-2 outline-none"
                  placeholder="公司"
                />
                <div className="flex gap-2 mb-2">
                  <input
                    value={exp.startDate}
                    onChange={(e) => {
                      const updated = [...(data.experience ?? [])];
                      updated[i] = { ...updated[i], startDate: e.target.value };
                      setData({ ...data, experience: updated });
                    }}
                    className="flex-1 bg-transparent text-xs text-t2 outline-none"
                    placeholder="开始 (YYYY-MM)"
                  />
                  <span className="text-xs text-t3">—</span>
                  <input
                    value={exp.endDate}
                    onChange={(e) => {
                      const updated = [...(data.experience ?? [])];
                      updated[i] = { ...updated[i], endDate: e.target.value };
                      setData({ ...data, experience: updated });
                    }}
                    className="flex-1 bg-transparent text-xs text-t2 outline-none"
                    placeholder="结束 (YYYY-MM)"
                  />
                </div>
                <textarea
                  value={(exp.highlights ?? []).join("\n")}
                  onChange={(e) => {
                    const updated = [...(data.experience ?? [])];
                    updated[i] = {
                      ...updated[i],
                      highlights: e.target.value.split("\n").filter(Boolean),
                    };
                    setData({ ...data, experience: updated });
                  }}
                  rows={3}
                  className="w-full bg-transparent text-xs text-t2 outline-none resize-none"
                  placeholder="工作亮点，每行一个"
                />
              </div>
            ))}
          </div>
        )}

        {(activeSection === "skills") && (
          <div className="max-w-lg">
            <h3 className="text-base font-semibold text-t1 mb-4">技能</h3>
            <textarea
              value={(data.skills ?? []).map((s) => `${s.name}, ${s.level}, ${s.category}`).join("\n")}
              onChange={(e) => {
                const skills = e.target.value.split("\n").filter(Boolean).map((line) => {
                  const [name, level, category] = line.split(",").map((s) => s.trim());
                  return { name, level: level || "proficient", category: category || "Other" };
                });
                setData({ ...data, skills });
              }}
              rows={10}
              className="w-full rounded-lg border border-input-bd bg-input-bg px-3 py-2 text-sm text-t1 outline-none focus:border-amber-600/40 transition-all resize-none"
              placeholder="每行一个：技能名, 级别, 分类&#10;例如：React, expert, Frontend"
            />
          </div>
        )}

        {(activeSection !== "basics" && activeSection !== "experience" && activeSection !== "skills") && (
          <div className="text-sm text-t2">
            <p>此部分可在解析后编辑。当前数据已保存。</p>
            <pre className="mt-4 p-4 rounded-xl bg-surface text-xs text-t3 overflow-auto">
              {JSON.stringify((data as unknown as Record<string, unknown>)[activeSection], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
