import { MaskReveal } from "../../components/MaskReveal";
import { Counter, NetworkGraph } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./LearningLoop.css";

export default function LearningLoop({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <div className="kicker">残酷的现实</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">输出全是瞎猜</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">猫 30% / 狗 70% —— 完全不对</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">损失函数</span>
        <span className="ch-data-label label-mono">衡量预测与真实差距的尺子</span>
      </div>
      <p className="ch-data-context">交叉熵损失：猜得越离谱，值越大</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "data", label: "看数据" },
          { id: "forward", label: "前向传播" },
          { id: "loss", label: "算损失" },
          { id: "backward", label: "反向更新" },
        ]}
        edges={[
        ]}
        visibleNodes={4}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-data ch-data--single-stat bg-gradient-bold">
      <div className="ch-data-primary">
        <Counter to={0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">猫 97%</span>
        <span className="ch-data-label label-mono">千百次循环后</span>
      </div>
      <p className="ch-data-context">学习率 × 梯度 → 逐步逼近最优</p>
    </div>
    );
  }

  return null;
}