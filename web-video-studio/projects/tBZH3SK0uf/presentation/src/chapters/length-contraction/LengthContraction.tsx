import { MaskReveal } from "../../components/MaskReveal";
import { Counter, DrawPath, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./LengthContraction.css";

export default function LengthContraction({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.7}>
        <Counter to={100} unit={" m"} duration={0.8} delay={0.2} />
        <TypeWriter text={"飞船原长 · 87% 光速"} speed={10} delay={0.6} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--before" style={{ gridArea: "1/1" }}>
        <Reveal from="right" delay={0} stepTime={0.5}>
        <TypeWriter text={"100m"} speed={6} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--arrow" style={{ gridArea: "1/2" }}>
        <DrawPath d={"M 100 540 L 540 540"} strokeWidth={4} color={"var(--text)"} duration={1.2} />
      </div>
      <div className="ch-composed-region ch-composed-region--after" style={{ gridArea: "1/3" }}>
        <Reveal from="up" delay={0.8} stepTime={0.7}>
        <Counter to={50} unit={" m"} duration={1.5} delay={0.6} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <Reveal from="right" delay={0} stepTime={0.6}>
        <TypeWriter text={"地面观察者\n飞船被压扁"} speed={8} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <Reveal from="left" delay={0.5} stepTime={0.7}>
        <TypeWriter text={"宇航员\n宇宙被压扁"} speed={8} delay={1} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">两个视角
    都是真实的</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  return null;
}