import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./writing.css";

const PROJECT = "/api/projects/9pNvreApIu";

const GENRES = [
  { en: "Essay", cn: "观点文章" },
  { en: "Story", cn: "剧本小说" },
  { en: "Professional", cn: "商务写作" },
  { en: "Technical", cn: "技术文档" },
  { en: "Emails & Letters", cn: "邮件信函" },
  { en: "Marketing", cn: "营销文案" },
];

export default function WritingChapter({ step, stepTime }: ChapterStepProps) {
  // step 0 — 写作是最高频
  if (step === 0) {
    return (
      <div className="wr-scene scene-pad wr-intro" key={step}>
        <Reveal from="left" stepTime={stepTime}>
          <span className="wr-kicker">能力升级 · 01 写作</span>
        </Reveal>
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <h1 className="wr-hero serif-cn">
            最高频的<span className="wr-accent">创作场景</span>
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.45} stepTime={stepTime}>
          <p className="wr-sub">YouMind 上写得最多的，就是它</p>
        </Reveal>
      </div>
    );
  }

  // step 1 — 六种题材
  if (step === 1) {
    return (
      <div className="wr-scene scene-pad wr-genres" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="wr-kicker">归纳出六种写作题材</span>
        </Reveal>
        <div className="wr-genre-grid">
          <Stagger interval={0.1} stepTime={stepTime}>
            {GENRES.map((g, i) => (
              <div className="wr-genre-card" key={g.en}>
                <span className="wr-genre-num hero-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="wr-genre-text">
                  <span className="wr-genre-en">{g.en}</span>
                  <span className="wr-genre-cn">{g.cn}</span>
                </div>
              </div>
            ))}
          </Stagger>
        </div>
      </div>
    );
  }

  // step 2 — 每种做成内置 Skill，AI 自动判断
  if (step === 2) {
    return (
      <div className="wr-scene scene-pad wr-split" key={step}>
        <div className="wr-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <span className="wr-kicker">内置 Skill</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h2 className="wr-mid serif-cn">AI 自动判断你在写什么</h2>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={stepTime}>
            <p className="wr-note">
              比如识别出你在写邮件，<br />自动运行 Emails &amp; Letters Skill
            </p>
          </Reveal>
        </div>
        <Reveal from="right" delay={0.3} stepTime={stepTime}>
          <figure className="wr-shot">
            <img src={`${PROJECT}/assets/7d6JLmI3_C.jpg`} alt="邮件写作 Skill 界面" />
            <figcaption>自动运行 Emails &amp; Letters 内置 Skill</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 3 — 按题材标准采集/构思/产出
  if (step === 3) {
    return (
      <div className="wr-scene scene-pad wr-flow" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="wr-kicker">按这个题材的标准来</span>
        </Reveal>
        <div className="wr-flow-row">
          <Stagger interval={0.18} stepTime={stepTime}>
            {[
              { t: "采集", d: "按题材找对的资料" },
              { t: "构思", d: "用对的结构搭框架" },
              { t: "产出", d: "写出这个题材该有的样子" },
            ].map((s, i) => (
              <div className="wr-flow-step" key={s.t}>
                <span className="wr-flow-idx hero-num">{i + 1}</span>
                <span className="wr-flow-t serif-cn">{s.t}</span>
                <span className="wr-flow-d">{s.d}</span>
              </div>
            ))}
          </Stagger>
        </div>
      </div>
    );
  }

  // step 4 — 精准改动：选中一个词
  if (step === 4) {
    return (
      <div className="wr-scene scene-pad wr-edit" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="wr-kicker">段落级精准改动</span>
        </Reveal>
        <Reveal from="up" delay={0.15} stepTime={stepTime}>
          <div className="wr-doc">
            <p className="wr-doc-line">这一段写得不错，先放着。</p>
            <p className="wr-doc-line">
              选中这<span className="wr-sel">一个词</span>，AI 只改它。
            </p>
            <p className="wr-doc-line">其余的内容，原封不动。</p>
          </div>
        </Reveal>
        <Reveal from="up" delay={0.5} stepTime={stepTime}>
          <p className="wr-sub">选中一段、一句、甚至某个词</p>
        </Reveal>
      </div>
    );
  }

  // step 5 — 指哪打哪
  return (
    <div className="wr-scene scene-pad wr-intro wr-center" key={step}>
      <Reveal from="up" stepTime={stepTime}>
        <h1 className="wr-hero serif-cn">
          真正做到<span className="wr-accent">指哪打哪</span>
        </h1>
      </Reveal>
      <Reveal from="right" delay={0.3} stepTime={stepTime}>
        <figure className="wr-shot wr-shot-wide">
          <img src={`${PROJECT}/assets/nZuF7h56PD.jpg`} alt="精准改动到词的编辑界面" />
          <figcaption>精准改动到词</figcaption>
        </figure>
      </Reveal>
    </div>
  );
}
