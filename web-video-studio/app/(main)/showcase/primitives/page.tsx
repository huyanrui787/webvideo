"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";

// ─── Theme tokens (midnight-press) ──────────────────────────────────────
const T = {
  bg: "#0f0f14",
  surface: "#1a1a24",
  bd: "#2a2a3a",
  text: "#e8e8ed",
  textMute: "#8888a0",
  accent: "#f59e0b",
  accent2: "#3b82f6",
  font: "system-ui, -apple-system, sans-serif",
  fontMono: "'SF Mono', 'Fira Code', monospace",
  radius: "8px",
};

// ─── Helpers ────────────────────────────────────────────────────────────

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: T.text, marginBottom: 4 }}>{title}</h2>
      {desc && <p style={{ fontSize: 14, color: T.textMute, marginBottom: 20 }}>{desc}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {children}
      </div>
    </section>
  );
}

function Card({ name, desc, children, fullWidth }: { name: string; desc?: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div style={{
      background: T.surface, borderRadius: T.radius, border: `1px solid ${T.bd}`,
      overflow: "hidden", gridColumn: fullWidth ? "1 / -1" : undefined,
    }}>
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "baseline", gap: 8 }}>
        <code style={{ fontSize: 13, color: T.accent, fontFamily: T.fontMono }}>{name}</code>
      </div>
      {desc && <div style={{ padding: "4px 20px 0", fontSize: 12, color: T.textMute }}>{desc}</div>}
      <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "visible" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Dots pattern (CSS only) ────────────────────────────────────────────
const dotsBg = `radial-gradient(circle, ${T.accent}22 1px, transparent 1px)`;
const gridBg = `linear-gradient(${T.accent}11 1px, transparent 1px), linear-gradient(90deg, ${T.accent}11 1px, transparent 1px)`;

// ─── Page ───────────────────────────────────────────────────────────────

