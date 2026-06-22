import { MaskReveal } from "../../components/MaskReveal";
import { Counter, NetworkGraph } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Capabilities.css";

export default function Capabilities({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <span className="ch-data-value">组件代码 → 状态管理 → git blame</span>
        <span className="ch-data-label label-mono">Bug 修复</span>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">改完还告诉你原因</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">不是丢给你一个补丁就跑</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "route", label: "路由" },
          { id: "middleware", label: "中间件" },
          { id: "auth", label: "认证逻辑" },
          { id: "db", label: "数据库" },
        ]}
        edges={[
          { from: "route", to: "middleware" },
          { from: "middleware", to: "auth" },
          { from: "auth", to: "db" },
        ]}
        visibleNodes={4}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-quote ch-quote--centered">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">等于配了一个会读代码的技术文档写手</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">jQuery</h3>
        <p className="ch-compare-body">$.ajax({"\u007d"})
    $(el).on('click',...)</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">React</h3>
        <p className="ch-compare-body">const [data, setData] = useState()
    &lt;button onClick={"\u007b"}...&gt;</p>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">自动分析依赖</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">分步重构 · 跑测试确认</p>
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={90} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">90%</span>
        <span className="ch-data-label label-mono">测试覆盖率</span>
      </div>
    </div>
    );
  }

  else if (step === 7) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">Git 操作也全包</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">提交 · 创建 PR · 写 commit message</p>
    </div>
    );
  }

  return null;
}
