import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./TheBrainGap.css";

export default function TheBrainGap({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <div className="kicker">认知之谜</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">半秒，你就知道这是猫</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">🧠 大脑</h3>
        <p className="ch-compare-body">860亿神经元
    瞬间识别</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">💻 计算机</h3>
        <p className="ch-compare-body">if 耳朵尖 and 尾巴长
    → 写到崩溃</p>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <div className="kicker">大脑的奥秘</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">凭什么？</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  return null;
}