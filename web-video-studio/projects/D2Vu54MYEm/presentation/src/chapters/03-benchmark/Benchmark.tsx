import { Reveal, Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./benchmark.css";

const DOMAINS = ["软件工程", "知识工作", "视觉", "科研", "长上下文"];

/** SWE-Bench Pro 三方对比柱 */
function SweBars({ stepTime, highlightGap }: { stepTime?: number; highlightGap?: boolean }) {
  const rows = [
    { name: "Fable 5", val: 80.3, accent: true },
    { name: "Opus 4.8", val: 69.2, accent: false },
    { name: "GPT-5.5", val: 58.6, accent: false },
    { name: "Gemini 3.1 Pro", val: 54.2, accent: false },
  ];
  return (
    <div className="bm-bars">
      {rows.map((r, i) => (
        <Reveal key={r.name} from="left" delay={0.15 + i * 0.18} stepTime={stepTime}>
          <div className="bm-bar-row">
            <span className="bm-bar-name">{r.name}</span>
            <div className="bm-bar-track">
              <div
                className={`bm-bar-fill ${r.accent ? "bm-bar-fill-accent" : ""}`}
                style={{ width: `${r.val}%` }}
              />
            </div>
            <span className={`bm-bar-val ${r.accent ? "bm-val-accent" : ""}`}>
              {r.val.toFixed(1)}
            </span>
          </div>
        </Reveal>
      ))}
      {highlightGap && (
        <Reveal from="up" delay={1.0} stepTime={stepTime}>
          <p className="bm-gap-note">
            Fable 5 比 GPT-5.5 高出 <span className="bm-accent">21.7</span> 个百分点
          </p>
        </Reveal>
      )}
    </div>
  );
}

export default function Benchmark({ step, stepTime }: ChapterStepProps) {
  // step 0 — 五大领域全第一
  if (step === 0) {
    return (
      <div className="bm-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="bm-kicker">几乎所有 benchmark</span>
        </Reveal>
        <div className="bm-domain-grid">
          {DOMAINS.map((d, i) => (
            <Reveal key={d} from="up" delay={0.15 + i * 0.12} stepTime={stepTime}>
              <div className="bm-domain-cell">
                <span className="bm-domain-name">{d}</span>
                <span className="bm-domain-rank">第 1</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    );
  }

  // step 1 — SWE-Bench Pro 标题 + Fable 数字
  if (step === 1) {
    return (
      <div className="bm-scene scene-pad" key={step}>
        <div className="bm-center">
          <Reveal from="none" stepTime={stepTime}>
            <span className="bm-kicker">SWE-Bench Pro · 真实编程能力核心榜</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <div className="bm-hero-line">
              <span className="bm-hero-label">Fable 5</span>
              <Counter to={80.3} unit="%" decimals={1} className="hero-num bm-hero-num" stepTime={stepTime} />
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 2 — 三方柱状对比
  if (step === 2) {
    return (
      <div className="bm-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="bm-kicker">SWE-Bench Pro 对比</span>
        </Reveal>
        <SweBars stepTime={stepTime} />
      </div>
    );
  }

  // step 3 — 高出 21.7 + 11 天踹翻王座
  if (step === 3) {
    return (
      <div className="bm-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="bm-kicker">SWE-Bench Pro 对比</span>
        </Reveal>
        <SweBars stepTime={stepTime} highlightGap />
        <Reveal from="up" delay={1.3} stepTime={stepTime}>
          <p className="bm-punch">上代王者坐了 11 天王座，被自家新模型一脚踹翻</p>
        </Reveal>
      </div>
    );
  }

  // step 4 — FrontierCode Diamond 对比
  if (step === 4) {
    return (
      <div className="bm-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="bm-kicker">FrontierCode Diamond · Agent 代码质量</span>
        </Reveal>
        <div className="bm-fc-row">
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <div className="bm-fc-cell bm-fc-cell-accent">
              <span className="bm-fc-name">Fable 5</span>
              <Counter to={29.3} unit="%" decimals={1} className="hero-num bm-fc-num" stepTime={stepTime} />
            </div>
          </Reveal>
          <Reveal from="none" delay={0.5} stepTime={stepTime}>
            <span className="bm-vs">VS</span>
          </Reveal>
          <Reveal from="up" delay={0.7} stepTime={stepTime}>
            <div className="bm-fc-cell">
              <span className="bm-fc-name">GPT-5.5</span>
              <Counter to={5.7} unit="%" decimals={1} className="hero-num bm-fc-num bm-num-mute" stepTime={stepTime} />
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 5 — 五倍差距收束
  return (
    <div className="bm-scene bm-dark scene-pad" key={step}>
      <div className="bm-center bm-center-mid">
        <Reveal from="up" stepTime={stepTime}>
          <div className="bm-five-line">
            <Counter to={5} unit="" className="hero-num bm-five-num" stepTime={stepTime} />
            <span className="bm-five-text">倍差距</span>
          </div>
        </Reveal>
        <Reveal from="up" delay={0.4} stepTime={stepTime}>
          <p className="bm-sub-light">而且 Fable 5 在中等算力档就到顶了</p>
        </Reveal>
      </div>
    </div>
  );
}
