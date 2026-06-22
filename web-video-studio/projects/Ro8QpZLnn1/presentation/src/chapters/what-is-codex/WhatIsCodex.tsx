import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, Counter, Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./WhatIsCodex.css";

export default function WhatIsCodex({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">Codex 是何方神圣？</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">OpenAI Codex · GPT-3 后代</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">GPT-3</h3>
        <p className="ch-compare-body">文科生 · 什么都能聊</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">Codex</h3>
        <p className="ch-compare-body">理工科学霸 · 专精编程</p>
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
              <h3 className="ch-step-heading">支持的语言</h3>
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
        <Counter to={parseFloat("10,000,000+") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">10,000,000+</span>
        <span className="ch-data-label label-mono">GitHub 公开仓库</span>
      </div>
      <p className="ch-data-context">训练数据规模</p>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`# 在列表中找出最大值
    max_value = max(list)
    
    # 读取 CSV 文件并计算平均值
    import pandas as pd
    df = pd.read_csv('data.csv')
    avg = df['value'].mean()`} language="python" highlights={[]} />
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`def read_and_average(filepath):
        try:
            df = pd.read_csv(filepath)
            return df['value'].mean()
        except FileNotFoundError:
            print(f'文件 {filepath} 不存在')
            return None`} language="python" highlights={[]} />
    </div>
    );
  }

  return null;
}