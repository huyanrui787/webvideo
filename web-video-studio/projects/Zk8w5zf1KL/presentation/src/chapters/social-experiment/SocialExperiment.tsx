import { MaskReveal } from "../../components/MaskReveal";
import { NetworkGraph } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./SocialExperiment.css";

export default function SocialExperiment({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">比特币真正厉害的地方在哪？</span>
          </MaskReveal>
        </h1>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">一场社会实验</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">不依赖任何人·只信数学</p>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-flow ch-flow--horizontal bg-gradient-subtle">
        <NetworkGraph
          nodes={[
            { id: "btc", label: "₿ 比特币" },
            { id: "defi", label: "DeFi" },
            { id: "nft", label: "NFT" },
            { id: "web3", label: "Web3" },
            { id: "open", label: "开放世界" },
          ]}
          edges={[
            { from: "btc", to: "defi" },
            { from: "btc", to: "nft" },
            { from: "btc", to: "web3" },
            { from: "defi", to: "open" },
            { from: "nft", to: "open" },
            { from: "web3", to: "open" },
          ]}
          visibleNodes={5}
          stepTime={1.0}
        />
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-quote ch-quote--centered bg-gradient-bold">
        <blockquote className="ch-quote-text pull-quote">
          <MaskReveal show duration={1100}>
            <span className="serif-cn">它已经像一把钥匙，打开了一个更开放、更透明、你自己掌握资产的新世界。</span>
          </MaskReveal>
        </blockquote>
        <cite className="ch-quote-attribution">— 了解它·看清这个数字时代的变迁</cite>
      </div>
    );
  }

  return null;
}
