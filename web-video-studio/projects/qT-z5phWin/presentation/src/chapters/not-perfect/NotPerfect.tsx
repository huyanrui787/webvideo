import { MaskReveal } from "../../components/MaskReveal";
import { Counter, Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./NotPerfect.css";

export default function NotPerfect({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-data ch-data--comparison">
        <div className="ch-data-primary">
          <Counter to={7} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">7</span>
          <span className="ch-data-label label-mono">BTC 每秒交易</span>
        </div>
        <p className="ch-data-context">Visa：数万笔/秒</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-data ch-data--single-stat">
        <div className="ch-data-primary">
          <Counter to={0} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">中型国家</span>
          <span className="ch-data-label label-mono">PoW 耗电量</span>
        </div>
        <p className="ch-data-context">超过某些中型国家总用电量</p>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--warn3" style={{ gridArea: "1/1" }}>
          <Reveal from="left" delay={0} stepTime={0.8}>
            <Stagger interval={0.4} from={"left"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--hope" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
            <Stagger interval={0.3} from={"up"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">最后的话</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">保持好奇，保持警惕</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">像九十年代的互联网——机会很大，坑也不少</p>
      </div>
    );
  }

  return null;
}
