import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Close.css";

export default function Close({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">你的下一个同事</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">可能就住在终端里</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--center">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.8}>
        <TypeWriter text={"$ claude\n\n"} speed={80} cursor={true} delay={0.5} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">试一次你就懂了</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">那种「指挥官」式的开发感觉</p>
    </div>
    );
  }

  return null;
}