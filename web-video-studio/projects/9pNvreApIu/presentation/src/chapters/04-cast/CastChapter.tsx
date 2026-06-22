import { Reveal, Stagger, DrawPath } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./cast.css";

const PROJECT = "/api/projects/9pNvreApIu";

const CAST_STAGES = [
  { t: "脚本", d: "Storyboard" },
  { t: "参考素材", d: "References" },
  { t: "分镜画面", d: "Shots" },
  { t: "配音音轨", d: "Voice" },
  { t: "组装成片", d: "Final cut" },
];

export default function CastChapter({ step, stepTime }: ChapterStepProps) {
  // step 0 — 重头戏：音视频
  if (step === 0) {
    return (
      <div className="ct-scene scene-pad ct-intro" key={step}>
        <Reveal from="left" stepTime={stepTime}>
          <span className="ct-kicker">能力升级 · 03 音视频</span>
        </Reveal>
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <h1 className="ct-hero serif-cn">
            重头戏：<span className="ct-accent">智能成片</span>
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.45} stepTime={stepTime}>
          <p className="ct-sub">把幻灯片，快速做成讲解视频</p>
        </Reveal>
      </div>
    );
  }

  // step 1 — 幻灯片 → 视频
  if (step === 1) {
    return (
      <div className="ct-scene scene-pad ct-transform" key={step}>
        <Reveal from="left" stepTime={stepTime}>
          <div className="ct-box">
            <span className="ct-box-cn serif-cn">幻灯片</span>
            <span className="ct-box-en">SLIDES</span>
          </div>
        </Reveal>
        <Reveal from="none" delay={0.4} stepTime={stepTime}>
          <div className="ct-oneclick">
            <span className="ct-oneclick-arrow">→</span>
            <span className="ct-oneclick-text">One-click video creation</span>
          </div>
        </Reveal>
        <Reveal from="right" delay={0.7} stepTime={stepTime}>
          <div className="ct-box ct-box-accent">
            <span className="ct-box-cn serif-cn">讲解视频</span>
            <span className="ct-box-en">VIDEO</span>
          </div>
        </Reveal>
      </div>
    );
  }

  // step 2 — 每页脚本 → 音频 → 整合
  if (step === 2) {
    return (
      <div className="ct-scene scene-pad ct-flow" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="ct-kicker">成片三步</span>
        </Reveal>
        <div className="ct-flow-row">
          <Stagger interval={0.2} stepTime={stepTime}>
            {[
              { t: "每页脚本", d: "按内容生成脚本文档" },
              { t: "生成音频", d: "脚本配上讲解音频" },
              { t: "整合音轨", d: "音轨整合回幻灯片" },
            ].map((s, i) => (
              <div className="ct-flow-step" key={s.t}>
                <span className="ct-flow-idx hero-num">{i + 1}</span>
                <span className="ct-flow-t serif-cn">{s.t}</span>
                <span className="ct-flow-d">{s.d}</span>
              </div>
            ))}
          </Stagger>
        </div>
        <Reveal from="up" delay={0.8} stepTime={stepTime}>
          <figure className="ct-shot ct-shot-wide">
            <img src={`${PROJECT}/assets/676SZL0hIP.jpg`} alt="智能成片界面" />
            <figcaption>一键智能成片</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 3 — 可调项
  if (step === 3) {
    return (
      <div className="ct-scene scene-pad ct-split" key={step}>
        <div className="ct-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <span className="ct-kicker">每个环节都能改</span>
          </Reveal>
          <div className="ct-tags">
            <Stagger interval={0.12} stepTime={stepTime}>
              {["背景音乐", "讲解人声", "字幕", "转场"].map((t) => (
                <span className="ct-tag" key={t}>{t}</span>
              ))}
            </Stagger>
          </div>
          <Reveal from="up" delay={0.7} stepTime={stepTime}>
            <p className="ct-note">单页脚本也能改，再重新生成对应音频</p>
          </Reveal>
        </div>
        <Reveal from="right" delay={0.3} stepTime={stepTime}>
          <figure className="ct-shot">
            <img src={`${PROJECT}/assets/LNluCDc97L.jpg`} alt="成片调整界面" />
            <figcaption>自由调整背景音乐、人声、字幕</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 4 — Cast 概念
  if (step === 4) {
    return (
      <div className="ct-scene scene-pad ct-cast" key={step}>
        <Reveal from="up" stepTime={stepTime}>
          <h1 className="ct-cast-name display-en">CAST</h1>
        </Reveal>
        <Reveal from="up" delay={0.25} stepTime={stepTime}>
          <p className="ct-cast-def">把视频制作拆成步骤，每一步都可控调整</p>
        </Reveal>
        <Reveal from="up" delay={0.5} stepTime={stepTime}>
          <div className="ct-cast-why">
            <span className="ct-cast-why-t">视频门槛最高</span>
            <span className="ct-cast-why-d">脚本 · 分镜 · 素材 · 配音 · 剪辑 · 配乐，缺一不可</span>
          </div>
        </Reveal>
      </div>
    );
  }

  // step 5 — 案例：15s 耳机广告
  if (step === 5) {
    return (
      <div className="ct-scene scene-pad ct-split" key={step}>
        <div className="ct-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <span className="ct-kicker">Create cast 技能</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h2 className="ct-mid serif-cn">
              做个 <span className="ct-accent">15s</span> 耳机广告
            </h2>
          </Reveal>
          <Reveal from="up" delay={0.4} stepTime={stepTime}>
            <p className="ct-note">在「任务」对话框里唤起，<br />简单描述你想要的视频内容</p>
          </Reveal>
        </div>
        <Reveal from="right" delay={0.3} stepTime={stepTime}>
          <figure className="ct-shot">
            <img src={`${PROJECT}/assets/qKjzA44Yol.jpg`} alt="Create cast 唤起界面" />
            <figcaption>唤起 Create cast 技能</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 6 — Create cast 流程链
  if (step === 6) {
    return (
      <div className="ct-scene scene-pad ct-chain" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="ct-kicker">每一步请你确认、允许调整</span>
        </Reveal>
        <div className="ct-chain-wrap">
          <svg className="ct-chain-svg" viewBox="0 0 1700 60" preserveAspectRatio="none">
            <DrawPath
              d="M 60 30 L 1640 30"
              color="var(--accent)"
              strokeWidth={4}
              duration={1.4}
              stepTime={stepTime}
            />
          </svg>
          <div className="ct-chain-row">
            <Stagger interval={0.22} stepTime={stepTime}>
              {CAST_STAGES.map((s, i) => (
                <div className="ct-chain-node" key={s.t}>
                  <span className="ct-chain-idx hero-num">{i + 1}</span>
                  <span className="ct-chain-t serif-cn">{s.t}</span>
                  <span className="ct-chain-d">{s.d}</span>
                </div>
              ))}
            </Stagger>
          </div>
        </div>
        <Reveal from="up" delay={1} stepTime={stepTime}>
          <figure className="ct-shot ct-shot-wide">
            <img src={`${PROJECT}/assets/r-Ztbpm4JO.jpg`} alt="Create cast Storyboard 流程" />
            <figcaption>生成 Storyboard → 分镜 → 音轨 → 组装成片</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 7 — 真人肖像 + 声音克隆
  return (
    <div className="ct-scene scene-pad ct-clone" key={step}>
      <Reveal from="none" stepTime={stepTime}>
        <span className="ct-kicker">基于 Seedance 2.0</span>
      </Reveal>
      <div className="ct-clone-row">
        <Stagger interval={0.2} stepTime={stepTime}>
          <div className="ct-clone-card">
            <span className="ct-clone-t serif-cn">真人肖像</span>
            <span className="ct-clone-d">上传肖像作为视频角色参考</span>
          </div>
          <div className="ct-clone-card ct-clone-card-accent">
            <span className="ct-clone-t serif-cn">声音克隆</span>
            <span className="ct-clone-d">用你自己的音色配音</span>
          </div>
        </Stagger>
      </div>
      <Reveal from="up" delay={0.6} stepTime={stepTime}>
        <p className="ct-clone-foot">用自己的形象和声音出镜，更有辨识度</p>
      </Reveal>
    </div>
  );
}
