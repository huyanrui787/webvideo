import { MaskReveal } from "../../components/MaskReveal";
import { Counter, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Coldopen.css";

export default function Coldopen({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <div className="kicker">认知颠覆</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">光速不变</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <Reveal from="right" delay={0} stepTime={0.7}>
        <TypeWriter text={"火车速度\n+\n球速\n=\n速度叠加"} speed={8} cursor={false} />
        </Reveal>
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <Reveal from="left" delay={0.6} stepTime={0.7}>
        <TypeWriter text={"光？\n不守\n这个规矩"} speed={10} delay={0.8} cursor={false} />
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
        <Counter to={300000} unit={" km/s"} duration={1.8} delay={0.3} />
        <TypeWriter text={"无论你怎么追\n光速始终不变"} speed={15} delay={1.8} cursor={false} />
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
          <span className="serif-cn">时间与空间
    必须可变</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  return null;
}