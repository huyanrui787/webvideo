import { Reveal, Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./naming.css";

/**
 * naming · [build] · 7 steps
 * 寓言与神话同源 / 安全分类器 / 定价
 */
export default function Naming({ step, stepTime }: ChapterStepProps) {
  // step 0 — 词源并排
  if (step === 0) {
    return (
      <div className="nm-scene scene-pad" key={step}>
        <div className="nm-etymon-wrap">
          <Reveal from="left" stepTime={stepTime}>
            <div className="nm-etymon">
              <span className="nm-word-en">fabula</span>
              <span className="nm-word-src">拉丁语</span>
              <span className="nm-word-cn">寓言</span>
            </div>
          </Reveal>
          <Reveal from="none" delay={0.3} stepTime={stepTime}>
            <span className="nm-link">同源</span>
          </Reveal>
          <Reveal from="right" delay={0.45} stepTime={stepTime}>
            <div className="nm-etymon">
              <span className="nm-word-en">mythos</span>
              <span className="nm-word-src">希腊语</span>
              <span className="nm-word-cn">神话</span>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 1 — 同一个底座
  if (step === 1) {
    return (
      <div className="nm-scene scene-pad" key={step}>
        <div className="nm-center">
          <Reveal from="up" stepTime={stepTime}>
            <h1 className="nm-statement">同一个故事</h1>
          </Reveal>
          <Reveal from="up" delay={0.3} stepTime={stepTime}>
            <h1 className="nm-statement nm-accent">同一个底座</h1>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 2 — 公开版 vs 完整版命名映射
  if (step === 2) {
    return (
      <div className="nm-scene scene-pad" key={step}>
        <div className="nm-map-wrap">
          <Reveal from="left" stepTime={stepTime}>
            <div className="nm-map-row">
              <span className="nm-map-name">Fable 5</span>
              <span className="nm-map-arrow">→</span>
              <span className="nm-map-cn">公开版 · 寓言</span>
            </div>
          </Reveal>
          <Reveal from="left" delay={0.3} stepTime={stepTime}>
            <div className="nm-map-row nm-map-row-accent">
              <span className="nm-map-name">Mythos 5</span>
              <span className="nm-map-arrow">→</span>
              <span className="nm-map-cn">完整版 · 神话</span>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 3 — 跑分差距 1-3 个百分点
  if (step === 3) {
    return (
      <div className="nm-scene scene-pad" key={step}>
        <div className="nm-center">
          <Reveal from="none" stepTime={stepTime}>
            <span className="nm-kicker">两个模型的跑分</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <div className="nm-gap-line">
              <span className="nm-gap-text">差距通常只有</span>
              <Counter to={3} prefix="1–" unit="" className="hero-num nm-gap-num" stepTime={stepTime} />
              <span className="nm-gap-text">个百分点</span>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.6} stepTime={stepTime}>
            <p className="nm-sub">几乎一模一样</p>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 4 — 安全分类器降级示意
  if (step === 4) {
    return (
      <div className="nm-scene scene-pad" key={step}>
        <div className="nm-flow-wrap">
          <Reveal from="none" stepTime={stepTime}>
            <span className="nm-kicker">Fable 5 内置安全分类器</span>
          </Reveal>
          <div className="nm-flow-row">
            <Reveal from="up" delay={0.2} stepTime={stepTime}>
              <div className="nm-flow-node">网安任务请求</div>
            </Reveal>
            <Reveal from="none" delay={0.45} stepTime={stepTime}>
              <span className="nm-flow-arrow">触发降级 →</span>
            </Reveal>
            <Reveal from="up" delay={0.7} stepTime={stepTime}>
              <div className="nm-flow-node nm-flow-node-down">交给 Opus 4.8 回复</div>
            </Reveal>
          </div>
        </div>
      </div>
    );
  }

  // step 5 — 安全任务 0 分反而是好事
  if (step === 5) {
    return (
      <div className="nm-scene nm-dark scene-pad" key={step}>
        <div className="nm-center">
          <Reveal from="none" stepTime={stepTime}>
            <span className="nm-kicker nm-on-dark-accent">所有安全测试</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <Counter to={0} className="hero-num nm-zero" stepTime={stepTime} />
          </Reveal>
          <Reveal from="up" delay={0.5} stepTime={stepTime}>
            <p className="nm-sub nm-on-dark">拿 0 分，这反而是好事</p>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 6 — 定价对比
  return (
    <div className="nm-scene scene-pad" key={step}>
      <div className="nm-price-wrap">
        <Reveal from="none" stepTime={stepTime}>
          <span className="nm-kicker">定价 · 每百万 token</span>
        </Reveal>
        <div className="nm-price-row">
          <Reveal from="up" delay={0.15} stepTime={stepTime}>
            <div className="nm-price-cell">
              <span className="nm-price-label">输入</span>
              <Counter to={10} prefix="$" className="hero-num nm-price-num" stepTime={stepTime} />
            </div>
          </Reveal>
          <Reveal from="up" delay={0.35} stepTime={stepTime}>
            <div className="nm-price-cell">
              <span className="nm-price-label">输出</span>
              <Counter to={50} prefix="$" className="hero-num nm-price-num nm-num-accent" stepTime={stepTime} />
            </div>
          </Reveal>
        </div>
        <Reveal from="up" delay={0.7} stepTime={stepTime}>
          <p className="nm-sub">是 Opus 标准版两倍，只有 GPT-5.5 Pro 的六分之一</p>
        </Reveal>
      </div>
    </div>
  );
}
