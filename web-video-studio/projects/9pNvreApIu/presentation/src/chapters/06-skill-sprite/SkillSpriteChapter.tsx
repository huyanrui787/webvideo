import { Reveal, Stagger, Counter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./skill-sprite.css";

const PROJECT = "/api/projects/9pNvreApIu";

export default function SkillSpriteChapter({ step, stepTime }: ChapterStepProps) {
  // step 0 — 创作者激励计划
  if (step === 0) {
    return (
      <div className="ss-scene scene-pad ss-intro" key={step}>
        <Reveal from="left" stepTime={stepTime}>
          <span className="ss-kicker">第二部分 · 生态</span>
        </Reveal>
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <h1 className="ss-hero serif-cn">
            创作者<span className="ss-accent">激励计划</span>
          </h1>
        </Reveal>
        <Reveal from="up" delay={0.45} stepTime={stepTime}>
          <p className="ss-sub">把工作流，变成能赚钱的产品</p>
        </Reveal>
      </div>
    );
  }

  // step 1 — 打包成 Skill 流程
  if (step === 1) {
    return (
      <div className="ss-scene scene-pad ss-flow" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="ss-kicker">怎么变现</span>
        </Reveal>
        <div className="ss-flow-row">
          <Stagger interval={0.18} stepTime={stepTime}>
            {[
              { t: "打包工作流", d: "做成可复用的 Skill" },
              { t: "积分定价", d: "上架 YouMind 技能广场" },
              { t: "赚奖励金", d: "别人用，你得收益" },
            ].map((s, i) => (
              <div className="ss-flow-step" key={s.t}>
                <span className="ss-flow-idx hero-num">{i + 1}</span>
                <span className="ss-flow-t serif-cn">{s.t}</span>
                <span className="ss-flow-d">{s.d}</span>
              </div>
            ))}
          </Stagger>
        </div>
        <Reveal from="up" delay={0.7} stepTime={stepTime}>
          <p className="ss-foot">自然语言编排，<span className="ss-accent">不懂代码也能</span>把认知产品化</p>
        </Reveal>
      </div>
    );
  }

  // step 2 — 数据
  if (step === 2) {
    return (
      <div className="ss-scene scene-pad ss-data" key={step}>
        <div className="ss-data-row">
          <Reveal from="up" stepTime={stepTime}>
            <div className="ss-data-card">
              <Counter to={2000} prefix="" unit="+" className="hero-num ss-num" stepTime={stepTime} />
              <span className="ss-data-label">技能广场已上架 Skill</span>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.3} stepTime={stepTime}>
            <div className="ss-data-card ss-data-card-accent">
              <Counter to={2000} prefix="$" className="hero-num ss-num" stepTime={stepTime} />
              <span className="ss-data-label">有创作者赚到的第一笔收入</span>
            </div>
          </Reveal>
        </div>
        <Reveal from="up" delay={0.6} stepTime={stepTime}>
          <figure className="ss-shot">
            <img src={`${PROJECT}/assets/8f9-G74es9.jpg`} alt="创作者收益统计" />
            <figcaption>创作者奖励计划 · 收益与积分统计</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 3 — 任务型 AI 的局限
  if (step === 3) {
    return (
      <div className="ss-scene scene-pad ss-task" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="ss-kicker">第三部分 · 精灵 Sprite</span>
        </Reveal>
        <Reveal from="up" delay={0.2} stepTime={stepTime}>
          <div className="ss-task-loop">
            <span className="ss-task-item">给指令</span>
            <span className="ss-task-arrow">→</span>
            <span className="ss-task-item">完成</span>
            <span className="ss-task-arrow">→</span>
            <span className="ss-task-item ss-task-end">对话结束</span>
          </div>
        </Reveal>
        <Reveal from="up" delay={0.5} stepTime={stepTime}>
          <h2 className="ss-mid serif-cn">
            但创作是<span className="ss-accent">连续的</span>
          </h2>
        </Reveal>
        <Reveal from="up" delay={0.7} stepTime={stepTime}>
          <p className="ss-sub">每开个新对话，它又什么都不记得了</p>
        </Reveal>
      </div>
    );
  }

  // step 4 — 精灵：Memory + Soul
  if (step === 4) {
    return (
      <div className="ss-scene scene-pad ss-split" key={step}>
        <div className="ss-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <h2 className="ss-mid serif-cn">精灵 Sprite</h2>
          </Reveal>
          <div className="ss-docs">
            <Stagger interval={0.18} stepTime={stepTime}>
              <div className="ss-doc-card">
                <span className="ss-doc-en">Memory</span>
                <span className="ss-doc-cn">长期记忆文档 · 记得你做过聊过的一切</span>
              </div>
              <div className="ss-doc-card ss-doc-card-accent">
                <span className="ss-doc-en">Soul</span>
                <span className="ss-doc-cn">可编辑灵魂文档 · 知道你是谁、在意什么</span>
              </div>
            </Stagger>
          </div>
        </div>
        <Reveal from="right" delay={0.4} stepTime={stepTime}>
          <figure className="ss-shot">
            <img src={`${PROJECT}/assets/4CAIJ-Xh6E.jpg`} alt="Board 内唤起精灵" />
            <figcaption>在 Board 工作区里唤起精灵</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 5 — 接 IM + 任务 vs 精灵
  return (
    <div className="ss-scene scene-pad ss-split" key={step}>
      <div className="ss-split-left">
        <Reveal from="left" stepTime={stepTime}>
          <span className="ss-kicker">还能接到 IM</span>
        </Reveal>
        <div className="ss-im">
          <Stagger interval={0.15} stepTime={stepTime}>
            <span className="ss-im-tag">Telegram</span>
            <span className="ss-im-tag">微信</span>
          </Stagger>
        </div>
        <Reveal from="up" delay={0.4} stepTime={stepTime}>
          <div className="ss-vs">
            <div className="ss-vs-item">
              <span className="ss-vs-t serif-cn">任务</span>
              <span className="ss-vs-d">一次性的创作工作</span>
            </div>
            <span className="ss-vs-sep">VS</span>
            <div className="ss-vs-item ss-vs-item-accent">
              <span className="ss-vs-t serif-cn">精灵</span>
              <span className="ss-vs-d">长期的创作搭档</span>
            </div>
          </div>
        </Reveal>
      </div>
      <Reveal from="right" delay={0.4} stepTime={stepTime}>
        <figure className="ss-shot">
          <img src={`${PROJECT}/assets/9VVdOjtfZ8.jpg`} alt="链接精灵至 IM" />
          <figcaption>把精灵链接到通讯软件</figcaption>
        </figure>
      </Reveal>
    </div>
  );
}
