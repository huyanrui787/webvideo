import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Safety.css";

export default function Safety({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">万一删库跑路怎么办？</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">Anthropic 放了好几层护栏</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-steps ch-steps--stacked">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <div className="ch-step-body">
              <h3 className="ch-step-heading">权限控制</h3>
              <p className="ch-step-text">危险操作须你批准 · 三级权限：允许 / 通知 / 禁止</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-steps ch-steps--stacked">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <div className="ch-step-body">
              <h3 className="ch-step-heading">全量日志</h3>
              <p className="ch-step-text">每一步可审查 · 不行就回退 · 像 Git diff 一样</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-steps ch-steps--stacked">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <div className="ch-step-body">
              <h3 className="ch-step-heading">行为准则</h3>
              <p className="ch-step-text">不确定时必须提问 · 不能做假设</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-subtle">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">不完美</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  return null;
}