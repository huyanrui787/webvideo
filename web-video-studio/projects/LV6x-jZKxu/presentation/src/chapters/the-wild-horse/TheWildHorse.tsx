import { DrawPath, Reveal, Stagger, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./TheWildHorse.css";

export default function TheWildHorse({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="left" delay={0} stepTime={0.8}>
        <TypeWriter text={"Harness = 控制 + 引导"} speed={45} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--pain1" style={{ gridArea: "1/1" }}>
        <Stagger interval={0.2}>
        <TypeWriter text={"脚本满天飞"} speed={30} />
        <TypeWriter text={"改一行就崩全线"} speed={25} />
        </Stagger>
      </div>
      <div className="ch-composed-region ch-composed-region--pain2" style={{ gridArea: "1/2" }}>
        <Stagger interval={0.2}>
        <TypeWriter text={"环境谜题"} speed={30} />
        <TypeWriter text={"开发好预发就坏"} speed={25} />
        </Stagger>
      </div>
      <div className="ch-composed-region ch-composed-region--pain3" style={{ gridArea: "2/1" }}>
        <Stagger interval={0.15}>
        <TypeWriter text={"审批迷宫"} speed={30} />
        <TypeWriter text={"层层签字无实卡"} speed={25} />
        </Stagger>
      </div>
      <div className="ch-composed-region ch-composed-region--pain4" style={{ gridArea: "2/2" }}>
        <Stagger interval={0.15}>
        <TypeWriter text={"成本黑盒"} speed={30} />
        <TypeWriter text={"账单让人心跳骤停"} speed={25} />
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={1}>
        <DrawPath path={"M 50,200 Q 200,50 350,200 T 600,200"} stroke={"#f0b429"} strokeWidth={3} animate={true} />
        </Reveal>
      </div>
    </div>
    );
  }

  return null;
}