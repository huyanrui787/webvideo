import { MaskReveal } from "../../components/MaskReveal";
import { NetworkGraph, Reveal, Stagger, WaveForm } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./VillageLedger.css";

export default function VillageLedger({ step }: ChapterStepProps): React.JSX.Element | null {
  if (step === 0) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-subtle">
        <div className="kicker">一个故事</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">想象一下，你住在一个村子里。</span>
          </MaskReveal>
        </h1>
      </div>
    );
  }

  else if (step === 1) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--network" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={1}>
            <NetworkGraph nodes={[{ "id": "chief", "label": "村长·唯一记账人", "highlight": true }, { "id": "zhang", "label": "张三" }, { "id": "li", "label": "李四" }, { "id": "wang", "label": "王五" }, { "id": "zhao", "label": "赵六" }]} edges={[{ "from": "chief", "to": "zhang" }, { "from": "chief", "to": "li" }, { "from": "chief", "to": "wang" }, { "from": "chief", "to": "zhao" }]} visibleNodes={5} edgeColor={"var(--rule)"} accentColor={"var(--accent)"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 2) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--alert" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 3) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--mesh" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
            <NetworkGraph nodes={[{ "id": "zhang", "label": "张三" }, { "id": "li", "label": "李四" }, { "id": "wang", "label": "王五" }, { "id": "zhao", "label": "赵六" }, { "id": "sun", "label": "孙七" }]} edges={[{ "from": "zhang", "to": "li" }, { "from": "zhang", "to": "wang" }, { "from": "li", "to": "wang" }, { "from": "li", "to": "zhao" }, { "from": "wang", "to": "sun" }, { "from": "zhao", "to": "sun" }, { "from": "zhang", "to": "zhao" }, { "from": "wang", "to": "zhao" }]} visibleNodes={5} edgeColor={"var(--accent)"} accentColor={"var(--accent)"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 4) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--broadcast" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.6}>
            <WaveForm variant={"pulse"} amplitude={0.2} color={"var(--accent)"} />
            <NetworkGraph nodes={[{ "id": "zhang", "label": "张三", "highlight": true }, { "id": "li", "label": "李四", "highlight": true }, { "id": "wang", "label": "王五" }, { "id": "zhao", "label": "赵六" }, { "id": "sun", "label": "孙七" }]} edges={[{ "from": "zhang", "to": "li", "label": "转账" }, { "from": "zhang", "to": "wang" }, { "from": "li", "to": "wang" }, { "from": "li", "to": "zhao" }, { "from": "wang", "to": "sun" }, { "from": "zhao", "to": "sun" }, { "from": "zhang", "to": "zhao" }, { "from": "wang", "to": "zhao" }]} visibleNodes={5} edgeColor={"var(--accent)"} accentColor={"var(--accent)"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 5) {
    return (
      <div className="ch-composed ch-composed--stack">
        <div className="ch-composed-region ch-composed-region--stamp" style={{ gridArea: "1/1" }}>
          <Reveal from="up" delay={0} stepTime={0.8}>
            <Stagger interval={0.3} from={"up"} />
          </Reveal>
        </div>
      </div>
    );
  }

  else if (step === 6) {
    return (
      <div className="ch-hero ch-hero--centered bg-gradient-bold">
        <div className="kicker">核心定义</div>
        <h1 className="ch-hero-title">
          <MaskReveal show duration={900}>
            <span className="serif-cn">这就是区块链</span>
          </MaskReveal>
        </h1>
        <p className="ch-hero-sub">集体维护、不可篡改的分布式账本</p>
      </div>
    );
  }

  return null;
}
