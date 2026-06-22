import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./BankCrisis.css";

export default function BankCrisis({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">2008</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">雷曼倒闭·银行挤兑·财富蒸发</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">Bitcoin: A Peer-to-Peer Electronic Cash System</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">— Satoshi Nakamoto, 2008</p>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-steps ch-steps--numbered">
        <div className="ch-steps-list">
          <Stagger index={0} delay={0.20} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">01</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">物理现金</h3>
                <p className="ch-step-text">一张纸币·一手交一手·无需第三方</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={1} delay={0.35} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">数字世界</h3>
                <p className="ch-step-text">Ctrl+C/Ctrl+V·无限复制·双花难题</p>
              </div>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">信任</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">银行作恶？数据被黑？两个「怎么办」都发生过</p>
      </div>
    );
  }

  return null;
}
