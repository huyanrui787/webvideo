import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Coldopen.css";

export default function Coldopen({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">深夜赶项目</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">满屏报错</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">能不能来个人</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">直接把活儿干了</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">Claude Code</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">住在你终端里的 AI 程序员</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">读文件 · 写代码 · 跑测试</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">甚至帮你重构一整个模块</p>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`\$ claude`} language="bash" highlights={[]} />
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`帮我把这个接口的错误处理重写一下
    找出所有可能的内存泄漏点`} language="text" highlights={[]} />
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">不止补全代码</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">它理解你整个项目的上下文</p>
    </div>
    );
  }

  return null;
}