import { Reveal, TypeWriter, WaveForm } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./TheBombSquad.css";

export default function TheBombSquad({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-composed ch-composed--stack">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.8}>
        <WaveForm variant={"pulse"} color={"#ef4444"} barCount={64} />
        <TypeWriter text={"发布日，就是拆弹现场。"} speed={70} />
        </Reveal>
      </div>
    </div>
    );
  }

  return null;
}