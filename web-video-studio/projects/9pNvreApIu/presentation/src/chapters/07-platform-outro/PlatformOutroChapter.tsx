import { Reveal, Stagger, DrawPath } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./platform-outro.css";

const PROJECT = "/api/projects/9pNvreApIu";

export default function PlatformOutroChapter({ step, stepTime }: ChapterStepProps) {
  // step 0 — iOS 上线
  if (step === 0) {
    return (
      <div className="po-scene scene-pad po-split" key={step}>
        <div className="po-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <span className="po-kicker">第四部分 · 走出网页</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h1 className="po-hero serif-cn">
              iOS 端<span className="po-accent">已上线</span>
            </h1>
          </Reveal>
          <Reveal from="up" delay={0.45} stepTime={stepTime}>
            <p className="po-sub">记录灵感、推进任务，整条链路都能在手机上完成</p>
          </Reveal>
        </div>
        <Reveal from="right" delay={0.3} stepTime={stepTime}>
          <figure className="po-shot">
            <img src={`${PROJECT}/assets/dzHnrwwmz3.jpg`} alt="移动端界面" />
            <figcaption>移动端 · 内容发现与聊天</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 1 — 分享进 Board + 多端即将见面
  if (step === 1) {
    return (
      <div className="po-scene scene-pad po-share" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="po-kicker">随手沉淀</span>
        </Reveal>
        <Reveal from="up" delay={0.15} stepTime={stepTime}>
          <div className="po-share-flow">
            <span className="po-src">X</span>
            <span className="po-src">YouTube</span>
            <span className="po-share-arrow">→</span>
            <span className="po-dest">直接分享进 Board</span>
          </div>
        </Reveal>
        <div className="po-coming">
          <Stagger interval={0.15} stepTime={stepTime}>
            <div className="po-coming-card">
              <span className="po-coming-t serif-cn">Android</span>
              <span className="po-coming-d">即将见面</span>
            </div>
            <div className="po-coming-card">
              <span className="po-coming-t serif-cn">桌面端</span>
              <span className="po-coming-d">即将见面</span>
            </div>
          </Stagger>
        </div>
      </div>
    );
  }

  // step 2 — YouMind API
  if (step === 2) {
    return (
      <div className="po-scene scene-pad po-split" key={step}>
        <div className="po-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <span className="po-kicker">第五部分 · YouMind API</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h2 className="po-mid serif-cn">让外部 Agent 操作 YouMind</h2>
          </Reveal>
          <div className="po-agents">
            <Stagger interval={0.12} stepTime={stepTime}>
              {["Codex", "Claude Code", "ClawBot"].map((t) => (
                <span className="po-agent-tag" key={t}>{t}</span>
              ))}
            </Stagger>
          </div>
          <Reveal from="up" delay={0.6} stepTime={stepTime}>
            <p className="po-note">生成 API Key，Agent 就能读取内容、用各项创作能力</p>
          </Reveal>
        </div>
        <Reveal from="right" delay={0.3} stepTime={stepTime}>
          <figure className="po-shot">
            <img src={`${PROJECT}/assets/08yojXZB4M.jpg`} alt="API 密钥管理界面" />
            <figcaption>生成 YouMind API Key</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 3 — Connector + 一键发布
  if (step === 3) {
    return (
      <div className="po-scene scene-pad po-split" key={step}>
        <div className="po-split-left">
          <Reveal from="left" stepTime={stepTime}>
            <span className="po-kicker">双向打通</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <div className="po-conn">
              <span className="po-conn-label">Connector 读取</span>
              <div className="po-conn-tags">
                <span className="po-conn-tag">Notion</span>
                <span className="po-conn-tag">Linear</span>
                <span className="po-conn-tag">Slack</span>
              </div>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.45} stepTime={stepTime}>
            <div className="po-conn">
              <span className="po-conn-label">一键发布到</span>
              <div className="po-conn-tags">
                <span className="po-conn-tag po-conn-tag-accent">微信公众号</span>
                <span className="po-conn-tag po-conn-tag-accent">X 文章</span>
              </div>
            </div>
          </Reveal>
          <Reveal from="up" delay={0.65} stepTime={stepTime}>
            <p className="po-note">发到草稿箱，无需二次排版</p>
          </Reveal>
        </div>
        <Reveal from="right" delay={0.3} stepTime={stepTime}>
          <figure className="po-shot">
            <img src={`${PROJECT}/assets/cIMhf48nQw.jpg`} alt="第三方应用连接器配置" />
            <figcaption>第三方应用连接器</figcaption>
          </figure>
        </Reveal>
      </div>
    );
  }

  // step 4 — IPO 方法论
  if (step === 4) {
    return (
      <div className="po-scene scene-pad po-ipo" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="po-kicker">两年前概念太多 → 现在每一步都更顺</span>
        </Reveal>
        <div className="po-ipo-wrap">
          <svg className="po-ipo-svg" viewBox="0 0 1500 40" preserveAspectRatio="none">
            <DrawPath
              d="M 80 20 L 1420 20"
              color="var(--accent)"
              strokeWidth={4}
              duration={1.3}
              stepTime={stepTime}
            />
          </svg>
          <div className="po-ipo-row">
            <Stagger interval={0.25} stepTime={stepTime}>
              {[
                { en: "Input", cn: "输入" },
                { en: "Process", cn: "加工" },
                { en: "Output", cn: "输出" },
              ].map((s) => (
                <div className="po-ipo-node" key={s.en}>
                  <span className="po-ipo-en display-en">{s.en}</span>
                  <span className="po-ipo-cn">{s.cn}</span>
                </div>
              ))}
            </Stagger>
          </div>
        </div>
        <Reveal from="up" delay={1} stepTime={stepTime}>
          <p className="po-ipo-foot">IPO 创作方法论，每一次迭代给出恰到好处的支持</p>
        </Reveal>
      </div>
    );
  }

  // step 5 — 结尾
  return (
    <div className="po-scene scene-pad po-close" key={step}>
      <Reveal from="up" stepTime={stepTime}>
        <h1 className="po-close-h serif-cn">
          欢迎你来
        </h1>
      </Reveal>
      <Reveal from="up" delay={0.3} stepTime={stepTime}>
        <h1 className="po-close-h serif-cn">
          也谢谢<span className="po-accent">还在</span>
        </h1>
      </Reveal>
      <Reveal from="none" delay={0.7} stepTime={stepTime}>
        <div className="po-close-bar" />
      </Reveal>
      <Reveal from="up" delay={0.9} stepTime={stepTime}>
        <p className="po-close-sub">和 YouMind 一起，大胆创作</p>
      </Reveal>
    </div>
  );
}
