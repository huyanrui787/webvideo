"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { VOICE_META } from "@/lib/voice-meta";
import type { VoiceItem } from "@/app/api/voices/route";
import type { Skill } from "@/lib/skills";
import { SkillsSection } from "./SkillsSection";
import { KeysSection } from "./KeysSection";

type PreferredModel = "deepseek-chat" | "deepseek-reasoner" | "deepseek-v4-flash" | "deepseek-v4-pro" | "claude-sonnet-4-6" | "claude-opus-4-8";
type TtsProvider = "minimax" | "openai";

const GENDER_LABEL: Record<string, string> = { male: "男声", female: "女声", neutral: "中性" };

const MODELS: { id: PreferredModel; name: string; desc: string }[] = [
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    desc: "最新旗舰模型，推理能力强，性价比高",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    desc: "V4 轻量版，响应速度更快，适合快速迭代",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    desc: "上一代主力模型，稳定可靠",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    desc: "推理专用模型，适合复杂逻辑任务",
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    desc: "速度与质量均衡，适合日常制作，响应更快",
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    desc: "最强推理能力，适合复杂内容，速度稍慢",
  },
];

const THEMES: { id: "light" | "dark" | "system"; label: string; desc: string; icon: string }[] = [
  { id: "light",  label: "浅色",   desc: "明亮界面，适合白天使用",   icon: "☀" },
  { id: "dark",   label: "深色",   desc: "暗色界面，减少视觉疲劳",   icon: "☽" },
  { id: "system", label: "跟随系统", desc: "自动匹配操作系统深浅色设置", icon: "◑" },
];

