import { MaskReveal } from "../../components/MaskReveal";
import { Counter, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./RealChallenges.css";

export default function RealChallenges({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-data ch-data--single-stat">
        <div className="ch-data-primary">
          <Counter to={7} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">7</span>
          <span className="ch-data-label label-mono">比特币主网 TPS (笔/秒)</span>
        </div>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-grid ch-grid--cols-2">
        <div className="ch-grid-inner" style={{ "--grid-cols": 2, "--grid-gap": "var(--space-5)" } as React.CSSProperties}>
          <Stagger index={0} delay={0.15} stepTime={0.5}>
            <div className="ch-grid-item">
              <img src="/api/projects/Zk8w5zf1KL/assets/placeholder-flag-sv.png" alt="" style={{ objectFit: "contain", width: 640, height: 360 }} />
            </div>
          </Stagger>
          <Stagger index={1} delay={0.15} stepTime={0.5}>
            <div className="ch-grid-item">
              <img src="/api/projects/Zk8w5zf1KL/assets/placeholder-flag-us.png" alt="" style={{ objectFit: "contain", width: 640, height: 360 }} />
            </div>
          </Stagger>
          <Stagger index={2} delay={0.15} stepTime={0.5}>
            <div className="ch-grid-item">
              <img src="/api/projects/Zk8w5zf1KL/assets/placeholder-flag-cn.png" alt="" style={{ objectFit: "contain", width: 640, height: 360 }} />
            </div>
          </Stagger>
          <Stagger index={3} delay={0.15} stepTime={0.5}>
            <div className="ch-grid-item">
              <img src="/api/projects/Zk8w5zf1KL/assets/placeholder-energy.png" alt="" style={{ objectFit: "contain", width: 640, height: 360 }} />
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-quote ch-quote--centered">
        <blockquote className="ch-quote-text pull-quote">
          <MaskReveal show duration={1100}>
            <span className="serif-cn">私钥即资产。不在你手里的币，不是你的币。</span>
          </MaskReveal>
        </blockquote>
        <cite className="ch-quote-attribution">— —— 加密货币圈安全法则</cite>
      </div>
    );
  }

  return null;
}
