import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, NetworkGraph, Reveal, TypeWriter } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./RealWorkflow.css";

export default function RealWorkflow({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-code ch-code--dark">
      <CodeBlock code={`userRoutes.js - before
    app.get('/users', (req, res) => {
      User.find({}, (err, users) => {
        if (err) console.log(err);
        res.json(users);
      });
    });`} language="" highlights={[]} />
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-hero ch-hero--centered">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">统一规范</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">console.log → next(error) + winston</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-composed ch-composed--center">
      <div className="ch-composed-region ch-composed-region--main">
        <Reveal from="up" delay={0} stepTime={0.5}>
        <TypeWriter text={"$ claude\n> 帮我把 routes/userRoutes.js 重构\n> console.log → next(error)\n> catch 块加 winston 日志\n"} speed={25} cursor={true} />
        </Reveal>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-flow ch-flow--linear">
      <NetworkGraph
        nodes={[
          { id: "read", label: "读取文件" },
          { id: "analyze", label: "分析改动" },
          { id: "plan", label: "列出计划" },
          { id: "confirm", label: "用户确认" },
          { id: "edit", label: "修改代码" },
          { id: "test", label: "运行测试" },
        ]}
        edges={[
          { from: "read", to: "analyze" },
          { from: "analyze", to: "plan" },
          { from: "plan", to: "confirm" },
          { from: "confirm", to: "edit" },
          { from: "edit", to: "test" },
        ]}
        visibleNodes={6}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-code ch-code--dark">
      <CodeBlock code={`userRoutes.js - after
    app.get('/users', async (req, res, next) => {
      try {
        const users = await User.find({});
        res.json(users);
      } catch (err) {
        logger.error('get users fail', { err });
        next(err);
      }
    });`} language="" highlights={[]} />
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">从工匠到指挥官</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">你交代意图，它负责落地</p>
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-compare ch-compare--contrast">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">老手</h3>
        <p className="ch-compare-body">增幅器 · 专注架构决策</p>
      </div>
      <div className="ch-compare-divider"><span>→</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">新手</h3>
        <p className="ch-compare-body">导师 + 执行者 · 读它写的代码</p>
      </div>
    </div>
    );
  }

  else if (step === 7) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">与 AI 高效协作</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">下一代开发者的核心技能</p>
    </div>
    );
  }

  return null;
}