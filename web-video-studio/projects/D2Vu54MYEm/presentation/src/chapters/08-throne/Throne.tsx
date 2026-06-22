import { Reveal, Counter, DrawPath } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./throne.css";

export default function Throne({ step, stepTime }: ChapterStepProps) {
  // step 0 — 蒸馏防护 + 0.03%
  if (step === 0) {
    return (
      <div className="th-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="th-kicker">蒸馏防护</span>
        </Reveal>
        <div className="th-center">
          <Reveal from="up" delay={0.15} stepTime={stepTime}>
            <h2 className="th-line">碰到蒸馏请求，它不通知你</h2>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={stepTime}>
            <h2 className="th-line th-accent">直接偷偷限制能力</h2>
          </Reveal>
          <Reveal from="up" delay={0.7} stepTime={stepTime}>
            <div className="th-pct-line">
              <span className="th-pct-text">约</span>
              <Counter to={0.03} unit="%" decimals={2} className="hero-num th-pct-num" stepTime={stepTime} />
              <span className="th-pct-text">的流量会受影响</span>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 1 — 王座尾灯，只剩两个
  if (step === 1) {
    return (
      <div className="th-scene th-dark scene-pad" key={step}>
        <div className="th-center th-center-mid">
          <Reveal from="none" stepTime={stepTime}>
            <span className="th-kicker">GPT-5.5 发布才一个半月</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <div className="th-tail-line">
              <span className="th-tail-text">能看到 Fable 5 尾灯的，只剩</span>
              <Counter to={2} unit="个" className="hero-num th-tail-num" stepTime={stepTime} />
            </div>
          </Reveal>
          <Reveal from="up" delay={0.5} stepTime={stepTime}>
            <p className="th-sub-light">往下，全是单方面屠杀</p>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 2 — 命名哲学
  if (step === 2) {
    return (
      <div className="th-scene scene-pad" key={step}>
        <div className="th-name-wrap">
          <Reveal from="left" stepTime={stepTime}>
            <div className="th-name-row">
              <span className="th-name-en">Mythos</span>
              <span className="th-name-cn">文明解释命运的神圣叙事</span>
            </div>
          </Reveal>
          <Reveal from="left" delay={0.3} stepTime={stepTime}>
            <div className="th-name-row">
              <span className="th-name-en">Fable</span>
              <span className="th-name-cn">人类最古老的道德教化</span>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 3 — 理性对神话的胜利反转
  if (step === 3) {
    return (
      <div className="th-scene th-dark scene-pad" key={step}>
        <div className="th-center">
          <Reveal from="none" stepTime={stepTime}>
            <span className="th-kicker">古希腊哲学的诞生</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h1 className="th-hero">理性，曾战胜神话</h1>
          </Reveal>
          <Reveal from="up" delay={0.55} stepTime={stepTime}>
            <p className="th-sub-light">而今天，机器征服理性的速度，我们都看到了</p>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 4 — 悬念收尾
  return (
    <div className="th-scene scene-pad" key={step}>
      <div className="th-center">
        <Reveal from="up" stepTime={stepTime}>
          <h1 className="th-final">
            意义的制造，善恶的判断
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.4} stepTime={stepTime}>
          <h1 className="th-final th-accent">还能不能留在人类手里？</h1>
        </Reveal>
        <svg className="th-final-line-svg" viewBox="0 0 1300 40" preserveAspectRatio="none">
          <DrawPath
            d="M 8 24 L 1292 24"
            color="var(--accent)"
            strokeWidth={12}
            duration={1.2}
            delay={1.0}
            stepTime={stepTime}
          />
        </svg>
      </div>
    </div>
  );
}
