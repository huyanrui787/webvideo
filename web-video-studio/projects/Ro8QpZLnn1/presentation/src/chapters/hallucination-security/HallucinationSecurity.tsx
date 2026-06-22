import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, Counter, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./HallucinationSecurity.css";

export default function HallucinationSecurity({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-bold">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">⚠️ 翻车现场</span>
        </MaskReveal>
      </h1>
      <p className="ch-hero-sub">Codex 绝对不是万能的</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-data ch-data--single-stat bg-gradient-bold">
      <div className="ch-data-primary">
        <Counter to={parseFloat("凭空编造") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">凭空编造</span>
        <span className="ch-data-label label-mono">不存在的函数</span>
      </div>
      <p className="ch-data-context">幻觉 Hallucination · 看起来合理，实际根本不存在</p>
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`# 你问：某个冷门库怎么用？
    from obscure_lib import smart_optimize
    
    # Codex 编造的函数： ❌
    result = smart_optimize(data, method='quantum')
    #          ^^^^^^^^^^^^^^
    #          这个函数根本不存在！
    #          AI 臆想出来的！
    
    # 你一跑：
    # ModuleNotFoundError: No function 'smart_optimize'`} language="python" highlights={[]} />
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-compare ch-compare--vs bg-gradient-bold">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">训练数据</h3>
        <p className="ch-compare-body">社区代码 · SQL 注入 · XSS 攻击 · 权限绕过</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">Codex 生成</h3>
        <p className="ch-compare-body">继承漏洞 · 直接拼 SQL · 未过滤输入 · 暴露接口</p>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`# 你让 Codex 写登录接口，它流畅写完：
    def login(username, password):
        query = f"SELECT * FROM users WHERE name='{username}' AND pass='{password}'"
        #                            ❌ 直接拼接！SQL 注入！
        result = db.execute(query)
        return result
    
    # 攻击者输入：
    # username: admin' --
    # 实际查询变成：
    # SELECT * FROM users WHERE name='admin' --' AND pass='...'
    #                         把密码检查注释掉了！直接登录！`} language="python" highlights={[]} />
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-quote ch-quote--centered bg-gradient-bold">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">学会了流畅的切菜功夫，却不知道把不新鲜的菜叶扔掉。你吃下去，就容易闹肚子。</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-compare ch-compare--vs bg-gradient-bold">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">简单任务 ✓</h3>
        <p className="ch-compare-body">写排序算法 · 一步到位 · 定义清晰</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">复杂需求 ✗</h3>
        <p className="ch-compare-body">满200减30 · 会员八折 · 限时特价不参与 · 条件互斥</p>
      </div>
    </div>
    );
  }

  return null;
}