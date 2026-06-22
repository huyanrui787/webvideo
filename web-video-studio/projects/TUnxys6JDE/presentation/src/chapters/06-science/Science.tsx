import type { ChapterStepProps } from "../../registry/types";
import "./Science.css";

/**
 * Chapter 6 · science — [build]
 * 裸眼通关宝可梦 → 蛋白质 14→9 → 基因组 138物种自训练 → 超越 Science
 */
export default function Science({ step }: ChapterStepProps) {
  return (
    <div className="sc-root">
      <div className="sc-mark mono">
        <span>VISION&nbsp;&amp;&nbsp;SCIENCE</span>
        <span className="sc-mark-sep">/</span>
        <span>AUTONOMOUS</span>
      </div>

      {/* step 0 — 视觉能力进步过渡 */}
      {step === 0 && (
        <div className="sc-scene sc-center">
          <div className="sc-kicker mono">VISION</div>
          <h1 className="sc-intro serif-cn">
            视觉能力的进步<br />
            <span className="sc-accent">同样夸张</span>
          </h1>
        </div>
      )}

      {/* step 1~2 — 宝可梦 旧方法 vs 裸眼 */}
      {(step === 1 || step === 2) && (
        <div className="sc-scene sc-poke-scene">
          <div className="sc-kicker mono">POKÉMON&nbsp;火红版&nbsp;·&nbsp;裸眼通关</div>
          <div className="sc-poke-row">
            <div className={`sc-poke-col sc-poke-old ${step >= 1 ? "in" : ""}`}>
              <div className="sc-poke-tag mono">以前的 Claude</div>
              <ul className="sc-poke-list serif-cn">
                <li>整套地图导航工具</li>
                <li>游戏状态解析</li>
                <li>额外工具接口</li>
              </ul>
              <div className="sc-poke-foot mono">还经常卡关</div>
            </div>
            <div className={`sc-poke-col sc-poke-new ${step >= 2 ? "in" : ""}`}>
              <div className="sc-poke-tag mono">Fable 5</div>
              <div className="sc-poke-big serif-cn">只看屏幕截图</div>
              <div className="sc-poke-foot2 mono">无地图 · 无导航 · 无辅助</div>
              {step >= 2 && <div className="sc-poke-clear display-en">从头通关</div>}
            </div>
          </div>
        </div>
      )}

      {/* step 3 — 蛋白质设计 14 → 9 */}
      {step === 3 && (
        <div className="sc-scene sc-center">
          <div className="sc-kicker mono">蛋白质设计&nbsp;·&nbsp;全自动研发</div>
          <div className="sc-prot-row">
            <div className="sc-prot-stat">
              <span className="sc-prot-num hero-num">14</span>
              <span className="sc-prot-lbl mono">疾病靶点</span>
            </div>
            <span className="sc-prot-arrow display-en">→</span>
            <div className="sc-prot-stat">
              <span className="sc-prot-num hero-num sc-accent">9</span>
              <span className="sc-prot-lbl mono">强候选方案</span>
            </div>
          </div>
          <div className="sc-prot-foot serif-cn">免疫 · 神经退行 · 肌肉疾病</div>
        </div>
      )}

      {/* step 4 — 基因组学 时间线 */}
      {step === 4 && (
        <div className="sc-scene sc-gen-scene">
          <div className="sc-kicker mono">基因组学&nbsp;·&nbsp;几乎无人监管</div>
          <div className="sc-gen-line">
            <div className="sc-gen-node">
              <div className="sc-gen-num hero-num">1<span className="sc-gen-u">周+</span></div>
              <div className="sc-gen-lbl mono">自主运行</div>
            </div>
            <div className="sc-gen-bar" />
            <div className="sc-gen-node">
              <div className="sc-gen-num hero-num">138</div>
              <div className="sc-gen-lbl mono">物种数据</div>
            </div>
            <div className="sc-gen-bar" />
            <div className="sc-gen-node">
              <div className="sc-gen-num hero-num sc-accent">自训</div>
              <div className="sc-gen-lbl mono">机器学习模型</div>
            </div>
          </div>
        </div>
      )}

      {/* step 5 — 超越 Science */}
      {step === 5 && (
        <div className="sc-scene sc-center">
          <div className="sc-kicker mono">RESULT</div>
          <h1 className="sc-result serif-cn">
            超越刚发在 <span className="sc-accent">Science</span> 上的研究
          </h1>
          <div className="sc-result-row">
            <span className="sc-result-pill">体量小 100 倍</span>
            <span className="sc-result-pill sc-result-pill-on">性能反超</span>
          </div>
        </div>
      )}
    </div>
  );
}