export default function SettingsPage() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [selected, setSelected] = useState<PreferredModel>("deepseek-v4-pro");
  const [saved, setSaved] = useState<PreferredModel>("deepseek-v4-pro");
  const [selectedCoding, setSelectedCoding] = useState<PreferredModel>("claude-sonnet-4-6");
  const [savedCoding, setSavedCoding] = useState<PreferredModel>("claude-sonnet-4-6");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCoding, setSavingCoding] = useState(false);
  const [workflowMode, setWorkflowMode] = useState<"quick" | "detailed">("quick");
  const [savedWorkflowMode, setSavedWorkflowMode] = useState<"quick" | "detailed">("quick");
  const [illustrationsEnabled, setIllustrationsEnabled] = useState(true);
  const [savedIllustrationsEnabled, setSavedIllustrationsEnabled] = useState(true);

  // TTS voice state
  const [voices, setVoices] = useState<{ minimax: VoiceItem[]; openai: VoiceItem[] }>({ minimax: [], openai: [] });
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>("minimax");
  const [ttsVoice, setTtsVoice] = useState<string>("");
  const [savedTtsVoice, setSavedTtsVoice] = useState<string>("");
  const [savedTtsProvider, setSavedTtsProvider] = useState<TtsProvider>("minimax");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [savingVoice, setSavingVoice] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Skills state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mainSkillId, setMainSkillId] = useState<string>("");
  const [skillsRoot, setSkillsRoot] = useState<string>("");
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(new Set());
  const [savedSkills, setSavedSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.preferredModel) { setSelected(data.preferredModel); setSaved(data.preferredModel); }
        if (data?.preferredCodingModel) { setSelectedCoding(data.preferredCodingModel); setSavedCoding(data.preferredCodingModel); }
        if (data?.workflowMode) { setWorkflowMode(data.workflowMode); setSavedWorkflowMode(data.workflowMode); }
        if (data?.illustrationsEnabled !== undefined) { setIllustrationsEnabled(data.illustrationsEnabled); setSavedIllustrationsEnabled(data.illustrationsEnabled); }
        if (data?.preferredTtsVoice) { setTtsVoice(data.preferredTtsVoice); setSavedTtsVoice(data.preferredTtsVoice); }
        if (data?.preferredTtsProvider) { setTtsProvider(data.preferredTtsProvider); setSavedTtsProvider(data.preferredTtsProvider); }
        if (data?.enabledSkills) {
          const set = new Set<string>(data.enabledSkills);
          setEnabledSkills(set);
          setSavedSkills(new Set(data.enabledSkills));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/voices").then(r => r.ok ? r.json() : null).then(d => { if (d) setVoices(d); });
    fetch("/api/skills")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        setSkills(d.skills as Skill[]);
        setMainSkillId(d.mainSkillId);
        setSkillsRoot(d.skillsRoot);
        // If settings API didn't return enabledSkills for any reason, fall back here.
        setEnabledSkills((prev) => prev.size === 0 ? new Set(d.enabledSkills) : prev);
        setSavedSkills((prev) => prev.size === 0 ? new Set(d.enabledSkills) : prev);
      });
  }, []);

  // Auto-save enabled skills whenever the selection changes
  const skillsDirtyRef = useRef(false);
  useEffect(() => {
    if (skillsDirtyRef.current === false) return; // skip first render
    if (enabledSkills.size === 0) return;
    const id = setTimeout(() => {
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledSkills: Array.from(enabledSkills) }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then(() => setSavedSkills(new Set(enabledSkills)))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(id);
  }, [enabledSkills]);

  function toggleSkill(id: string, on: boolean) {
    setEnabledSkills((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    skillsDirtyRef.current = true;
  }

  useEffect(() => () => { previewAudioRef.current?.pause(); }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredModel: selected }),
    });
    if (res.ok) setSaved(selected);
    setSaving(false);
  }

  async function handleSaveCoding() {
    setSavingCoding(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredCodingModel: selectedCoding }),
    });
    if (res.ok) setSavedCoding(selectedCoding);
    setSavingCoding(false);
  }

  async function handleSaveVoice() {
    if (!ttsVoice) return;
    setSavingVoice(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredTtsProvider: ttsProvider, preferredTtsVoice: ttsVoice }),
    });
    if (res.ok) { setSavedTtsVoice(ttsVoice); setSavedTtsProvider(ttsProvider); }
    setSavingVoice(false);
  }

  async function previewVoice(voice: VoiceItem) {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    if (previewingId === voice.id) { setPreviewingId(null); return; }
    setPreviewingId(voice.id);
    try {
      const res = await fetch("/api/voices/preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: ttsProvider, voiceId: voice.id, text: "你好，这是音色预览，帮你感受音色的效果。" }),
      });
      if (!res.ok) { setPreviewingId(null); return; }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      previewAudioRef.current = audio;
      audio.play().catch(() => setPreviewingId(null));
      audio.addEventListener("ended", () => setPreviewingId(null));
    } catch { setPreviewingId(null); }
  }

  const dirty = selected !== saved;
  const dirtyCoding = selectedCoding !== savedCoding;
  const voiceDirty = ttsVoice !== savedTtsVoice || ttsProvider !== savedTtsProvider;
  const voiceList = (ttsProvider === "minimax" ? voices.minimax : voices.openai)
    .filter(v => genderFilter === "all" || v.gender === genderFilter);

  const TABS = [
    { id: "appearance", label: "外观主题", icon: "☀" },
    { id: "model",      label: "AI 模型",   icon: "✦" },
    { id: "workflow",   label: "工作模式",  icon: "⚙" },
    { id: "voice",      label: "配音音色",  icon: "◉" },
    { id: "skills",     label: "可用 Skills", icon: "◆" },
    { id: "keys",       label: "API 密钥",  icon: "🔑" },
  ] as const;
  type TabId = typeof TABS[number]["id"];
  const [activeTab, setActiveTab] = useState<TabId>("appearance");

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* ── 二级侧栏 ── */}
      <nav className="w-44 shrink-0 border-r border-bd bg-base flex flex-col py-4">
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={[
                "mx-3 my-0.5 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                active
                  ? "bg-indigo-500/15 text-t1 font-medium"
                  : "text-t2 hover:bg-surface2",
              ].join(" ")}
            >
              <span className="text-base w-4 text-center shrink-0">{t.icon}</span>
              <span className="truncate">{t.label}</span>
              {active && <span className="ml-auto w-1 h-4 rounded-full bg-indigo-400" />}
            </button>
          );
        })}
      </nav>

      {/* ── 当前 tab 的内容 ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          {activeTab === "appearance" && (
            <div>
              <h2 className="text-xl font-bold text-t1 mb-1">外观主题</h2>
              <p className="text-sm text-t3 mb-6">选择界面的深浅色风格，立即生效</p>
              <div className="flex flex-col gap-3">
                {THEMES.map((t) => {
                  const active = currentTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={[
                        "w-full text-left rounded-xl border-2 px-5 py-4 transition-all",
                        active
                          ? "border-accent bg-surface2"
                          : "border-bd bg-modal hover:border-bd-hover",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl w-6 text-center shrink-0">{t.icon}</span>
                        <span
                          className={[
                            "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                            active ? "border-accent" : "border-[var(--text-muted)]",
                          ].join(" ")}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-accent block" />}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-t1">{t.label}</p>
                          <p className="text-xs text-t3 mt-0.5">{t.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "model" && (
            <div>
              <h2 className="text-xl font-bold text-t1 mb-1">AI 模型</h2>
              <p className="text-sm text-t3 mb-6">
                分别设置主 Agent（对话规划/脚本生成）和 Coding 子 Agent（章节代码编写）使用的模型
              </p>
              {loading ? (
                <div className="text-sm text-t3">加载中…</div>
              ) : (
                <div className="flex flex-col gap-8">
                  {/* ── 主 Agent 模型 ── */}
                  <section>
                    <h3 className="text-sm font-semibold text-t1 mb-1">主 Agent 模型</h3>
                    <p className="text-xs text-t3 mb-3">负责对话、内容规划、口播稿和大纲生成</p>
                    <div className="flex flex-col gap-2">
                      {MODELS.map((m) => {
                        const active = selected === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setSelected(m.id)}
                            className={[
                              "w-full text-left rounded-xl border-2 px-4 py-3 transition-all",
                              active
                                ? "border-accent bg-surface2"
                                : "border-bd bg-modal hover:border-bd-hover",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={[
                                  "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                  active ? "border-accent" : "border-[var(--text-muted)]",
                                ].join(" ")}
                              >
                                {active && <span className="w-2 h-2 rounded-full bg-accent block" />}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-t1">{m.name}</p>
                                <p className="text-xs text-t3 mt-0.5">{m.desc}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={handleSave}
                          disabled={!dirty || saving}
                          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-sm font-medium disabled:opacity-40 transition-colors"
                        >
                          {saving ? "保存中…" : "保存"}
                        </button>
                        {!dirty && !saving && (
                          <span className="text-xs text-t3">已保存</span>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── Coding 子 Agent 模型 ── */}
                  <section>
                    <h3 className="text-sm font-semibold text-t1 mb-1">Coding 子 Agent 模型</h3>
                    <p className="text-xs text-t3 mb-3">负责并行构建每个章节的 React/TSX 代码</p>
                    <div className="flex flex-col gap-2">
                      {MODELS.map((m) => {
                        const active = selectedCoding === m.id;
                        return (
                          <button
                            key={`coding-${m.id}`}
                            onClick={() => setSelectedCoding(m.id)}
                            className={[
                              "w-full text-left rounded-xl border-2 px-4 py-3 transition-all",
                              active
                                ? "border-accent bg-surface2"
                                : "border-bd bg-modal hover:border-bd-hover",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={[
                                  "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                  active ? "border-accent" : "border-[var(--text-muted)]",
                                ].join(" ")}
                              >
                                {active && <span className="w-2 h-2 rounded-full bg-accent block" />}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-t1">{m.name}</p>
                                <p className="text-xs text-t3 mt-0.5">{m.desc}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={handleSaveCoding}
                          disabled={!dirtyCoding || savingCoding}
                          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-sm font-medium disabled:opacity-40 transition-colors"
                        >
                          {savingCoding ? "保存中…" : "保存"}
                        </button>
                        {!dirtyCoding && !savingCoding && (
                          <span className="text-xs text-t3">已保存</span>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {activeTab === "workflow" && (
            <div>
              <h2 className="text-xl font-bold text-t1 mb-1">工作模式</h2>
              <p className="text-sm text-t3 mb-6">
                控制 AI 推进流程时是否需要逐阶段确认。对所有项目生效。
              </p>
              {loading ? (
                <div className="text-sm text-t3">加载中…</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {[
                    { id: "quick" as const, name: "快捷模式", desc: "AI 自动推进，中间步骤不等待确认。适合快速出片、探索想法", icon: "⚡" },
                    { id: "detailed" as const, name: "详细模式", desc: "稿子/插图/构建等关键节点需要确认后才继续。适合重要内容、精雕细琢", icon: "🔍" },
                  ].map((m) => {
                    const active = workflowMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setWorkflowMode(m.id)}
                        className={[
                          "w-full text-left rounded-xl border-2 px-5 py-4 transition-all",
                          active
                            ? "border-accent bg-surface2"
                            : "border-bd bg-modal hover:border-bd-hover",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl w-6 text-center shrink-0">{m.icon}</span>
                          <span className={[
                            "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                            active ? "border-accent" : "border-[var(--text-muted)]",
                          ].join(" ")}>
                            {active && <span className="w-2 h-2 rounded-full bg-accent block" />}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-t1">{m.name}</p>
                            <p className="text-xs text-t3 mt-0.5">{m.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/settings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ workflowMode }),
                        });
                        if (res.ok) setSavedWorkflowMode(workflowMode);
                      }}
                      disabled={workflowMode === savedWorkflowMode}
                      className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-sm font-medium disabled:opacity-40 transition-colors"
                    >
                      保存
                    </button>
                    {workflowMode === savedWorkflowMode && (
                      <span className="text-xs text-t3">已保存</span>
                    )}
                  </div>

                  {/* ── 插图生成开关 ── */}
                  <div className="mt-6 pt-5 border-t border-bd">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-t1">小黑插图</h3>
                        <p className="text-xs text-t3 mt-0.5">关闭后跳过生图环节，节省积分</p>
                      </div>
                      <button
                        onClick={async () => {
                          const next = !illustrationsEnabled;
                          setIllustrationsEnabled(next);
                          const res = await fetch("/api/settings", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ illustrationsEnabled: next }),
                          });
                          if (res.ok) setSavedIllustrationsEnabled(next);
                        }}
                        className={`w-10 h-5 rounded-full transition-colors relative ${illustrationsEnabled ? "bg-accent" : "bg-bd-strong"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${illustrationsEnabled ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "voice" && (
            <div>
              <h2 className="text-xl font-bold text-t1 mb-1">配音音色</h2>
              <p className="text-sm text-t3 mb-6">
                选择全局默认音色，新项目构建完成后自动用此音色合成配音
              </p>
              {loading ? (
                <div className="text-sm text-t3">加载中…</div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex rounded-xl border border-bd overflow-hidden">
                    {(["minimax", "openai"] as const).map(p => (
                      <button key={p} onClick={() => { setTtsProvider(p); setGenderFilter("all"); }}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${ttsProvider === p ? "bg-accent text-accent-text" : "text-t3 hover:text-t2"}`}>
                        {p === "minimax" ? "MiniMax" : "OpenAI"}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {(["all", "female", "male"] as const).map(g => (
                      <button key={g} onClick={() => setGenderFilter(g)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${genderFilter === g ? "bg-accent text-accent-text" : "bg-surface2 text-t2 hover:bg-surface3"}`}>
                        {g === "all" ? "全部" : GENDER_LABEL[g]}
                      </button>
                    ))}
                    <span className="ml-auto text-xs text-t4 self-center">{voiceList.length} 个</span>
                  </div>

                  <div className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-xl border border-bd p-2">
                    {voiceList.length === 0 ? (
                      <p className="text-xs text-t3 text-center py-6">加载中…</p>
                    ) : voiceList.map(voice => {
                      const isSelected = ttsVoice === voice.id;
                      const isPreviewing = previewingId === voice.id;
                      return (
                        <div key={voice.id} onClick={() => setTtsVoice(voice.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-accent text-accent-text" : "hover:bg-surface2 text-t2"}`}>
                          <span className={`shrink-0 w-2 h-2 rounded-full ${voice.gender === "female" ? "bg-pink-400" : voice.gender === "male" ? "bg-blue-400" : "bg-t3"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{voice.zh}</p>
                            <p className="text-xs truncate opacity-60">{voice.style}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); previewVoice(voice); }}
                            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-white/20 hover:bg-white/30" : "bg-surface2 hover:bg-surface3 text-t2"}`}
                            title="试听">
                            <span className="text-[11px]">{isPreviewing ? "■" : "▶"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={handleSaveVoice} disabled={!voiceDirty || savingVoice || !ttsVoice}
                      className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-sm font-medium disabled:opacity-40 transition-colors">
                      {savingVoice ? "保存中…" : "保存音色"}
                    </button>
                    {!voiceDirty && savedTtsVoice && (
                      <span className="text-xs text-t3">已保存：{VOICE_META[savedTtsVoice]?.zh ?? savedTtsVoice}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "skills" && (
            <SkillsSection
              skills={skills}
              mainSkillId={mainSkillId}
              skillsRoot={skillsRoot}
              enabledSkills={enabledSkills}
              onToggle={toggleSkill}
              isDirty={(id) => enabledSkills.has(id) !== savedSkills.has(id)}
            />
          )}

          {activeTab === "keys" && <KeysSection />}
        </div>
      </div>
    </main>
  );
}

