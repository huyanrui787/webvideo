import { Counter, DataChart, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./CostAndFlags.css";

export default function CostAndFlags({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--chart" style={{ gridArea: "1/1" }}>
        <DataChart type={"bar"} data={[{"label":"EC2","value":24000},{"label":"K8s","value":18000},{"label":"LBs","value":8000}]} />
      </div>
      <div className="ch-composed-region ch-composed-region--savings" style={{ gridArea: "1/2" }}>
        <Reveal from="up" delay={1} stepTime={1}>
        <Counter to={40} unit={"%"} label={"可节省"} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--left">
        <TypeWriter text={"代码部署 ✅"} speed={40} />
        <TypeWriter text={"已到所有节点"} speed={30} delay={0.5} />
      </div>
      <div className="ch-composed-region ch-composed-region--right">
        <TypeWriter text={"功能开关 🔒"} speed={40} />
        <TypeWriter text={"内部 → 10% → 全量"} speed={30} delay={0.5} />
        <TypeWriter text={"一键关闭毫秒生效"} speed={30} delay={1} />
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.8}>
        <TypeWriter text={"部署 ≠ 发布"} speed={60} />
        <Counter to={0} unit={"用户受影响"} label={"回滚影响面"} />
        </Reveal>
      </div>
    </div>
    );
  }

  return null;
}