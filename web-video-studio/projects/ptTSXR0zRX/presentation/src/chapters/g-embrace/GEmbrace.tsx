import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./GEmbrace.css";

export default function GEmbrace({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">冰是水的表象</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">经典世界是量子现实的特殊形态</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-subtle">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">不确定性不是bug，是宇宙给你的自由</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-bold">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">我们不仅是在观测宇宙，我们是在创造宇宙</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">经典世界</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">量子世界</h3>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">拥抱不确定</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">这就是量子力学给你最好的礼物</p>
    </div>
    );
  }

  return null;
}