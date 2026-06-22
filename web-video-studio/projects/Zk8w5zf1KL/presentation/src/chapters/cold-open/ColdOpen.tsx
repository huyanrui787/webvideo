import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./ColdOpen.css";

export default function ColdOpen({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">有一种钱</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">不属于任何国家</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">没有中央银行</span>
          </MaskReveal>
        </h1>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">总数2100万枚</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">写死在代码里·永不超发</p>
      </div>
    );
  }

  return null;
}
