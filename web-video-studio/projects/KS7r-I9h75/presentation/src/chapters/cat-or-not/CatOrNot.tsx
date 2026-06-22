import { MaskReveal } from "../../components/MaskReveal";
import { Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./CatOrNot.css";

export default function CatOrNot({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">你在大街上</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">看到一只猫</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">半张脸 奇怪姿势 光线巨差</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">你照样一秒认出</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">if 耳朵尖 and 尾巴长 and 喵喵叫</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">总有规则漏掉的情况</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">你的大脑</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">到底怎么做到的？</p>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={860} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">860亿</span>
        <span className="ch-data-label label-mono">大脑皮层神经元数量</span>
      </div>
    </div>
    );
  }

  return null;
}