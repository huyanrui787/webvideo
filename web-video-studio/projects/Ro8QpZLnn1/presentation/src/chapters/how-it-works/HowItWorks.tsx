import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, Counter, NetworkGraph, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./HowItWorks.css";

export default function HowItWorks({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-data ch-data--single-stat bg-gradient-subtle">
      <div className="ch-data-primary">
        <Counter to={parseFloat("164") || 0} delay={0.2} stepTime={1.2} />
        <span className="ch-data-value">164</span>
        <span className="ch-data-label label-mono">道手写编程题</span>
      </div>
      <p className="ch-data-context">HumanEval 评测集 · 每道题含自然语言描述 + 测试用例</p>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-flow ch-flow--horizontal">
      <NetworkGraph
        nodes={[
          { id: "read", label: "理解题目", description: "读人话描述" },
          { id: "gen", label: "生成代码", description: "毫秒级响应" },
          { id: "test", label: "跑测试", description: "真的执行" },
          { id: "fix", label: "修正", description: "从错误中学习" },
        ]}
        edges={[
        ]}
        visibleNodes={4}
        stepTime={1.0}
      />
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-compare ch-compare--vs">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">生成</h3>
        <p className="ch-compare-body">几毫秒 · 模式匹配 · 概率输出</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">验证</h3>
        <p className="ch-compare-body">真正运行代码 · 理解执行逻辑 · 跑通测试用例</p>
      </div>
    </div>
    );
  }

  else if (step === 3) {
    return (
    <div className="ch-compare ch-compare--vs bg-gradient-subtle">
      <div className="ch-compare-panel ch-compare-left">
        <h3 className="ch-compare-heading">优雅代码</h3>
        <p className="ch-compare-body">教科书写法 · 最佳实践 · 清晰注释</p>
      </div>
      <div className="ch-compare-divider"><span>VS</span></div>
      <div className="ch-compare-panel ch-compare-right">
        <h3 className="ch-compare-heading">社区代码</h3>
        <p className="ch-compare-body">初学者 bug · 屎山 · 隐藏漏洞</p>
      </div>
    </div>
    );
  }

  else if (step === 4) {
    return (
    <div className="ch-quote ch-quote--centered">
      <blockquote className="ch-quote-text pull-quote">
        <MaskReveal show duration={1100}>
          <span className="serif-cn">鱼龙混杂的训练数据，让它见多识广——但也埋下了翻车的伏笔。</span>
        </MaskReveal>
      </blockquote>
    </div>
    );
  }

  else if (step === 5) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`// 读取 CSV 文件并计算平均值
    // 👆 你只写了这一行注释……
    
    // 👇 Copilot 自动补全了下面的全部：
    import csv
    from statistics import mean
    
    def calculate_average(filename):
        with open(filename, 'r') as f:
            reader = csv.DictReader(f)
            values = [float(row['value']) for row in reader]
        return mean(values)`} language="python" highlights={[]} />
    </div>
    );
  }

  else if (step === 6) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`def validate_email(email):
        # Copilot 自动补全 👇
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\$'
        if not re.match(pattern, email):
            raise ValueError(f"Invalid email: {email}")
        return True`} language="python" highlights={[]} />
    </div>
    );
  }

  return null;
}