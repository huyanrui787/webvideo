import { MaskReveal } from "../../components/MaskReveal";
import { Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./CElectronShock.css";

export default function CElectronShock({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={parseFloat("光子") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">光子</span>
        <span className="ch-data-label label-mono">光 = 粒子 · 光电效应</span>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">波粒二象性</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">光 —— 既是波，也是粒子</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">克劳斯·约恩松 1961</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">用电子做双缝实验 · 一个一个发射</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={parseFloat("自己干涉自己") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">自己干涉自己</span>
        <span className="ch-data-label label-mono">电子同时穿过两条缝</span>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-compare ch-compare--vs bg-gradient-subtle">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">不观测</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">装上探测器</h3>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">它知道你在偷看</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">观测改变现实 —— 叠加态</p>
    </div>
    );
  }

  return null;
}