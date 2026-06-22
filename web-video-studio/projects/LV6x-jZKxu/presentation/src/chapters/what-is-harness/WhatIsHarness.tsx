import { MaskReveal } from "../../components/MaskReveal";
import type { ChapterStepProps } from "../../registry/types";
import "./WhatIsHarness.css";

export default function WhatIsHarness({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">Harness</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">马具 · 缰绳 · 背带系统</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-custom ch-custom-what-is-harness">
      <div className="wg-dual-scene"><div className="wg-side wg-left"><svg viewBox="0 0 200 200" className="wg-icon-svg"><path d="M100 160 Q80 100 100 50 Q120 100 100 160" fill="none" stroke="var(--accent)" strokeWidth="3"/><circle cx="100" cy="40" r="8" fill="var(--accent)" opacity="0.7"/></svg><span className="wg-label">烈马</span></div><div className="wg-connector"><svg viewBox="0 0 100 20" className="wg-line-svg"><line x1="0" y1="10" x2="100" y2="10" stroke="var(--text-mute)" strokeWidth="2" strokeDasharray="6 3"/></svg></div><div className="wg-side wg-right"><svg viewBox="0 0 200 200" className="wg-icon-svg"><rect x="50" y="30" width="100" height="140" rx="10" fill="none" stroke="var(--accent)" strokeWidth="3"/><rect x="70" y="60" width="60" height="15" rx="3" fill="var(--accent)" opacity="0.4"/><rect x="70" y="85" width="60" height="15" rx="3" fill="var(--accent)" opacity="0.4"/><rect x="70" y="110" width="60" height="15" rx="3" fill="var(--accent)" opacity="0.4"/></svg><span className="wg-label">服务器集群</span></div></div>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-custom ch-custom-what-is-harness">
      <div className="wg-nodes"><div className="wg-node-ring"><span className="wg-node" style={{animationDelay:'0s'}}>构建</span><span className="wg-node" style={{animationDelay:'0.2s'}}>测试</span><span className="wg-node" style={{animationDelay:'0.4s'}}>部署</span><span className="wg-node" style={{animationDelay:'0.6s'}}>监控</span><span className="wg-node wg-extra" style={{animationDelay:'0.8s'}}>云成本</span><span className="wg-node wg-extra" style={{animationDelay:'1s'}}>特性开关</span></div><p className="wg-tagline">一把瑞士军刀，搞定全流程</p></div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-custom ch-custom-what-is-harness">
      <div className="wg-question"><p className="wg-q-text">Jenkins？GitLab CI？</p><p className="wg-q-sub">问题就在这——</p></div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-custom ch-custom-what-is-harness">
      <div className="wg-pains"><div className="wg-pain-card" style={{animationDelay:'0s'}}><span className="wg-pain-num">01</span><span className="wg-pain-title">脚本满天飞</span><span className="wg-pain-detail">改一行就怕全线崩</span></div><div className="wg-pain-card" style={{animationDelay:'0.15s'}}><span className="wg-pain-num">02</span><span className="wg-pain-title">环境谜题</span><span className="wg-pain-detail">手动修改没记录</span></div><div className="wg-pain-card" style={{animationDelay:'0.3s'}}><span className="wg-pain-num">03</span><span className="wg-pain-title">审批迷宫</span><span className="wg-pain-detail">卡点形同虚设</span></div><div className="wg-pain-card" style={{animationDelay:'0.45s'}}><span className="wg-pain-num">04</span><span className="wg-pain-title">成本黑盒</span><span className="wg-pain-detail">月底心跳骤停</span></div></div>
    </div>
    );
  }

  return null;
}