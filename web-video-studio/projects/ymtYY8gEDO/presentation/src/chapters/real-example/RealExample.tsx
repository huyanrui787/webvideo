import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, Counter, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./RealExample.css";

export default function RealExample({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">不如看个真实例子</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`// routes/userRoutes.js
    app.get('/users', (req, res) => {
      try {
        // ...
      } catch (error) {
        console.log(error)
      }
    })`} language="javascript" highlights={[]} />
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">统一改成 next(error)</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">加 winston 日志记录</p>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`\$ claude
    > 帮我把 routes/userRoutes.js 里的错误处理
      重构一下，不要用 console.log，
      改用 next(error)，catch 块加 winston 日志`} language="bash" highlights={[]} />
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`// 改动计划：
    // 1. 替换 console.log → next(error)
    // 2. 添加 winston 日志
    // 3. catch 块统一错误传递
    
    npm test
      ✓ users route (3 tests)
      ✓ error middleware (2 tests)`} language="text" highlights={[]} />
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`\$ git add routes/userRoutes.js
    \$ git commit -m "refactor: error handling
    
    - Replace console.log with next(error)
    - Add winston logging in catch blocks
    - Update error middleware"`} language="bash" highlights={[]} />
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-data ch-data--single-stat">
      <div className="ch-data-primary">
        <Counter to={parseFloat("~2 分钟") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">~2 分钟</span>
        <span className="ch-data-label label-mono">全程耗时</span>
      </div>
    </div>
    );
  }

  else if (step === 7) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">从工匠到指挥官</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">你交代意图 · 把控方向 · 它负责落地</p>
    </div>
    );
  }

  return null;
}