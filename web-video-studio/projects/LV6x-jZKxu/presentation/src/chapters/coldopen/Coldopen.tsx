import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./Coldopen.css";

export default function Coldopen({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">发布日</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">拆弹现场</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">报错</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">谁改了配置？快回滚！</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">拆弹现场</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">你的软件交付，缺一副好马具</p>
    </div>
    );
  }

  return null;
}