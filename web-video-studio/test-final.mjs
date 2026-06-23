import { deepseek } from "@ai-sdk/deepseek";
import { streamText, convertToModelMessages } from "ai";

async function main() {
  // Simulate qT-z5phWin messages: user → assistant with tools → user "继续"
  const msgs = [
    { id:"1", role:"user", parts:[{type:"text",text:"请读取 article.md 并开始制作视频"}] },
    { id:"2", role:"assistant", parts:[
      {type:"text",text:"好的，开始读取原文。"},
      {type:"tool-invocation",toolName:"ProjectRead",input:{path:"article.md"},state:"result"},
      {type:"text",text:"文章已读取，现在开始写稿。"},
      {type:"tool-invocation",toolName:"ProjectWrite",input:{path:"rhythm.md",content:"# rhythm"},state:"result"},
    ]},
    { id:"3", role:"user", parts:[{type:"text",text:"继续"}] },
  ];

  // Strip tool parts (our fix)
  const clean = msgs.map(m => ({
    ...m,
    parts: m.parts.filter(p => p.type === "text")
  }));
  console.log("Original parts:", msgs[1].parts.length, "→ Clean:", clean[1].parts.length);

  const modelMsgs = await convertToModelMessages(clean);
  console.log("Model messages:", modelMsgs.length);
  console.log("Assistant content types:", JSON.stringify(modelMsgs[1]).slice(0, 300));

  const model = deepseek("deepseek-v4-pro");
  try {
    const result = await streamText({
      model,
      system: "You are a helpful assistant. Reply in Chinese, briefly.",
      messages: modelMsgs,
      maxOutputTokens: 60,
    });
    console.log("✅ streamText OK:", (await result.text).slice(0, 200));
  } catch (err: any) {
    console.log("❌ ERROR:", err.message?.slice(0, 500));
  }
}
main();
