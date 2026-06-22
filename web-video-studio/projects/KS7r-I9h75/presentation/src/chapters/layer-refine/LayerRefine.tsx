import { MaskReveal } from "../../components/MaskReveal";
import { Counter, NetworkGraph } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./LayerRefine.css";

export default function LayerRefine({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">单个神经元</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">啥也干不了</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={784} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">784</span>
        <span className="ch-data-label label-mono">28x28像素 输入层维度</span>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "input", label: "输入层 784" },
          { id: "hidden1", label: "隐藏层1" },
          { id: "hidden2", label: "隐藏层2" },
          { id: "output", label: "输出层 猫/狗" },
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
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">第1层</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">第2层</h3>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">第3层</h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">输出层</h3>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">层层精炼</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">深度学习的深度，就是这个意思</p>
    </div>
    );
  }

  return null;
}