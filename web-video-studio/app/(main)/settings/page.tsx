"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { VOICE_META } from "@/lib/voice-meta";
import type { VoiceItem } from "@/app/api/voices/route";
import type { Skill } from "@/lib/skills";
import { SkillsSection } from "./SkillsSection";
import { StyleSettingsTab } from "./style-tab";
import ProviderSection from "./ProviderSection";

type TtsProvider = "minimax" | "openai";

const GENDER_LABEL: Record<string, string> = { male: "男声", female: "女声", neutral: "中性" };

/* ── SVG icons ─────────────────────────────────────────────────────── */

const IconSun = <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="3.5"/><line x1="10" y1="1.5" x2="10" y2="3.5"/><line x1="10" y1="16.5" x2="10" y2="18.5"/><line x1="3" y1="3" x2="4.5" y2="4.5"/><line x1="15.5" y1="15.5" x2="17" y2="17"/><line x1="1.5" y1="10" x2="3.5" y2="10"/><line x1="16.5" y1="10" x2="18.5" y2="10"/><line x1="3" y1="17" x2="4.5" y2="15.5"/><line x1="15.5" y1="4.5" x2="17" y2="3"/></svg>;
const IconMoon = <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 12.5a7 7 0 01-8-8 7 7 0 008 8z"/></svg>;
const IconSystem = <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="16" height="11" rx="1.5"/><line x1="8" y1="17" x2="12" y2="17"/><line x1="10" y1="14" x2="10" y2="17"/></svg>;

const THEMES: { id: "light" | "dark" | "system"; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "light",  label: "浅色",   desc: "明亮界面，适合白天使用",   icon: IconSun },
  { id: "dark",   label: "深色",   desc: "暗色界面，减少视觉疲劳",   icon: IconMoon },
  { id: "system", label: "跟随系统", desc: "自动匹配操作系统深浅色设置", icon: IconSystem },
];

/* ── Tab definitions ───────────────────────────────────────────────── */

const TABS = [
  { id: "appearance", label: "外观主题", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v2M8 12.5v2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M1.5 8h2M12.5 8h2M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></svg> },
  { id: "provider",   label: "模型供应商", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><line x1="4.5" y1="1.5" x2="4.5" y2="4"/><line x1="11.5" y1="1.5" x2="11.5" y2="4"/><circle cx="8" cy="8" r="1.5"/></svg> },
  { id: "workflow",   label: "工作模式",  icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg> },
  { id: "voice",      label: "配音音色",  icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 5.5v5a2 2 0 002 2h1l3 1.5v-12l-3 1.5h-1a2 2 0 00-2 2z"/></svg> },
  { id: "skills",     label: "可用 Skills", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="8,1.5 10.5,6 15,6.5 11.5,10 12.5,14.5 8,12 3.5,14.5 4.5,10 1,6.5 5.5,6"/></svg> },
  { id: "style",      label: "画面风格",  icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.06 1.06M12.01 12.01l1.06 1.06M2.93 13.07l1.06-1.06M12.01 3.99l1.06-1.06"/></svg> },
] as const;
type TabId = typeof TABS[number]["id"];

/* ── Shared radio card component ───────────────────────────────────── */

function RadioCard({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
        active ? "border-brand/50 bg-brand-subtle" : "border-bd bg-modal hover:border-bd-hover"
      }`}>
      {children}
    </button>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${active ? "border-brand-text" : "border-bd-strong"}`}>
      {active && <span className="w-2 h-2 rounded-full bg-brand" />}
    </span>
  );
}

