import { MaskReveal } from "../../components/MaskReveal";
import { CodeBlock, Reveal } from "../../primitives";
import type { ChapterStepProps } from "../../registry/types";
import "./Coldopen.css";

export default function Coldopen({ step }: ChapterStepProps) {
  if (step === 0) {
    return (
    <div className="ch-hero ch-hero--centered bg-gradient-subtle">
      <h1 className="ch-hero-title">
        <MaskReveal show duration={900}>
          <span className="serif-cn">你说话，它写代码</span>
        </MaskReveal>
      </h1>
    </div>
    );
  }

  else if (step === 1) {
    return (
    <div className="ch-code ch-code--single-file">
      <CodeBlock code={`# 把表格画成柱状图，红色，标题叫「销售趋势」
    import matplotlib.pyplot as plt
    import pandas as pd
    
    df = pd.read_csv('sales.csv')
    plt.bar(df['月份'], df['销售额'], color='red')
    plt.title('销售趋势')
    plt.show()`} language="python" highlights={[]} />
    </div>
    );
  }

  else if (step === 2) {
    return (
    <div className="ch-code ch-code--single-file bg-gradient-subtle">
      <CodeBlock code={`# 👆 代码执行结果：
    # 📊 红色柱状图已渲染
    # 标题：「销售趋势」
    # 耗时：3.2 秒`} language="text" highlights={[]} />
    </div>
    );
  }

  return null;
}