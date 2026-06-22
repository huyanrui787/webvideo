import { MaskReveal } from "../../components/MaskReveal";
import { DrawPath, ParticleField, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./SpacetimeCurve.css";

export default function SpacetimeCurve({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <Reveal from="right" delay={0} stepTime={0.6}>
        <TypeWriter text={"电梯加速上升\n感到重力\n脚贴地面"} speed={10} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <Reveal from="left" delay={0.5} stepTime={0.7}>
        <TypeWriter text={"站在地球表面\n感到重力\n脚贴地面"} speed={10} delay={1} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <div className="kicker">等效原理</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">引力 = 加速度</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.8}>
        <DrawPath d={"M 100 540 Q 480 900 960 600 Q 1440 300 1820 540"} strokeWidth={3} color={"var(--accent)"} duration={2} />
        <TypeWriter text={"时空弯曲\n质量压弯了周围的时空\n小球沿曲面自由滑落"} speed={15} delay={2} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.7}>
        <ParticleField behavior={"orbit"} count={150} color={"var(--accent)"} speed={0.8} />
        <TypeWriter text={"地球弯曲时空\n你在测地线上\n未来指向地面"} speed={12} delay={0.6} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.8}>
        <DrawPath d={"M 100 300 Q 500 100 960 400 Q 1400 700 1820 500"} strokeWidth={3} color={"var(--accent)"} duration={2.5} />
        <TypeWriter text={"光线经过大质量天体\n路径偏折\n引力透镜"} speed={12} delay={2} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  return null;
}