import type { ChapterStepProps } from "../../registry/types";
import "./Mythos.css";

/**
 * Chapter 7 · mythos — [close]
 * 只剩两个能看到尾灯 → 命名深意 → 理性对神话 → 悬念收束
 */
export default function Mythos({ step }: ChapterStepProps) {
  const dark = step >= 2;
  return (
    <div className={`my-root ${dark ? "my-dark" : ""}`}>
      <div className="my-mark mono">
        <span>THE&nbsp;THRONE</span>
        <span className="my-mark-sep">/</span>
        <span>MYTHOS&nbsp;OPENS</span>
      </div>

      {/* step 0 — 只剩两个项目 */}
      {step === 0 && (
        <div className="my-scene my-center">
          <div className="my-kicker mono">GPT-5.5&nbsp;发布一个半月</div>
          <div className="my-only-row">
            <span className="my-only-num hero-num">2</span>
            <span className="my-only-cap serif-cn">个项目<br />还能看到尾灯</span>
          </div>
          <div className="my-only-foot serif-cn">往下，全是单方面屠杀</div>
        </div>
      )}

      {/* step 1 — 命名深意 */}
      {step === 1 && (
        <div className="my-scene my-name-scene">
          <div className="my-kicker mono">藏在名字里的意思</div>
          <div className="my-name-grid">
            <div className="my-name-item">
              <div className="my-name-en display-en">MYTHOS</div>
              <div className="my-name-desc serif-cn">文明解释自身命运的神圣叙事</div>
            </div>
            <div className="my-name-item">
              <div className="my-name-en display-en">FABLE</div>
              <div className="my-name-desc serif-cn">人类最古老的道德教化</div>
            </div>
          </div>
        </div>
      )}

      {/* step 2 — 理性对神话的胜利（黑底反转） */}
      {step === 2 && (
        <div className="my-scene my-center">
          <h1 className="my-logos serif-cn">
            古希腊哲学的诞生<br />
            曾是 <span className="my-accent">理性</span> 对神话的一次胜利
          </h1>
          <div className="my-logos-foot mono">LOGOS&nbsp;&gt;&nbsp;MYTHOS</div>
        </div>
      )}

      {/* step 3 — 悬念收束 */}
      {step === 3 && (
        <div className="my-scene my-center">
          <div className="my-close-top serif-cn">
            如今一家公司站在 ASI 门口<br />
            把最强模型叫做<span className="my-accent">神话</span>与<span className="my-accent">寓言</span>
          </div>
          <h1 className="my-close-q serif-cn">
            意义和善恶的判断<br />
            还能不能留在<span className="my-accent">人类手里</span>？
          </h1>
        </div>
      )}
    </div>
  );
}
