import { CodeBlock, Counter, NetworkGraph, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./AiPilot.css";

export default function AiPilot({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <TypeWriter text={"传统 CI/CD"} speed={40} />
        <NetworkGraph nodes={[{"id":"1","label":"Step 1"},{"id":"2","label":"Step 2"},{"id":"3","label":"Step 3 ❌"}]} edges={[{"from":"1","to":"2"},{"from":"2","to":"3"}]} visibleNodes={3} />
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <TypeWriter text={"Harness AI 流水线"} speed={40} />
        <NetworkGraph nodes={[{"id":"a","label":"金丝雀"},{"id":"b","label":"验证"},{"id":"c","label":"推进"}]} edges={[{"from":"a","to":"b"},{"from":"b","to":"c"},{"from":"c","to":"a"}]} visibleNodes={3} layout={"circular"} />
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--canary" style={{ gridArea: "1/1" }}>
        <Counter to={5} unit={"%"} label={"金丝雀灰度"} />
      </div>
      <div className="ch-composed-region ch-composed-region--monitor" style={{ gridArea: "1/2" }}>
        <Counter to={99.9} unit={"%"} label={"健康指标"} />
      </div>
      <div className="ch-composed-region ch-composed-region--rollback" style={{ gridArea: "1/3" }}>
        <TypeWriter text={"异常 → 自动回滚"} speed={35} />
        <Counter to={120} unit={"s"} label={"恢复时间"} />
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <CodeBlock language={"yaml"} code={"pipeline:\n  - stage: Build\n    type: CI\n  - stage: Approve\n    type: Approval\n  - stage: Deploy\n    type: Canary\n  - stage: Notify\n    type: Slack"} />
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <TypeWriter text={"🧱 模块化积木"} speed={35} />
        <TypeWriter text={"一次构建"} speed={30} delay={0.5} />
        <TypeWriter text={"处处复用"} speed={30} delay={1} />
      </div>
    </div>
    );
  }

  return null;
}