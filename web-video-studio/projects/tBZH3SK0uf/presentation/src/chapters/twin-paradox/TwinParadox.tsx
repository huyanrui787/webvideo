import { MaskReveal } from "../../components/MaskReveal";
import { DrawPath, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./TwinParadox.css";

export default function TwinParadox({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <Reveal from="right" delay={0} stepTime={0.6}>
        <TypeWriter text={"哥哥\n登上飞船\n星际旅行"} speed={10} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <Reveal from="left" delay={0.5} stepTime={0.7}>
        <TypeWriter text={"弟弟\n留在地球\n等待归来"} speed={10} delay={0.8} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.8}>
        <DrawPath d={"M 300 200 Q 960 900 1620 200"} strokeWidth={4} color={"var(--accent)"} duration={2} />
        <DrawPath d={"M 300 300 L 1620 300"} strokeWidth={2} color={"var(--text-mute)"} duration={1} delay={0.3} />
        <TypeWriter text={"哥哥世界线（弯曲）\n弟弟世界线（直线）\n\n路径不对称 → 哥哥原时更短"} speed={15} delay={2} cursor={false} />
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
        <TypeWriter text={"哥哥\n面容年轻\n原时更短"} speed={10} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <Reveal from="left" delay={0.5} stepTime={0.7}>
        <TypeWriter text={"弟弟\n头发花白\n时光流逝"} speed={10} delay={1} cursor={false} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-subtle">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">Hafele-Keating 实验
    原子钟坐飞机回来
    确实比地面钟慢
    
    向未来旅行是可能的</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  return null;
}