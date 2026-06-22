import { MaskReveal } from "../../components/MaskReveal";
import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./WhatItCanDo.css";

export default function WhatItCanDo({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">十八般武艺</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">远不止自动补全</p>
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
              <h3 className="ch-step-heading">交互式编程搭档</h3>
              <p className="ch-step-text">说需求 → 调接口 → 整表格 → 画图，一条龙</p>
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
              <h3 className="ch-step-heading">跨语言翻译机</h3>
              <p className="ch-step-text">Java → Go，连命名风格一起换</p>
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
              <h3 className="ch-step-heading">代码说明书生成器</h3>
              <p className="ch-step-text">贴代码 → 一层层剥开逻辑</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-steps ch-steps--numbered">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">随手捏游戏</h3>
              <p className="ch-step-text">乒乓球网页游戏，HTML+CSS+JS 全套</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-steps ch-steps--numbered">
      <div className="ch-steps-list">
        <Stagger index={0} delay={0.20} stepTime={0.7}>
          <div className="ch-step-item">
            <span className="ch-step-num">01</span>
            <div className="ch-step-body">
              <h3 className="ch-step-heading">数据处理魔法师</h3>
              <p className="ch-step-text">写正则提取IP和时间戳，比老手利索</p>
            </div>
          </div>
        </Stagger>
      </div>
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">五大能力</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">交互编程 · 跨语言翻译 · 代码解释 · 写游戏 · 数据处理</p>
    </div>
    );
  }

  else if (step === 7) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">先别急着喊牛</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  return null;
}