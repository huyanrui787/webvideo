import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./VsCopilot.css";

export default function VsCopilot({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">这不就是 Copilot 吗？</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">完全不是</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">我打个比方</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">Copilot</h3>
        <p className="ch-compare-body">输入法增强
    编辑器内联补全
    只在当前文件里转</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading"></h3>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading"></h3>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">Claude Code</h3>
        <p className="ch-compare-body">坐你旁边的同事
    自己规划任务
    跨文件 · 全局操作</p>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">IDE 内</h3>
        <p className="ch-compare-body">Copilot
    编辑器插件</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">终端内</h3>
        <p className="ch-compare-body">Claude Code
    Git · 构建 · 部署 总控台</p>
      </div>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`\$ git commit -m "feat: add logging"
    \$ npm run build
    \$ npm run deploy`} language="bash" highlights={[]} />
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">两种路线，可以兼得</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">Copilot 加速编码 · Claude Code 搞定大任务</p>
    </div>
    );
  }

  return null;
}