import { MaskReveal } from "../../components/MaskReveal";
import { DrawPath, ParticleField, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Closing.css";

export default function Closing({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--line1">
        <Reveal from="up" delay={0} stepTime={0.5}>
        <TypeWriter text={"光速不变"} speed={10} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--line2">
        <Reveal from="up" delay={0.4} stepTime={0.5}>
        <TypeWriter text={"时间膨胀"} speed={10} delay={0.4} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--line3">
        <Reveal from="up" delay={0.8} stepTime={0.5}>
        <TypeWriter text={"长度收缩"} speed={10} delay={0.8} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--line4">
        <Reveal from="up" delay={1.2} stepTime={0.5}>
        <TypeWriter text={"E=mc²"} speed={10} delay={1.2} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--line5">
        <Reveal from="up" delay={1.6} stepTime={0.5}>
        <TypeWriter text={"时空弯曲"} speed={10} delay={1.6} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.9}>
        <ParticleField behavior={"converge"} count={300} color={"var(--accent)"} speed={0.5} />
        <TypeWriter text={"每一步推导\n建立在逻辑与实验之上"} speed={12} delay={0.5} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.8}>
        <DrawPath d={"M 100 800 Q 500 600 960 400 Q 1400 200 1820 100"} strokeWidth={3} color={"var(--accent)"} duration={2.5} />
        <TypeWriter text={"星光走来的路径\n因山河星系而弯曲"} speed={12} delay={2} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-bold">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">常识
    只是
    低速偏见</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  return null;
}