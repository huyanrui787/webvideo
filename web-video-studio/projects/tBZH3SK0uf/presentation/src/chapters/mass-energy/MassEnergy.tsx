import { MaskReveal } from "../../components/MaskReveal";
import { Counter, DataChart, DrawPath, ParticleField, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./MassEnergy.css";

export default function MassEnergy({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">E = mc²</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--c-squared" style={{ gridArea: "1/1" }}>
        <Reveal from="up" delay={0} stepTime={0.9}>
        <Counter to={9} unit={" × 10¹⁶"} duration={2} delay={0.3} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--label" style={{ gridArea: "1/2" }}>
        <Reveal from="left" delay={0.5} stepTime={0.7}>
        <TypeWriter text={"光速的平方\nc²"} speed={10} delay={0.5} cursor={false} />
        <TypeWriter text={"质量 = 浓缩的能量"} speed={8} delay={1.8} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.7}>
        <DataChart type={"bar"} data={{"labels":["1g 质量含能","广岛原子弹","燃烧1吨煤"],"values":[90,63,0.029]}} />
        <TypeWriter text={"单位：万亿焦耳"} speed={8} delay={1} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.9}>
        <ParticleField behavior={"converge"} count={250} color={"var(--accent)"} speed={0.6} />
        <TypeWriter text={"弹簧上紧发条 → 变重\n热水 → 比凉水质量大\n\n宇宙中没有「死」的质量\n一切都是冻结的能量"} speed={15} delay={0.8} cursor={false} />
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
        <DrawPath d={"M 200 800 Q 600 700 1200 400 Q 1500 200 1700 100"} strokeWidth={4} color={"var(--accent)"} duration={2} />
        <TypeWriter text={"越接近光速\n质量越大\n需要推力 → ∞\n\n光速 = 宇宙速度上限"} speed={15} delay={1.8} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  return null;
}