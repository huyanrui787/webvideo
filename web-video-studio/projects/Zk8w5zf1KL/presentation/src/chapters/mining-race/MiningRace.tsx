import { Counter, Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./MiningRace.css";

export default function MiningRace({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-data ch-data--single-stat bg-gradient-bold">
        <div className="ch-data-primary">
          <Counter to={3.125} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">3.125</span>
          <span className="ch-data-label label-mono">当前每区块奖励 (BTC)</span>
        </div>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-data ch-data--single-stat bg-gradient-bold">
        <div className="ch-data-primary">
          <Counter to={2} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">2,100万</span>
          <span className="ch-data-label label-mono">比特币总量上限</span>
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
                <h3 className="ch-step-heading">诚实挖矿</h3>
                <p className="ch-step-text">投入电力+机器 → 获得BTC奖励 → 持续盈利</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={1} delay={0.35} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">试图作恶</h3>
                <p className="ch-step-text">投入电力+机器 → 被节点拒绝 → 血本无归</p>
              </div>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-data ch-data--single-stat bg-gradient-subtle">
        <div className="ch-data-primary">
          <Counter to={15} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">15+</span>
          <span className="ch-data-label label-mono">无中央管理安全运行年限</span>
        </div>
      </div>
    );
  }

  return null;
}
