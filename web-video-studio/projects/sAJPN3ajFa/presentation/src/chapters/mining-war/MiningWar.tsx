import { MaskReveal } from "../../components/MaskReveal";
import { Counter, Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./MiningWar.css";

export default function MiningWar({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">挖矿</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">全球矿工竞赛 · 暴力破解数学题</p>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-data ch-data--single-stat">
        <div className="ch-data-primary">
          <Counter to={50} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">50 → 3.125</span>
          <span className="ch-data-label label-mono">BTC / 区块</span>
        </div>
        <p className="ch-data-context">2009: 50 → 2012: 25 → 2016: 12.5 → 2020: 6.25 → 2024: 3.125</p>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-data ch-data--single-stat">
        <div className="ch-data-primary">
          <Counter to={3.125} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">3.125</span>
          <span className="ch-data-label label-mono">BTC</span>
        </div>
        <p className="ch-data-context">每四年减半 · 总量锁死2100万枚 · 天然稀缺</p>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-steps ch-steps--numbered">
        <div className="ch-steps-list">
          <Reveal from="up" delay={0.2} stepTime={0.6}>
            <div className="ch-step-item">
              <span className="ch-step-num">01</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">中国水电站</h3>
                <p className="ch-step-text">丰水期电力过剩，矿场逐水电而居</p>
              </div>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={0.6}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">美国德州风电场</h3>
                <p className="ch-step-text">可再生能源驱动矿场，绿电挖矿</p>
              </div>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.6} stepTime={0.6}>
            <div className="ch-step-item">
              <span className="ch-step-num">03</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">冰岛地热能</h3>
                <p className="ch-step-text">天然冷却 + 清洁地热，理想矿场</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-data ch-data--single-stat">
        <div className="ch-data-primary">
          <Counter to={0} delay={0.2} stepTime={1.2} />
          <span className="ch-data-value">≈ 中等国家</span>
          <span className="ch-data-label label-mono">全网年耗电</span>
        </div>
        <p className="ch-data-context">超过部分中等国家全年用电量 · 绿色能源转型中</p>
      </div>
    );
  }

  else if (step === 5) {
    return (
      <div className="ch-comparison-table">
        <Stagger index={0} delay={0.1} stepTime={0.5}>
          <div className="ch-comparison-header" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-header-cell">
              攻击成本
            </div>
            <div className="ch-comparison-cell ch-comparison-header-cell">
              篡改收益
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.20} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">算力投入</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>重新计算所有后续区块</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>修改几笔交易</span>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.28} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">电力消耗</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>天文数字电力成本</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>微薄经济回报</span>
            </div>
          </div>
        </Stagger>
        <Stagger index={3} delay={0.36} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">结果</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>全网节点立刻拒绝</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>篡改数据无法生效</span>
            </div>
          </div>
        </Stagger>
      </div>
    );
  }

  return null;
}
