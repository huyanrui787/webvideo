import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Closing.css";

export default function Closing({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">程序员会失业吗？</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">短期内，不会</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">没有 Codex</h3>
        <p className="ch-compare-body">自己走路</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">有了 Codex</h3>
        <p className="ch-compare-body">跑更快，跳更高
    但方向你说了算</p>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">核心价值上移</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">样板代码 → AI / 架构设计 → 你</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-steps ch-steps--numbered">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">你的主战场</h3>
              <p className="ch-step-text">需求分析 · 系统架构 · 复杂调试 · 价值判断</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">计算器 → 数学家</h3>
        <p className="ch-compare-body">没失业，更专注于抽象理论</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">Codex → 程序员</h3>
        <p className="ch-compare-body">没失业，角色向上迁移</p>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">编程民主化</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">有好点子的人都能快速做原型</p>
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-quote ch-quote--centered">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">把复杂模糊的现实问题，拆成AI能执行的明确指令——这才是未来最稀缺的能力。</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 7) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">指挥家</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">不再是敲字工</p>
    </div>
    );
  }

  else if (step === 8) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">把探索和定义留给自己</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">把枯燥和重复留给 AI</p>
    </div>
    );
  }

  return null;
}