import { Counter, DrawPath, ParticleField, Reveal, TypeWriter, WaveForm } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./TimeDilation.css";

export default function TimeDilation({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.8}>
        <WaveForm variant={"pulse"} cycles={3} amplitude={0.08} color={"var(--accent)"} />
        <TypeWriter text={"光钟\n光子镜间弹跳\n一次往返 = 一滴答"} speed={12} delay={0.6} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <Reveal from="right" delay={0} stepTime={0.6}>
        <DrawPath d={"M 480 300 L 480 800"} strokeWidth={3} color={"var(--accent)"} duration={0.8} />
        <TypeWriter text={"静止光钟\n竖直弹跳"} speed={8} delay={0.6} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <Reveal from="left" delay={0.4} stepTime={0.7}>
        <DrawPath d={"M 300 300 L 450 550 L 300 800 L 450 550 L 300 300"} strokeWidth={3} color={"var(--accent)"} duration={1} />
        <TypeWriter text={"飞船上\n走出锯齿斜线"} speed={8} delay={0.8} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--ground-clock" style={{ gridArea: "1/1" }}>
        <Reveal from="up" delay={0} stepTime={0.7}>
        <Counter to={10} unit={" 秒"} duration={1.5} delay={0.2} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--ship-clock" style={{ gridArea: "1/2" }}>
        <Reveal from="up" delay={0.5} stepTime={0.7}>
        <Counter to={6} unit={" 秒"} duration={1.5} delay={0.2} />
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
        <TypeWriter text={"心跳 · 细胞衰老 · 原子振动\n全部变慢"} speed={15} cursor={false} />
        <TypeWriter text={"近光速旅行\n地球已过数年\n你只老了几岁"} speed={12} delay={1.5} cursor={false} />
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
        <ParticleField behavior={"flow"} count={200} color={"var(--accent)"} speed={0.7} />
        <TypeWriter text={"粒子加速器\n原子钟飞机实验\n全验证了"} speed={12} delay={0.5} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  return null;
}