import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./Genesis.css";

export default function Genesis({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">2008 · 金融危机</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">银行倒闭 · 政府疯狂印钱</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">中本聪</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">一种不需要银行背书的货币</p>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">2009.01.03</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">比特币网络正式上线</p>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">万亿市值</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">它到底怎么运转的？</p>
      </div>
    );
  }

  return null;
}
