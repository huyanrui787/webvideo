import { NetworkGraph, Stagger, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./SmartVsManual.css";

export default function SmartVsManual({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <TypeWriter text={"📷 手动相机"} speed={40} />
        <TypeWriter text={"Jenkins / Spinnaker"} speed={25} delay={0.5} />
        <TypeWriter text={"自己调光圈快门对焦"} speed={25} delay={1} />
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <TypeWriter text={"🤖 智能相机"} speed={40} />
        <TypeWriter text={"Harness"} speed={25} delay={0.5} />
        <TypeWriter text={"场景识别 · 自动校正"} speed={25} delay={1} />
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left" style={{ gridArea: "1/1" }}>
        <Stagger interval={0.25}>
        <TypeWriter text={"部署 → 经理审批 ✓"} speed={30} />
        <TypeWriter text={"回滚 → 自动执行 ✓"} speed={30} />
        <TypeWriter text={"无需人工检查"} speed={30} />
        </Stagger>
      </div>
      <div className="ch-composed-region ch-composed-region--right" style={{ gridArea: "1/2" }}>
        <NetworkGraph nodes={[{"id":"1","label":"构建","x":50,"y":100},{"id":"2","label":"审批","x":200,"y":100},{"id":"3","label":"部署","x":350,"y":100},{"id":"4","label":"验证","x":500,"y":100}]} edges={[{"from":"1","to":"2"},{"from":"2","to":"3"},{"from":"3","to":"4"}]} visibleNodes={4} />
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <TypeWriter text={"🔐 密码绝不出现在日志"} speed={35} />
        <TypeWriter text={"UI 拖拽 + GitOps 双模式"} speed={30} delay={0.6} />
      </div>
    </div>
    );
  }

  return null;
}