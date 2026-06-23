import { MaskReveal } from "../../components/MaskReveal";
import { NetworkGraph, Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./BeyondCurrency.css";

export default function BeyondCurrency({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-flow ch-flow--horizontal">
        <NetworkGraph
          nodes={[
            { id: "condition", label: "条件触发" },
            { id: "contract", label: "智能合约" },
            { id: "execute", label: "自动执行" },
            { id: "result", label: "结果上链" },
          ]}
          edges={[
          ]}
          visibleNodes={4}
          stepTime={1.0}
        />
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">智能合约</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">代码就是法律</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">没有中间人，没有赖账的可能</p>
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
                <h3 className="ch-step-heading">DeFi 去中心化金融</h3>
                <p className="ch-step-text">借贷·交易·保险——无银行柜台</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={1} delay={0.35} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">02</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">NFT 数字艺术品</h3>
                <p className="ch-step-text">唯一归属标记·流转历史全透明</p>
              </div>
            </div>
          </Stagger>
          <Stagger index={2} delay={0.50} stepTime={0.7}>
            <div className="ch-step-item">
              <span className="ch-step-num">03</span>
              <div className="ch-step-body">
                <h3 className="ch-step-heading">供应链追踪</h3>
                <p className="ch-step-text">牛奶从牧场到货架·每步扫码上链</p>
              </div>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--eco" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
            <NetworkGraph nodes={[{ "id": "sc", "label": "智能合约", "highlight": true }, { "id": "defi", "label": "DeFi" }, { "id": "nft", "label": "NFT" }, { "id": "supply", "label": "供应链" }, { "id": "did", "label": "分布式身份" }, { "id": "dao", "label": "DAO" }]} edges={[{ "from": "sc", "to": "defi" }, { "from": "sc", "to": "nft" }, { "from": "sc", "to": "supply" }, { "from": "sc", "to": "did" }, { "from": "sc", "to": "dao" }]} visibleNodes={6} edgeColor={"var(--accent)"} accentColor={"var(--accent)"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">信任边界</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">从相信机构</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">到相信公开代码</p>
      </div>
    );
  }

  return null;
}
