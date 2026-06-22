import { Reveal, Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./partner.css";

/**
 * partner · [turn] · 6 steps
 * 不像工具，像伙伴 + Stripe 5000 万行一天迁移 + 物理研究
 * 转折拍：第一句打破前面的「跑分思维」
 */
export default function Partner({ step, stepTime }: ChapterStepProps) {
  // step 0 — 转折单句，黑场
  if (step === 0) {
    return (
      <div className="pt-scene pt-dark scene-pad" key={step}>
        <div className="pt-center">
          <Reveal from="up" stepTime={stepTime}>
            <h1 className="pt-turn">
              真正让人后背发凉的
            </h1>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={stepTime}>
            <h1 className="pt-turn pt-strike">不是这些数字</h1>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 1 — Karpathy 引用
  if (step === 1) {
    return (
      <div className="pt-scene scene-pad" key={step}>
        <div className="pt-quote-wrap">
          <Reveal from="left" stepTime={stepTime}>
            <blockquote className="pt-quote">
              这是一次配得上「大版本号」的跨越式进步。
            </blockquote>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={stepTime}>
            <span className="pt-cite">— Karpathy，刚加入 Anthropic</span>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 2 — Alex Albert「像伙伴」
  if (step === 2) {
    return (
      <div className="pt-scene scene-pad" key={step}>
        <div className="pt-quote-wrap">
          <Reveal from="left" stepTime={stepTime}>
            <blockquote className="pt-quote">
              第一个让我觉得<span className="pt-hl">不像工具，像伙伴</span>的模型。
            </blockquote>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={stepTime}>
            <span className="pt-cite">— Alex Albert，资深研究员</span>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 3 — Stripe 案例
  if (step === 3) {
    return (
      <div className="pt-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="pt-kicker">Stripe · 早期权限实测</span>
        </Reveal>
        <div className="pt-center">
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <div className="pt-loc-line">
              <Counter to={5000} unit="" className="hero-num pt-loc-num" stepTime={stepTime} />
              <span className="pt-loc-unit">万行 Ruby 代码库</span>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.6} stepTime={stepTime}>
            <p className="pt-desc">做一次全局代码迁移</p>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 4 — 时间对比反差
  if (step === 4) {
    return (
      <div className="pt-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="pt-kicker">同一项任务，时间差</span>
        </Reveal>
        <div className="pt-vs-row">
          <Reveal from="left" delay={0.2} stepTime={stepTime}>
            <div className="pt-vs-cell pt-vs-old">
              <span className="pt-vs-who">一整个团队</span>
              <span className="pt-vs-time">两个多月</span>
            </div>
          </Reveal>
          <Reveal from="none" delay={0.5} stepTime={stepTime}>
            <span className="pt-vs-arrow">→</span>
          </Reveal>
          <Reveal from="right" delay={0.7} stepTime={stepTime}>
            <div className="pt-vs-cell pt-vs-new">
              <span className="pt-vs-who">Fable 5</span>
              <span className="pt-vs-time">一天</span>
            </div>
          </Reveal>
        </div>
        <Reveal from="up" delay={1.1} stepTime={stepTime}>
          <p className="pt-desc">一天，5000 万行，整个团队都看傻了</p>
        </Reveal>
      </div>
    );
  }

  // step 5 — 物理研究
  return (
    <div className="pt-scene pt-dark scene-pad" key={step}>
      <Reveal from="none" stepTime={stepTime}>
        <span className="pt-kicker pt-kicker-light">前沿物理研究任务</span>
      </Reveal>
      <div className="pt-phys-row">
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <div className="pt-phys-cell">
            <Counter to={3} prefix="1/" unit="" className="hero-num pt-phys-num" stepTime={stepTime} />
            <span className="pt-phys-label">GPT-5.5 的推理 token</span>
          </div>
        </Reveal>
        <Reveal from="up" delay={0.5} stepTime={stepTime}>
          <div className="pt-phys-cell">
            <div className="pt-phys-time">
              <Counter to={36} unit="h" className="hero-num pt-phys-num" stepTime={stepTime} />
              <span className="pt-phys-vs">vs 对手 4 天</span>
            </div>
            <span className="pt-phys-label">跑到同样的位置</span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
