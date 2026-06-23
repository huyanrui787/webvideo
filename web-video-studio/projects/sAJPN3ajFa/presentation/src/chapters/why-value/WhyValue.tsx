import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./WhyValue.css";

export default function WhyValue({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">凭什么？</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">一枚比特币 · 几万美元</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-steps ch-steps--numbered">
        <div className="ch-steps-list">
          <Stagger index={0} delay={0.20} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">01</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">稀缺性</h3>
                <p className="ch-step-text">总量永久锁死 2100 万枚</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={1} delay={0.35} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">vs 法币</h3>
                <p className="ch-step-text">无限印钞 · 持续贬值</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={2} delay={0.50} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">03</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">数字黄金</h3>
                <p className="ch-step-text">绝对稀缺 · 天然抗通胀</p>
              </div>
            </div>
          </Stagger>
        </div>
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
                <h3 className="ch-step-heading">无国界</h3>
                <p className="ch-step-text">不受任何国家管制</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={1} delay={0.35} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">私钥即所有权</h3>
                <p className="ch-step-text">记住一串私钥 = 真正拥有</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={2} delay={0.50} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">03</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">不可冻结</h3>
                <p className="ch-step-text">任何政府无法查封没收</p>
              </div>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-steps ch-steps--numbered">
        <div className="ch-steps-list">
          <Stagger index={0} delay={0.20} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">01</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">共识价值</h3>
                <p className="ch-step-text">越多人持有 · 价格越高</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={1} delay={0.35} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">机构入场</h3>
                <p className="ch-step-text">MicroStrategy · Tesla · 萨尔瓦多</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={2} delay={0.50} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">03</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">资产储备</h3>
                <p className="ch-step-text">上市公司和国家纳入资产负债表</p>
              </div>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">2100万 · 无国界 · 共识</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">三项合一 · 价值根基</p>
      </div>
    );
  }

  return null;
}
