import { MaskReveal } from "../../components/MaskReveal";
import { Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./EUncertaintyEntanglement.css";

export default function EUncertaintyEntanglement({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">不确定性原理</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">不是测量误差 · 是宇宙底层代码</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={parseFloat("此消彼长") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">此消彼长</span>
        <span className="ch-data-label label-mono">永不同时为100%精确</span>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">生活里的不确定性</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">定义此刻 → 失去方向</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-compare ch-compare--vs bg-gradient-subtle">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">粒子 A · 地球</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">粒子 B · 银河系远端</h3>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-data ch-data--single-stat bg-gradient-bold">
      <div className="ch-data-primary">
        <Counter to={parseFloat("实验验证") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">实验验证</span>
        <span className="ch-data-label label-mono">量子纠缠 —— 真实存在</span>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">量子纠缠已投入应用</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">密钥分发 · 隐形传态 · 不可破解通信</p>
    </div>
    );
  }

  return null;
}