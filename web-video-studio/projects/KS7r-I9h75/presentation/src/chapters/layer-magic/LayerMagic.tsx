import { MaskReveal } from "../../components/MaskReveal";
import { NetworkGraph } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./LayerMagic.css";

export default function LayerMagic({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <div className="kicker">从单个到网络</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">成百上千个神经元</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">组织成层 → 首尾相连 → 威力涌现</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "pixels", label: "像素\n边缘" },
          { id: "shapes", label: "形状\n轮廓" },
          { id: "parts", label: "耳朵·眼睛" },
          { id: "cat", label: "🐱 猫" },
        ]}
        edges={[
        ]}
        visibleNodes={4}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <div className="kicker">层层精炼</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">它自己「悟出」了猫</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">从像素到语义——这就是「深度」</p>
    </div>
    );
  }

  return null;
}