export default function PrimitiveShowcase() {
  const [scaffoldOpen, setScaffoldOpen] = useState(false);
  const [scaffoldName, setScaffoldName] = useState("");
  const [scaffoldCat, setScaffoldCat] = useState("animation");
  const [scaffoldType, setScaffoldType] = useState("gsap");
  const [scaffoldDesc, setScaffoldDesc] = useState("");
  const [scaffoldStatus, setScaffoldStatus] = useState<"" | "running" | "done" | "error">("");
  const [scaffoldMsg, setScaffoldMsg] = useState("");

  async function handleScaffold() {
    if (!scaffoldName) return;
    setScaffoldStatus("running"); setScaffoldMsg("注册中…");
    try {
      const r = await fetch("/api/scaffold-primitive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: scaffoldName, cat: scaffoldCat, type: scaffoldType, desc: scaffoldDesc }),
      });
      const d = await r.json();
      if (d.ok) { setScaffoldStatus("done"); setScaffoldMsg(d.output); }
      else { setScaffoldStatus("error"); setScaffoldMsg(d.error ?? "失败"); }
    } catch (e: any) { setScaffoldStatus("error"); setScaffoldMsg(e.message); }
  }

  if (scaffoldOpen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => { setScaffoldOpen(false); setScaffoldMsg(""); setScaffoldStatus(""); }} />
        <div style={{ position: "relative", background: T.surface, border: `1px solid ${T.bd}`, borderRadius: 12, padding: 28, width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>添加新 Primitive</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: T.textMute, display: "block", marginBottom: 4 }}>名称 (PascalCase)</label>
              <input value={scaffoldName} onChange={e => setScaffoldName(e.target.value)} placeholder="RippleWave"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.bd}`, background: T.bg, color: T.text, fontSize: 14, fontFamily: T.fontMono, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: T.textMute, display: "block", marginBottom: 4 }}>类别</label>
                <select value={scaffoldCat} onChange={e => setScaffoldCat(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.bd}`, background: T.bg, color: T.text, fontSize: 14, outline: "none" }}>
                  {["text","data","media","layout","decor","svg","chart","animation"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: T.textMute, display: "block", marginBottom: 4 }}>类型</label>
                <select value={scaffoldType} onChange={e => setScaffoldType(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.bd}`, background: T.bg, color: T.text, fontSize: 14, outline: "none" }}>
                  {["gsap","canvas","svg","react"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.textMute, display: "block", marginBottom: 4 }}>描述 (可选)</label>
              <input value={scaffoldDesc} onChange={e => setScaffoldDesc(e.target.value)} placeholder="简短描述"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.bd}`, background: T.bg, color: T.text, fontSize: 14, outline: "none" }} />
            </div>
            {scaffoldMsg && (
              <div style={{ padding: 10, borderRadius: 6, background: scaffoldStatus === "error" ? "#ef444422" : scaffoldStatus === "done" ? "#10b98122" : T.surface, fontSize: 12, color: scaffoldStatus === "error" ? "#ef4444" : T.text, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto", fontFamily: T.fontMono }}>{scaffoldMsg}</div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => { setScaffoldOpen(false); setScaffoldMsg(""); setScaffoldStatus(""); }}
                style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.bd}`, background: "transparent", color: T.text, fontSize: 13, cursor: "pointer" }}>取消</button>
              <button onClick={handleScaffold} disabled={!scaffoldName || scaffoldStatus === "running"}
                style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: T.accent, color: "#000", fontSize: 13, fontWeight: 600, cursor: scaffoldName ? "pointer" : "not-allowed", opacity: scaffoldName ? 1 : 0.5 }}>
                {scaffoldStatus === "running" ? "注册中…" : "注册"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: T.font, minHeight: "100vh", padding: "40px 32px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 48, borderBottom: `1px solid ${T.bd}`, paddingBottom: 24 }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 8 }}>
          <span style={{ color: T.accent }}>WebVideo Studio</span> 视觉积木系统
        </h1>
        <p style={{ fontSize: 16, color: T.textMute, maxWidth: 640 }}>
          Blueprint v2 — 70 种 primitive。每个组件接受结构化 JSON params，编译器生成 TSX。
          此页面展示全部组件的渲染效果。
        </p>
        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <button
            onClick={() => setScaffoldOpen(true)}
            style={{
              background: T.accent, color: "#000", border: "none", borderRadius: 8,
              padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: T.font,
            }}
          >
            ＋ 添加 Primitive
          </button>
          <span style={{ fontSize: 12, color: T.textMute, alignSelf: "center" }}>
            或终端运行 <code style={{ background: T.surface, padding: "2px 6px", borderRadius: 4, fontFamily: T.fontMono }}>
              npx tsx scripts/scaffold-primitive.ts --name=MyAnim
            </code>
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 文字系统 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="文字系统" desc="6 种文字积木，覆盖 hero / data / quote / sub / body / kicker 六级字号">

        <Card name="Headline · hero" desc="scale: hero — 主标题">
          <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15 }}>这是主标题</h1>
        </Card>

        <Card name="Headline · data" desc="scale: data — 超大数字">
          <div style={{ fontSize: 96, fontWeight: 800, color: T.accent, lineHeight: 1 }}>2048<span style={{ fontSize: 28, fontWeight: 400 }}> tokens</span></div>
        </Card>

        <Card name="Headline · quote" desc="scale: quote — 金句/引用">
          <div style={{ fontSize: 36, fontWeight: 600, fontStyle: "italic", lineHeight: 1.3, textAlign: "center", maxWidth: 400 }}>"哪怕世界疯狂待你，你也得把自己当个人看"</div>
        </Card>

        <Card name="Headline · sub" desc="scale: sub — 副标题">
          <h2 style={{ fontSize: 24, fontWeight: 500, color: T.textMute }}>这是副标题层级</h2>
        </Card>

        <Card name="Headline · body" desc="scale: body — 正文">
          <p style={{ fontSize: 16, lineHeight: 1.6, color: T.textMute, maxWidth: 360 }}>正文段落用于传递信息主体，字号舒适适合阅读，行高 1.6 保证可读性。</p>
        </Card>

        <Card name="Headline · kicker" desc="scale: kicker — 小标签">
          <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>KICKER LABEL</span>
        </Card>

        <Card name="Body" desc="正文段落，align: left/center/right">
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: T.textMute, textAlign: "left", marginBottom: 8 }}>左对齐正文。WebVideo Studio 是一套 AI 驱动的视频生产平台，将文章转化为电影级视频。</p>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: T.textMute, textAlign: "center" }}>居中对齐正文。</p>
          </div>
        </Card>

        <Card name="Kicker" desc="小标签，color 可自定义">
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 13, fontFamily: T.fontMono, color: T.accent, background: `${T.accent}18`, padding: "2px 10px", borderRadius: 99 }}>NEW</span>
            <span style={{ fontSize: 13, fontFamily: T.fontMono, color: T.accent2, background: `${T.accent2}18`, padding: "2px 10px", borderRadius: 99 }}>v2.0</span>
            <span style={{ fontSize: 13, fontFamily: T.fontMono, color: "#10b981", background: "#10b98118", padding: "2px 10px", borderRadius: 99 }}>STABLE</span>
          </div>
        </Card>

        <Card name="PullQuote" desc="引用金句，带动画引号装饰">
          <div style={{ textAlign: "center", maxWidth: 320 }}>
            <div style={{ fontSize: 96, lineHeight: 0.5, color: T.accent, opacity: 0.2, userSelect: "none", marginBottom: 8, fontFamily: "Georgia, serif" }}>"</div>
            <p style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.3 }}>把找工作的过程，从卑微的求收留，变成平等的看合不合适</p>
            <cite style={{ display: "block", marginTop: 12, fontSize: 16, color: T.textMute, fontStyle: "normal" }}>— 求职者说</cite>
          </div>
        </Card>

        <Card name="Caption" desc="图片说明/脚注">
          <div style={{ fontSize: 12, color: T.textMute, fontStyle: "italic" }}>▲ 图1：2024年应届毕业生人数变化趋势</div>
        </Card>

        <Card name="TypeWriter" desc="打字机效果，逐字显示">
          <TypeWriterDemo />
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 数据可视化 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="数据可视化" desc="7 种数据积木 — 从数字滚动到图表">

        <Card name="Counter" desc="to: 1179, unit: '万', duration: 2">
          <CounterDemo to={1179} unit=" 万" />
        </Card>

        <Card name="StatCard" desc="value + label + trend 箭头">
          <div style={{ display: "flex", gap: 32 }}>
            <StatCardDemo value="99.5%" label="回复率" trend="up" />
            <StatCardDemo value="35岁" label="隐形红线" trend="down" />
            <StatCardDemo value="2亿" label="灵活就业" trend="neutral" />
          </div>
        </Card>

        <Card name="BigNumber" desc="静态大数字 + 单位 + 标签">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: T.accent, lineHeight: 1 }}>1179<span style={{ fontSize: 24, fontWeight: 400 }}> 万</span></div>
            <div style={{ fontSize: 13, color: T.textMute, fontFamily: T.fontMono, marginTop: 8 }}>2024 届高校毕业生人数</div>
          </div>
        </Card>

        <Card name="BarChart" desc="data: [{label, value}]">
          <BarChartDemo />
        </Card>

        <Card name="LineChart" desc="series: [{label, points}]">
          <LineChartDemo />
        </Card>

        <Card name="PieChart" desc="slices: [{value, label}]">
          <PieChartDemo />
        </Card>

        <Card name="Gauge" desc="SVG 仪表盘, value/max/label/unit">
          <GaugeDemo value={75} max={100} label="CPU" unit="%" color={T.accent} />
          <div style={{ width: 40 }} />
          <GaugeDemo value={42} max={60} label="内存" unit="GB" color={T.accent2} />
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 布局容器 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="布局容器" desc="5 种容器 — 支持嵌套，children 数组定义子区域">

        <Card name="Grid" desc="columns: 3, gap: md" fullWidth>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: "100%" }}>
            {[T.accent, T.accent2, "#10b981"].map((c, i) => (
              <div key={i} style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 6, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: c }}>列 {i + 1}</div>
                <div style={{ fontSize: 12, color: T.textMute, marginTop: 4 }}>grid child</div>
              </div>
            ))}
          </div>
        </Card>

        <Card name="FlexRow" desc="横向排列，gap + align">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {["A", "B", "C", "D"].map((c) => (
              <div key={c} style={{ background: `${T.accent}18`, border: `1px solid ${T.accent}44`, borderRadius: 6, padding: "12px 20px", fontSize: 18, fontWeight: 600, color: T.accent }}>{c}</div>
            ))}
          </div>
        </Card>

        <Card name="FlexCol" desc="纵向排列，gap + align">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", width: 200 }}>
            {["标题行", "内容行", "脚注行"].map((c, i) => (
              <div key={c} style={{ background: i === 0 ? `${T.accent}22` : "transparent", borderRadius: 4, padding: "8px 12px", fontSize: i === 0 ? 16 : 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? T.text : T.textMute }}>{c}</div>
            ))}
          </div>
        </Card>

        <Card name="Split" desc="左右分栏，ratio + divider" fullWidth>
          <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
            <div style={{ flex: 1, textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 13, fontFamily: T.fontMono, color: T.accent, marginBottom: 8 }}>优化前</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>3 小时</div>
              <div style={{ fontSize: 13, color: T.textMute, marginTop: 4 }}>手动排版</div>
            </div>
            <div style={{ fontSize: 28, color: T.accent, fontWeight: 700, padding: "0 16px" }}>→</div>
            <div style={{ flex: 1, textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 13, fontFamily: T.fontMono, color: T.accent2, marginBottom: 8 }}>优化后</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.accent2 }}>3 秒</div>
              <div style={{ fontSize: 13, color: T.textMute, marginTop: 4 }}>AI 编译</div>
            </div>
          </div>
        </Card>

        <Card name="Card" desc="卡片容器，padding + border + shadow" fullWidth>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { pad: "sm", label: "sm" },
              { pad: "md", label: "md (default)" },
              { pad: "lg", label: "lg" },
            ].map(({ pad, label }) => (
              <div key={pad} style={{
                flex: 1, background: T.bg, borderRadius: 8,
                padding: pad === "sm" ? 12 : pad === "lg" ? 28 : 20,
                border: `1px solid ${T.bd}`, boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Card</div>
                <div style={{ fontSize: 12, color: T.textMute }}>padding: {label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card name="Grid → Card × 3" desc="Grid(3列) → 每列一个 Card → 内含 Headline + Body" fullWidth>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%" }}>
            {[
              { title: "文字", body: "6 种文字积木", color: T.accent },
              { title: "数据", body: "7 种数据图表", color: T.accent2 },
              { title: "装饰", body: "7 种纯代码装饰", color: "#10b981" },
            ].map((item) => (
              <div key={item.title} style={{ background: T.bg, border: `1px solid ${item.color}33`, borderRadius: 8, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: T.textMute }}>{item.body}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card name="Split → FlexCol × 2" desc="左:FlexCol(Headline+Body+Badge), 右:FlexCol(Counter+Caption), divider=line" fullWidth>
          <div style={{ display: "flex", width: "100%", alignItems: "stretch", minHeight: 140 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 16, gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.accent, background: `${T.accent}18`, padding: "2px 8px", borderRadius: 99, alignSelf: "flex-start" }}>v2.1</span>
              <div style={{ fontSize: 18, fontWeight: 700 }}>嵌套布局</div>
              <div style={{ fontSize: 12, color: T.textMute, lineHeight: 1.5 }}>region.content 可以是 LayoutDef，编译器递归渲染无限层级嵌套</div>
            </div>
            <div style={{ width: 1, background: T.accent, opacity: 0.2, margin: "12px 0" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 16, gap: 6 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.accent2 }}>∞</div>
              <div style={{ fontSize: 11, color: T.textMute }}>嵌套深度无限制</div>
            </div>
          </div>
        </Card>

        <Card name="Card → Grid 2×2" desc="一个 Card 容器内嵌 2×2 Grid，每格放一个微型 StatCard" fullWidth>
          <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 10, padding: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { v: "63", l: "Primitives" },
                { v: "5", l: "Layouts" },
                { v: "∞", l: "Nesting" },
                { v: "0", l: "API cost" },
              ].map((s) => (
                <div key={s.l} style={{ background: T.surface, borderRadius: 6, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: T.textMute, fontFamily: T.fontMono, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card name="FlexRow → Card + Card" desc="FlexRow 横向排列两个 Card，左侧放 Headline+Body，右侧放 Counter" fullWidth>
          <div style={{ display: "flex", gap: 12, alignItems: "stretch", width: "100%" }}>
            <div style={{ flex: 1, background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>编译性能</div>
              <div style={{ fontSize: 12, color: T.textMute }}>7 章 Blueprint，并行编译 + tsc 验证，平均耗时</div>
            </div>
            <div style={{ width: 1, background: T.bd }} />
            <div style={{ background: T.bg, border: `1px solid ${T.bd}`, borderRadius: 8, padding: 16, textAlign: "center", minWidth: 100 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.accent }}>3<span style={{ fontSize: 14, fontWeight: 400 }}>s</span></div>
              <div style={{ fontSize: 10, color: T.textMute, fontFamily: T.fontMono, marginTop: 2 }}>PER CHAPTER</div>
            </div>
          </div>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 装饰系统 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="装饰系统" desc="7 种纯代码装饰 — 零素材依赖">

        <Card name="Divider" desc="direction + style (solid / dashed / gradient)">
          <div style={{ width: "100%" }}>
            <div style={{ height: 2, background: T.accent, opacity: 0.3, marginBottom: 12 }} />
            <div style={{ height: 1, borderTop: `2px dashed ${T.accent}44`, marginBottom: 12 }} />
            <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`, opacity: 0.5 }} />
          </div>
        </Card>

        <Card name="Badge" desc="徽章 — text + color + size">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontFamily: T.fontMono, fontWeight: 600, background: T.accent, color: "#000", padding: "2px 10px", borderRadius: 99 }}>FEATURED</span>
            <span style={{ fontSize: 12, fontFamily: T.fontMono, fontWeight: 600, background: T.accent2, color: "#fff", padding: "2px 10px", borderRadius: 99 }}>NEW</span>
            <span style={{ fontSize: 10, fontFamily: T.fontMono, background: `${T.accent}18`, color: T.accent, padding: "1px 6px", borderRadius: 99 }}>sm</span>
          </div>
        </Card>

        <Card name="BorderBox" desc="边框盒子 — borderWidth + borderColor + padding">
          <div style={{ border: `2px solid ${T.accent}44`, borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>带边框的内容区域</div>
            <div style={{ fontSize: 12, color: T.textMute, marginTop: 4 }}>borderWidth: 2, borderColor: accent</div>
          </div>
        </Card>

        <Card name="GradientBg" desc="渐变背景 — from → to + direction + opacity">
          <div style={{ position: "relative", width: "100%", height: 120, borderRadius: 6, overflow: "hidden", background: T.surface }}>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${T.accent}, transparent)`, opacity: 0.15 }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <span style={{ fontSize: 14, color: T.text }}>to-b · opacity: 0.15</span>
            </div>
          </div>
        </Card>

        <Card name="NoiseBg" desc="噪点纹理 — SVG 滤镜">
          <div style={{ position: "relative", width: "100%", height: 100, borderRadius: 6, overflow: "hidden", background: T.surface }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <span style={{ fontSize: 14 }}>NoiseBg · opacity: 0.08</span>
            </div>
          </div>
        </Card>

        <Card name="PatternBg" desc="图案背景 — dots / grid / diagonal / crosshatch">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
            {[
              { name: "dots", bg: `radial-gradient(circle, ${T.accent}44 1px, transparent 1px)`, size: "16px 16px" },
              { name: "grid", bg: `linear-gradient(${T.accent}22 1px, transparent 1px), linear-gradient(90deg, ${T.accent}22 1px, transparent 1px)`, size: "24px 24px" },
              { name: "diagonal", bg: `repeating-linear-gradient(45deg, ${T.accent}22, ${T.accent}22 1px, transparent 1px, transparent 6px)`, size: "12px 12px" },
              { name: "crosshatch", bg: `repeating-linear-gradient(45deg, ${T.accent}15 0.5px, transparent 0.5px, transparent 6px), repeating-linear-gradient(-45deg, ${T.accent}15 0.5px, transparent 0.5px, transparent 6px)`, size: "12px 12px" },
            ].map(({ name, bg, size }) => (
              <div key={name} style={{ height: 60, borderRadius: 4, backgroundImage: bg, backgroundSize: size, backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, color: T.textMute, background: T.surface, padding: "2px 8px", borderRadius: 4 }}>{name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card name="GlowRing" desc="发光环 — color + size + pulseSpeed">
          <GlowRingDemo color={T.accent} size={120} />
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 动画与SVG */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="动画与 SVG" desc="9 种动画/SVG 积木 — 纯代码驱动">

        <Card name="DrawPath" desc="SVG 路径自绘 — d + strokeWidth + duration">
          <svg width="200" height="80" viewBox="0 0 200 80">
            <path d="M 10 70 Q 60 10, 100 40 T 190 20" stroke={T.accent} strokeWidth={3} fill="none"
              strokeDasharray="300" strokeDashoffset="0"
              style={{ animation: "drawPath 2s ease-out forwards" }} />
            <style>{`@keyframes drawPath { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }`}</style>
          </svg>
        </Card>

        <Card name="ParticleField" desc="behavior: flow/burst/orbit/rain · count: 60">
          <ParticleDemo />
        </Card>

        <Card name="WaveForm" desc="variant: sine/pulse/noise/bars">
          <WaveFormDemo />
        </Card>

        <Card name="MagneticField" desc="磁场可视化 · lineCount · showParticles">
          <svg width="200" height="100" viewBox="0 0 200 100">
            {Array.from({ length: 8 }).map((_, i) => {
              const t = (i / 7 - 0.5) * 120;
              return <path key={i} d={`M 40 50 Q 100 ${50 + t}, 160 ${50 + t * 0.3}`} stroke={T.accent2} strokeWidth={1.5} fill="none" opacity={0.5} />;
            })}
            <circle cx="40" cy="50" r="6" fill={T.accent2} />
            <circle cx="160" cy="50" r="6" fill={T.accent2} opacity={0.3} />
          </svg>
        </Card>

        <Card name="CircuitFlow" desc="电路流动画 · nodes + wires">
          <svg width="200" height="80" viewBox="0 0 200 80">
            <rect x="20" y="20" width="30" height="20" rx="3" fill="none" stroke={T.accent} strokeWidth={1.5} />
            <rect x="100" y="10" width="30" height="20" rx="3" fill="none" stroke={T.accent} strokeWidth={1.5} />
            <rect x="100" y="50" width="30" height="20" rx="3" fill="none" stroke={T.accent} strokeWidth={1.5} />
            <rect x="160" y="30" width="30" height="20" rx="3" fill="none" stroke={T.accent} strokeWidth={1.5} />
            <path d="M 50 30 L 100 20 M 50 30 L 100 60 M 130 20 L 160 30 M 130 60 L 160 40" stroke={T.accent} strokeWidth={1} opacity={0.4} />
            <circle cx="50" cy="30" r="2" fill={T.accent} />
            <circle cx="35" cy="25" r="1.5" fill={T.accent2} style={{ animation: "dotFlow 1.5s linear infinite" }} />
            <style>{`@keyframes dotFlow { 0% { transform: translate(0,0); opacity:1; } 100% { transform: translate(50px,0); opacity:0; } }`}</style>
          </svg>
        </Card>

        <Card name="TextGlow" desc="文字发光 — text + color + intensity">
          <div style={{ fontSize: 36, fontWeight: 800, color: T.accent, textShadow: `0 0 20px ${T.accent}, 0 0 40px ${T.accent}44` }}>
            GLOW
          </div>
        </Card>

        <Card name="SvgReveal" desc="SVG 揭示动画 — drawPath + duration">
          <svg width="160" height="80" viewBox="0 0 160 80">
            <defs>
              <clipPath id="revealClip">
                <rect x="0" y="0" width="160" height="80" style={{ animation: "revealSwipe 2s ease-out forwards" }}>
                  <animate attributeName="width" from="0" to="160" dur="2s" fill="freeze" />
                </rect>
              </clipPath>
            </defs>
            <text x="80" y="50" textAnchor="middle" fontSize="32" fontWeight="700" fill={T.accent} clipPath="url(#revealClip)">REVEAL</text>
          </svg>
        </Card>

        <Card name="Reveal" desc="入场动画包装器 — from: up/down/left/right · delay · duration" fullWidth>
          <RevealDemo />
        </Card>

        <Card name="Stagger" desc="逐个出现包装器 — content 数组第一个元素，自动包裹后续 primitive" fullWidth>
          <StaggerDemo />
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* GSAP 角色与场景 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="GSAP 角色与场景" desc="18 种 GSAP 驱动的角色、物体和电影级场景动画">

        <Card name="StickMan" desc="实体火柴人 — 矩形躯干四肢 + 圆形头部，idle 呼吸动画" fullWidth>
          <StickManInline action="idle" size={300} />
        </Card>

        <Card name="BarRace" desc="柱状图竞速 — 多根柱子竞速增长到目标值" fullWidth>
          <BarRaceInline data={[{ label: "文案", value: 850 }, { label: "视频", value: 450 }, { label: "作图", value: 650 }, { label: "数据", value: 320 }, { label: "直播", value: 580 }]} />
        </Card>

        <Card name="FaceMorph" desc="表情变化 — happy/surprised/thinking/sweat/angry/neutral">
          <div style={{ display: "flex", gap: 8 }}>
            {(["happy","surprised","thinking","sweat","angry"] as const).map((e) => (
              <div key={e} style={{ textAlign: "center" }}>
                <FaceMorphInline emotion={e} size={80} />
                <div style={{ fontSize: 9, color: T.textMute, fontFamily: T.fontMono, marginTop: 2 }}>{e}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card name="LiquidPour" desc="液体灌注 — 液面波浪上升，数字同步滚动">
          <LiquidPourInline value={72} max={100} label="完成度" unit="%" />
        </Card>

        <Card name="PlantGrow" desc="植物生长 — 根→茎→叶→花 四阶段">
          <PlantGrowInline stages={4} size={120} />
        </Card>

        <Card name="GearMechanism" desc="齿轮传动 — 多齿轮啮合旋转">
          <GearMechanismInline gears={3} size={180} />
        </Card>

        <Card name="CalendarFlip" desc="日历翻页 — 3D CSS 翻页效果">
          <CalendarFlipInline pages={5} size={140} />
        </Card>

        <Card name="Constellation" desc="星座连线 — 星点亮起 + 连线渐显">
          <ConstellationInline stars={8} size={200} />
        </Card>

        <Card name="RocketLaunch" desc="火箭发射 — 倒计时 → 点火 → 升空">
          <RocketLaunchInline size={180} />
        </Card>

        <Card name="HandGesture" desc="手势 — thumbsUp/counting/pointing/okSign/clap/wave">
          <div style={{ display: "flex", gap: 8 }}>
            {(["thumbsUp","counting","pointing","okSign","wave"] as const).map((g) => (
              <div key={g} style={{ textAlign: "center" }}>
                <HandGestureInline gesture={g} size={80} />
                <div style={{ fontSize: 9, color: T.textMute, fontFamily: T.fontMono, marginTop: 2 }}>{g}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card name="FunnelFilter" desc="漏斗筛选 — 粒子涌入→层层过滤→精华沉淀" fullWidth>
          <FunnelFilterInline size={220} />
        </Card>

        <Card name="DominoEffect" desc="多米诺连锁 — 骨牌依次倒下→标签弹出→核心结论揭示" fullWidth>
          <DominoEffectInline count={8} labels={["简历","筛选","面试","笔试","群面","终面","对比","Offer"]} size={260} />
        </Card>

        <Card name="Storm2Calm" desc="风暴到平静 — 天暗→闪电→雨暴→船颠→光透→平静" fullWidth>
          <Storm2CalmInline size={240} />
        </Card>

        <Card name="Hourglass" desc="沙漏时间 — 沙流→上层耗尽→翻转→新循环">
          <HourglassInline size={150} />
        </Card>

        <Card name="PuzzleAssembly" desc="拼图聚合 — 碎片漂浮→寻找匹配→拼合完整→标题浮现" fullWidth>
          <PuzzleAssemblyInline pieces={9} title="团队协作完成" size={240} />
        </Card>

        <Card name="PaperPlane" desc="纸飞机旅程 — 折叠→掷出→特技飞行→手上降落→留言展开">
          <PaperPlaneInline size={220} message="恰到啦" />
        </Card>

        <Card name="HologramReveal" desc="全息投影 — 底座亮→网格升→激光交汇→物体打印→旋转">
          <HologramRevealInline size={200} shape="cube" />
        </Card>

        <Card name="CowCharacter" desc="拟人化牛 — 矩形躯干四肢 + 牛头犄角 + 铜铃，idle 呼吸动画" fullWidth>
          <CowCharacterInline action="idle" size={320} />
        </Card>

        <Card name="Volcano" desc="火山喷发 — 冒烟→裂缝→红光→喷涌→岩浆流→植物新生" fullWidth>
          <VolcanoInline size={220} />
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 图表与图示 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="图表与图示" desc="5 种图表积木 — 从节点图到3D地球">

        <Card name="NetworkGraph" desc="节点关系图 · nodes + edges + layout" fullWidth>
          <svg width="400" height="160" viewBox="0 0 400 160">
            {[
              [100, 80, "A"], [200, 40, "B"], [200, 120, "C"], [300, 80, "D"],
            ].map(([x, y, label]) => (
              <g key={label}>
                <circle cx={x} cy={y} r={18} fill={T.surface} stroke={T.accent} strokeWidth={2} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill={T.accent}>{label}</text>
              </g>
            ))}
            {[[100, 80, 200, 40], [100, 80, 200, 120], [200, 40, 300, 80], [200, 120, 300, 80]].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.accent} strokeWidth={1.5} opacity={0.4} />
            ))}
          </svg>
        </Card>

        <Card name="TimelineItem" desc="时间线条目 · date + heading + highlight" fullWidth>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0, width: "100%", overflow: "hidden" }}>
            {[
              { date: "2020", heading: "AI 写代码", hl: false },
              { date: "2023", heading: "模板填空", hl: false },
              { date: "2024", heading: "Blueprint v1", hl: true },
              { date: "2025", heading: "积木系统", hl: false },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", position: "relative", paddingTop: 20 }}>
                <div style={{ position: "absolute", top: 0, left: "50%", width: item.hl ? 14 : 10, height: item.hl ? 14 : 10, borderRadius: "50%", background: item.hl ? T.accent : T.bd, transform: "translate(-50%, 0)", boxShadow: item.hl ? `0 0 0 4px ${T.accent}33` : "none" }} />
                <div style={{ fontSize: 12, fontFamily: T.fontMono, color: T.accent, marginBottom: 4 }}>{item.date}</div>
                <div style={{ fontSize: 14, fontWeight: item.hl ? 700 : 500, color: item.hl ? T.accent : T.text }}>{item.heading}</div>
              </div>
            ))}
            <div style={{ position: "absolute", top: 5, left: "12%", right: "12%", height: 2, background: T.accent, opacity: 0.2, zIndex: -1 }} />
          </div>
        </Card>

        <Card name="ProcessArrow" desc="流程箭头 · steps + direction" fullWidth>
          <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
            {["投简历", "HR 筛选", "面试", "Offer"].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ background: i === 0 ? `${T.accent}22` : T.surface, border: `1px solid ${i === 0 ? T.accent : T.bd}`, borderRadius: 6, padding: "8px 16px", textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{step}</div>
                </div>
                {i < 3 && <div style={{ fontSize: 18, color: T.accent, margin: "0 4px" }}>→</div>}
              </div>
            ))}
          </div>
        </Card>

        <Card name="VennDiagram" desc="韦恩图 · 2-4 sets" fullWidth>
          <svg width="250" height="140" viewBox="0 0 250 140">
            <circle cx="90" cy="70" r="55" fill={T.accent} opacity={0.15} stroke={T.accent} strokeWidth={1.5} />
            <circle cx="160" cy="70" r="55" fill={T.accent2} opacity={0.15} stroke={T.accent2} strokeWidth={1.5} />
            <text x="65" y="60" textAnchor="middle" fontSize={12} fill={T.accent}>AI</text>
            <text x="185" y="60" textAnchor="middle" fontSize={12} fill={T.accent2}>视频</text>
            <text x="125" y="85" textAnchor="middle" fontSize={11} fill={T.textMute}>交集</text>
          </svg>
        </Card>

        <Card name="GeoGlobe" desc="3D 地球 · highlightRegions + rotationSpeed" fullWidth>
          <div style={{ width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${T.accent2}44, ${T.accent2}22 40%, ${T.surface} 70%)`, border: `2px solid ${T.accent2}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, color: T.textMute }}>🌍 3D Globe</span>
          </div>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 创意 Canvas */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="创意 Canvas" desc="7 种 useSeekableCanvas 驱动的创意场景 — 支持 stepTime 精准同步">

        <Card name="MoonPhase" desc="月相演变 — 新月→满月→新月循环 + 数据面板">
          <div style={{ width: 280, height: 182, background: "#020210", borderRadius: 6, overflow: "hidden" }}><MoonPhaseInline /></div>
        </Card>

        <Card name="FlowChart" desc="流程追踪 — traceroute 风格，节点+边+动画包" fullWidth>
          <div style={{ width: "100%", height: 130, background: "#0a0a14", borderRadius: 6, overflow: "hidden" }}><FlowChartInline /></div>
        </Card>

        <Card name="LineDraw" desc="架构图绘制 — 方框+连线逐步揭示">
          <div style={{ width: 260, height: 169, background: "#0a0a14", borderRadius: 6, overflow: "hidden" }}><LineDrawInline /></div>
        </Card>

        <Card name="LoadingAnim" desc="环形进度 — 圆弧填充 + 发光点 + 日志行">
          <div style={{ width: 160, height: 128, background: "#0a0a14", borderRadius: 6, overflow: "hidden" }}><LoadingAnimInline /></div>
        </Card>

        <Card name="GameScene" desc="像素迷宫 — 玩家点移动 + 拖尾 + 网格">
          <div style={{ width: 200, height: 200, background: "#020205", borderRadius: 6, overflow: "hidden" }}><GameSceneInline /></div>
        </Card>

        <Card name="Editorial" desc="科幻落地页 — 渐变条 + 大标题 + 扫描线">
          <div style={{ width: 280, height: 182, background: "#0a0a12", borderRadius: 6, overflow: "hidden" }}><EditorialInline /></div>
        </Card>
      
      
        <Card name="Test" desc="">
          <div style={{ width: 240, height: 160, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-mute)", fontSize:12 }}>
            TODO: Test 预览 — 实现 TestInline 组件
          </div>
        </Card>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 综合排版 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Section title="综合排版" desc="跨类别混搭 + 嵌套布局 — 展示真实视频画面的信息密度">

        <Card name="嵌套布局" desc="Split → 左:Grid(Card×2) + 右:FlexCol(Headline+Body+Badge)" fullWidth>
          <div style={{ display: "flex", width: "100%", minHeight: 220, gap: 1 }}>
            <div style={{ flex: "1fr", display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.accent }}>42</div>
                  <div style={{ fontSize: 10, color: T.textMute, marginTop: 2 }}>Primitives</div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.accent2 }}>5</div>
                  <div style={{ fontSize: 10, color: T.textMute, marginTop: 2 }}>Layouts</div>
                </div>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.bd}`, borderRadius: 6, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: T.textMute }}>Layout nesting: Grid → Card → FlexCol</div>
              </div>
            </div>
            <div style={{ width: 1, background: T.accent, opacity: 0.2 }} />
            <div style={{ flex: "1fr", display: "flex", flexDirection: "column", justifyContent: "center", padding: 20, gap: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>嵌套布局</div>
              <div style={{ fontSize: 13, color: T.textMute, lineHeight: 1.5 }}>每个 region 的 content 被拓展为: PrimitiveCall 数组 | 单个 PrimitiveCall | LayoutDef。当 region 内容是 LayoutDef 时，编译器递归渲染子布局。</div>
              <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.accent, background: `${T.accent}18`, padding: "2px 8px", borderRadius: 99, alignSelf: "flex-start" }}>v2.1</span>
            </div>
          </div>
        </Card>

        <Card name="数字冲击" desc="Headline + Counter + Badge + GlowRing + GradientBg" fullWidth>
          <div style={{ position: "relative", width: "100%", height: 260, borderRadius: 8, overflow: "hidden", background: T.surface }}>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom right, ${T.accent}15, transparent 60%)` }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 180, height: 180, borderRadius: "50%", border: `2px solid ${T.accent}33`, boxShadow: `0 0 40px ${T.accent}18`, transform: "translate(-50%, -50%)" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <span style={{ fontSize: 13, fontFamily: T.fontMono, color: T.accent, background: `${T.accent}18`, padding: "2px 10px", borderRadius: 99, marginBottom: 12 }}>数据冲击</span>
              <div style={{ fontSize: 64, fontWeight: 800, color: T.accent, lineHeight: 1 }}>99.5<span style={{ fontSize: 22, fontWeight: 400 }}>%</span></div>
              <div style={{ fontSize: 14, color: T.textMute, marginTop: 8 }}>AI 编译成功率 · 覆盖 42 种 primitive</div>
            </div>
          </div>
        </Card>

        <Card name="感言卡片" desc="Card + PullQuote + Avatar + GradientBg" fullWidth>
          <div style={{ position: "relative", width: "100%", padding: 32, borderRadius: 8, background: T.surface, border: `1px solid ${T.bd}`, boxShadow: `0 4px 16px rgba(0,0,0,0.3)`, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.accent2})` }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 72, lineHeight: 0.5, color: T.accent, opacity: 0.15, userSelect: "none", marginBottom: 8, fontFamily: "Georgia, serif" }}>"</div>
              <p style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.4, maxWidth: 400, margin: "0 auto" }}>从 3 小时手动排版到 3 秒 AI 编译，这套积木系统重新定义了视频生产</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>W</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>WebVideo Studio</div>
                  <div style={{ fontSize: 12, color: T.textMute }}>Blueprint v2</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card name="数据仪表盘" desc="Grid → Card → FlexCol → Headline + LineChart + StatCard" fullWidth>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, width: "100%" }}>
            <div style={{ background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>编译时长趋势</div>
              <svg width="100%" height="120" viewBox="0 0 300 120">
                <polyline points="0,100 50,85 100,90 150,60 200,55 250,30 300,20" fill="none" stroke={T.accent} strokeWidth={2.5} />
                <circle cx="300" cy="20" r="4" fill={T.accent} />
                {[0, 50, 100, 150, 200, 250, 300].map((x, i) => (
                  <text key={i} x={x} y={116} textAnchor="middle" fontSize={9} fill={T.textMute}>{["Jan","Feb","Mar","Apr","May","Jun","Jul"][i]}</text>
                ))}
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.accent }}>42</div>
                <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>Primitives ↑</div>
              </div>
              <div style={{ background: T.bg, borderRadius: 8, border: `1px solid ${T.bd}`, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.accent2 }}>5</div>
                <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>Layouts →</div>
              </div>
            </div>
          </div>
        </Card>

        <Card name="流程导航" desc="Split + ProcessArrow + Headline + Body + Badge" fullWidth>
          <div style={{ display: "flex", width: "100%", alignItems: "center", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.accent, background: `${T.accent}18`, padding: "1px 8px", borderRadius: 99 }}>WORKFLOW</span>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>AI 构建管线</div>
              <div style={{ fontSize: 13, color: T.textMute, marginTop: 4 }}>写作 → Blueprint → 编译 → 渲染</div>
            </div>
            <div style={{ fontSize: 24, color: T.accent }}>→</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {["写作 agent", "Blueprint JSON", "编译器", "iframe 预览"].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: i === 0 ? T.accent : T.bd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: i === 0 ? "#000" : T.textMute, flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: 13 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Section>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.bd}`, paddingTop: 24, marginTop: 48, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: T.textMute }}>
          WebVideo Studio · Blueprint v2 · 5 layouts × 42 primitives · 全部代码驱动，零素材依赖
        </p>
      </div>
    </div>
  );
}

// ─── Demo Components (inline, no external deps) ─────────────────────────

function TypeWriterDemo() {
  const [text, setText] = useState("");
  const fullText = "打字机效果逐字显示…";
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) { setText(fullText.slice(0, i)); i++; }
      else clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, []);
  return <span style={{ fontSize: 20, fontFamily: T.fontMono, color: T.accent }}>{text}<span style={{ animation: "blink 1s step-end infinite" }}>|</span><style>{`@keyframes blink{50%{opacity:0}}`}</style></span>;
}

function CounterDemo({ to, unit }: { to: number; unit: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 2000; const steps = 60; const inc = to / steps;
    let i = 0;
    const t = setInterval(() => { i++; setVal(Math.min(Math.round(inc * i), to)); if (i >= steps) clearInterval(t); }, duration / steps);
    return () => clearInterval(t);
  }, [to]);
  return <span style={{ fontSize: 48, fontWeight: 800, color: T.accent }}>{val}<span style={{ fontSize: 20, fontWeight: 400 }}>{unit}</span></span>;
}

function StatCardDemo({ value, label, trend }: { value: string; label: string; trend: string }) {
  const colors: Record<string, string> = { up: T.accent, down: "#ef4444", neutral: T.textMute };
  const icons: Record<string, string> = { up: "↑", down: "↓", neutral: "→" };
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: colors[trend] ?? T.accent }}>{value}</span>
        <span style={{ fontSize: 16, color: colors[trend] ?? T.textMute }}>{icons[trend] ?? ""}</span>
      </div>
      <div style={{ fontSize: 11, color: T.textMute, fontFamily: T.fontMono, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function BarChartDemo() {
  const data = [{ l: "文案", v: 85 }, { l: "视频", v: 45 }, { l: "作图", v: 65 }, { l: "数据", v: 30 }, { l: "直播", v: 55 }];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 100 }}>
      {data.map((d) => (
        <div key={d.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 28, height: d.v, background: T.accent, borderRadius: "4px 4px 0 0", opacity: 0.8, transition: "height 1s ease-out" }} />
          <span style={{ fontSize: 10, color: T.textMute }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function LineChartDemo() {
  const points = "20,70 70,50 120,60 170,30 220,40 270,20";
  return (
    <svg width="300" height="100" viewBox="0 0 300 100">
      <polyline points={points} fill="none" stroke={T.accent2} strokeWidth={2.5} />
      {points.split(" ").map((p, i) => { const [x, y] = p.split(",").map(Number); return <circle key={i} cx={x} cy={y} r={3} fill={T.accent2} />; })}
    </svg>
  );
}

function PieChartDemo() {
  const slices = [
    { value: 35, color: T.accent, label: "文字" },
    { value: 25, color: T.accent2, label: "数据" },
    { value: 20, color: "#10b981", label: "装饰" },
    { value: 20, color: "#8b5cf6", label: "动画" },
  ];
  let cumulative = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="90" height="90" viewBox="0 0 36 36">
        {slices.map((s, i) => {
          const dashArray = (s.value / 100) * 100;
          const dashOffset = -cumulative;
          cumulative += dashArray;
          return <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={s.color} strokeWidth="4" strokeDasharray={`${dashArray} ${100 - dashArray}`} strokeDashoffset={dashOffset} transform="rotate(-90 18 18)" />;
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
            <span style={{ fontSize: 11, color: T.textMute }}>{s.label} {s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GaugeDemo({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const r = 35; const circumference = 2 * Math.PI * r;
  const startAngle = 135; const sweepAngle = 270;
  const pct = value / max;
  const dashArray = circumference * (sweepAngle / 360);
  const dashOffset = circumference * (1 - pct) * (sweepAngle / 360);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="90" height="70" viewBox="0 0 90 70">
        <circle cx="45" cy="45" r={r} fill="none" stroke={`${color}22`} strokeWidth="6" strokeDasharray={`${dashArray} ${circumference - dashArray}`} strokeDashoffset="0" transform="rotate(135 45 45)" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${dashArray} ${circumference - dashArray}`} strokeDashoffset={dashOffset} transform="rotate(135 45 45)" strokeLinecap="round" />
        <text x="45" y="43" textAnchor="middle" fontSize="16" fontWeight={700} fill={color}>{value}</text>
        <text x="45" y="56" textAnchor="middle" fontSize={9} fill={color} opacity={0.6}>{unit}</text>
      </svg>
      <div style={{ fontSize: 10, color: T.textMute, fontFamily: T.fontMono, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function GlowRingDemo({ color, size }: { color: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}44`,
      boxShadow: `0 0 ${size * 0.3}px ${color}44`,
      animation: "pulseRing 2s ease-in-out infinite",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: 11, color: T.textMute }}>GlowRing</span>
      <style>{`@keyframes pulseRing { 0%, 100% { box-shadow: 0 0 ${size*0.2}px ${color}33; transform: scale(1); } 50% { box-shadow: 0 0 ${size*0.4}px ${color}55; transform: scale(1.05); } }`}</style>
    </div>
  );
}

function ParticleDemo() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    l: (Math.round(hash(i * 3) * 10000) / 100).toFixed(2),
    t: (Math.round(hash(i * 7 + 1) * 10000) / 100).toFixed(2),
    o: (Math.round((0.2 + hash(i * 5 + 2) * 0.5) * 1000) / 1000).toFixed(3),
    d: (Math.round((2 + hash(i * 11 + 3) * 3) * 100) / 100).toFixed(2),
    ad: (Math.round(hash(i * 13 + 4) * 200) / 100).toFixed(2),
  }));
  return (
    <div style={{ position: "relative", width: "100%", height: 100, overflow: "hidden", borderRadius: 6 }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 3, height: 3, borderRadius: "50%", background: T.accent,
          left: p.l + "%", top: p.t + "%",
          opacity: p.o,
          animation: "particleFloat " + p.d + "s linear infinite",
          animationDelay: p.ad + "s",
        }} />
      ))}
      <style>{`@keyframes particleFloat { 0% { transform: translateY(100px) translateX(0); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(-20px) translateX(20px); opacity: 0; } }`}</style>
    </div>
  );
}

function WaveFormDemo() {
  return (
    <svg width="200" height="60" viewBox="0 0 200 60">
      <path d="M 0 30 Q 25 5, 50 30 T 100 30 T 150 30 T 200 30" fill="none" stroke={T.accent} strokeWidth={2} opacity={0.7}>
        <animate attributeName="d" values="M 0 30 Q 25 5, 50 30 T 100 30 T 150 30 T 200 30;M 0 30 Q 25 55, 50 30 T 100 30 T 150 30 T 200 30;M 0 30 Q 25 5, 50 30 T 100 30 T 150 30 T 200 30" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M 0 40 Q 30 15, 60 40 T 120 40 T 180 40" fill="none" stroke={T.accent2} strokeWidth={1.5} opacity={0.5}>
        <animate attributeName="d" values="M 0 40 Q 30 15, 60 40 T 120 40 T 180 40;M 0 40 Q 30 55, 60 40 T 120 40 T 180 40;M 0 40 Q 30 15, 60 40 T 120 40 T 180 40" dur="1.5s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function RevealDemo() {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 300); return () => clearTimeout(t); }, []);
  const dirs = [
    { from: "up", label: "↑ up", style: { transform: show ? "translateY(0)" : "translateY(32px)", opacity: show ? 1 : 0 } },
    { from: "down", label: "↓ down", style: { transform: show ? "translateY(0)" : "translateY(-32px)", opacity: show ? 1 : 0 } },
    { from: "left", label: "← left", style: { transform: show ? "translateX(0)" : "translateX(32px)", opacity: show ? 1 : 0 } },
    { from: "right", label: "→ right", style: { transform: show ? "translateX(0)" : "translateX(-32px)", opacity: show ? 1 : 0 } },
  ];
  return (
    <div style={{ display: "flex", gap: 16, width: "100%", justifyContent: "center" }}>
      {dirs.map((d, i) => (
        <div key={d.from} style={{
          background: T.surface, border: `1px solid ${T.bd}`, borderRadius: 6,
          padding: "12px 20px", textAlign: "center",
          transition: `all 0.7s ease-out ${i * 0.15}s`,
          ...d.style,
        }}>
          <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.accent, marginBottom: 4 }}>{d.label}</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Reveal</div>
        </div>
      ))}
    </div>
  );
}

function StaggerDemo() {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    const items = [1, 2, 3, 4, 5];
    items.forEach((n) => { setTimeout(() => setVisible(n), n * 300); });
  }, []);
  return (
    <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center" }}>
      {["投简历", "HR筛选", "面试通知", "技术面", "Offer"].map((text, i) => (
        <div key={text} style={{
          background: visible > i ? T.accent : T.surface,
          border: `1px solid ${visible > i ? T.accent : T.bd}`,
          borderRadius: 6,
          padding: "10px 18px",
          transition: "all 0.5s ease-out",
          transform: visible > i ? "translateY(0)" : "translateY(16px)",
          opacity: visible > i ? 1 : 0.3,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2, color: visible > i ? "#000" : T.text }}>{String(i + 1).padStart(2, "0")}</div>
          <div style={{ fontSize: 12, color: visible > i ? "#0008" : T.textMute }}>{text}</div>
        </div>
      ))}
    </div>
  );
}

// ─── GSAP Animation Inline Demos ──────────────────────────────────────────

function StickManInline({ action = "idle", size = 300 }: { action?: string; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
    const bodyGroup = svg.querySelector("#smi-body-group") as SVGGElement;
    const uaL = svg.querySelector("#smi-ua-l") as SVGGElement;
    const uaR = svg.querySelector("#smi-ua-r") as SVGGElement;
    const faL = svg.querySelector("#smi-fa-l") as SVGGElement;
    const faR = svg.querySelector("#smi-fa-r") as SVGGElement;
    const legL = svg.querySelector("#smi-leg-l") as SVGRectElement;
    const legR = svg.querySelector("#smi-leg-r") as SVGRectElement;
    const shL = "68px 128px"; const shR = "172px 128px";
    const elL = "50px 148px"; const elR = "190px 148px";
    if (action === "walk") {
      tl.to(uaL,{rotation:-20,duration:0.35,ease:"sine.inOut",transformOrigin:shL},0).to(uaR,{rotation:20,duration:0.35,ease:"sine.inOut",transformOrigin:shR},0).to(legR,{rotation:15,duration:0.35,ease:"sine.inOut",transformOrigin:"135px 195px"},0).to(legL,{rotation:-15,duration:0.35,ease:"sine.inOut",transformOrigin:"105px 195px"},0).to(bodyGroup,{y:-3,duration:0.18,ease:"sine.inOut",yoyo:true,repeat:1},0).to(uaL,{rotation:20,duration:0.35,ease:"sine.inOut",transformOrigin:shL},0.35).to(uaR,{rotation:-20,duration:0.35,ease:"sine.inOut",transformOrigin:shR},0.35).to(legR,{rotation:-15,duration:0.35,ease:"sine.inOut",transformOrigin:"135px 195px"},0.35).to(legL,{rotation:15,duration:0.35,ease:"sine.inOut",transformOrigin:"105px 195px"},0.35).to(bodyGroup,{y:-3,duration:0.18,ease:"sine.inOut",yoyo:true,repeat:1},0.35);
    } else if (action === "wave") {
      tl.to(uaR,{rotation:-130,duration:0.3,ease:"power2.out",transformOrigin:shR},0).to(faR,{rotation:-40,duration:0.3,ease:"power2.out",transformOrigin:elR},0.1).to(uaR,{rotation:-110,duration:0.15,transformOrigin:shR},0.3).to(uaR,{rotation:-130,duration:0.15,transformOrigin:shR},0.45).to(uaR,{rotation:0,duration:0.3,ease:"power2.in",transformOrigin:shR},0.8).to(faR,{rotation:0,duration:0.3,ease:"power2.in",transformOrigin:elR},0.8);
    } else if (action === "think") {
      tl.to(bodyGroup,{rotation:2,duration:0.5,transformOrigin:"120px 140px"},0).to(uaR,{rotation:60,duration:0.5,transformOrigin:shR},0).to(faR,{rotation:30,duration:0.4,transformOrigin:elR},0.1);
    } else if (action === "celebrate") {
      tl.to(uaL,{rotation:-150,duration:0.5,ease:"back.out(2)",transformOrigin:shL},0).to(faL,{rotation:-30,duration:0.4,ease:"back.out(2)",transformOrigin:elL},0.1).to(uaR,{rotation:150,duration:0.5,ease:"back.out(2)",transformOrigin:shR},0).to(faR,{rotation:30,duration:0.4,ease:"back.out(2)",transformOrigin:elR},0.1).to(bodyGroup,{y:-8,duration:0.25,ease:"power2.out",yoyo:true,repeat:7},0.3);
    } else {
      tl.to(bodyGroup,{scaleY:1.012,duration:2,ease:"sine.inOut",yoyo:true,repeat:-1,transformOrigin:"120px 200px"},0).to(uaL,{rotation:-6,duration:3,ease:"sine.inOut",yoyo:true,repeat:-1,transformOrigin:shL},0).to(uaR,{rotation:6,duration:3,ease:"sine.inOut",yoyo:true,repeat:-1,transformOrigin:shR},0.5);
    }
    return () => { tl.kill(); };
  }, [action]);
  const s = size / 260; const clr = "#f59e0b"; const sc = "#d97706"; const dk = "#92400e";
  return (<svg ref={svgRef} width={size} height={size*1.2} viewBox="0 0 260 320"><g transform={`scale(${s})`}><rect id="smi-leg-l" x="80" y="195" width="26" height="48" rx="10" fill={clr}/><rect id="smi-leg-r" x="132" y="195" width="26" height="48" rx="10" fill={clr}/><rect x="78" y="240" width="30" height="10" rx="5" fill={dk}/><rect x="130" y="240" width="30" height="10" rx="5" fill={dk}/><g id="smi-body-group"><rect x="75" y="115" width="90" height="85" rx="20" fill={clr}/><ellipse cx="120" cy="125" rx="22" ry="14" fill={sc} opacity={0.3}/><g id="smi-ua-l"><rect x="58" y="120" width="20" height="28" rx="8" fill={clr}/><g id="smi-fa-l" style={{transformOrigin:"68px 148px"}}><rect x="54" y="142" width="16" height="26" rx="7" fill={clr}/><rect x="52" y="164" width="20" height="9" rx="4" fill={dk}/></g></g><g id="smi-ua-r"><rect x="162" y="120" width="20" height="28" rx="8" fill={clr}/><g id="smi-fa-r" style={{transformOrigin:"172px 148px"}}><rect x="170" y="142" width="16" height="26" rx="7" fill={clr}/><rect x="168" y="164" width="20" height="9" rx="4" fill={dk}/></g></g><g transform="translate(120, 82)"><circle cx="0" cy="-2" r="32" fill={clr}/><circle cx="0" cy="-2" r="28" fill={sc} opacity={0.25}/><ellipse cx="-13" cy="-5" rx="7" ry="8" fill="#FFF"/><ellipse cx="13" cy="-5" rx="7" ry="8" fill="#FFF"/><circle cx="-11" cy="-3" r="4" fill="#1A1A1A"/><circle cx="15" cy="-3" r="4" fill="#1A1A1A"/><circle cx="-12" cy="-5" r="1.5" fill="#FFF"/><circle cx="14" cy="-5" r="1.5" fill="#FFF"/><path d="M -6 8 Q 0 13 6 8" fill="none" stroke={dk} strokeWidth={2} strokeLinecap="round"/></g></g></g></svg>);
}

function BarRaceInline({ data }: { data: { label: string; value: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || data.length === 0) return;
    const maxVal = Math.max(...data.map((d) => d.value));
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const bars = el.querySelectorAll(".bar-race-bar");
    bars.forEach((bar, i) => {
      const pct = (data[i].value / maxVal) * 100;
      tl.fromTo(bar, { width: "0%" }, { width: `${pct}%`, duration: 1.5, ease: "expo.out" }, i * 0.08);
    });
    return () => { tl.kill(); };
  }, [data]);
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 60, fontSize: 11, fontFamily: T.fontMono, color: T.textMute, textAlign: "right" }}>{d.label}</span>
          <div style={{ flex: 1, height: 20, background: T.surface, borderRadius: 3, overflow: "hidden" }}>
            <div className="bar-race-bar" style={{ height: "100%", borderRadius: 3, background: i === 0 ? T.accent : `hsl(${210 + i * 40}, 70%, 55%)`, width: "0%" }} />
          </div>
          <span style={{ width: 36, fontSize: 12, fontWeight: 700, fontFamily: T.fontMono }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function FaceMorphInline({ emotion, size = 80 }: { emotion: string; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const mouth = svg.querySelector("#fm-mouth") as SVGPathElement;
    const eyeL = svg.querySelector("#fm-eye-l") as SVGEllipseElement;
    const eyeR = svg.querySelector("#fm-eye-r") as SVGEllipseElement;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1, yoyo: true, repeat: 1 });
    const mouthMap: Record<string, string> = { happy: "M 40 65 Q 60 85 80 65", surprised: "M 40 62 Q 60 78 80 62", thinking: "M 50 65 Q 60 60 70 65", sweat: "M 45 68 Q 60 60 75 68", angry: "M 45 72 Q 60 58 75 72" };
    const d = mouthMap[emotion] ?? "M 50 65 Q 60 68 70 65";
    if (emotion === "surprised") {
      tl.to([eyeL, eyeR], { ry: 10, duration: 0.5 }, 0);
    } else {
      tl.to([eyeL, eyeR], { ry: 5, duration: 0.5 }, 0);
    }
    tl.to(mouth, { attr: { d }, duration: 0.5 }, 0);
    return () => { tl.kill(); };
  }, [emotion]);
  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 160 120">
      <circle cx="80" cy="60" r="50" fill="none" stroke={T.accent} strokeWidth={2.5} />
      <ellipse id="fm-eye-l" cx="60" cy="50" rx="5" ry="6" fill={T.accent} />
      <ellipse id="fm-eye-r" cx="100" cy="50" rx="5" ry="6" fill={T.accent} />
      <line x1="50" y1="38" x2="70" y2="36" stroke={T.accent} strokeWidth={2.5} strokeLinecap="round" />
      <line x1="110" y1="38" x2="90" y2="36" stroke={T.accent} strokeWidth={2.5} strokeLinecap="round" />
      <path id="fm-mouth" d="M 50 65 Q 60 68 70 65" fill="none" stroke={T.accent} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

function LiquidPourInline({ value, max, label, unit }: { value: number; max: number; label: string; unit: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const pct = Math.min(value / max, 1);
    const targetY = 170 - pct * 120;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const liquid = svg.querySelector("#lp-liquid") as SVGPathElement;
    const counter = svg.querySelector("#lp-counter") as SVGTextElement;
    const startD = "M 40 170 Q 80 172 140 170 L 140 190 L 40 190 Z";
    const endD = `M 40 ${targetY} Q 80 ${targetY + 3} 140 ${targetY} L 140 190 L 40 190 Z`;
    tl.fromTo(liquid, { attr: { d: startD } }, { attr: { d: endD }, duration: 1.5, ease: "power2.inOut" }, 0);
    const waveD = `M 40 ${targetY} Q 80 ${targetY - 4} 140 ${targetY} L 140 190 L 40 190 Z`;
    tl.to(liquid, { attr: { d: waveD }, duration: 0.3, yoyo: true, repeat: 5, ease: "sine.inOut" }, 1.3);
    const counterObj = { v: 0 };
    tl.to(counterObj, { v: value, duration: 1.5, ease: "power2.out", onUpdate: () => { if (counter) counter.textContent = Math.round(counterObj.v).toString(); } }, 0);
    return () => { tl.kill(); };
  }, [value, max]);
  return (
    <div style={{ textAlign: "center" }}>
      <svg ref={svgRef} width="120" height="150" viewBox="0 0 180 210">
        <path d="M 40 50 L 40 190 L 140 190 L 140 50" fill="none" stroke={T.textMute} strokeWidth={2.5} />
        <path id="lp-liquid" d="M 40 170 Q 80 172 140 170 L 140 190 L 40 190 Z" fill={T.accent} opacity={0.5} />
        <text id="lp-counter" x="90" y="158" textAnchor="middle" fontSize={26} fontWeight={700} fill={T.text} stroke="none">0</text>
        <text x="90" y="176" textAnchor="middle" fontSize={12} fill={T.textMute} stroke="none">{unit}</text>
      </svg>
      <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textMute, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function PlantGrowInline({ stages, size = 120 }: { stages: number; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    const stem = svg.querySelector("#pg-stem") as SVGPathElement;
    const leaves = svg.querySelectorAll(".pg-leaf");
    const flower = svg.querySelector("#pg-flower") as SVGGElement | null;
    tl.fromTo(stem, { attr: { d: "M 80 120 Q 80 120 80 120" } }, { attr: { d: "M 80 120 Q 75 80 80 40" }, duration: 1, ease: "power2.out" }, 0.3);
    leaves.forEach((leaf, i) => {
      tl.fromTo(leaf, { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, 0.7 + i * 0.2);
    });
    if (flower && stages >= 4) {
      tl.fromTo(flower, { scale: 0, transformOrigin: "80px 40px" }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" }, 1.2);
    }
    return () => { tl.kill(); };
  }, [stages]);
  return (
    <svg ref={svgRef} width={size} height={size * 1.1} viewBox="0 0 160 170">
      <path d="M 80 120 Q 75 135 70 145 M 80 120 Q 85 135 90 145" fill="none" stroke={T.accent} strokeWidth={2} />
      <path id="pg-stem" d="M 80 120 Q 75 80 80 40" fill="none" stroke={T.accent} strokeWidth={3} />
      <g className="pg-leaf" transform="translate(80,80)"><ellipse cx="0" cy="0" rx="18" ry="8" fill={T.accent} opacity={0.7} /></g>
      <g className="pg-leaf" transform="translate(80,60)"><ellipse cx="20" cy="0" rx="18" ry="8" fill={T.accent} opacity={0.6} transform="rotate(-30)" /></g>
      {stages >= 3 && <g className="pg-leaf" transform="translate(80,55)"><ellipse cx="-18" cy="5" rx="16" ry="7" fill={T.accent} opacity={0.5} transform="rotate(30)" /></g>}
      {stages >= 4 && <g id="pg-flower" transform="translate(80,40)">{[0,60,120,180,240,300].map(a => <ellipse key={a} cx={0} cy={-8} rx={5} ry={10} fill={T.accent} opacity={0.8} transform={`rotate(${a})`} />)}<circle cx="0" cy="0" r="5" fill={T.accent2} /></g>}
    </svg>
  );
}

function GearMechanismInline({ gears, size = 180 }: { gears: number; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  function gearPath(teeth: number, outerR: number, innerR: number): string {
    const parts: string[] = [];
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2, a2 = ((i + 0.5) / teeth) * Math.PI * 2;
      parts.push(`M ${Math.cos(a1)*innerR} ${Math.sin(a1)*innerR} L ${Math.cos(a1)*outerR} ${Math.sin(a1)*outerR} L ${Math.cos(a2)*outerR} ${Math.sin(a2)*outerR} L ${Math.cos(a2)*innerR} ${Math.sin(a2)*innerR}`);
    }
    return parts.join(" ");
  }
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1 });
    const g1 = svg.querySelector("#gm-gear-1") as SVGGElement;
    const g2 = svg.querySelector("#gm-gear-2") as SVGGElement;
    const g3 = svg.querySelector("#gm-gear-3") as SVGGElement | null;
    tl.to(g1, { rotation: 360, duration: 10, ease: "none", transformOrigin: "60px 70px" }, 0);
    tl.to(g2, { rotation: -360, duration: 6, ease: "none", transformOrigin: "115px 55px" }, 0);
    if (g3) tl.to(g3, { rotation: 360, duration: 8, ease: "none", transformOrigin: "130px 85px" }, 0);
    return () => { tl.kill(); };
  }, [gears]);
  return (
    <svg ref={svgRef} width={size} height={size * 0.7} viewBox="0 0 180 120">
      <g id="gm-gear-1"><path d={gearPath(10, 30, 22)} fill="none" stroke={T.accent} strokeWidth={2} transform="translate(60,70)" /><circle cx="60" cy="70" r="10" fill="none" stroke={T.accent} strokeWidth={1.5} /><circle cx="60" cy="70" r="3" fill={T.accent} /></g>
      {gears >= 2 && <g id="gm-gear-2"><path d={gearPath(6, 22, 16)} fill="none" stroke={T.accent} strokeWidth={2} transform="translate(115,55)" /><circle cx="115" cy="55" r="8" fill="none" stroke={T.accent} strokeWidth={1.5} /><circle cx="115" cy="55" r="2.5" fill={T.accent} /></g>}
      {gears >= 3 && <g id="gm-gear-3"><path d={gearPath(8, 18, 12)} fill="none" stroke={T.accent} strokeWidth={2} transform="translate(130,85)" /><circle cx="130" cy="85" r="6" fill="none" stroke={T.accent} strokeWidth={1.5} /><circle cx="130" cy="85" r="2" fill={T.accent} /></g>}
    </svg>
  );
}

function CalendarFlipInline({ pages, size = 140 }: { pages: number; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    const cards = el.querySelectorAll(".cal-card");
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      const t = i * 1.0;
      tl.set(card, { zIndex: pages - i, rotationX: 0, transformOrigin: "50% 0%" }, t);
      tl.to(card, { rotationX: -180, duration: 0.5, ease: "power2.in", transformOrigin: "50% 0%" }, t + 0.6);
      tl.set(card, { zIndex: 0 }, t + 1.1);
    });
    return () => { tl.kill(); };
  }, [pages]);
  return (
    <div ref={ref} style={{ width: size, height: size * 1.1, position: "relative", perspective: 300 }}>
      {Array.from({ length: pages }).map((_, i) => {
        const date = 1 + i;
        return (
          <div key={i} className="cal-card" style={{ position: "absolute", inset: 0, background: T.surface, border: `1.5px solid ${i === 2 ? T.accent : T.bd}`, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: pages - i, backfaceVisibility: "hidden" }}>
            <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textMute }}>MAR</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: i === 2 ? T.accent : T.text }}>{date}</div>
          </div>
        );
      })}
    </div>
  );
}

function ConstellationInline({ stars, size = 200 }: { stars: number; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const starEls = svg.querySelectorAll(".cn-star");
    const lines = svg.querySelectorAll(".cn-line");
    starEls.forEach((star, i) => {
      tl.fromTo(star, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, i * 0.15);
    });
    lines.forEach((line, i) => {
      const len = (line as SVGLineElement).getTotalLength?.() ?? 100;
      tl.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, 0.8 + i * 0.12);
    });
    return () => { tl.kill(); };
  }, [stars]);
  const pts = Array.from({ length: stars }, (_, i) => ({ x: 25 + Math.sin(i * 7.1) * 75 + 5, y: 20 + Math.cos(i * 13.3) * 40 + 40 }));
  return (
    <svg ref={svgRef} width={size} height={size * 0.6} viewBox="0 0 200 120">
      {pts.map((p, i) => { if (i === 0) return null; return <line key={i} className="cn-line" x1={pts[i-1].x} y1={pts[i-1].y} x2={p.x} y2={p.y} stroke={T.accent} strokeWidth={1} opacity={0.35} />; })}
      {pts.map((p, i) => <g key={i} className="cn-star"><circle cx={p.x} cy={p.y} r={2.5} fill={T.accent} opacity={0.9} /></g>)}
    </svg>
  );
}

function RocketLaunchInline({ size = 180 }: { size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const rocket = svg.querySelector("#rl-rocket") as SVGGElement;
    const flame = svg.querySelector("#rl-flame") as SVGGElement;
    const nums = svg.querySelectorAll(".rl-num");
    nums.forEach((num, i) => {
      tl.fromTo(num, { scale: 2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }, i * 0.45);
      tl.to(num, { scale: 0.5, opacity: 0, duration: 0.2 }, i * 0.45 + 0.35);
    });
    tl.fromTo(flame, { scaleY: 0, opacity: 0, transformOrigin: "50% 100%" }, { scaleY: 1, opacity: 1, duration: 0.3 }, 1.6);
    tl.to(rocket, { y: -80, duration: 1.2, ease: "power3.in" }, 1.8);
    return () => { tl.kill(); };
  }, []);
  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 200 240">
      {Array.from({ length: 12 }).map((_, i) => { const cx=(10+Math.round(hash(i*17)*18000)/100).toFixed(2); const cy=(-5-Math.round(hash(i*23)*3000)/100).toFixed(2); const cr=(Math.round((0.5+hash(i*31)*1.5)*100)/100).toFixed(2); return <circle key={i} cx={cx} cy={cy} r={cr} fill={T.textMute} opacity={0.3} />; })}
      <text className="rl-num" x="100" y="100" textAnchor="middle" fontSize={42} fontWeight={800} fill={T.accent}>3</text>
      <text className="rl-num" x="100" y="100" textAnchor="middle" fontSize={42} fontWeight={800} fill={T.accent}>2</text>
      <text className="rl-num" x="100" y="100" textAnchor="middle" fontSize={42} fontWeight={800} fill={T.accent}>1</text>
      <g id="rl-rocket" transform="translate(100, 170)">
        <path d="M 0 30 L -12 50 L 0 45 L 12 50 Z" fill="none" stroke={T.accent} strokeWidth={2.5} />
        <rect x="-6" y="-30" width="12" height="60" rx="4" fill={T.accent} fillOpacity={0.15} stroke={T.accent} strokeWidth={2} />
        <circle cx="0" cy="10" r="6" fill={T.bg} stroke={T.accent} strokeWidth={1.5} />
      </g>
      <g id="rl-flame" transform="translate(100, 218)" opacity={0}>
        <path d="M -8 0 Q 0 -25 8 0 Z" fill={T.accent} opacity={0.7} />
        <path d="M -4 0 Q 0 -12 4 0 Z" fill="#fff" opacity={0.5} />
      </g>
    </svg>
  );
}

function FunnelFilterInline({ size = 220 }: { size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const gold = svg.querySelectorAll(".ffi-gold");
    gold.forEach((g, i) => {
      tl.fromTo(g, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(3)" }, 1.5 + i * 0.25);
      tl.to(g, { scale: 1.3, yoyo: true, repeat: -1, duration: 0.6 }, 2 + i * 0.25);
    });
    return () => { tl.kill(); };
  }, []);
  return <svg ref={svgRef} width={size} height={size*0.7} viewBox="0 0 300 200"><path d="M 80 40 L 40 130 L 120 130 M 220 40 L 260 130 L 180 130" fill="none" stroke={T.textMute} strokeWidth={2} opacity={0.4}/><path d="M 120 130 L 60 200 L 240 200 L 180 130" fill="none" stroke={T.textMute} strokeWidth={2} opacity={0.4}/><circle className="ffi-gold" cx="100" cy="235" r="6" fill={T.accent}/><circle className="ffi-gold" cx="150" cy="240" r="7" fill={T.accent}/><circle className="ffi-gold" cx="200" cy="235" r="5" fill={T.accent}/></svg>;
}
function DominoEffectInline({ count = 8, labels, size = 260 }: { count: number; labels?: string[]; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const pieces = svg.querySelectorAll(".dei-piece");
    const tags = svg.querySelectorAll(".dei-tag");
    const finale = svg.querySelector("#dei-finale") as SVGGElement;
    pieces.forEach((p, i) => {
      const t = i * 0.25;
      tl.to(p, { rotation: 90, duration: 0.2, ease: "power3.in", transformOrigin: `${25+(i/(count-1))*250}px 90px` }, t);
      if (tags[i]) tl.fromTo(tags[i], { opacity: 0, scale: 0, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: "back.out(2)" }, t + 0.1);
    });
    if (finale) tl.fromTo(finale, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, count * 0.25 + 0.3);
    return () => { tl.kill(); };
  }, [count, labels]);
  return <svg ref={svgRef} width={size} height={size*0.6} viewBox="0 0 300 180"><line x1="10" y1="120" x2="290" y2="120" stroke={T.textMute} strokeWidth={1} opacity={0.3}/>{Array.from({length:count},(_,i)=>{const x=25+(i/(count-1))*250;return <g key={i}><g className="dei-piece" transform={`translate(${x}, 60)`}><rect x="-6" y="-30" width="12" height="30" rx="2" fill={T.accent} opacity={0.8} stroke={T.accent} strokeWidth={1}/><circle cx="0" cy="-20" r="2" fill={T.bg}/></g>{labels&&labels[i]&&<text className="dei-tag" x={x} y="110" textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill={T.accent}>{labels[i]}</text>}</g>;})}<g id="dei-finale" transform="translate(150,155)"><rect x="-70" y="-18" width="140" height="36" rx="8" fill={T.accent} fillOpacity={0.1} stroke={T.accent} strokeWidth={1.5}/><text x="0" y="6" textAnchor="middle" fontSize={18} fontWeight={700} fill={T.accent}>{labels?.[0] ?? "核心结论"}</text></g></svg>;
}
function Storm2CalmInline({ size = 240 }: { size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const sky = svg.querySelector("#sci-sky") as SVGRectElement;
    const lightning = svg.querySelector("#sci-lightning") as SVGPathElement;
    const boat = svg.querySelector("#sci-boat") as SVGGElement;
    const light = svg.querySelector("#sci-light") as SVGCircleElement;
    tl.to(sky, { fill: "#0a0a14", duration: 1, ease: "power2.in" }, 0);
    tl.fromTo(lightning, { opacity: 1 }, { opacity: 1, duration: 0.08 }, 1);
    tl.to(lightning, { opacity: 0, duration: 0.04 }, 1.1);
    tl.fromTo(lightning, { opacity: 1 }, { opacity: 1, duration: 0.06 }, 1.2);
    tl.to(lightning, { opacity: 0, duration: 0.04 }, 1.3);
    tl.to(boat, { rotation: 8, duration: 0.3, yoyo: true, repeat: 7, transformOrigin: "150px 128px", ease: "sine.inOut" }, 1);
    tl.fromTo(light, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.7, duration: 0.8, ease: "power3.out", transformOrigin: "200px 60px" }, 1.8);
    tl.to(sky, { fill: "#1a1a2e", duration: 1, ease: "power2.out" }, 1.8);
    tl.to(boat, { rotation: 0, duration: 0.5, ease: "power2.out" }, 2.5);
    return () => { tl.kill(); };
  }, []);
  return <svg ref={svgRef} width={size} height={size*0.75} viewBox="0 0 300 200"><rect id="sci-sky" width="300" height="200" fill="#1a1a2e"/><path d="M 0 130 Q 75 125 150 130 T 300 130 L 300 200 L 0 200 Z" fill={T.accent} opacity={0.1}/><path id="sci-lightning" d="M 180 0 L 160 40 L 175 45 L 150 90 L 170 85 L 155 130" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0}/><g id="sci-boat" transform="translate(150,128)"><path d="M -20 10 L 20 10 L 12 25 L -12 25 Z" fill="none" stroke={T.accent} strokeWidth={2}/><line x1="0" y1="10" x2="0" y2="-15" stroke={T.accent} strokeWidth={1.5}/></g><circle id="sci-light" cx="200" cy="60" r="50" fill={`${T.accent}44`} opacity={0}/></svg>;
}
function HourglassInline({ size = 150 }: { size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    const upper = svg.querySelector("#hgi-upper") as SVGPathElement;
    const lower = svg.querySelector("#hgi-lower") as SVGPathElement;
    const flip = svg.querySelector("#hgi-flip") as SVGGElement;
    const upperFull = "M 80 60 Q 100 120 180 120 L 120 120 Q 100 150 80 60 Z";
    const upperEmpty = "M 80 60 Q 100 80 130 100 L 120 120 Q 100 140 80 60 Z";
    const lowerEmpty = "M 100 150 Q 100 130 120 120 L 130 140 Z";
    const lowerFull = "M 100 150 Q 120 180 200 150 L 120 120 Q 100 140 100 150 Z";
    tl.fromTo(upper, { attr: { d: upperFull } }, { attr: { d: upperEmpty }, duration: 2, ease: "power2.in" }, 0);
    tl.fromTo(lower, { attr: { d: lowerEmpty } }, { attr: { d: lowerFull }, duration: 2, ease: "power2.in" }, 0);
    tl.to(flip, { rotation: 180, duration: 0.8, ease: "power2.inOut", transformOrigin: "150px 130px" }, 2.5);
    tl.set(upper, { attr: { d: upperFull } }, 2.9);
    tl.set(lower, { attr: { d: lowerEmpty } }, 2.9);
    tl.set(flip, { rotation: 0 }, 2.9);
    return () => { tl.kill(); };
  }, []);
  return <svg ref={svgRef} width={size} height={size*1.1} viewBox="0 0 300 260"><path d="M 80 60 Q 100 120 180 120 L 120 120 Q 100 150 80 200 L 220 200 Q 200 150 180 130 L 240 120 Q 200 60 80 60 Z" fill="none" stroke={T.textMute} strokeWidth={2.5}/><line x1="70" y1="55" x2="230" y2="55" stroke={T.accent} strokeWidth={3}/><line x1="70" y1="205" x2="230" y2="205" stroke={T.accent} strokeWidth={3}/><g id="hgi-flip" style={{transformOrigin:"150px 130px"}}><path id="hgi-upper" d="M 80 60 Q 100 120 180 120 L 120 120 Q 100 150 80 60 Z" fill={T.accent} opacity={0.5}/><path id="hgi-lower" d="M 100 150 Q 100 130 120 120 L 130 140 Z" fill={T.accent} opacity={0.3}/></g></svg>;
}
function PuzzleAssemblyInline({ pieces = 9, title = "", size = 240 }: { pieces: number; title: string; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    const parts = svg.querySelectorAll(".pzi-piece");
    const finale = svg.querySelector("#pzi-finale") as SVGTextElement;
    parts.forEach((p, i) => {
      const tx = parseFloat(p.getAttribute("data-tx") ?? "0"), ty = parseFloat(p.getAttribute("data-ty") ?? "0");
      tl.fromTo(p, { x: (Math.random()-0.5)*200, y: (Math.random()-0.5)*150, opacity: 0, rotation: Math.random()*20-10 }, { x: 0, y: 0, opacity: 1, rotation: 0, duration: 0.4, ease: "power2.out" }, i * 0.12);
    });
    if (finale) tl.fromTo(finale, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, pieces * 0.12 + 0.2);
    return () => { tl.kill(); };
  }, [pieces, title]);
  const cols=3,rows=3,pw=180/cols,ph=100/rows;
  return <svg ref={svgRef} width={size} height={size*0.7} viewBox="0 0 260 160"><rect x="40" y="20" width="180" height="100" rx="6" fill={T.surface} stroke={T.bd} strokeWidth={1} strokeDasharray="4,4"/>{Array.from({length:pieces},(_,i)=>{const col=i%cols,row=Math.floor(i/cols),x=40+col*pw+pw/2,y=20+row*ph+ph/2;return <g key={i} className="pzi-piece" data-tx={x} data-ty={y} style={{transformOrigin:x+"px "+y+"px"}}><rect x={x-pw/2+2} y={y-ph/2+2} width={pw-4} height={ph-4} rx={2} fill={T.accent} opacity={0.15+(i%5)*0.08} stroke={T.accent} strokeWidth={1.2}/></g>;})}<text id="pzi-finale" x="130" y="140" textAnchor="middle" fontSize={14} fontWeight={600} fill={T.accent}>{title||"拼图完成"}</text></svg>;
}
function PaperPlaneInline({ size = 220, message = "" }: { size?: number; message: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    const paper = svg.querySelector("#ppi-paper") as SVGGElement;
    const plane = svg.querySelector("#ppi-plane") as SVGGElement;
    const hand = svg.querySelector("#ppi-hand") as SVGGElement;
    const text = svg.querySelector("#ppi-text") as SVGTextElement;
    tl.fromTo(paper, { scale: 1.3, opacity: 0.5 }, { scale: 0.1, opacity: 0, duration: 0.6, ease: "power2.in", transformOrigin: "100px 80px" }, 0);
    tl.fromTo(plane, { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)", transformOrigin: "100px 80px" }, 0.4);
    tl.to(plane, { x: 120, y: -50, rotation: 10, duration: 1, ease: "power2.out" }, 1);
    tl.fromTo(hand, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 2);
    tl.to(plane, { x: 60, y: 30, rotation: -5, scale: 0.4, duration: 0.5, ease: "power2.in" }, 2);
    tl.to(plane, { opacity: 0, duration: 0.15 }, 2.5);
    if (message) tl.fromTo(text, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 2.8);
    return () => { tl.kill(); };
  }, [message]);
  return <svg ref={svgRef} width={size} height={size*0.7} viewBox="0 0 280 180"><ellipse cx="200" cy="25" rx="35" ry="14" fill={T.textMute} opacity={0.08}/><g id="ppi-paper" transform="translate(100,80)"><rect x="-20" y="-12" width="40" height="24" rx="1" fill="#fff" fillOpacity={0.9} stroke={T.accent} strokeWidth={1.5} transform="rotate(-5)"/></g><g id="ppi-plane" transform="translate(100,80)"><path d="M 0 0 L -25 12 L -10 5 L 0 8 L 10 5 L 25 12 Z" fill="none" stroke={T.accent} strokeWidth={1.8}/></g><g id="ppi-hand" transform="translate(160,150)" opacity={0}><rect x="-15" y="-5" width="30" height="30" rx="6" fill={T.accent} fillOpacity={0.1} stroke={T.accent} strokeWidth={1.5}/>{[-10,-3,4].map(dx=><rect key={dx} x={dx} y="-18" width="5" height="14" rx="3" fill={T.accent} fillOpacity={0.15} stroke={T.accent} strokeWidth={1}/>)}<line x1="-15" y1="12" x2="-20" y2="22" stroke={T.accent} strokeWidth={4} strokeLinecap="round"/></g>{message&&<text id="ppi-text" x="140" y="170" textAnchor="middle" fontSize={14} fontWeight={600} fill={T.accent} opacity={0}>{message}</text>}</svg>;
}
function HologramRevealInline({ size = 200, shape = "cube" }: { size?: number; shape?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const base = svg.querySelector("#hri-base") as SVGEllipseElement;
    const obj = svg.querySelector("#hri-object") as SVGGElement;
    const lasers = svg.querySelectorAll(".hri-laser");
    tl.fromTo(base, { fill: `${T.accent}00` }, { fill: `${T.accent}33`, duration: 0.4 }, 0);
    lasers.forEach((l, i) => { tl.fromTo(l, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.5 + i * 0.1); });
    tl.fromTo(obj, { scale: 0, opacity: 0, transformOrigin: "140px 100px" }, { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, 1);
    tl.to(obj, { rotation: 360, duration: 8, ease: "none", repeat: -1, transformOrigin: "140px 100px" }, 1.8);
    return () => { tl.kill(); };
  }, [shape]);
  return <svg ref={svgRef} width={size} height={size*0.9} viewBox="0 0 280 220"><ellipse id="hri-base" cx="140" cy="170" rx="70" ry="10" fill={`${T.accent}22`} stroke={T.accent} strokeWidth={2}/>{[-40,-20,0,20,40].map((x,i)=><line key={i} x1={140+x} y1="170" x2={140+x} y2="40" stroke={T.accent} strokeWidth={0.5} opacity={0.15}/>)}<line className="hri-laser" x1="70" y1="170" x2="140" y2="100" stroke={T.accent} strokeWidth={1} opacity={0} strokeDasharray="4,4"/><line className="hri-laser" x1="210" y1="170" x2="140" y2="100" stroke={T.accent} strokeWidth={1} opacity={0} strokeDasharray="4,4"/><g id="hri-object" transform="translate(140,100)">{shape==="cube"?<rect x="-30" y="-30" width="60" height="60" rx="2" fill="none" stroke={T.accent} strokeWidth={2}/>:shape==="sphere"?<circle cx="0" cy="0" r="30" fill="none" stroke={T.accent} strokeWidth={2}/>:<polygon points="0,-35 35,0 0,35 -35,0" fill="none" stroke={T.accent} strokeWidth={2}/>}</g></svg>;
}
function CowCharacterInline({ action = "idle", size = 100 }: { action?: string; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
    const bodyGroup = svg.querySelector("#cci-body-group") as SVGGElement;
    // Upper arms — rotate at shoulder
    const uaL = svg.querySelector("#cci-ua-l") as SVGGElement;
    const uaR = svg.querySelector("#cci-ua-r") as SVGGElement;
    // Forearms — rotate at elbow
    const faL = svg.querySelector("#cci-fa-l") as SVGGElement;
    const faR = svg.querySelector("#cci-fa-r") as SVGGElement;
    const legL = svg.querySelector("#cci-leg-l") as SVGRectElement;
    const legR = svg.querySelector("#cci-leg-r") as SVGRectElement;
    const tail = svg.querySelector("#cci-tail") as SVGGElement;

    const shL = "68px 128px"; // left shoulder pivot
    const shR = "172px 128px"; // right shoulder pivot
    const elL = "50px 148px"; // left elbow pivot (relative to upper arm group)
    const elR = "190px 148px"; // right elbow pivot

    if (action === "walk") {
      tl.to(uaL, { rotation: -25, duration: 0.35, ease: "sine.inOut", transformOrigin: shL }, 0);
      tl.to(uaR, { rotation: 25, duration: 0.35, ease: "sine.inOut", transformOrigin: shR }, 0);
      tl.to(legR, { rotation: 18, duration: 0.35, ease: "sine.inOut", transformOrigin: "135px 195px" }, 0);
      tl.to(legL, { rotation: -18, duration: 0.35, ease: "sine.inOut", transformOrigin: "105px 195px" }, 0);
      tl.to(bodyGroup, { y: -3, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);
      tl.to(uaL, { rotation: 25, duration: 0.35, ease: "sine.inOut", transformOrigin: shL }, 0.35);
      tl.to(uaR, { rotation: -25, duration: 0.35, ease: "sine.inOut", transformOrigin: shR }, 0.35);
      tl.to(legR, { rotation: -18, duration: 0.35, ease: "sine.inOut", transformOrigin: "135px 195px" }, 0.35);
      tl.to(legL, { rotation: 18, duration: 0.35, ease: "sine.inOut", transformOrigin: "105px 195px" }, 0.35);
      tl.to(bodyGroup, { y: -3, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.35);
      tl.to(tail, { rotation: 12, duration: 0.4, yoyo: true, repeat: 1, transformOrigin: "155px 160px", ease: "sine.inOut" }, 0);
      tl.to(tail, { rotation: -8, duration: 0.4, yoyo: true, repeat: 1, transformOrigin: "155px 160px", ease: "sine.inOut" }, 0.4);
    } else if (action === "wave") {
      tl.to(uaR, { rotation: -120, duration: 0.3, ease: "power2.out", transformOrigin: shR }, 0)
        .to(faR, { rotation: -40, duration: 0.3, ease: "power2.out", transformOrigin: elR }, 0.1)
        .to(uaR, { rotation: -100, duration: 0.15, transformOrigin: shR }, 0.3)
        .to(uaR, { rotation: -120, duration: 0.15, transformOrigin: shR }, 0.45)
        .to(uaR, { rotation: 0, duration: 0.3, ease: "power2.in", transformOrigin: shR }, 0.8)
        .to(faR, { rotation: 0, duration: 0.3, ease: "power2.in", transformOrigin: elR }, 0.8);
    } else if (action === "celebrate") {
      tl.to(uaL, { rotation: -140, duration: 0.5, ease: "back.out(2)", transformOrigin: shL }, 0)
        .to(faL, { rotation: -30, duration: 0.4, ease: "back.out(2)", transformOrigin: elL }, 0.1)
        .to(uaR, { rotation: 140, duration: 0.5, ease: "back.out(2)", transformOrigin: shR }, 0)
        .to(faR, { rotation: 30, duration: 0.4, ease: "back.out(2)", transformOrigin: elR }, 0.1)
        .to(bodyGroup, { y: -8, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 7 }, 0.3);
    } else if (action === "charge") {
      tl.to(bodyGroup, { rotation: -15, duration: 0.4, ease: "power3.in", transformOrigin: "120px 140px" }, 0)
        .to(uaL, { rotation: 15, duration: 0.3, transformOrigin: shL }, 0)
        .to(uaR, { rotation: 15, duration: 0.3, transformOrigin: shR }, 0);
    } else if (action === "point") {
      tl.to(uaR, { rotation: -80, duration: 0.4, ease: "power2.out", transformOrigin: shR }, 0)
        .to(faR, { rotation: -20, duration: 0.3, ease: "power2.out", transformOrigin: elR }, 0.1);
    } else {
      // idle: body breathing + arms gently sway + tail
      tl.to(bodyGroup, { scaleY: 1.012, duration: 2, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "120px 200px" }, 0);
      tl.to(uaL, { rotation: -8, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: shL }, 0);
      tl.to(uaR, { rotation: 8, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: shR }, 0.5);
      tl.to(faL, { rotation: -5, duration: 2.5, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: elL }, 0.3);
      tl.to(faR, { rotation: 5, duration: 2.5, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: elR }, 0.8);
      tl.to(tail, { rotation: 6, duration: 2, yoyo: true, repeat: -1, transformOrigin: "155px 160px", ease: "sine.inOut" }, 0);
    }
    return () => { tl.kill(); };
  }, [action]);
  const s = size / 260; const clr = "#8B5E3C"; const sc = "#6B3F2A"; const dk = "#3A2010"; const pk = "#F4A4A0"; const hrn = "#E8D5C0";
  return (
    <svg ref={svgRef} width={size} height={size * 1.2} viewBox="0 0 260 320">
      <g transform={`scale(${s})`} style={{transformOrigin:"0px 0px"}}>
        {/* Tail */}
        <g id="cci-tail" style={{transformOrigin:"155px 160px"}}>
          <path d="M 148 150 Q 175 148 185 135 Q 192 125 188 115" fill="none" stroke={clr} strokeWidth={5} strokeLinecap="round"/>
          <ellipse cx="188" cy="112" rx="5" ry="8" fill={sc}/>
        </g>
        {/* Legs */}
        <rect id="cci-leg-l" x="80" y="195" width="26" height="48" rx="10" fill={clr}/>
        <rect id="cci-leg-r" x="132" y="195" width="26" height="48" rx="10" fill={clr}/>
        <rect x="78" y="240" width="30" height="10" rx="5" fill={dk}/>
        <rect x="130" y="240" width="30" height="10" rx="5" fill={dk}/>

        {/* BODY GROUP */}
        <g id="cci-body-group">
          <rect x="75" y="115" width="90" height="85" rx="20" fill={clr}/>
          <ellipse cx="105" cy="140" rx="14" ry="10" fill={sc} opacity={0.45}/>
          <ellipse cx="130" cy="155" rx="10" ry="12" fill={sc} opacity={0.35}/>
          <ellipse cx="95" cy="170" rx="8" ry="6" fill={sc} opacity={0.4}/>
          <ellipse cx="120" cy="125" rx="22" ry="14" fill="#F5EDE4" opacity={0.3}/>

          {/* LEFT ARM — 2 segments */}
          <g id="cci-ua-l">
            <rect x="58" y="120" width="20" height="28" rx="8" fill={clr}/>
            <g id="cci-fa-l" style={{transformOrigin:"68px 148px"}}>
              <rect x="54" y="142" width="16" height="26" rx="7" fill={clr}/>
              <rect x="52" y="164" width="20" height="9" rx="4" fill={dk}/>
            </g>
          </g>
          {/* RIGHT ARM — 2 segments */}
          <g id="cci-ua-r">
            <rect x="162" y="120" width="20" height="28" rx="8" fill={clr}/>
            <g id="cci-fa-r" style={{transformOrigin:"172px 148px"}}>
              <rect x="170" y="142" width="16" height="26" rx="7" fill={clr}/>
              <rect x="168" y="164" width="20" height="9" rx="4" fill={dk}/>
            </g>
          </g>

          {/* Head */}
          <g transform="translate(120, 92)">
            <ellipse cx="0" cy="-5" rx="36" ry="30" fill={clr}/>
            <ellipse cx="0" cy="-18" rx="18" ry="12" fill={sc} opacity={0.5}/>
            <ellipse cx="-42" cy="-22" rx="15" ry="7" fill={sc} transform="rotate(-35)"/>
            <ellipse cx="42" cy="-22" rx="15" ry="7" fill={sc} transform="rotate(35)"/>
            <ellipse cx="-42" cy="-24" rx="8" ry="3" fill={pk} transform="rotate(-35)"/>
            <ellipse cx="42" cy="-24" rx="8" ry="3" fill={pk} transform="rotate(35)"/>
            <path d="M -18 -28 Q -26 -50 -20 -58 Q -16 -52 -12 -40" fill={hrn} stroke="#C8B8A0" strokeWidth={1.5}/>
            <path d="M 18 -28 Q 26 -50 20 -58 Q 16 -52 12 -40" fill={hrn} stroke="#C8B8A0" strokeWidth={1.5}/>
            {[-8,-3,2,6].map((dx,i)=><ellipse key={i} cx={dx} cy={-32-i*2} rx={4} ry={5} fill={sc} opacity={0.6}/>)}
            <ellipse cx="-15" cy="-5" rx="9" ry="10" fill="#FFF"/><ellipse cx="15" cy="-5" rx="9" ry="10" fill="#FFF"/>
            <circle cx="-13" cy="-3" r="5" fill="#4A2810"/><circle cx="17" cy="-3" r="5" fill="#4A2810"/>
            <circle cx="-12" cy="-4" r="2.5" fill="#1A1A1A"/><circle cx="18" cy="-4" r="2.5" fill="#1A1A1A"/>
            <circle cx="-16" cy="-7" r="2" fill="#FFF"/><circle cx="14" cy="-7" r="2" fill="#FFF"/>
            <path d="M -26 -16 Q -16 -20 -6 -16" fill="none" stroke={sc} strokeWidth={2.5} strokeLinecap="round"/>
            <path d="M 26 -16 Q 16 -20 6 -16" fill="none" stroke={sc} strokeWidth={2.5} strokeLinecap="round"/>
            <ellipse cx="0" cy="11" rx="20" ry="13" fill={pk}/>
            <ellipse cx="-7" cy="13" rx="4" ry="3" fill="#D4837F"/><ellipse cx="7" cy="13" rx="4" ry="3" fill="#D4837F"/>
            <path d="M -9 17 Q 0 22 9 17" fill="none" stroke="#D4837F" strokeWidth={2} strokeLinecap="round"/>
            <ellipse cx="-18" cy="5" rx="6" ry="4" fill={pk} opacity={0.2}/><ellipse cx="18" cy="5" rx="6" ry="4" fill={pk} opacity={0.2}/>
          </g>
        </g>
      </g>
    </svg>
  );
}


// ─── Canvas Creative Inline Demos ──────────────────────────────────────────
function hash(n:number){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}

function MoonPhaseInline(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=ref.current;if(!c)return;let raf:number;const loop=(t:number)=>{const ctx=c.getContext("2d")!;const w=c.width=280, h=c.height=182;ctx.clearRect(0,0,w,h);for(let i=0;i<50;i++){const sx=hash(i*7)*w,sy=hash(i*13)*h;ctx.beginPath();ctx.arc(sx,sy,hash(i*3)*1.5+0.5,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${0.3+0.4*Math.sin(t*0.0015+hash(i)*10)})`;ctx.fill()}
const cx=w*.52,cy=h*.48,r=Math.min(w,h)*.33;const phase=(t*0.00015)%1;const grd=ctx.createRadialGradient(cx-r*.25,cy-r*.25,r*.05,cx,cy,r);grd.addColorStop(0,"#e8e8d0");grd.addColorStop(.6,"#c8c8b0");grd.addColorStop(1,"#707060");ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();const sf=phase<.5?1-phase*4:(phase-.5)*4-1;const sx2=cx+sf*r;const sgd=ctx.createRadialGradient(sx2,cy,0,sx2,cy,r*1.5);sgd.addColorStop(0,"rgba(5,5,20,0.98)");sgd.addColorStop(1,"rgba(5,5,20,0.85)");ctx.beginPath();if(phase<.5){ctx.arc(cx,cy,r,Math.PI/2,-Math.PI/2,false);ctx.ellipse(cx,cy,Math.abs(sf*r),r,0,-Math.PI/2,Math.PI/2,sf*r>0)}else{ctx.arc(cx,cy,r,-Math.PI/2,Math.PI/2,false);ctx.ellipse(cx,cy,Math.abs(-sf*r),r,0,Math.PI/2,-Math.PI/2,-sf*r>0)}ctx.closePath();ctx.fillStyle=sgd;ctx.fill();ctx.restore();[[0.3,0.4,0.06],[0.55,0.35,0.04],[0.45,0.6,0.035]].forEach(([fx,fy,fr])=>{ctx.beginPath();ctx.arc(cx+(fx-.5)*r*1.6,cy+(fy-.5)*r*1.6,fr*r,0,Math.PI*2);ctx.strokeStyle="rgba(100,100,80,0.4)";ctx.lineWidth=1;ctx.stroke()});raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)},[]);return<canvas ref={ref} width={280} height={182} style={{background:"#020210",width:280,height:182}}/>}

