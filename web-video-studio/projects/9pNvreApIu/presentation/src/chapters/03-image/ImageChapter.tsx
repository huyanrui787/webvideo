import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./image.css";

const PROJECT = "/api/projects/9pNvreApIu";

export default function ImageChapter({ step, stepTime }: ChapterStepProps) {
  // step 0 — 痛点：改不动
  if (step === 0) {
    return (
      <div className="im-scene scene-pad im-intro" key={step}>
        <Reveal from="left" stepTime={stepTime}>
          <span className="im-kicker">能力升级 · 02 生图</span>
        </Reveal>
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <h1 className="im-hero serif-cn">
            出图之后，<span className="im-accent">改不动</span>
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.45} stepTime={stepTime}>
          <p className="im-sub">这是用户反复提的痛点</p>
        </Reveal>
      </div>
    );
  }

  // step 1 — 旧流程：整张重跑
  if (step === 1) {
    return (
      <div className="im-scene scene-pad im-old" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="im-kicker">以前的做法</span>
        </Reveal>
        <div className="im-old-row">
          <Stagger interval={0.18} stepTime={stepTime}>
            <div className="im-old-card">换个背景</div>
            <div className="im-old-card">移除一个元素</div>
            <div className="im-old-card">调一个角落</div>
          </Stagger>
        </div>
        <Reveal from="up" delay={0.7} stepTime={stepTime}>
          <div className="im-rerun">
            <span className="im-rerun-arrow">↓</span>
            <span className="im-rerun-text">都得整张图重新跑一遍</span>
          </div>
        </Reveal>
      </div>
    );
  }

  // step 2 — 新增图片编辑器，点图片唤起工具栏
  if (step === 2) {
    return (
      <div className="im-scene scene-pad im-split" key={step}>
        <div className="im-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <span className="im-kicker">1.0 新增</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h2 className="im-mid serif-cn">图片编辑器</h2>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={stepTime}>
            <p className="im-note">点击图片，即可唤起编辑工具栏</p>
          </Reveal>
        </div>
        <Reveal from="right" delay={0.3} stepTime={stepTime}>
          <figure className="im-shot">
            <img src={`${PROJECT}/assets/WVtp7By1Vf.jpg`} alt="图片编辑器界面" />
            <figcaption>点击图片唤起编辑工具栏</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 3 — 框选 / 描述
  if (step === 3) {
    return (
      <div className="im-scene scene-pad im-two" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="im-kicker">两种改法</span>
        </Reveal>
        <div className="im-two-row">
          <Stagger interval={0.2} stepTime={stepTime}>
            <div className="im-two-card">
              <span className="im-two-num hero-num">A</span>
              <span className="im-two-t serif-cn">框选</span>
              <span className="im-two-d">圈出你想改的那一块</span>
            </div>
            <div className="im-two-card im-two-card-accent">
              <span className="im-two-num hero-num">B</span>
              <span className="im-two-t serif-cn">描述</span>
              <span className="im-two-d">直接说出你的需求</span>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  // step 4 — 编辑能力列表
  if (step === 4) {
    return (
      <div className="im-scene scene-pad im-tools" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="im-kicker">能做这些</span>
        </Reveal>
        <div className="im-tool-grid">
          <Stagger interval={0.12} stepTime={stepTime}>
            {["编辑文本", "快速编辑", "裁剪", "擦除"].map((t) => (
              <div className="im-tool-card" key={t}>
                <span className="im-tool-t serif-cn">{t}</span>
              </div>
            ))}
          </Stagger>
        </div>
      </div>
    );
  }

  // step 5 — 编辑器搬到幻灯片
  if (step === 5) {
    return (
      <div className="im-scene scene-pad im-split" key={step}>
        <div className="im-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <span className="im-kicker">同样上线</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h2 className="im-mid serif-cn">幻灯片编辑器</h2>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={stepTime}>
            <p className="im-note">同样能编辑文本、裁剪、擦除，<br />还新增了背景移除</p>
          </Reveal>
        </div>
        <Reveal from="right" delay={0.3} stepTime={stepTime}>
          <figure className="im-shot">
            <img src={`${PROJECT}/assets/jKsQvjfLSh.jpg`} alt="幻灯片编辑器界面" />
            <figcaption>幻灯片编辑器 · 快速编辑菜单</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 6 — 每页单独调
  return (
    <div className="im-scene scene-pad im-intro im-center" key={step}>
      <Reveal from="up" stepTime={stepTime}>
        <h1 className="im-hero serif-cn">
          每一页的元素和布局
        </h1>
      </Reveal>
      <Reveal from="up" delay={0.3} stepTime={stepTime}>
        <div className="im-emph-box">都能单独调</div>
      </Reveal>
    </div>
  );
}
