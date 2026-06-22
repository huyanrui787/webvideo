import { Reveal, Stagger, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./coldopen.css";

const SAME = ["AI 味", "AI 味", "AI 味", "AI 味", "AI 味", "AI 味", "AI 味", "AI 味"];

const DIRECTIONS = [
  { en: "WRITE", cn: "写作" },
  { en: "IMAGE", cn: "生图" },
  { en: "VIDEO", cn: "音视频" },
  { en: "SLIDES", cn: "幻灯片" },
  { en: "WEB", cn: "网页" },
  { en: "LEARN", cn: "学习" },
];

export default function ColdopenChapter({ step, stepTime }: ChapterStepProps) {
  // step 0 — 抛出问题
  if (step === 0) {
    return (
      <div className="co-scene scene-pad co-center" key={step}>
        <span className="co-kicker">YOUMIND 1.0</span>
        <h1 className="co-question">
          <TypeWriter
            text="AI 做出来的东西，一眼就能认出来？"
            speed={55}
            stepTime={stepTime}
          />
        </h1>
        <span className="co-cursor-bar" />
      </div>
    );
  }

  // step 1 — 千篇一律的网格
  if (step === 1) {
    return (
      <div className="co-scene scene-pad co-center" key={step}>
        <div className="co-grid">
          <Stagger interval={0.06} stepTime={stepTime}>
            {SAME.map((t, i) => (
              <div className="co-cell" key={i}>
                {t}
              </div>
            ))}
          </Stagger>
        </div>
        <Reveal from="up" delay={0.6} stepTime={stepTime}>
          <p className="co-caption">相同句式、相同配色、相同节奏</p>
        </Reveal>
      </div>
    );
  }

  // step 2 — YouMind 1.0 登场
  if (step === 2) {
    return (
      <div className="co-scene scene-pad co-center" key={step}>
        <Reveal from="up" stepTime={stepTime}>
          <h1 className="co-logo display-en">YOUMIND</h1>
        </Reveal>
        <Reveal from="up" delay={0.25} stepTime={stepTime}>
          <div className="co-version-row">
            <span className="co-bar" />
            <span className="co-version hero-num">1.0</span>
          </div>
        </Reveal>
        <Reveal from="none" delay={0.55} stepTime={stepTime}>
          <p className="co-sub">就是来解决「一眼 AI」的</p>
        </Reveal>
      </div>
    );
  }

  // step 3 — 看家本领是创作
  if (step === 3) {
    return (
      <div className="co-scene scene-pad co-left" key={step}>
        <Reveal from="left" stepTime={stepTime}>
          <span className="co-kicker">立身之本</span>
        </Reveal>
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <h1 className="co-big serif-cn">
            看家本领是<span className="co-accent">创作</span>
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.45} stepTime={stepTime}>
          <p className="co-line">覆盖六大方向</p>
        </Reveal>
      </div>
    );
  }

  // step 4 — 六大方向
  if (step === 4) {
    return (
      <div className="co-scene scene-pad co-dirs" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="co-kicker">六大创作能力</span>
        </Reveal>
        <div className="co-dir-grid">
          <Stagger interval={0.1} stepTime={stepTime}>
            {DIRECTIONS.map((d, i) => (
              <div className="co-dir-card" key={d.en}>
                <span className="co-dir-num hero-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="co-dir-cn serif-cn">{d.cn}</span>
                <span className="co-dir-en">{d.en}</span>
              </div>
            ))}
          </Stagger>
        </div>
      </div>
    );
  }

  // step 5 — 沉淀审美和门道
  return (
    <div className="co-scene scene-pad co-center" key={step}>
      <Reveal from="up" stepTime={stepTime}>
        <h1 className="co-big serif-cn">
          每个方向都沉淀了
        </h1>
      </Reveal>
      <Reveal from="up" delay={0.3} stepTime={stepTime}>
        <div className="co-emph-row">
          <span className="co-emph-box">这个领域的审美</span>
          <span className="co-plus">+</span>
          <span className="co-emph-box co-emph-box-accent">创作的门道</span>
        </div>
      </Reveal>
    </div>
  );
}
