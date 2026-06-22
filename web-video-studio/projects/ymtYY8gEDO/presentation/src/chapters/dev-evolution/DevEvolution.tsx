import { NetworkGraph, Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./DevEvolution.css";

export default function DevEvolution({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "old", label: "写代码的动作" },
          { id: "new", label: "解决问题" },
        ]}
        edges={[
        ]}
        visibleNodes={2}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">老手</h3>
        <p className="ch-compare-body">增幅器
    重复细节外包
    专注架构和决策</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading"></h3>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading"></h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">新手</h3>
        <p className="ch-compare-body">导师 + 执行者
    读 AI 写的代码
    看 AI 怎么调试</p>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-steps ch-steps--numbered bg-gradient-subtle">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">下一代开发者核心技能</h3>
              <p className="ch-step-text">清晰描述需求
    审查 AI 产出
    与 AI 高效协作</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  return null;
}