import { NetworkGraph } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./BlockchainCore.css";

export default function BlockchainCore({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-flow ch-flow--horizontal bg-gradient-subtle">
        <NetworkGraph
          nodes={[
            { id: "bank", label: "银行 ✕" },
            { id: "n1", label: "节点" },
            { id: "n2", label: "节点" },
            { id: "n3", label: "节点" },
            { id: "n4", label: "节点" },
          ]}
          edges={[
            { from: "n1", to: "n2" },
            { from: "n2", to: "n3" },
            { from: "n3", to: "n4" },
            { from: "n4", to: "n1" },
            { from: "n1", to: "n3" },
          ]}
          visibleNodes={5}
          stepTime={1.0}
        />
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-flow ch-flow--horizontal bg-gradient-subtle">
        <NetworkGraph
          nodes={[
            { id: "sender", label: "小明 🔑" },
            { id: "tx", label: "签名广播" },
            { id: "verify", label: "全网验证 ✓" },
            { id: "block", label: "打包入块" },
            { id: "recv", label: "小红 ✓" },
          ]}
          edges={[
            { from: "sender", to: "tx" },
            { from: "tx", to: "verify" },
            { from: "verify", to: "block" },
            { from: "block", to: "recv" },
          ]}
          visibleNodes={5}
          stepTime={1.0}
        />
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-flow ch-flow--horizontal bg-gradient-subtle">
        <NetworkGraph
          nodes={[
            { id: "b1", label: "Block #100" },
            { id: "b2", label: "Block #101" },
            { id: "b3", label: "Block #102" },
            { id: "b4", label: "Block #103" },
            { id: "b5", label: "Block #104" },
          ]}
          edges={[
            { from: "b1", to: "b2" },
            { from: "b2", to: "b3" },
            { from: "b3", to: "b4" },
            { from: "b4", to: "b5" },
          ]}
          visibleNodes={5}
          stepTime={1.0}
        />
      </div>
    );
  }

  return null;
}
