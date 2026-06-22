import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./TheReins.css";

export default function TheReins({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <div className="kicker">Harness 工程</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">控制力 = 安全感</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">在复杂系统中，找回那份久违的从容</p>
    </div>
    );
  }

  return null;
}