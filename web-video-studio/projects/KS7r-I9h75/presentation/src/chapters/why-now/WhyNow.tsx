import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./WhyNow.css";

export default function WhyNow({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <div className="kicker">历史之问</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">为什么现在才炸？</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">1958 感知机 → 1986 反向传播 → 2012 AlexNet</p>
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
              <h3 className="ch-step-heading">大数据</h3>
              <p className="ch-step-text">ImageNet 1400万+ 标注图片，喂得越多越强</p>
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.35} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">02</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">GPU 算力</h3>
              <p className="ch-step-text">几千核心并行矩阵乘法，训练从月缩到小时</p>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.50} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">03</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">算法突破</h3>
              <p className="ch-step-text">ReLU / BatchNorm / Dropout / ResNet 让深层网络可训练</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <div className="kicker">三引擎到齐</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">直接起飞</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">数据 × 算力 × 算法 → 爆发</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <div className="kicker">不止于识别</div>
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">神经网络，正在改变一切</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">写代码 · 画图 · 聊天 · 开车</p>
    </div>
    );
  }

  return null;
}