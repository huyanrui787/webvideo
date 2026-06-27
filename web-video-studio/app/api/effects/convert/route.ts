import { streamText } from "ai";
import { getModel } from "@/lib/model-provider";

export const maxDuration = 120;

const SYSTEM = `你是一个专业的创意编程转换器。
将用户提供的 p5.js 源码改写成 React + useSeekableCanvas 格式，用于视频帧渲染系统。
输出 JSON，格式：{"effectCode": "完整TSX代码字符串", "aiHint": "15字以内适用场景说明"}
effectCode 是完整 TSX 代码，不要 markdown 代码块包裹。`;

const USER_PROMPT = (name: string, slug: string, source: string) => `
将以下 p5.js 代码改写为 React + useSeekableCanvas 格式。

组件名：${name}Effect
文件注释：// showcase-effects/${slug}/code.tsx

改写规则：
1. t 必须是时间的纯函数——禁止 let x += speed 这类累积状态
2. frameCount 等效为 t * 60
3. random() 替换为 hash(seed) 保证确定性
4. 颜色优先用 var(--accent, fallback) 等 CSS token
5. 画布尺寸用 w/h 参数

输出完整 TSX（包含 useSeekableCanvas 内联实现），不要 markdown 代码块。
同时在 aiHint 字段给出15字以内的适用场景说明。

p5.js 源码：
${source}

以 JSON 格式输出：{"effectCode": "...", "aiHint": "..."}`;

export async function POST(req: Request) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { source, name, slug } = await req.json() as {
    source: string;
    name: string;
    slug: string;
  };

  if (!source?.trim() || !name?.trim() || !slug?.trim()) {
    return Response.json({ error: "source, name, slug required" }, { status: 400 });
  }

  if (source.length > 80_000) {
    return Response.json({ error: "源码过长（最大 80000 字符）" }, { status: 400 });
  }

  let text = "";
  try {
    const result = await streamText({
      model: getModel("deepseek-chat"),
      system: SYSTEM,
      messages: [{ role: "user", content: USER_PROMPT(name, slug, source) }],
      maxOutputTokens: 8000,
    });
    text = (await result.text).trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `AI 调用失败: ${msg}` }, { status: 502 });
  }

  if (!text) {
    return Response.json({ error: "AI 返回内容为空，请重试" }, { status: 502 });
  }

  // Try to parse as JSON
  let effectCode = "";
  let aiHint = "";
  try {
    // Strip markdown json block if present
    const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(clean) as { effectCode: string; aiHint: string };
    effectCode = parsed.effectCode ?? "";
    aiHint = parsed.aiHint ?? "";
  } catch {
    // Fallback: extract code from markdown block if any
    const codeMatch = text.match(/```(?:tsx?|jsx?)?\s*([\s\S]*?)```/);
    effectCode = codeMatch ? codeMatch[1].trim() : text;
    aiHint = "";
  }

  if (!effectCode) {
    return Response.json({ error: `代码提取失败，AI 原始输出：${text.slice(0, 200)}` }, { status: 502 });
  }

  return Response.json({ effectCode, aiHint });
}