function FlowChartInline(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=ref.current;if(!c)return;let raf:number;const loop=(t:number)=>{const ctx=c.getContext("2d")!;const w=c.width=c.clientWidth*2, h=c.height=c.clientHeight*2;ctx.clearRect(0,0,w,h);const nodes=[{x:.15,y:.5,label:"源",sub:"10.0.0.1"},{x:.4,y:.5,label:"A",sub:"20.0.0.3"},{x:.65,y:.5,label:"B",sub:"30.0.0.8"},{x:.88,y:.5,label:"超时",sub:"TTL",error:!0}];const progress=Math.min(1,t*0.0004/2.5);nodes.forEach((n,i)=>{const x=n.x*w,y=n.y*h;if(i<Math.floor(progress*3+1)){ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fillStyle=n.error?"#ef4444":"#00ffb4";ctx.globalAlpha=.2;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=n.error?"#ef4444":"#00ffb4";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=n.error?"#ef4444":"#00ffb4";ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.fillText(n.label,x,y-15);if(n.sub){ctx.fillStyle="rgba(255,255,255,0.4)";ctx.font="9px monospace";ctx.fillText(n.sub,x,y+22)}}
if(i<3&&i<Math.floor(progress*3)){const nx=nodes[i+1].x*w,ny=nodes[i+1].y*h;ctx.strokeStyle=nodes[i+1].error?"#ef4444":"#00ffb4";ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(x+12,y);ctx.lineTo(nx-12,y);ctx.stroke();ctx.setLineDash([])}});raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)},[]);return<canvas ref={ref} style={{width:"100%",height:130,background:"#0a0a14"}}/>}

