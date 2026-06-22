import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Close.css";

export default function Close({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">Harness</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">给软件交付套上一副好缰绳</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-steps ch-steps--numbered bg-gradient-subtle">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">跑得快</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.35} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">02</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">回滚</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.50} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">03</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">新功能</h3>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">控制力</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">等于安全感</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">每个工程团队</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">都值得拥有</p>
    </div>
    );
  }

  return null;
}