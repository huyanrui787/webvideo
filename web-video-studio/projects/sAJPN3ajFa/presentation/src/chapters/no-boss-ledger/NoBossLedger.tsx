import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./NoBossLedger.css";

export default function NoBossLedger({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered">
        <div className="kicker">传统银行</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">中央大账本</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">一家独管 · 说没就没</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <div className="kicker">分布式账本</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">全世界共享的账本</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">千千万万台电脑同时记账 · 全网同步</p>
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
                <h3 className="ch-step-heading">篡改银行</h3>
                <p className="ch-step-text">攻破一台服务器即可</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={1} delay={0.35} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">篡改比特币</h3>
                <p className="ch-step-text">需黑掉 50%+ 节点 · 几乎不可能</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={2} delay={0.50} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">03</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">信任重构</h3>
                <p className="ch-step-text">数学 + 加密算法 = 信任</p>
              </div>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <div className="kicker">永不停机</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">没有老板的网络</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">无 CEO · 无客服 · 无机房 · 永不关停</p>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">历史首次</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">数学 = 信任</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">陌生人之间 · 无需中间人 · 纯技术保证</p>
      </div>
    );
  }

  return null;
}
