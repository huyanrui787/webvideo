import { MaskReveal } from "../../components/MaskReveal";
import { Counter, NetworkGraph, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./WhoKeepsLedger.css";

export default function WhoKeepsLedger({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <div className="kicker">核心问题</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">谁来记账？</span>
          </MaskReveal>
        </h1>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-composed ch-composed--center">
        <div className="ch-composed-region ch-composed-region--race" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
            <NetworkGraph nodes={[{ "id": "m1", "label": "矿工 A", "highlight": true }, { "id": "m2", "label": "矿工 B", "highlight": true }, { "id": "m3", "label": "矿工 C", "highlight": true }, { "id": "m4", "label": "矿工 D" }, { "id": "m5", "label": "矿工 E" }]} edges={[{ "from": "m1", "to": "m2", "label": "竞赛" }, { "from": "m1", "to": "m3", "label": "竞赛" }, { "from": "m2", "to": "m3", "label": "竞赛" }, { "from": "m2", "to": "m4", "label": "竞赛" }, { "from": "m3", "to": "m5", "label": "竞赛" }]} visibleNodes={5} edgeColor={"var(--rule)"} accentColor={"var(--accent)"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-composed ch-composed--center">
        <div className="ch-composed-region ch-composed-region--winner" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={1}>
            <Counter to={3842000000000000} unit={" 次/秒"} decimals={0} duration={2.5} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-composed ch-composed--split">
        <div className="ch-composed-region ch-composed-region--pow" style={{ gridArea: "left" }}>
          <Reveal from="left" delay={0} stepTime={0.6}>
          </Reveal>
        </div>
        <div className="ch-composed-region ch-composed-region--pos" style={{ gridArea: "right" }}>
          <Reveal from="right" delay={0.3} stepTime={0.6}>
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-composed ch-composed--center">
        <div className="ch-composed-region ch-composed-region--energy" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={1}>
            <Counter to={99.95} unit={"% 能耗降低"} decimals={2} duration={2} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 5) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">本质</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">共识 = 国家法律</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">透明规则让所有人自发遵守</p>
      </div>
    );
  }

  return null;
}