function LineDrawInline(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=ref.current;if(!c)return;let raf:number;const loop=(t:number)=>{const ctx=c.getContext("2d")!;const w=c.width=260, h=c.height=169;ctx.clearRect(0,0,w,h);const p=Math.min(1,t*0.0003/3.5);ctx.fillStyle="#00c8ff";ctx.font="bold 16px monospace";ctx.textAlign="left";ctx.fillText("ARCH",w*.04,h*.12);const boxes=[{x:.08,y:.35,bw:.18,bh:.15,l:"入口"},{x:.35,y:.25,bw:.22,bh:.15,l:"处理"},{x:.35,y:.55,bw:.22,bh:.15,l:"缓存"},{x:.68,y:.35,bw:.24,bh:.15,l:"输出"}];boxes.forEach((box,i)=>{const bp=Math.max(0,Math.min(1,(p-i*.1)/.3));if(bp<=0)return;const bx=box.x*w,by=box.y*h,bw=box.bw*w,bh=box.bh*h;ctx.globalAlpha=bp;ctx.fillStyle="#00c8ff15";ctx.strokeStyle="#00c8ff";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,[5]);ctx.fill();ctx.stroke();ctx.fillStyle="#00c8ff";ctx.font="13px monospace";ctx.textAlign="center";ctx.fillText(box.l,bx+bw/2,by+bh/2+4);ctx.globalAlpha=1});raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)},[]);return<canvas ref={ref} width={260} height={169} style={{background:"#0a0a14",width:260,height:169}}/>}

