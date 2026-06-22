import { MaskReveal } from "../../components/MaskReveal";
import { Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./DCatSuperposition.css";

export default function DCatSuperposition({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">叠加态</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">观测前 · 粒子没有确定位置</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">薛定谔 1935</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">「太荒谬了，我设计个实验……」</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-compare ch-compare--vs bg-gradient-subtle">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">原子未衰变 → 猫活</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">原子衰变 → 猫死</h3>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={parseFloat("50% / 50%") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">50% / 50%</span>
        <span className="ch-data-label label-mono">随机坍缩为活或死</span>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-bold">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">没人知道为什么坍缩</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  return null;
}