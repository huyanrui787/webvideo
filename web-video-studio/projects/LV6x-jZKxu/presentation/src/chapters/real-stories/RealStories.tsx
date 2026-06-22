import { MaskReveal } from "../../components/MaskReveal";
import { Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./RealStories.css";

export default function RealStories({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-subtle">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">以前每到发布日，紧张到胃疼</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-subtle">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">2 分钟自动回滚，用户完全没感觉</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={-40} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">-40%</span>
        <span className="ch-data-label label-mono">月度云账单</span>
      </div>
      <p className="ch-data-context">测试集群自动缩容 + Spot 实例</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-subtle">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">账单从 50 万降到 30 万</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-subtle">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">代码先上生产，只对内部测试员打开</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-subtle">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">零回滚 零部署 全程几秒</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  return null;
}