import { Reveal, Stagger } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./web-learn.css";

const PROJECT = "/api/projects/9pNvreApIu";

export default function WebLearnChapter({ step, stepTime }: ChapterStepProps) {
  // step 0 — 动态策展
  if (step === 0) {
    return (
      <div className="wl-scene scene-pad wl-intro" key={step}>
        <Reveal from="left" stepTime={stepTime}>
          <span className="wl-kicker">能力升级 · 04 网页</span>
        </Reveal>
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <h1 className="wl-hero serif-cn">
            新增<span className="wl-accent">动态策展</span>
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.45} stepTime={stepTime}>
          <p className="wl-sub">让网页跟着 Board 自动更新</p>
        </Reveal>
      </div>
    );
  }

  // step 1 — 旧痛点：手动更新重发
  if (step === 1) {
    return (
      <div className="wl-scene scene-pad wl-old" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="wl-kicker">以前的麻烦</span>
        </Reveal>
        <Stagger className="wl-old-flow" interval={0.18} stepTime={stepTime}>
          <div className="wl-old-card">新增一篇文章</div>
          <div className="wl-old-card">手动用 Agent 更新</div>
          <div className="wl-old-card">再发布一遍</div>
        </Stagger>
        <Reveal from="up" delay={0.7} stepTime={stepTime}>
          <p className="wl-old-foot">每加一条内容，都得重来一次</p>
        </Reveal>
      </div>
    );
  }

  // step 2 — @ 选中 Board 自动同步 + 案例
  if (step === 2) {
    return (
      <div className="wl-scene scene-pad wl-split" key={step}>
        <div className="wl-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <div className="wl-at">
              <span className="wl-at-symbol">@</span>
              <span className="wl-at-text">选中整个 Board</span>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.3} stepTime={stepTime}>
            <p className="wl-note">之后往 Board 里加内容，<br />网页自动同步展示，无需手动更新</p>
          </Reveal>
          <Stagger className="wl-scenes" interval={0.1} stepTime={stepTime}>
            {["作品集", "资料库", "博客", "灵感板"].map((t) => (
              <span className="wl-scene-tag" key={t}>{t}</span>
            ))}
          </Stagger>
        </div>
        <Reveal from="right" delay={0.4} stepTime={stepTime}>
          <figure className="wl-shot">
            <img src={`${PROJECT}/assets/W5a88sKALR.jpg`} alt="AI 日报网页自动更新" />
            <figcaption>工程师的 AI 日报网页 · 每天自动更新</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 3 — 学习接入 Browser Use
  if (step === 3) {
    return (
      <div className="wl-scene scene-pad wl-intro" key={step}>
        <Reveal from="left" stepTime={stepTime}>
          <span className="wl-kicker">能力升级 · 05 学习</span>
        </Reveal>
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <h1 className="wl-hero serif-cn">
            接入 <span className="wl-accent">Browser Use</span>
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.45} stepTime={stepTime}>
          <p className="wl-sub">Learn &amp; Research：多来源采集、交叉验证、出报告</p>
        </Reveal>
      </div>
    );
  }

  // step 4 — 对比：旧限制 vs 现在
  return (
    <div className="wl-scene scene-pad wl-compare" key={step}>
      <Reveal from="none" stepTime={stepTime}>
        <span className="wl-kicker">读取能力的飞跃</span>
      </Reveal>
      <div className="wl-compare-row">
        <Reveal from="left" delay={0.2} stepTime={stepTime}>
          <div className="wl-cmp-card wl-cmp-old">
            <span className="wl-cmp-label">以前</span>
            <span className="wl-cmp-t serif-cn">只能读摘要和快照</span>
            <span className="wl-cmp-d">登录、动态加载、反爬页面就失效</span>
          </div>
        </Reveal>
        <Reveal from="right" delay={0.4} stepTime={stepTime}>
          <div className="wl-cmp-card wl-cmp-new">
            <span className="wl-cmp-label">现在</span>
            <span className="wl-cmp-t serif-cn">直接操作浏览器</span>
            <span className="wl-cmp-d">允许登录、读实时内容、动态加载数据</span>
          </div>
        </Reveal>
      </div>
      <Reveal from="up" delay={0.6} stepTime={stepTime}>
        <figure className="wl-shot wl-shot-wide">
          <img src={`${PROJECT}/assets/Q9L_OTfKth.jpg`} alt="开启浏览器权限界面" />
          <figcaption>在「任务」对话中开启浏览器权限</figcaption>
        </figure>
      </Reveal>
    </div>
  );
}
