import { MaskReveal } from "../../components/MaskReveal";
import { Counter, NetworkGraph } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./GradientDescent.css";

export default function GradientDescent({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">刚出生的网络</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">是瞎猜的，得让它学</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">Loss</span>
        <span className="ch-data-label label-mono">损失函数</span>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "top", label: "你在山顶" },
          { id: "feel", label: "感受坡度" },
          { id: "goal", label: "山脚最低点" },
        ]}
        edges={[
        ]}
        visibleNodes={3}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "s1", label: "迈一步" },
          { id: "s2", label: "感受坡度" },
          { id: "s3", label: "再迈一步" },
          { id: "s4", label: "到达谷底" },
        ]}
        edges={[
        ]}
        visibleNodes={4}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "loss", label: "损失" },
          { id: "out", label: "输出层" },
          { id: "hid", label: "隐藏层" },
          { id: "in", label: "输入层" },
        ]}
        edges={[
        ]}
        visibleNodes={4}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">W - lr * grad</span>
        <span className="ch-data-label label-mono">权重更新公式</span>
      </div>
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "d", label: "看数据" },
          { id: "f", label: "前向传播" },
          { id: "l", label: "算损失" },
          { id: "b", label: "反向传播" },
          { id: "u", label: "更新权重" },
        ]}
        edges={[
        ]}
        visibleNodes={5}
        stepTime={1.0}
      />
    </div>
    );
  }

  return null;
}