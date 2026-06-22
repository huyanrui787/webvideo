import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./VsTradition.css";

export default function VsTradition({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">差别在哪？</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-compare ch-compare--vs bg-gradient-subtle">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">手动相机</h3>
        <ul className="ch-compare-items">
          <li>光圈自己调</li>
          <li>快门自己设</li>
          <li>对焦自己拧</li>
        </ul>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">智能相机</h3>
        <ul className="ch-compare-items">
          <li>自动算参数</li>
          <li>场景识别</li>
          <li>逆光自动校正</li>
        </ul>
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
              <h3 className="ch-step-heading">治理策略</h3>
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
              <h3 className="ch-step-heading">治理策略</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.35} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">02</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">可视化管道</h3>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-steps ch-steps--numbered">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">治理策略</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.35} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">02</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">可视化管道</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.50} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">03</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">秘钥管理</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={3} delay={0.65} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">04</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">开发者体验</h3>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  return null;
}