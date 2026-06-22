import type { ChapterStepProps } from "../../registry/types";
import "./Twins.css";

/**
 * Chapter 2 · twins — [build]
 * Fable(寓言) vs Mythos(神话): same base, one difference = safety classifier.
 */
export default function Twins({ step }: ChapterStepProps) {
  return (
    <div className="tw-root">
      <div className="tw-mark mono">
        <span>DOUBLE&nbsp;RELEASE</span>
        <span className="tw-mark-sep">/</span>
        <span>2025</span>
      </div>

      {/* step 0 — 双连发标题 */}
      {step === 0 && (
        <div className="tw-scene tw-center">
          <div className="tw-kicker mono">TONIGHT</div>
          <h1 className="tw-title serif-cn">Anthropic 双连发</h1>
          <div className="tw-names display-en">
            <span className="tw-name-a">FABLE&nbsp;5</span>
            <span className="tw-plus">+</span>
            <span className="tw-name-b">MYTHOS&nbsp;5</span>
          </div>
        </div>
      )}

      {/* step 1~3 — 双卡对照 + 词源 + 分层 */}
      {step >= 1 && step <= 3 && (
        <div className="tw-scene tw-cards-scene">
          <div className="tw-cards">
            <div className="tw-card card">
              <div className="tw-card-en display-en">FABLE&nbsp;5</div>
              <div className={`tw-card-etym mono ${step >= 2 ? "in" : ""}`}>
                拉丁语 · fabula
              </div>
              <div className={`tw-card-cn serif-cn ${step >= 1 ? "in" : ""}`}>寓言</div>
              <div className={`tw-card-tag ${step >= 3 ? "in" : ""}`}>公开版</div>
            </div>
            <div className="tw-card card tw-card-dark">
              <div className="tw-card-en display-en">MYTHOS&nbsp;5</div>
              <div className={`tw-card-etym mono ${step >= 2 ? "in" : ""}`}>
                希腊语 · mythos
              </div>
              <div className={`tw-card-cn serif-cn ${step >= 1 ? "in" : ""}`}>神话</div>
              <div className={`tw-card-tag ${step >= 3 ? "in" : ""}`}>完整版</div>
            </div>
          </div>
          <div className={`tw-base mono ${step >= 2 ? "in" : ""}`}>
            同一个故事 · 同一个底座
          </div>
        </div>
      )}

      {/* step 4 — 跑分差距仅 1~3% */}
      {step === 4 && (
        <div className="tw-scene tw-center">
          <div className="tw-kicker mono">BENCHMARK&nbsp;GAP</div>
          <div className="tw-gap-row">
            <span className="tw-gap-num hero-num">1–3<span className="tw-gap-pct">%</span></span>
          </div>
          <h2 className="tw-gap-cap serif-cn">两版跑分几乎一模一样</h2>
        </div>
      )}

      {/* step 5 — 唯一区别：安全分类器 */}
      {step === 5 && (
        <div className="tw-scene tw-center">
          <div className="tw-kicker mono">THE&nbsp;ONLY&nbsp;DIFFERENCE</div>
          <h1 className="tw-diff serif-cn">
            唯一区别<span className="tw-accent">：安全分类器</span>
          </h1>
          <div className="tw-flow">
            <span className="tw-flow-node">触发网安任务</span>
            <span className="tw-flow-arrow display-en">→</span>
            <span className="tw-flow-node tw-flow-down">降级 Opus 4.8</span>
          </div>
        </div>
      )}
    </div>
  );
}
