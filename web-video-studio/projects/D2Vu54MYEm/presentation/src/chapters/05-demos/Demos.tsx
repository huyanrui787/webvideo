import { Reveal, WaveForm, useSeekableCanvas } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./demos.css";

/** Factorio 风格传送带 / 生产线示意 */
function FactoryViz({ stepTime }: { stepTime?: number }) {
  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2541ee";
      const ink = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#0a0a0a";
      const lanes = 4;
      for (let l = 0; l < lanes; l++) {
        const y = h * (0.28 + l * 0.16);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(w * 0.08, y);
        ctx.lineTo(w * 0.92, y);
        ctx.stroke();
        // moving boxes
        const speed = 180 + l * 40;
        const gap = 220;
        const offset = (t * speed) % gap;
        for (let x = w * 0.08 - offset; x < w * 0.92; x += gap) {
          if (x < w * 0.08) continue;
          ctx.fillStyle = l % 2 === 0 ? accent : ink;
          ctx.fillRect(x, y - 28, 44, 44);
        }
      }
    },
    { stepTime }
  );
  return <canvas ref={ref} className="dm-canvas" />;
}

/** 行星轨道运动 */
function OrbitViz({ stepTime }: { stepTime?: number }) {
  const ref = useSeekableCanvas(
    (ctx, t, w, h) => {
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2541ee";
      const ink = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#0a0a0a";
      const cx = w / 2;
      const cy = h / 2;
      // sun
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.fill();
      const orbits = [
        { r: 150, speed: 0.9 },
        { r: 260, speed: 0.55 },
        { r: 380, speed: 0.35 },
      ];
      orbits.forEach((o) => {
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, o.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        const a = t * o.speed;
        const px = cx + Math.cos(a) * o.r;
        const py = cy + Math.sin(a) * o.r * 0.5;
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    { stepTime }
  );
  return <canvas ref={ref} className="dm-canvas" />;
}

export default function Demos({ step, stepTime }: ChapterStepProps) {
  // step 0 — 总起
  if (step === 0) {
    return (
      <div className="dm-scene scene-pad" key={step}>
        <div className="dm-center">
          <Reveal from="up" stepTime={stepTime}>
            <h1 className="dm-title">它能长时间</h1>
          </Reveal>
          <Reveal from="up" delay={0.25} stepTime={stepTime}>
            <h1 className="dm-title dm-accent">自己干活</h1>
          </Reveal>
          <Reveal from="up" delay={0.5} stepTime={stepTime}>
            <p className="dm-sub">而且产出质量高到离谱</p>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 1 — Factorio
  if (step === 1) {
    return (
      <div className="dm-scene scene-pad" key={step}>
        <FactoryViz stepTime={stepTime} />
        <div className="dm-overlay">
          <Reveal from="none" stepTime={stepTime}>
            <span className="dm-kicker">FACTORIO · 工程师圣经级建造游戏</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h2 className="dm-demo-title">从零搭出整条自动化生产线</h2>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 2 — 3D CAD
  if (step === 2) {
    return (
      <div className="dm-scene scene-pad" key={step}>
        <div className="dm-cad-wrap">
          <Reveal from="none" stepTime={stepTime}>
            <span className="dm-kicker">浏览器内 · 凭空渲染</span>
          </Reveal>
          <div className="dm-cad-frame">
            <Reveal from="left" delay={0.2} stepTime={stepTime}>
              <div className="dm-cad-toolbar">
                <span className="dm-cad-dot" /><span className="dm-cad-dot" /><span className="dm-cad-dot" />
                <span className="dm-cad-tool">移动</span>
                <span className="dm-cad-tool">旋转</span>
                <span className="dm-cad-tool">倒角</span>
              </div>
            </Reveal>
            <Reveal from="none" delay={0.5} stepTime={stepTime}>
              <svg className="dm-cad-cube" viewBox="0 0 200 200">
                <polygon points="60,60 140,40 160,110 80,130" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="3" />
                <polygon points="60,60 80,130 60,170 40,100" fill="none" stroke="var(--text)" strokeWidth="3" />
                <polygon points="140,40 160,110 160,150 140,80" fill="none" stroke="var(--text)" strokeWidth="3" />
              </svg>
            </Reveal>
          </div>
          <Reveal from="up" delay={0.7} stepTime={stepTime}>
            <h2 className="dm-demo-title">先写出 3D CAD 编辑器，再用它做出能打印的模型</h2>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 3 — 物理轨道
  if (step === 3) {
    return (
      <div className="dm-scene dm-dark scene-pad" key={step}>
        <OrbitViz stepTime={stepTime} />
        <div className="dm-overlay">
          <Reveal from="none" stepTime={stepTime}>
            <span className="dm-kicker">物理第一性原理</span>
          </Reveal>
          <Reveal from="up" delay={0.2} stepTime={stepTime}>
            <h2 className="dm-demo-title dm-on-dark">自己推导行星轨道，然后预测日食</h2>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 4 — 贝多芬混音 + 流体
  if (step === 4) {
    return (
      <div className="dm-scene dm-dark scene-pad" key={step}>
        <div className="dm-music-wrap">
          <Reveal from="none" stepTime={stepTime}>
            <span className="dm-kicker">FIFTH SYMPHONY · FABLE</span>
          </Reveal>
          <div className="dm-wave-box">
            <WaveForm variant="bars" barCount={56} color="var(--accent)" stepTime={stepTime} />
          </div>
          <Reveal from="up" delay={0.3} stepTime={stepTime}>
            <h2 className="dm-demo-title dm-on-dark">用代码写了一首贝多芬第五的 EDM 混音</h2>
          </Reveal>
          <Reveal from="up" delay={0.6} stepTime={stepTime}>
            <p className="dm-sub dm-sub-light">又写了一段跟着节拍炸开的流体模拟</p>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 5 — 宝可梦对比
  if (step === 5) {
    return (
      <div className="dm-scene scene-pad" key={step}>
        <Reveal from="none" stepTime={stepTime}>
          <span className="dm-kicker">宝可梦火红 · 接口对比</span>
        </Reveal>
        <div className="dm-poke-row">
          <Reveal from="left" delay={0.2} stepTime={stepTime}>
            <div className="dm-poke-cell dm-poke-old">
              <span className="dm-poke-who">以前的 Claude</span>
              <ul className="dm-poke-list">
                <li>地图导航</li>
                <li>游戏状态解析</li>
                <li>额外工具接口</li>
                <li>还经常卡关</li>
              </ul>
            </div>
          </Reveal>
          <Reveal from="right" delay={0.5} stepTime={stepTime}>
            <div className="dm-poke-cell dm-poke-new">
              <span className="dm-poke-who">Fable 5</span>
              <span className="dm-poke-one">一个极简视觉接口</span>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  // step 6 — 裸眼通关收束
  return (
    <div className="dm-scene dm-dark scene-pad" key={step}>
      <div className="dm-center dm-center-mid">
        <Reveal from="none" stepTime={stepTime}>
          <span className="dm-kicker">没地图 · 没导航 · 只看屏幕截图</span>
        </Reveal>
        <Reveal from="up" delay={0.25} stepTime={stepTime}>
          <h1 className="dm-finale">裸眼通关</h1>
        </Reveal>
      </div>
    </div>
  );
}
