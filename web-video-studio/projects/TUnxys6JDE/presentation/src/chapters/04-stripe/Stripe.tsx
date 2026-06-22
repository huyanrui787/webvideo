import type { ChapterStepProps } from "../../registry/types";
import "./Stripe.css";

/**
 * Chapter 4 · stripe — [turn]
 * 真正吓人的不是数字 → Stripe 5000万行一天迁移 → 物理研究 36h vs 4天
 */
export default function Stripe({ step }: ChapterStepProps) {
  const isTurn = step === 0;
  return (
    <div className="st-root">
      {!isTurn && (
        <div className="st-mark mono">
          <span>EARLY&nbsp;ACCESS</span>
          <span className="st-mark-sep">/</span>
          <span>REAL&nbsp;WORK</span>
        </div>
      )}

      {/* step 0 — 转折：画面反转黑底 */}
      {step === 0 && (
        <div className="st-scene st-center st-turn">
          <h1 className="st-turn-line serif-cn">
            真正吓人的，<br />
            <span className="st-strike">不是这些数字</span>
            <br />
            <span className="st-big">是它干的活</span>
          </h1>
        </div>
      )}

      {/* step 1 — Stripe 5000万行规模 */}
      {step === 1 && (
        <div className="st-scene st-center">
          <div className="st-kicker mono">STRIPE&nbsp;·&nbsp;全局代码迁移</div>
          <div className="st-stripe-num hero-num">
            5000<span className="st-stripe-unit serif-cn">万行</span>
          </div>
          <div className="st-stripe-cap serif-cn">Ruby 代码库，一次全局迁移</div>
          <div className="st-stripe-tag mono">这种级别，通常是整个团队的活</div>
        </div>
      )}

      {/* step 2 — 时间对比 团队两个月 vs Fable 一天 */}
      {step === 2 && (
        <div className="st-scene st-cmp-scene">
          <div className="st-kicker mono">同样的活 · 两个时间</div>
          <div className="st-cmp-row">
            <div className="st-cmp-col st-cmp-old">
              <div className="st-cmp-who mono">整个团队</div>
              <div className="st-cmp-time serif-cn">两个多月</div>
              <div className="st-cmp-foot mono">正常情况下的工期</div>
            </div>
            <div className="st-cmp-col st-cmp-new">
              <div className="st-cmp-who mono">Fable 5</div>
              <div className="st-cmp-time serif-cn">一天</div>
              <div className="st-cmp-foot mono">实测完成</div>
            </div>
          </div>
        </div>
      )}

      {/* step 3 — 冲击大字 */}
      {step === 3 && (
        <div className="st-scene st-center">
          <h1 className="st-turn-line serif-cn" style={{ color: "var(--text)" }}>
            一天 · <span className="st-accent">五千万行</span>
          </h1>
          <div className="st-shock serif-cn">整个团队都看傻了</div>
        </div>
      )}

      {/* step 4 — 物理研究 1/3 算力 36h vs 4天 */}
      {step === 4 && (
        <div className="st-scene st-phys">
          <div className="st-kicker mono">FRONTIER&nbsp;PHYSICS&nbsp;·&nbsp;前沿物理研究</div>
          <div className="st-phys-grid">
            <div className="st-phys-stat">
              <div className="st-phys-big hero-num">1/3</div>
              <div className="st-phys-lbl mono">推理算力消耗</div>
            </div>
            <div className="st-phys-stat">
              <div className="st-phys-small hero-num">
                36<span style={{ fontSize: "0.5em" }}>h</span>
              </div>
              <div className="st-phys-lbl mono">到达对手位置</div>
            </div>
          </div>
          <div className="st-phys-vs serif-cn">
            而 GPT-5.5 花了 <span className="st-accent">整整四天</span>
          </div>
        </div>
      )}
    </div>
  );
}
