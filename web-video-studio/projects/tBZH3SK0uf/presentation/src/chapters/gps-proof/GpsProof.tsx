import { MaskReveal } from "../../components/MaskReveal";
import { Counter, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./GpsProof.css";

export default function GpsProof({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.7}>
        <Counter to={20000} unit={" km"} duration={1.2} delay={0.3} />
        <TypeWriter text={"GPS 卫星轨道高度"} speed={8} delay={0.5} cursor={false} />
        <TypeWriter text={"速度 3.9 km/s"} speed={8} delay={1} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--sr" style={{ gridArea: "1/1" }}>
        <Reveal from="right" delay={0} stepTime={0.6}>
        <Counter to={-7} unit={" μs/天"} duration={1.5} delay={0.3} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--gr" style={{ gridArea: "1/2" }}>
        <Reveal from="up" delay={0.3} stepTime={0.6}>
        <Counter to={45} unit={" μs/天"} duration={1.5} delay={0.5} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--net" style={{ gridArea: "1/3" }}>
        <Reveal from="up" delay={0.8} stepTime={0.8}>
        <Counter to={38} unit={" μs/天"} duration={1.5} delay={1} />
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
        <Counter to={10} unit={" km/天"} duration={2} delay={0.3} />
        <TypeWriter text={"不校准 → 误差每天累积\n1天 = 偏离 10 公里以上\n导航彻底失效"} speed={15} delay={1.5} cursor={false} />
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
          <span className="serif-cn">感谢爱因斯坦</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">相对论在你口袋里</p>
    </div>
    );
  }

  return null;
}