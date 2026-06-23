import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./NeverStops.css";

export default function NeverStops({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">十几年</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">旧金融体系的叛逆产物</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">信任可以重构</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">货币形态可能被重写</p>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-data ch-data--single-stat">
        <Reveal from="up" delay={0.2} stepTime={0.8}>
          <div className="ch-data-primary">
            <span className="ch-data-value">加密世界</span>
          </div>
        </Reveal>
        <Reveal from="up" delay={0.5} stepTime={0.7}>
          <p className="ch-data-context">智能合约 · DeFi · NFT — 整个加密世界由此开启</p>
        </Reveal>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">永不停机</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">运行在全球无数电脑上</p>
      </div>
    );
  }

  return null;
}
