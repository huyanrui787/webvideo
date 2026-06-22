import { Reveal, Counter, NetworkGraph } from "../../primitives";
import type { ChapterStepProps, } from "../../registry/types";
import type { GraphNode, GraphEdge } from "../../primitives";
import "./science.css";

const GENOME_NODES: GraphNode[] = [
  { id: "data", x: 360, y: 540, label: "138 物种数据", highlight: true },
  { id: "h1", x: 760, y: 320, label: "细胞样本" },
  { id: "h2", x: 760, y: 540, label: "特征工程" },
  { id: "h3", x: 760, y: 760, label: "标注" },
  { id: "model", x: 1180, y: 540, label: "自训 ML 模型", highlight: true },
  { id: "out", x: 1560, y: 540, label: "超越 Science", highlight: true },
];
const GENOME_EDGES: GraphEdge[] = [
  { from: "data", to: "h1" },
  { from: "data", to: "h2" },
  { from: "data", to: "h3" },
  { from: "h1", to: "model" },
  { from: "h2", to: "model" },
  { from: "h3", to: "model" },
  { from: "model", to: "out" },
];

export default function Science({ step, stepTime }: ChapterStepProps) {
  // step 0 — 提效 → 性质变了分界
  if (step === 0) {
    return (
      <div className="sc-scene sc-dark scene-pad" key={step}>
        <div className="sc-center">
          <Reveal from="left" stepTime={stepTime}>
            <div className="sc-divide">
              <span className="sc-old">编程 / 视觉 = 提效</span>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.35} stepTime={stepTime}>
            <h1 className="sc-turn">生命科学，性质变了</h1>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 1 — 蛋白质设计全自动流程
  if (step === 1) {
    return (
      <div className="sc-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="sc-kicker">蛋白质设计 · Mythos 5 全自动</span>
        </Reveal>
        <div className="sc-flow">
          {["选靶点", "跑设计", "失败自纠错"].map((s, i) => (
            <Reveal key={s} from="left" delay={0.2 + i * 0.25} stepTime={stepTime}>
              <div className="sc-flow-step">
                <span className="sc-flow-idx">{i + 1}</span>
                <span className="sc-flow-name">{s}</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal from="up" delay={1.0} stepTime={stepTime}>
          <p className="sc-sub">从头到尾，没人插手</p>
        </Reveal>
      </div>
    );
  }

  // step 2 — 14 靶点 9 强候选
  if (step === 2) {
    return (
      <div className="sc-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="sc-kicker">疾病靶点战果</span>
        </Reveal>
        <div className="sc-score-row">
          <Reveal from="up" delay={0.15} stepTime={stepTime}>
            <div className="sc-score-cell">
              <Counter to={14} className="hero-num sc-score-num sc-num-mute" stepTime={stepTime} />
              <span className="sc-score-label">个疾病靶点</span>
            </div>
          </Reveal>
          <Reveal from="none" delay={0.4} stepTime={stepTime}>
            <span className="sc-score-arrow">→</span>
          </Reveal>
          <Reveal from="up" delay={0.6} stepTime={stepTime}>
            <div className="sc-score-cell">
              <Counter to={9} className="hero-num sc-score-num sc-num-accent" stepTime={stepTime} />
              <span className="sc-score-label">个强候选方案</span>
            </div>
          </Reveal>
        </div>
        <Reveal from="up" delay={1.0} stepTime={stepTime}>
          <p className="sc-sub">覆盖免疫、神经退行性、肌肉疾病</p>
        </Reveal>
      </div>
    );
  }

  // step 3 — 基因组学自主搜集
  if (step === 3) {
    return (
      <div className="sc-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="sc-kicker">基因组学 · 一周多，几乎没人管</span>
        </Reveal>
        <div className="sc-graph-wrap">
          <NetworkGraph
            nodes={GENOME_NODES}
            edges={GENOME_EDGES}
            visibleNodes={4}
            nodeColor="var(--text)"
            edgeColor="var(--text-mute)"
            fontSize={24}
            stepTime={stepTime}
          />
        </div>
        <Reveal from="up" delay={0.8} stepTime={stepTime}>
          <p className="sc-sub">自己搜集 138 个物种、几百万个细胞的数据</p>
        </Reveal>
      </div>
    );
  }

  // step 4 — 自训 ML 模型超越 Science
  if (step === 4) {
    return (
      <div className="sc-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="sc-kicker">基因组学 · 自己设计、自己训练</span>
        </Reveal>
        <div className="sc-graph-wrap">
          <NetworkGraph
            nodes={GENOME_NODES}
            edges={GENOME_EDGES}
            visibleNodes={6}
            nodeColor="var(--text)"
            edgeColor="var(--text-mute)"
            fontSize={24}
            stepTime={stepTime}
          />
        </div>
        <Reveal from="up" delay={0.8} stepTime={stepTime}>
          <p className="sc-sub">训出的模型，超越了近期发在 <span className="sc-hl">Science</span> 上的同类研究</p>
        </Reveal>
      </div>
    );
  }

  // step 5 — 小 100 倍性能反超
  return (
    <div className="sc-scene sc-dark scene-pad" key={step}>
      <div className="sc-center sc-center-mid">
        <Reveal from="up" stepTime={stepTime}>
          <div className="sc-final-line">
            <span className="sc-final-text">体量小</span>
            <Counter to={100} unit="倍" className="hero-num sc-final-num" stepTime={stepTime} />
          </div>
        </Reveal>
        <Reveal from="up" delay={0.4} stepTime={stepTime}>
          <h1 className="sc-final-punch">性能反超</h1>
        </Reveal>
      </div>
    </div>
  );
}