function LoadingAnimInline(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=ref.current;if(!c)return;let raf:number;const loop=(t:number)=>{const ctx=c.getContext("2d")!;const w=c.width=160, h=c.height=128;ctx.clearRect(0,0,w,h);const cx=w/2,cy=h*.55,r=Math.min(w,h)*.3;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle="#00ff8822";ctx.lineWidth=r*.18;ctx.stroke();const pct=Math.min(.67,1);const sa=-Math.PI/2,ea=sa+pct*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,sa,ea);ctx.strokeStyle="#0f8";ctx.lineWidth=r*.18;ctx.lineCap="round";ctx.stroke();const dx=cx+Math.cos(ea)*r,dy=cy+Math.sin(ea)*r;ctx.beginPath();ctx.arc(dx,dy,r*.08,0,Math.PI*2);ctx.fillStyle="#0f8";ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 18px monospace";ctx.textAlign="center";ctx.fillText("67%",cx,cy+6);ctx.fillStyle="#0f888";ctx.font="10px monospace";ctx.fillText("Loading",cx,cy+r+18);raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)},[]);return<canvas ref={ref} width={160} height={128} style={{background:"#0a0a14",width:160,height:128}}/>}

function GameSceneInline(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=ref.current;if(!c)return;let raf:number;const loop=(t:number)=>{const ctx=c.getContext("2d")!;const w=c.width=200, h=c.height=200;ctx.clearRect(0,0,w,h);const s=10, cw=w/s, ch=h/s;for(let r=0;r<s;r++)for(let co=0;co<s;co++){const x=co*cw,y=r*ch;if(hash(r*s+co)>.6){ctx.fillStyle="#0f018";ctx.fillRect(x,y,cw,ch)}ctx.strokeStyle="#0f022";ctx.lineWidth=.5;ctx.strokeRect(x,y,cw,ch)}
const pi=Math.floor(((t*0.0015)%(s*2)));const px=(pi%s)*cw+cw/2,py=(Math.floor(pi/s)%s)*ch+ch/2;ctx.beginPath();ctx.arc(px,py,cw*.3,0,Math.PI*2);ctx.fillStyle="#0f044";ctx.fill();ctx.beginPath();ctx.arc(px,py,cw*.12,0,Math.PI*2);ctx.fillStyle="#0f0";ctx.fill();for(let i=1;i<=4;i++){const tp=((t*0.0015-i*.3)%(s*2));if(tp<0)continue;const ti=Math.floor(tp);if(ti<0)continue;const tpx=(ti%s)*cw+cw/2,tpy=(Math.floor(ti/s)%s)*ch+ch/2;ctx.beginPath();ctx.arc(tpx,tpy,cw*.05,0,Math.PI*2);ctx.fillStyle="#0f0";ctx.globalAlpha=1-i*.22;ctx.fill()}ctx.globalAlpha=1;raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)},[]);return<canvas ref={ref} width={200} height={200} style={{background:"#020205",width:200,height:200}}/>}

