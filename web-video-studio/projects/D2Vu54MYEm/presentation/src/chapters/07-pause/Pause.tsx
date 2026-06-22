import { Reveal, DrawPath } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./pause.css";

/**
 * pause · [release] · 2 steps
 * 情绪释放：一句话停顿。极简留白，用 SVG 自绘强调线作克制视觉。
 */
export default function Pause({ step, stepTime }: ChapterStepProps) {
  // step 0 — 一周搞定顶刊的活
  if (step === 0) {
    return (
      <div className="ps-scene ps-dark scene-pad" key={step}>
        <div className="ps-center">
          <Reveal from="none" stepTime={stepTime}>
            <h1 className="ps-line">
              一个 AI，一周搞定了<br />别人发顶刊的活。
            </h1>
          </Reveal>
          <svg className="ps-underline" viewBox="0 0 900 40" preserveAspectRatio="none">
            <DrawPath
              d="M 8 24 L 892 24"
              color="var(--accent)"
              strokeWidth={10}
              duration={1.0}
              delay={0.6}
              stepTime={stepTime}
            />
          </svg>
        </div>
      </div>
    );
  }

  // step 1 — 问题被重写
  return (
    <div className="ps-scene scene-pad" key={step}>
      <div className="ps-center">
        <Reveal from="up" stepTime={stepTime}>
          <p className="ps-q">「AI 到底能做什么」</p>
        </Reveal>
        <Reveal from="up" delay={0.4} stepTime={stepTime}>
          <h1 className="ps-rewrite">今晚，被重写了一遍</h1>
        </Reveal>
        <svg className="ps-underline ps-underline-wide" viewBox="0 0 1200 40" preserveAspectRatio="none">
          <DrawPath
            d="M 8 24 L 1192 24"
            color="var(--accent)"
            strokeWidth={10}
            duration={1.0}
            delay={0.9}
            stepTime={stepTime}
          />
        </svg>
      </div>
    </div>
  );
}
