import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./SmartPipeline.css";

export default function SmartPipeline({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-custom ch-custom-smart-pipeline">
      <div className="sp-question-stage"><p className="sp-big-q">四个坑，怎么填？</p><p className="sp-answer">让流水线自己带脑子</p></div>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-custom ch-custom-smart-pipeline">
      <div className="sp-robot-stage"><svg viewBox="0 0 200 200" className="sp-robot-svg"><rect x="50" y="40" width="100" height="80" rx="12" fill="none" stroke="var(--text-mute)" strokeWidth="3"/><circle cx="80" cy="70" r="8" fill="var(--text-mute)" opacity="0.5"/><circle cx="120" cy="70" r="8" fill="var(--text-mute)" opacity="0.5"/><rect x="70" y="90" width="60" height="5" rx="2" fill="var(--text-mute)" opacity="0.5"/><text x="100" y="150" textAnchor="middle" fill="var(--text-mute)" fontFamily="var(--font-mono)" fontSize="24">?</text></svg><p className="sp-caption">失败 → 傻站 → 等你修</p></div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-custom ch-custom-smart-pipeline">
      <div className="sp-flow-step"><div className="sp-flow-icon"><svg viewBox="0 0 80 80" width="80" height="80"><circle cx="40" cy="40" r="30" fill="none" stroke="var(--accent)" strokeWidth="3"/><path d="M40 20 L40 50" stroke="var(--accent)" strokeWidth="3"/><circle cx="40" cy="55" r="4" fill="var(--accent)"/></svg></div><div className="sp-flow-text"><span className="sp-flow-num">Step 1</span><h3 className="sp-flow-title">金丝雀发布</h3><p className="sp-flow-desc">新版本 → 少量实例 → 实时监控</p></div></div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-custom ch-custom-smart-pipeline">
      <div className="sp-flow-step"><div className="sp-flow-icon"><svg viewBox="0 0 80 80" width="80" height="80"><path d="M20 60 L40 30 L60 50 L70 20" fill="none" stroke="var(--accent)" strokeWidth="3"/><circle cx="70" cy="15" r="5" fill="var(--accent)"/><line x1="70" y1="10" x2="70" y2="0" stroke="var(--accent)" strokeWidth="3"/></svg></div><div className="sp-flow-text"><span className="sp-flow-num">Step 2</span><h3 className="sp-flow-title">自动判断</h3><p className="sp-flow-desc">指标下滑 → 自动回滚，不等你下令</p></div></div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-custom ch-custom-smart-pipeline">
      <div className="sp-flow-step"><div className="sp-flow-icon"><svg viewBox="0 0 80 80" width="80" height="80"><rect x="10" y="35" width="12" height="25" rx="2" fill="var(--accent)" opacity="0.3"/><rect x="25" y="25" width="12" height="35" rx="2" fill="var(--accent)" opacity="0.5"/><rect x="40" y="15" width="12" height="45" rx="2" fill="var(--accent)" opacity="0.7"/><rect x="55" y="5" width="12" height="55" rx="2" fill="var(--accent)" opacity="1"/></svg></div><div className="sp-flow-text"><span className="sp-flow-num">Step 3</span><h3 className="sp-flow-title">渐进式推进</h3><p className="sp-flow-desc">灰度 5% → 25% → 100%，看路踩刹车全自动</p></div></div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-custom ch-custom-smart-pipeline">
      <div className="sp-lego-stage"><svg viewBox="0 0 300 80" className="sp-lego-svg"><rect x="5" y="25" width="50" height="35" rx="6" fill="var(--accent)" opacity="0.5"/><rect x="60" y="20" width="60" height="40" rx="6" fill="var(--accent)" opacity="0.6"/><rect x="125" y="15" width="55" height="45" rx="6" fill="var(--accent)" opacity="0.7"/><rect x="185" y="10" width="65" height="50" rx="6" fill="var(--accent)" opacity="0.85"/><rect x="255" y="15" width="40" height="40" rx="6" fill="var(--accent)"/></svg><p className="sp-lego-label">声明式 YAML · 模块化 · 搭一次处处复用</p></div>
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">部署的自动驾驶</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">已经上路</p>
    </div>
    );
  }

  return null;
}