function EditorialInline(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=ref.current;if(!c)return;let raf:number;const loop=(t:number)=>{const ctx=c.getContext("2d")!;const w=c.width=280, h=c.height=182;ctx.clearRect(0,0,w,h);for(let i=0;i<5;i++){const bh=h*.04,by=h*.15+i*h*.08;const bw=(.3+i*.15+Math.sin(t*0.0003+i)*.05)*w;ctx.fillStyle=`#ff6b35${Math.floor(8+i*4).toString(16)}`;ctx.fillRect(0,by,bw,bh)}ctx.fillStyle="#fff";ctx.font="bold 18px sans-serif";ctx.textAlign="left";ctx.fillText("BEYOND",w*.08,h*.48);ctx.fillStyle="#ff6b35";ctx.fillRect(w*.08,h*.5,w*.35,3);ctx.fillStyle="rgba(255,255,255,0.5)";ctx.font="11px monospace";ctx.fillText("Chapter IV",w*.08,h*.58);ctx.strokeStyle="#ff6b35";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.05,h*.35);ctx.lineTo(w*.03,h*.35);ctx.lineTo(w*.03,h*.55);ctx.lineTo(w*.05,h*.55);ctx.stroke();const sy=((t*0.0004)%1)*h;ctx.fillStyle="#ff6b3515";ctx.fillRect(0,sy,w,3);raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)},[]);return<canvas ref={ref} width={280} height={182} style={{background:"#0a0a12",width:280,height:182}}/>}

