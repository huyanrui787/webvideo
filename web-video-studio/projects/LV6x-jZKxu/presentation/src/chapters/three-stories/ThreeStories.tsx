import { Counter, DataChart, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./ThreeStories.css";

export default function ThreeStories({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <TypeWriter text={"🏦 金融公司 · 自动回滚"} speed={40} />
        <Counter to={2} unit={"分钟"} />
        <Counter to={5} unit={"%"} prefix={"影响面 "} />
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--chart" style={{ gridArea: "1/1" }}>
        <DataChart type={"bar"} data={[{"label":"优化前","value":50},{"label":"优化后","value":30}]} />
      </div>
      <div className="ch-composed-region ch-composed-region--savings" style={{ gridArea: "1/2" }}>
        <Reveal from="up" delay={0.8} stepTime={1.2}>
        <Counter to={40} unit={"%"} prefix={"成本下降 "} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={1}>
        <TypeWriter text={"🛒 电商大促 · 暗发布"} speed={40} />
        <TypeWriter text={"零回滚 · 零部署 · 毫秒关停"} speed={30} delay={0.8} />
        <Counter to={0} unit={"秒"} prefix={"用户感知中断 "} />
        </Reveal>
      </div>
    </div>
    );
  }

  return null;
}