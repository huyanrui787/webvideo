import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./BWaveParticle.css";

export default function BWaveParticle({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">牛顿：光是一束粒子</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">17世纪 · 粒子说</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">惠更斯：不，光是波</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">像水波一样会拐弯</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">托马斯·杨的双缝实验</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">1801年 · 一束光 + 两条缝</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">粒子预期</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">实际结果</h3>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">波动说 完胜</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">粒子说被封印一百年 ······</p>
    </div>
    );
  }

  return null;
}