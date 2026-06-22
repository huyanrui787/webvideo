import { MaskReveal } from "../../components/MaskReveal";
import { Counter, Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./DigitalGold.css";

export default function DigitalGold({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-steps ch-steps--numbered bg-gradient-subtle">
        <div className="ch-steps-list">
          <Stagger index={0} delay={0.20} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">01</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">黄金</h3>
                <p className="ch-step-text">稀缺·耐腐蚀·可分割·易携带·被广泛接受</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={1} delay={0.35} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">比特币 ₿</h3>
                <p className="ch-step-text">总量2100万·代码永存·1枚=1亿聪·助记词走全球·全球共识</p>
              </div>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-data ch-data--single-stat bg-gradient-bold">
        <div className="ch-data-primary">
          <Counter to={1} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">1亿聪</span>
          <span className="ch-data-label label-mono">1 BTC = 100,000,000 聪</span>
        </div>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-quote ch-quote--centered">
        <blockquote className="ch-quote-text pull-quote">
          <MaskReveal show duration={1100}>
            <span className="serif-cn">数字黄金</span>
          </MaskReveal>
        </blockquote>
        <cite className="ch-quote-attribution">— 不与任何主权信用挂钩·全球自由流通·避险资产</cite>
      </div>
    );
  }

  return null;
}
