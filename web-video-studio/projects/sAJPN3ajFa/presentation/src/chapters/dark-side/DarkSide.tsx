import { Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./DarkSide.css";

export default function DarkSide({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-comparison-table">
        <Stagger index={0} delay={0.1} stepTime={0.5}>
          <div className="ch-comparison-header" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-header-cell">
              争议
            </div>
            <div className="ch-comparison-cell ch-comparison-header-cell">
              事实
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.20} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">暗网交易</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>丝绸之路 · 勒索病毒</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>区块链交易公开可查</span>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.28} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">匿名性</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>曾被用于洗钱</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>执法机构链上追踪能力强</span>
            </div>
          </div>
        </Stagger>
        <Stagger index={3} delay={0.36} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">犯罪工具</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>匿名犯罪印象</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>每笔交易永久留痕</span>
            </div>
          </div>
        </Stagger>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-comparison-table">
        <Stagger index={0} delay={0.1} stepTime={0.5}>
          <div className="ch-comparison-header" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-header-cell">
              风险
            </div>
            <div className="ch-comparison-cell ch-comparison-header-cell">
              进展
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.20} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">能源消耗</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>年耗电 ≈ 中等国家</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>矿场转向绿色能源</span>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.28} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">价格波动</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>日涨跌可达百分之几十</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>高风险数字资产</span>
            </div>
          </div>
        </Stagger>
        <Stagger index={3} delay={0.36} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">环保批评</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>环保争议声浪</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>利用闲置电力 · 地热风能</span>
            </div>
          </div>
        </Stagger>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-comparison-table">
        <Stagger index={0} delay={0.1} stepTime={0.5}>
          <div className="ch-comparison-header" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-header-cell">
              支持
            </div>
            <div className="ch-comparison-cell ch-comparison-header-cell">
              禁止
            </div>
          </div>
        </Stagger>
        <Stagger index={1} delay={0.20} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">法定地位</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>萨尔瓦多：法定货币</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>部分国家：严厉禁止</span>
            </div>
          </div>
        </Stagger>
        <Stagger index={2} delay={0.28} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">金融市场</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>美国：ETF 获批</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>监管政策仍在剧烈变化</span>
            </div>
          </div>
        </Stagger>
        <Stagger index={3} delay={0.36} stepTime={0.4}>
          <div className="ch-comparison-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="ch-comparison-cell ch-comparison-label">趋势</div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>机构持续买入</span>
            </div>
            <div className="ch-comparison-cell ch-comparison-value">
              <span>仍在野蛮生长阶段</span>
            </div>
          </div>
        </Stagger>
      </div>
    );
  }

  return null;
}
