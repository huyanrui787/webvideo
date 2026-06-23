import { MaskReveal } from "../../components/MaskReveal";
import { NetworkGraph, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./WhySpecial.css";

export default function WhySpecial({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <div className="kicker">对比</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">中心化 vs 去中心化</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">两种记账模式的根本差异</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-composed ch-composed--split">
        <div className="ch-composed-region ch-composed-region--left" style={{ gridArea: "left" }}>
          <Reveal from="left" delay={0} stepTime={0.8}>
          </Reveal>
        </div>
        <div className="ch-composed-region ch-composed-region--right" style={{ gridArea: "right" }}>

        </div>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-composed ch-composed--center">
        <div className="ch-composed-region ch-composed-region--p2p" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={1}>
            <NetworkGraph nodes={[{ "id": "n1", "label": "节点 1" }, { "id": "n2", "label": "节点 2" }, { "id": "n3", "label": "节点 3" }, { "id": "n4", "label": "节点 4" }, { "id": "n5", "label": "节点 5" }, { "id": "n6", "label": "节点 6" }]} edges={[{ "from": "n1", "to": "n2" }, { "from": "n1", "to": "n3" }, { "from": "n2", "to": "n4" }, { "from": "n3", "to": "n5" }, { "from": "n4", "to": "n6" }, { "from": "n5", "to": "n6" }, { "from": "n2", "to": "n5" }, { "from": "n3", "to": "n6" }]} visibleNodes={6} edgeColor={"var(--rule)"} accentColor={"var(--accent)"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-composed ch-composed--center">
        <div className="ch-composed-region ch-composed-region--flow" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
            <NetworkGraph nodes={[{ "id": "tx", "label": "交易", "highlight": true }, { "id": "n1", "label": "验证" }, { "id": "n2", "label": "验证" }, { "id": "n3", "label": "验证" }, { "id": "block", "label": "打包", "highlight": true }]} edges={[{ "from": "tx", "to": "n1" }, { "from": "tx", "to": "n2" }, { "from": "tx", "to": "n3" }, { "from": "n1", "to": "block" }, { "from": "n2", "to": "block" }, { "from": "n3", "to": "block" }]} visibleNodes={5} edgeColor={"var(--accent)"} accentColor={"var(--accent)"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-composed ch-composed--center">
        <div className="ch-composed-region ch-composed-region--resilient" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
            <NetworkGraph nodes={[{ "id": "n1", "label": "在线" }, { "id": "n2", "label": "在线" }, { "id": "n3", "label": "离线" }, { "id": "n4", "label": "在线" }, { "id": "n5", "label": "离线" }, { "id": "n6", "label": "在线" }]} edges={[{ "from": "n1", "to": "n2" }, { "from": "n2", "to": "n4" }, { "from": "n4", "to": "n6" }, { "from": "n1", "to": "n6" }]} visibleNodes={6} edgeColor={"var(--rule)"} accentColor={"var(--accent)"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 5) {
    return (
      <div className="ch-composed ch-composed--center">
        <div className="ch-composed-region ch-composed-region--nocenter" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.6}>
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 6) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">核心洞察</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">去中心化的力量</span>
          </MaskReveal>
        </h1>
      </div>
    );
  }

  return null;
}
