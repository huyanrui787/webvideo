import { MaskReveal } from "../../components/MaskReveal";
import { Counter, NetworkGraph } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./NeuronFaucet.css";

export default function NeuronFaucet({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">不给规则</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">只给海量标注样本，它自己悟</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "x1", label: "输入 x1" },
          { id: "x2", label: "输入 x2" },
          { id: "x3", label: "输入 x3" },
          { id: "neuron", label: "神经元" },
        ]}
        edges={[
        ]}
        visibleNodes={4}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "rain", label: "下雨了 影响大" },
          { id: "friend", label: "朋友约 影响大" },
          { id: "tired", label: "太累了 影响中" },
          { id: "decision", label: "出不出门?" },
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
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">sum(x*w)+b</span>
        <span className="ch-data-label label-mono">加权求和加偏置</span>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">没有激活函数</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">有激活函数</h3>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">Sigmoid</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">ReLU 水龙头</h3>
      </div>
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">非线性决策单元</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">就这么简单</p>
    </div>
    );
  }

  return null;
}