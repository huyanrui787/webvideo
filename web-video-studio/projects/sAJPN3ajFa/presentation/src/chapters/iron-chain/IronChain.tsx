import { MaskReveal } from "../../components/MaskReveal";
import { Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./IronChain.css";

export default function IronChain({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <div className="kicker">分布式账本</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">永不停机</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">没有 CEO · 没有机房 · 关不掉</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-hero ch-hero--centered">
        <div className="kicker">核心技术</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">区块链</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">密码学串起的数据块</p>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-steps ch-steps--numbered">
        <div className="ch-steps-list">
          <Reveal from="up" delay={0.2} stepTime={0.6}>
            <div className="ch-step-item">
              <span className="ch-step-num">01</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">交易汇集</h3>
                <p className="ch-step-text">十分钟内的所有交易打包成一个区块</p>
              </div>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.35} stepTime={0.6}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">加密压缩</h3>
                <p className="ch-step-text">SHA-256 算法生成独一无二的哈希指纹</p>
              </div>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.5} stepTime={0.6}>
            <div className="ch-step-item">
              <span className="ch-step-num">03</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">链式锁定</h3>
                <p className="ch-step-text">指纹即唯一ID，任何改动都会破坏整条链</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-data ch-data--single-stat">
        <Reveal from="up" delay={0.2} stepTime={0.8}>
          <div className="ch-data-primary">
            <span className="ch-data-value">多米诺骨牌</span>
          </div>
        </Reveal>
        <Reveal from="up" delay={0.5} stepTime={0.7}>
          <p className="ch-data-context">篡改历史数据 → 指纹全部对不上 → 全网拒绝</p>
        </Reveal>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">不可篡改</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">数学 = 信任</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">代码替代银行·律师·公证处</p>
      </div>
    );
  }

  return null;
}
