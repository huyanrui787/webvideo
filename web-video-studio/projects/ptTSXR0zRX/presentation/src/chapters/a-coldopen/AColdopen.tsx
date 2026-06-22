import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./AColdopen.css";

export default function AColdopen({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">量子力学</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">既死又活的猫</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">上帝不掷骰子</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">不是玄学，不是科幻</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">它在你手机芯片里</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-bold">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">没人真正懂量子力学</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  return null;
}