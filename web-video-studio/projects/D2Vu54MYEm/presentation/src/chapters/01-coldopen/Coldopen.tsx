import { Reveal, Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./coldopen.css";

/**
 * coldopen · [hook] · 5 steps
 * 藏了两个月的「太危险」模型今夜解封 + 双连发 + 迭代提速
 * bauhaus-bold：硬切、巨字、4px 黑边、蓝色 accent，无渐变无圆角
 */
export default function Coldopen({ step, stepTime }: ChapterStepProps) {
  // step 0 — 黑底大字「藏了两个月」
  if (step === 0) {
    return (
      <div className="cd-scene cd-dark scene-pad" key={step}>
        <div className="cd-center-stack">
          <Reveal from="none" stepTime={stepTime}>
            <span className="cd-kicker">ANTHROPIC · 今夜</span>
          </Reveal>
          <Reveal from="up" delay={0.15} stepTime={stepTime}>
            <h1 className="cd-mega cd-on-dark">藏了两个月</h1>
          </Reveal>
          <Reveal from="up" delay={0.45} stepTime={stepTime}>
            <p className="cd-tag cd-on-dark-mute">官方说它「太危险，不能公开」</p>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 1 — 解封单句
  if (step === 1) {
    return (
      <div className="cd-scene scene-pad" key={step}>
        <div className="cd-center-stack">
          <Reveal from="up" stepTime={stepTime}>
            <h1 className="cd-mega">
              今夜，<span className="cd-accent">解封</span>了
            </h1>
          </Reveal>
          <Reveal from="none" delay={0.4} stepTime={stepTime}>
            <span className="cd-bar" aria-hidden />
          </Reveal>
        </div>
      </div>
    );
  }

  // step 2 — 反差词「双连发」
  if (step === 2) {
    return (
      <div className="cd-scene scene-pad" key={step}>
        <div className="cd-center-stack">
          <Reveal from="none" stepTime={stepTime}>
            <span className="cd-kicker">而且是</span>
          </Reveal>
          <Reveal from="up" delay={0.15} stepTime={stepTime}>
            <h1 className="cd-mega cd-huge">双连发</h1>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 3 — 两个模型名并列
  if (step === 3) {
    return (
      <div className="cd-scene scene-pad" key={step}>
        <div className="cd-pair-wrap">
          <Reveal from="left" stepTime={stepTime}>
            <div className="cd-model-card">
              <span className="cd-model-tag">公开版 · 寓言</span>
              <span className="cd-model-name">Claude Fable 5</span>
            </div>
          </Reveal>
          <Reveal from="none" delay={0.25} stepTime={stepTime}>
            <span className="cd-plus">+</span>
          </Reveal>
          <Reveal from="right" delay={0.4} stepTime={stepTime}>
            <div className="cd-model-card cd-model-card-accent">
              <span className="cd-model-tag">完整版 · 神话</span>
              <span className="cd-model-name">Claude Mythos 5</span>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 4 — 迭代提速对比 43 天 → 11 天
  return (
    <div className="cd-scene scene-pad" key={step}>
      <div className="cd-speed-wrap">
        <Reveal from="none" stepTime={stepTime}>
          <span className="cd-kicker">迭代速度</span>
        </Reveal>
        <div className="cd-speed-row">
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <div className="cd-speed-cell">
              <span className="cd-speed-label">Opus 4.7 → 4.8</span>
              <Counter to={43} unit=" 天" className="hero-num cd-speed-num cd-num-mute" stepTime={stepTime} />
            </div>
          </Reveal>
          <Reveal from="none" delay={0.5} stepTime={stepTime}>
            <span className="cd-arrow" aria-hidden>→</span>
          </Reveal>
          <Reveal from="up" delay={0.7} stepTime={stepTime}>
            <div className="cd-speed-cell">
              <span className="cd-speed-label">4.8 → Fable 5</span>
              <Counter to={11} unit=" 天" className="hero-num cd-speed-num cd-num-accent" stepTime={stepTime} />
            </div>
          </Reveal>
        </div>
        <Reveal from="up" delay={1.0} stepTime={stepTime}>
          <p className="cd-tag">只隔 11 天，新王就来了</p>
        </Reveal>
      </div>
    </div>
  );
}
