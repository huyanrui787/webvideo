import type { Narration } from "../../registry/types";

export const narrations: Narration[] = [
  "说这么多理论，不如看个真实例子。",
  "假设你接手一个 Express 旧项目。路由文件里错误处理一塌糊涂，到处 console.log。",
  "你想统一改成 next(error) 传给全局错误中间件，再加 winston 日志。",
  "打开终端，敲 claude，说：「帮我把 routes/userRoutes.js 里的错误处理重构一下，不要用 console.log，改用 next(error)，catch 块加 winston 日志。」",
  "它会先读文件，分析所有改动位置，列出计划让你确认。确认后飞速改代码，然后主动跑 npm test。",
  "测试不通过？它根据报错继续改，直到通过。最后还帮你更新注释，问你要不要提交 commit。",
  "整个过程可能就两三分钟。你全程目击，随时喊停。",
  "这种感觉就像从工匠变成了指挥官。你交代意图、把控方向，它负责落地。",
];