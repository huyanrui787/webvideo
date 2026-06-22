import { MaskReveal } from "../../components/MaskReveal";
import { Counter, Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./BeyondDelivery.css";

export default function BeyondDelivery({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">不止于交付</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">云成本 + 特性开关</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">闲置资源</span>
        <span className="ch-data-label label-mono">自动发现</span>
      </div>
      <p className="ch-data-context">EC2 + 负载均衡器</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={4} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">4核只用0.1核</span>
        <span className="ch-data-label label-mono">配置过大</span>
      </div>
      <p className="ch-data-context">自动调整规格</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-compare ch-compare--vs bg-gradient-subtle">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">传统</h3>
        <ul className="ch-compare-items">
          <li>代码上线 = 功能可见</li>
          <li>出问题全量用户受影响</li>
        </ul>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">Harness</h3>
        <ul className="ch-compare-items">
          <li>部署不等于发布</li>
          <li>开关控制毫秒级关闭</li>
        </ul>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-steps ch-steps--numbered bg-gradient-subtle">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">内部员工</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.35} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">02</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">10% 用户</h3>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.50} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">03</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">全量</h3>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">毫秒级关闭</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">测试在生产环境做，炸不到普通用户</p>
    </div>
    );
  }

  return null;
}