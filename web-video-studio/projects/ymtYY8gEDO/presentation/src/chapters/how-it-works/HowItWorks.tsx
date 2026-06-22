import { MaskReveal } from "../../components/MaskReveal";
import { Counter, NetworkGraph, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./HowItWorks.css";

export default function HowItWorks({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--center">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from={"up"} duration={0.8} />
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-data ch-data--hero bg-gradient-subtle">
      <div className="ch-data-primary">
        <Counter to={parseFloat("200K") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">200K</span>
        <span className="ch-data-label label-mono">tokens 上下文窗口</span>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">不光在脑子里想</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">它真的会动手</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-flow ch-flow--circular">
      <NetworkGraph
        nodes={[
          { id: "task", label: "接到任务" },
          { id: "search", label: "搜索文件" },
          { id: "read", label: "读取代码" },
          { id: "analyze", label: "分析问题" },
          { id: "edit", label: "编辑文件" },
          { id: "verify", label: "跑命令验证" },
          { id: "adjust", label: "根据输出调整" },
        ]}
        edges={[
          { from: "task", to: "search" },
          { from: "search", to: "read" },
          { from: "read", to: "analyze" },
          { from: "analyze", to: "edit" },
          { from: "edit", to: "verify" },
          { from: "verify", to: "adjust" },
          { from: "adjust", to: "search" },
        ]}
        visibleNodes={7}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-quote ch-quote--centered">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">像一个实习生</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  return null;
}