import { useEffect, useRef } from "react";
import type { ChapterStepProps } from "../../registry/types";
import "./Symphony.css";

/**
 * Chapter 5 · symphony — [release]
 * 从没"听"过音乐的 AI 用代码写贝多芬混音 + 流体随节拍跳舞。
 * Canvas particle fluid, black canvas, minimal type — a breath.
 */

function FluidCanvas({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = (canvas.width = 1920);
    const H = (canvas.height = 1080);
    const accent = "#2541ee";

    const N = 220;
    const parts = Array.from({ length: N }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 120 + Math.random() * 420,
      sp: 0.002 + Math.random() * 0.006,
      sz: 1.5 + Math.random() * 3.5,
      hue: Math.random(),
    }));

    let raf = 0;
    let t = 0;
    function frame() {
      t += 1;
      // beat: pulsing radius driven by sin (simulated music beat)
      const beat = Math.pow(Math.abs(Math.sin(t * 0.03)), 3);
      ctx.fillStyle = "rgba(10,10,10,0.18)";
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      for (const p of parts) {
        p.a += p.sp;
        const rr = p.r * (0.85 + beat * 0.5);
        const x = cx + Math.cos(p.a) * rr;
        const y = cy + Math.sin(p.a) * rr * 0.62;
        ctx.beginPath();
        ctx.arc(x, y, p.sz * (1 + beat), 0, Math.PI * 2);
        // deep violet on low, ice blue on high
        ctx.fillStyle = p.hue > 0.5 ? accent : "rgba(120,90,220,0.9)";
        ctx.globalAlpha = 0.5 + beat * 0.5;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    if (active) frame();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={ref} className="sy-canvas" />;
}

export default function Symphony({ step }: ChapterStepProps) {
  return (
    <div className="sy-root">
      <FluidCanvas active={step >= 1} />

      {/* step 0 — 最魔幻的一个 */}
      {step === 0 && (
        <div className="sy-scene sy-center">
          <h1 className="sy-lead serif-cn">最魔幻的一个</h1>
        </div>
      )}

      {/* step 1 — 没听过音乐的 AI 写了贝多芬混音 */}
      {step === 1 && (
        <div className="sy-scene sy-center sy-over">
          <div className="sy-title display-en">FIFTH&nbsp;SYMPHONY&nbsp;·&nbsp;FABLE</div>
          <h1 className="sy-line serif-cn">
            从没<span className="sy-accent">听</span>过音乐的 AI
          </h1>
          <p className="sy-sub serif-cn">用代码写了一首贝多芬混音</p>
        </div>
      )}

      {/* step 2 — 流体随节拍跳舞 */}
      {step === 2 && (
        <div className="sy-scene sy-center sy-over">
          <p className="sy-sub2 serif-cn">再用代码</p>
          <h1 className="sy-line sy-line2 serif-cn">
            写了段<span className="sy-accent">跟着节拍跳舞</span>的流体
          </h1>
        </div>
      )}
    </div>
  );
}
