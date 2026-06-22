import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, Counter, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./LogicBias.css";

export default function LogicBias({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">🧠 人类工程师</h3>
        <p className="ch-compare-body">拆解多层条件 · 权衡取舍 · 理解「为什么」</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">⚙️ Codex</h3>
        <p className="ch-compare-body">模式匹配 · 一步到位指令 · 不懂「为什么」</p>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-bold">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">它只是模式匹配大师，不是真正理解「为什么这样设计」的工程师。</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`// ⚠️ Codex 可能生成的代码：
    // 含有冒犯性变量名、不当注释
    // 这些来自训练数据中的暗影
    
    // ❌ 示例（已脱敏）：
    let masterList = [];      // 不当隐喻
    let slaveNode = {};        // 历史包袱
    // 这些不是 Codex 故意为之
    // 而是训练数据中的偏见被继承了`} language="javascript" highlights={[]} />
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-data ch-data--single-stat bg-gradient-bold">
      <div className="ch-data-primary">
        <Counter to={parseFloat("4") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">4</span>
        <span className="ch-data-label label-mono">类风险</span>
      </div>
      <p className="ch-data-context">幻觉 · 安全漏洞 · 逻辑混乱 · 偏见代码</p>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">能帮你写代码</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">同时也在帮你埋雷</p>
    </div>
    );
  }

  return null;
}