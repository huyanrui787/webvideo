import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./DeliveryPain.css";

export default function DeliveryPain({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-steps ch-steps--numbered">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">脚本满天飞</h3>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-steps ch-steps--numbered">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">脚本满天飞</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.35} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">02</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">环境谜题</h3>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-steps ch-steps--numbered">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">脚本满天飞</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.35} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">02</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">环境谜题</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.50} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">03</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">审批迷宫</h3>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-steps ch-steps--numbered">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">脚本满天飞</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.35} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">02</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">环境谜题</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.50} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">03</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">审批迷宫</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={3} delay={0.65} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">04</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">成本黑盒</h3>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">怎么填？</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  return null;
}