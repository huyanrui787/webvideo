import { MaskReveal } from "../../components/MaskReveal";
import { Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./FQuantumApps.css";

export default function FQuantumApps({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={parseFloat("晶体管") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">晶体管</span>
        <span className="ch-data-label label-mono">能带理论 ← 量子力学</span>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">没有量子力学</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">就没有整个信息时代</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">量子力学在你身边</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">LED灯 · 核磁共振 · 激光</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={parseFloat("亿年 → 几小时") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">亿年 → 几小时</span>
        <span className="ch-data-label label-mono">RSA密码破译 · 指数级并行</span>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">量子计算的应用前景</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">药物研发 · 材料设计 · 气候模拟</p>
    </div>
    );
  }

  return null;
}