function VolcanoInline({ size = 220 }: { size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    const smoke = svg.querySelector("#vci-smoke") as SVGCircleElement;
    const mountain = svg.querySelector("#vci-mountain") as SVGPathElement;
    const eruption = svg.querySelector("#vci-eruption") as SVGGElement;
    const lavaGlow = svg.querySelector("#vci-lava-glow") as SVGCircleElement;
    const plants = svg.querySelectorAll(".vci-plant");
    tl.fromTo(smoke, { scale: 0.6, opacity: 0.2 }, { scale: 2.5, opacity: 0.5, duration: 1.2, ease: "power2.out", transformOrigin: "140px 65px" }, 0);
    tl.to(mountain, { y: 1, duration: 0.08, yoyo: true, repeat: 7 }, 1);
    tl.fromTo(lavaGlow, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.in", transformOrigin: "140px 80px" }, 1.2);
    tl.fromTo(eruption, { scaleY: 0, opacity: 0, transformOrigin: "140px 80px" }, { scaleY: 1, opacity: 1, duration: 0.3, ease: "power3.out" }, 2);
    plants.forEach((p, i) => { tl.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.7, duration: 0.4, ease: "back.out(2)" }, 2.8 + i * 0.2); });
    return () => { tl.kill(); };
  }, []);
  return <svg ref={svgRef} width={size} height={size*0.85} viewBox="0 0 280 240"><rect width="280" height="240" fill="#0a0a14"/><path id="vci-mountain" d="M 40 180 L 140 50 L 240 180 Z" fill="#1a1a24" stroke={T.accent} strokeWidth={1.5} opacity={0.5}/><circle id="vci-smoke" cx="140" cy="65" r="12" fill={T.textMute} opacity={0.15}/><circle id="vci-lava-glow" cx="140" cy="80" r="18" fill={T.accent} opacity={0}/><g id="vci-eruption" transform="translate(140,80)" opacity={0}><path d="M -6 0 Q 0 -50 8 0" fill={T.accent} opacity={0.7}/></g><path d="M 130 90 Q 100 120 60 170 L 80 175 Q 110 140 140 110" fill="none" stroke={T.accent} strokeWidth={4} strokeLinecap="round" opacity={0.5}/>{[[60,175],[75,178],[200,172],[220,176]].map(([x,y],i)=><g key={i} className="vci-plant" transform={`translate(${x},${y})`} opacity={0}><line x1="0" y1="0" x2="0" y2="-12" stroke="#10b981" strokeWidth={1.5}/><ellipse cx={i%2===0?-4:4} cy={-8} rx="4" ry="2" fill="#10b981" opacity={0.6}/></g>)}</svg>;
}

