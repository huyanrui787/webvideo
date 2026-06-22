/**
 * Integration test for illustrated-article mode.
 * Run with: npx tsx scripts/test-article-layout.ts
 */
import { parseArticle, placeIllustrations, buildLayout, autoLayout } from "../lib/article-layout";
import { renderToWechatHTML, renderToMarkdown, renderToHTML } from "../lib/article-export";
import { db } from "../lib/db";
import { articleLayouts } from "../lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import type { LayoutBlock, IllustrationShot } from "../lib/db/schema";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (e) {
      console.log(`  ❌ ${name}: ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  };
}

const SAMPLE_MD = `# 信息过载时代的注意力管理

## 为什么信息过载是个问题

每天醒来，我们面对的是无穷无尽的信息流。微信消息、邮件通知、社交媒体推送、新闻客户端——它们都在争夺我们最稀缺的资源：注意力。

就像一个大漏斗，我们的大脑其实一直在过滤。但问题是，很多时候我们连漏斗的方向都搞反了。我们试图接收更多，而不是更少。

> 注意力不是被消耗的，而是被分散的。分散到一定程度，你就什么都不剩了。

## 漏斗模型：从混乱到清晰

认知心理学里有个概念叫注意力过滤模型。简单说，大脑有三个过滤层：感知过滤、理解过滤、记忆过滤。每一层都会丢掉大量信息。

第一层是感知过滤——你看到的所有东西里，只有不到1%进入你的意识。第二层是理解过滤——你能理解的只是你已知框架能容纳的。第三层是记忆过滤——24小时内你会忘记80%的接收信息。

## 如何建立自己的信息过滤系统

首先，减少信息入口。不是所有的信息都值得看。其次，建立处理流程——收集、过滤、消化、输出。最后，定期清空——没有输出的输入最终都会变成噪音。`;

function makeTestShots() {
  const shots: IllustrationShot[] = [
    {
      id: "shot-1",
      projectId: "test",
      chapterId: "attention",
      stepIdx: 0,
      theme: "信息过载",
      structureType: "概念隐喻",
      coreIdea: "大脑像漏斗一样过滤信息洪流",
      xiaoheiAction: "小黑站在巨大漏斗前抵挡信息洪流",
      elements: '["手机","通知","漏斗","大脑"]',
      labels: '["过载","过滤","稀缺"]',
      promptEn: "Generate...",
      assetFilename: "test.png",
      assetUrl: "/api/projects/test/assets/illustrations/test.png",
      generationStatus: "done",
      generationError: null,
      kenBurnsScale: null,
      kenBurnsPanX: 0,
      kenBurnsPanY: 0,
      sortOrder: 0,
      createdAt: Date.now(),
    },
  ];
  return shots;
}

async function main() {
  console.log("═══ Integration Test: Illustrated Article Mode ═══\n");

  // ─── Test 1: Markdown Parsing ─────────────────────────────────

  console.log("Test 1: parseArticle");
  await test("parses headings correctly", () => {
    const blocks = parseArticle(SAMPLE_MD);
    const headings = blocks.filter((b) => b.type === "heading");
    if (headings.length < 3) throw new Error("Expected >=3 headings, got " + headings.length);
    if (headings[0]!.content !== "信息过载时代的注意力管理") throw new Error("H1 wrong: " + headings[0]!.content);
  })();
  await test("parses blockquotes", () => {
    const blocks = parseArticle(SAMPLE_MD);
    const quotes = blocks.filter((b) => b.type === "quote");
    if (quotes.length === 0) throw new Error("No quotes found");
  })();
  await test("parses paragraphs", () => {
    const blocks = parseArticle(SAMPLE_MD);
    const paras = blocks.filter((b) => b.type === "paragraph");
    if (paras.length < 5) throw new Error("Expected >=5 paragraphs, got " + paras.length);
  })();

  // ─── Test 2: Illustration Placement ────────────────────────────

  console.log("\nTest 2: placeIllustrations");
  await test("places shots at matching paragraphs", () => {
    const blocks = parseArticle(SAMPLE_MD);
    const shots = makeTestShots();
    const placements = placeIllustrations(blocks, shots);
    if (placements.size !== 1) throw new Error("Expected 1 placement, got " + placements.size);
    const idx = [...placements.keys()][0]!;
    const block = blocks[idx];
    if (!block) throw new Error("Invalid placement index");
    if (!block.content.includes("漏斗")) throw new Error('Expected near funnel, got "' + block.content.slice(0, 50) + '"');
  })();
  await test("handles empty shots array", () => {
    const blocks = parseArticle(SAMPLE_MD);
    const placements = placeIllustrations(blocks, []);
    if (placements.size !== 0) throw new Error("Should be empty");
  })();

  // ─── Test 3: Layout Building ──────────────────────────────────

  console.log("\nTest 3: buildLayout / autoLayout");
  await test("autoLayout produces valid structure", () => {
    const shots = makeTestShots();
    const layout = autoLayout(SAMPLE_MD, shots);
    if (layout.length === 0) throw new Error("Empty layout");
    const illus = layout.filter((b) => b.type === "illustration");
    if (illus.length < 1) throw new Error("No illustration blocks");
    const types = layout.map((b) => b.type);
    if (!types.includes("heading")) throw new Error("Missing headings");
  })();

  // ─── Test 4: Export Engines ───────────────────────────────────

  console.log("\nTest 4: Export");

  const testBlocks: LayoutBlock[] = [
    { id: "1", type: "heading", content: "测试标题" },
    { id: "2", type: "paragraph", content: "这是一段**测试**文字。", spacingBefore: "normal" },
    { id: "3", type: "illustration", shotId: "s1", illustrationUrl: "https://example.com/img.png", caption: "测试图片", width: "full" },
    { id: "4", type: "quote", content: "这是一段引用。" },
    { id: "5", type: "divider", content: "" },
    { id: "6", type: "paragraph", content: "最后一段。" },
  ];

  // (wrapped in async since test harness requires it)
  await (async () => {
    try {
      const html = renderToWechatHTML(testBlocks, "测试文章");
      if (!html.includes("测试标题")) throw new Error("Missing title");
      if (!html.includes("<strong>测试</strong>")) throw new Error("Missing bold");
      if (!html.includes("font-size")) throw new Error("Missing inline styles");
      if (html.includes("class=")) throw new Error("Must not have class attributes");
      console.log("  ✅ WeChat HTML export");
      passed++;
    } catch (e) { console.log("  ❌ WeChat HTML:", e instanceof Error ? e.message : String(e)); failed++; }

    try {
      const md = renderToMarkdown(testBlocks, "测试文章");
      if (!md.includes("# 测试文章")) throw new Error("Missing H1");
      if (!md.includes("![测试图片]")) throw new Error("Missing image");
      if (!md.includes("> 这是一段引用")) throw new Error("Missing quote");
      console.log("  ✅ Markdown export");
      passed++;
    } catch (e) { console.log("  ❌ Markdown:", e instanceof Error ? e.message : String(e)); failed++; }

    try {
      const html2 = renderToHTML(testBlocks, "测试文章");
      if (!html2.includes("<!DOCTYPE html>")) throw new Error("Not a full page");
      if (!html2.includes("<figcaption>")) throw new Error("Missing figcaption");
      console.log("  ✅ HTML export");
      passed++;
    } catch (e) { console.log("  ❌ HTML:", e instanceof Error ? e.message : String(e)); failed++; }
  })();

  // ─── Test 5: Database ─────────────────────────────────────────

  console.log("\nTest 5: Database");

  const testProjectId = "-R4pqr4-G0";

  await test("upsert article layout", async () => {
    const id = nanoid();
    const now = Math.floor(Date.now() / 1000);

    // Clean up previous
    await db.delete(articleLayouts).where(eq(articleLayouts.projectId, testProjectId));

    // Insert
    await db.insert(articleLayouts).values({
      id,
      projectId: testProjectId,
      blocks: JSON.stringify(testBlocks),
      themeConfig: "{}",
      createdAt: now,
      updatedAt: now,
    });

    const rows = await db
      .select()
      .from(articleLayouts)
      .where(eq(articleLayouts.projectId, testProjectId));
    if (rows.length !== 1) throw new Error("Insert failed");
    if (rows[0]!.blocks !== JSON.stringify(testBlocks)) throw new Error("Data mismatch");

    // Cleanup
    await db.delete(articleLayouts).where(eq(articleLayouts.projectId, testProjectId));
  })();

  // ─── Summary ──────────────────────────────────────────────────

  console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══`);
  if (failed > 0) process.exit(1);
}

main();
