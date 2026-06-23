import { MaskReveal } from "../../components/MaskReveal";
import { Counter, NetworkGraph, Reveal, Stagger, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./TamperProof.css";

export default function TamperProof({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <div className="kicker">关键问题</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">电子数据不是说改就改吗？</span>
          </MaskReveal>
        </h1>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--hash" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.6}>
            <TypeWriter text={"输入：「张三向李四转账5元」\n输出：「7B3A8F2C...」"} speed={25} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--props" style={{ gridArea: "1/1" }}>
          <Reveal from="right" delay={0} stepTime={0.8}>
            <Stagger interval={0.5} from={"right"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-flow ch-flow--horizontal">
        <NetworkGraph
          nodes={[
            { id: "block100", label: "第100块" },
            { id: "block101", label: "第101块" },
            { id: "block102", label: "第102块" },
            { id: "block103", label: "第103块" },
          ]}
          edges={[
          ]}
          visibleNodes={4}
          stepTime={1.0}
        />
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--tamper" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.7}>
            <Stagger interval={0.3} from={"up"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 5) {
    return (
      <div className="ch-flow ch-flow--horizontal">
        <NetworkGraph
          nodes={[
            { id: "b100", label: "第100块 ✗" },
            { id: "b101", label: "第101块 ✗" },
            { id: "b102", label: "第102块 ✗" },
            { id: "b103", label: "第103块 ✗" },
          ]}
          edges={[
          ]}
          visibleNodes={4}
          stepTime={1.0}
        />
      </div>
    );
  }

  else if (step === 6) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--left" style={{ gridArea: "1/1" }}>
          <Reveal from="left" delay={0} stepTime={0.8}>
            <Stagger interval={0.2} from={"left"} />
          </Reveal>
        </div>
        <div className="ch-composed-region ch-composed-region--right" style={{ gridArea: "1/2" }}>

        </div>
      </div>
    );
  }

  else if (step === 7) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--attacker" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
            <Counter to={51} unit={"% 算力门槛"} />
          </Reveal>
        </div>
        <div className="ch-composed-region ch-composed-region--honest" style={{ gridArea: "1/2" }}>

        </div>
      </div>
    );
  }

  else if (step === 8) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">核心结论</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">篡改可能</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">经济上完全不可行</p>
      </div>
    );
  }

  return null;
}
