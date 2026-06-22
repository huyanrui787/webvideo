import type { ChapterStepProps } from "../../registry/types";
import "./Coldopen.css";

/**
 * Chapter 1 · coldopen — [hook]
 * "藏了两个月、太危险不能公开、今晚解禁"
 * Sharp bauhaus block reveals, massive type, primary-blue stamp.
 */
export default function Coldopen({ step }: ChapterStepProps) {
  return (
    <div className="cd-root">
      {/* corner registration mark */}
      <div className="cd-mark mono">
        <span>ANTHROPIC</span>
        <span className="cd-mark-sep">/</span>
        <span>CLAUDE&nbsp;5</span>
      </div>

      {/* step 0 — 藏了整整两个月 */}
      {step === 0 && (
        <div className="cd-scene cd-center">
          <div className="cd-kicker mono">CLASSIFIED&nbsp;·&nbsp;60&nbsp;DAYS</div>
          <h1 className="cd-line serif-cn">
            <span className="cd-word" style={{ ["--i" as string]: 0 }}>藏了整整</span>
            <span className="cd-word cd-num display-en" style={{ ["--i" as string]: 1 }}>两个月</span>
          </h1>
          <div className="cd-underbar" />
        </div>
      )}

      {/* step 1 — 太危险，不能公开 */}
      {step === 1 && (
        <div className="cd-scene cd-center">
          <div className="cd-quotemark display-en">"</div>
          <h1 className="cd-danger serif-cn">
            <span className="cd-danger-1">太危险</span>
            <span className="cd-danger-2">不能公开</span>
          </h1>
          <div className="cd-attr mono">— ANTHROPIC&nbsp;官方</div>
        </div>
      )}

      {/* step 2 — 今晚，交到所有人手上 */}
      {step === 2 && (
        <div className="cd-scene cd-center">
          <h1 className="cd-reveal serif-cn">
            <span className="cd-reveal-sm">今晚</span>
            <span className="cd-reveal-lg">
              交到<span className="cd-accent">所有人</span>手上
            </span>
          </h1>
          <div className="cd-stamp display-en">UNLOCKED</div>
        </div>
      )}
    </div>
  );
}