function HandGestureInline({ gesture, size = 80 }: { gesture: string; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
    const fingers = svg.querySelectorAll(".hg-finger");
    const thumb = svg.querySelector("#hg-thumb") as SVGLineElement;
    if (gesture === "thumbsUp") {
      fingers.forEach((f) => tl.to(f, { scaleY: 0.3, duration: 0.3, transformOrigin: "50% 100%", ease: "power2.in" }, 0));
      tl.to(thumb, { rotation: -40, duration: 0.3, transformOrigin: "80px 70px" }, 0.3);
    } else if (gesture === "counting") {
      fingers.forEach((f, i) => { tl.fromTo(f, { scaleY: 0.2 }, { scaleY: 1, duration: 0.2, transformOrigin: "50% 100%", ease: "back.out(2)" }, i * 0.3); });
    } else if (gesture === "pointing") {
      fingers.forEach((f, i) => {
        if (i === 0) tl.to(f, { scaleY: 1.1, duration: 0.3 }, 0);
        else tl.to(f, { scaleY: 0.3, duration: 0.3, transformOrigin: "50% 100%" }, 0);
      });
    } else if (gesture === "wave") {
      fingers.forEach((f, i) => { tl.to(f, { rotation: -12, duration: 0.15, yoyo: true, repeat: 7, transformOrigin: "50% 80%", delay: i * 0.08 }, 0); });
    }
    return () => { tl.kill(); };
  }, [gesture]);
  const fingerData = [{ x: 68, y: 28, h: 35 }, { x: 80, y: 26, h: 38 }, { x: 92, y: 28, h: 33 }, { x: 104, y: 32, h: 28 }];
  return (
    <svg ref={svgRef} width={size} height={size * 0.9} viewBox="0 0 160 120">
      <rect x="55" y="55" width="70" height="45" rx="10" fill={T.accent} fillOpacity={0.15} stroke={T.accent} strokeWidth={2} />
      {fingerData.map((f, i) => <rect key={i} className="hg-finger" x={f.x - 4} y={f.y} width="8" height={f.h} rx="4" fill={T.accent} fillOpacity={0.2} stroke={T.accent} strokeWidth={1.5} />)}
      <line id="hg-thumb" x1="80" y1="70" x2="55" y2="60" stroke={T.accent} strokeWidth={6} strokeLinecap="round" />
    </svg>
  );
}
