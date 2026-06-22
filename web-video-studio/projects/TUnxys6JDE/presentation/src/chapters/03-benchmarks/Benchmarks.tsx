import type { ChapterStepProps } from "../../registry/types";
import "./Benchmarks.css";

/**
 * Chapter 3 · benchmarks — [data]
 * SWE-Bench Pro bars + code-quality 5x gap. Bars grow, counters roll.
 */

interface Bar {
  name: string;
  value: number;
  note: string;
  lead?: boolean;
}

const SWE: Bar[] = [
  { name: "Fable 5", value: 80.3, note: "今夜", lead: true },
  { name: "Opus 4.8", value: 69.2, note: "11天前" },
  { name: "GPT-5.5", value: 58.6, note: "" },
  { name: "Gemini 3.1 Pro", value: 54.2, note: "" },
];

export default function Benchmarks({ step }: ChapterStepProps) {
  return (
    <div className="bm-root">
      <div className="bm-mark mono">
        <span>BENCHMARKS</span>
        <span className="bm-mark-sep">/</span>
        <span>AGENT&nbsp;CODING</span>
      </div>

      {/* step 0 — 榜单铺垫 */}
      {step === 0 && (
        <div className="bm-scene bm-intro">
          <div className="bm-kicker mono">THE&nbsp;TOUGHEST&nbsp;LEADERBOARD</div>
          <h1 className="bm-intro-title serif-cn">SWE-Bench Pro</h1>
          <p className="bm-intro-sub serif-cn">最卷的智能体编程榜</p>
        </div>
      )}

      {/* step 1~3 — 柱状图逐步入场 */}
      {step >= 1 && step <= 3 && (
        <div className="bm-scene bm-chart-scene">
          <div className="bm-chart-head display-en">SWE-BENCH&nbsp;PRO</div>
          <div className="bm-chart">
            {SWE.map((b, i) => {
              // step1: 仅 Fable; step2: + Opus + GPT-5.5; step3: 全部
              const visibleCount = step === 1 ? 1 : step === 2 ? 3 : 4;
              const shown = i < visibleCount;
              return (
                <div className={`bm-bar-row ${shown ? "in" : ""}`} key={b.name}>
                  <div className="bm-bar-label mono">
                    {b.name}
                    {b.note && <span className="bm-bar-note">{b.note}</span>}
                  </div>
                  <div className="bm-bar-track">
                    <div
                      className={`bm-bar-fill ${b.lead ? "lead" : ""}`}
                      style={{ width: shown ? `${b.value}%` : "0%" }}
                    />
                    <span className={`bm-bar-val hero-num ${shown ? "in" : ""}`}>
                      {b.value.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {step === 3 && (
            <div className="bm-overthrow serif-cn">
              新王坐稳 <span className="bm-accent">11 天</span>，被自家新模型踹翻
            </div>
          )}
        </div>
      )}

      {/* step 4 — 代码质量榜五倍差距 */}
      {step === 4 && (
        <div className="bm-scene bm-quality">
          <div className="bm-kicker mono">FRONTIERCODE&nbsp;DIAMOND&nbsp;·&nbsp;代码质量</div>
          <div className="bm-q-row">
            <div className="bm-q-col">
              <div className="bm-q-num hero-num bm-accent">29.3</div>
              <div className="bm-q-name mono">Fable 5</div>
            </div>
            <div className="bm-q-vs display-en">5×</div>
            <div className="bm-q-col">
              <div className="bm-q-num hero-num bm-faint">5.7</div>
              <div className="bm-q-name mono">GPT-5.5</div>
            </div>
          </div>
          <div className="bm-q-foot serif-cn">中等算力就到顶，随便想想就是第一</div>
        </div>
      )}
    </div>
  );
}