export default function SettingsPage() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("appearance");
  const [loading, setLoading] = useState(true);

  // Workflow
  const [workflowMode, setWorkflowMode] = useState<"quick" | "detailed">("quick");
  const [savedWorkflowMode, setSavedWorkflowMode] = useState<"quick" | "detailed">("quick");
  const [illustrationsEnabled, setIllustrationsEnabled] = useState(true);
  const [savedIllustrationsEnabled, setSavedIllustrationsEnabled] = useState(true);

  // Voice
  const [voices, setVoices] = useState<{ minimax: VoiceItem[]; openai: VoiceItem[] }>({ minimax: [], openai: [] });
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>("minimax");
  const [ttsVoice, setTtsVoice] = useState<string>("");
  const [savedTtsVoice, setSavedTtsVoice] = useState<string>("");
  const [savedTtsProvider, setSavedTtsProvider] = useState<TtsProvider>("minimax");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [savingVoice, setSavingVoice] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Skills
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mainSkillId, setMainSkillId] = useState<string>("");
  const [skillsRoot, setSkillsRoot] = useState<string>("");
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(new Set());
  const [savedSkills, setSavedSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.workflowMode) { setWorkflowMode(data.workflowMode); setSavedWorkflowMode(data.workflowMode); }
        if (data?.illustrationsEnabled !== undefined) { setIllustrationsEnabled(data.illustrationsEnabled); setSavedIllustrationsEnabled(data.illustrationsEnabled); }
        if (data?.preferredTtsVoice) { setTtsVoice(data.preferredTtsVoice); setSavedTtsVoice(data.preferredTtsVoice); }
        if (data?.preferredTtsProvider) { setTtsProvider(data.preferredTtsProvider); setSavedTtsProvider(data.preferredTtsProvider); }
        if (data?.enabledSkills) { const s = new Set<string>(data.enabledSkills); setEnabledSkills(s); setSavedSkills(new Set(data.enabledSkills)); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/voices").then(r => r.ok ? r.json() : null).then(d => { if (d) setVoices(d); });
    fetch("/api/skills").then((r) => r.ok ? r.json() : null).then((d) => {
      if (!d) return;
      setSkills(d.skills as Skill[]); setMainSkillId(d.mainSkillId); setSkillsRoot(d.skillsRoot);
    });
  }, []);

  const skillsDirtyRef = useRef(false);
  useEffect(() => {
    if (!skillsDirtyRef.current) return;
    if (enabledSkills.size === 0) return;
    const id = setTimeout(() => {
      fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabledSkills: Array.from(enabledSkills) }) })
        .then((r) => r.ok ? r.json() : null)
        .then(() => setSavedSkills(new Set(enabledSkills)))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(id);
  }, [enabledSkills]);

  function toggleSkill(id: string, on: boolean) {
    setEnabledSkills((prev) => { const next = new Set(prev); if (on) next.add(id); else next.delete(id); return next; });
    skillsDirtyRef.current = true;
  }

  useEffect(() => () => { previewAudioRef.current?.pause(); }, []);

  async function handleSaveVoice() { if (!ttsVoice) return; setSavingVoice(true); const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferredTtsProvider: ttsProvider, preferredTtsVoice: ttsVoice }) }); if (res.ok) { setSavedTtsVoice(ttsVoice); setSavedTtsProvider(ttsProvider); } setSavingVoice(false); }

  async function previewVoice(voice: VoiceItem) {
    previewAudioRef.current?.pause(); previewAudioRef.current = null;
    if (previewingId === voice.id) { setPreviewingId(null); return; }
    setPreviewingId(voice.id);
    try {
      const res = await fetch("/api/voices/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: ttsProvider, voiceId: voice.id, text: "你好，这是音色预览，帮你感受音色的效果。" }) });
      if (!res.ok) { setPreviewingId(null); return; }
      const blob = await res.blob(); const audio = new Audio(URL.createObjectURL(blob)); previewAudioRef.current = audio;
      audio.play().catch(() => setPreviewingId(null));
      audio.addEventListener("ended", () => setPreviewingId(null));
    } catch { setPreviewingId(null); }
  }

  const voiceDirty = ttsVoice !== savedTtsVoice || ttsProvider !== savedTtsProvider;
  const voiceList = (ttsProvider === "minimax" ? voices.minimax : voices.openai).filter(v => genderFilter === "all" || v.gender === genderFilter);

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* ── Left sidebar ── */}
      <nav className="w-44 shrink-0 border-r border-bd bg-sidebar flex flex-col py-3">
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`mx-3 my-0.5 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                active ? "bg-brand/10 text-t1 font-medium" : "text-t2 hover:text-t1 hover:bg-surface2"
              }`}>
              <span className={`shrink-0 ${active ? "text-brand-text" : "text-t3"}`}>{t.icon}</span>
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-5 h-5 border-2 border-brand-text border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
            {/* ── Appearance ── */}
            {activeTab === "appearance" && (
              <div>
                <h2 className="text-lg font-semibold text-t1 mb-1">外观主题</h2>
                <p className="text-xs text-t3 mb-6">选择界面的深浅色风格，立即生效</p>
                <div className="flex flex-col gap-2">
                  {THEMES.map((t) => {
                    const active = currentTheme === t.id;
                    return (
                      <RadioCard key={t.id} active={active} onClick={() => setTheme(t.id)}>
                        <div className="flex items-center gap-3">
                          <span className={`shrink-0 ${active ? "text-brand-text" : "text-t3"}`}>{t.icon}</span>
                          <RadioDot active={active} />
                          <div>
                            <p className="text-sm font-semibold text-t1">{t.label}</p>
                            <p className="text-xs text-t3 mt-0.5">{t.desc}</p>
                          </div>
                        </div>
                      </RadioCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Model Provider ── */}
            {activeTab === "provider" && <ProviderSection />}

            {/* ── Workflow ── */}
            {activeTab === "workflow" && (
              <div>
                <h2 className="text-lg font-semibold text-t1 mb-1">工作模式</h2>
                <p className="text-xs text-t3 mb-6">控制 AI 推进流程时是否需要逐阶段确认。对所有项目生效。</p>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "quick" as const, name: "快捷模式", desc: "AI 自动推进，中间步骤不等待确认。适合快速出片", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="7,3 14,9 7,15"/></svg> },
                    { id: "detailed" as const, name: "详细模式", desc: "稿子/插图/构建等关键节点需要确认后才继续。适合精雕细琢", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="6"/><polyline points="9,5.5 9,9 12,11"/></svg> },
                  ].map((m) => {
                    const active = workflowMode === m.id;
                    return (
                      <RadioCard key={m.id} active={active} onClick={() => setWorkflowMode(m.id)}>
                        <div className="flex items-center gap-3">
                          <span className={`shrink-0 ${active ? "text-brand-text" : "text-t3"}`}>{m.icon}</span>
                          <RadioDot active={active} />
                          <div>
                            <p className="text-sm font-semibold text-t1">{m.name}</p>
                            <p className="text-xs text-t3 mt-0.5">{m.desc}</p>
                          </div>
                        </div>
                      </RadioCard>
                    );
                  })}
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={async () => { const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflowMode }) }); if (res.ok) setSavedWorkflowMode(workflowMode); }}
                      disabled={workflowMode === savedWorkflowMode}
                      className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors">保存</button>
                    {workflowMode === savedWorkflowMode && <span className="text-xs text-t3">已保存</span>}
                  </div>

                  {/* Illustrations toggle */}
                  <div className="mt-6 pt-5 border-t border-bd">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-t1">小黑插图</h3>
                        <p className="text-xs text-t3 mt-0.5">关闭后跳过生图环节，节省积分</p>
                      </div>
                      <button onClick={async () => {
                        const next = !illustrationsEnabled; setIllustrationsEnabled(next);
                        await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ illustrationsEnabled: next }) });
                        setSavedIllustrationsEnabled(next);
                      }}
                        className={`w-10 h-5 rounded-full transition-colors relative ${illustrationsEnabled ? "bg-brand" : "bg-bd-strong"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${illustrationsEnabled ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Voice ── */}
            {activeTab === "voice" && (
              <div>
                <h2 className="text-lg font-semibold text-t1 mb-1">配音音色</h2>
                <p className="text-xs text-t3 mb-6">选择全局默认音色，新项目构建完成后自动用此音色合成配音</p>
                <div className="flex flex-col gap-3">
                  {/* Provider selector */}
                  <div className="inline-flex rounded-lg border border-bd p-0.5">
                    {(["minimax","openai"] as const).map(p => (
                      <button key={p} onClick={() => { setTtsProvider(p); setGenderFilter("all"); }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${ttsProvider === p ? "bg-brand text-white" : "text-t3 hover:text-t1"}`}>
                        {p === "minimax" ? "MiniMax" : "OpenAI"}
                      </button>
                    ))}
                  </div>

                  {/* Gender filter */}
                  <div className="flex items-center gap-2">
                    {(["all","female","male"] as const).map(g => (
                      <button key={g} onClick={() => setGenderFilter(g)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors ${genderFilter === g ? "bg-brand/10 text-brand-text font-medium" : "text-t3 hover:text-t1 hover:bg-surface2"}`}>
                        {g === "all" ? "全部" : GENDER_LABEL[g]}
                      </button>
                    ))}
                    <span className="ml-auto text-xs text-t4">{voiceList.length} 个</span>
                  </div>

                  {/* Voice list */}
                  <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto rounded-xl border border-bd p-1.5">
                    {voiceList.length === 0 ? (
                      <p className="text-xs text-t3 text-center py-8">加载中…</p>
                    ) : voiceList.map(voice => {
                      const isSelected = ttsVoice === voice.id;
                      const isPreviewing = previewingId === voice.id;
                      return (
                        <div key={voice.id} onClick={() => setTtsVoice(voice.id)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-brand/10 text-t1" : "text-t2 hover:bg-surface2"}`}>
                          <span className={`shrink-0 w-2 h-2 rounded-full ${voice.gender === "female" ? "bg-pink-400" : voice.gender === "male" ? "bg-blue-400" : "bg-t3"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{voice.zh}</p>
                            <p className="text-xs truncate text-t4">{voice.style}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); previewVoice(voice); }}
                            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-brand/10 text-brand-text hover:bg-brand/30" : "bg-surface2 text-t2 hover:bg-surface3"}`}
                            title="试听">
                            {isPreviewing ? (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" stroke="none"><rect x="3" y="2" width="2" height="8" rx="0.5"/><rect x="7" y="2" width="2" height="8" rx="0.5"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" stroke="none"><polygon points="4,2.5 10,6 4,9.5"/></svg>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={handleSaveVoice} disabled={!voiceDirty || savingVoice || !ttsVoice}
                      className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium disabled:opacity-40 transition-colors">
                      {savingVoice ? "保存中…" : "保存音色"}
                    </button>
                    {!voiceDirty && savedTtsVoice && (
                      <span className="text-xs text-t3">已保存：{VOICE_META[savedTtsVoice]?.zh ?? savedTtsVoice}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Skills ── */}
            {activeTab === "skills" && (
              <SkillsSection skills={skills} mainSkillId={mainSkillId} skillsRoot={skillsRoot}
                enabledSkills={enabledSkills} onToggle={toggleSkill}
                isDirty={(id) => enabledSkills.has(id) !== savedSkills.has(id)} />
            )}

            {activeTab === "style" && <StyleSettingsTab />}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
