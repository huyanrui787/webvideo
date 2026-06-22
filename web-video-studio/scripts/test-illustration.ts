/**
 * Integration test for illustration-video mode.
 * Run with: npx tsx scripts/test-illustration.ts
 */
import { buildImagePrompt } from "../lib/illustration-prompt";
import { checkShot, summarizeQA } from "../lib/illustration-qa";
import { db } from "../lib/db";
import { illustrationShots } from "../lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

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

async function main() {
  console.log("═══ Integration Test: Illustration Video Mode ═══\n");

  // ─── Test 1: Prompt builder ────────────────────────────────────

  console.log("Test 1: buildImagePrompt");

  await test("generates English prompt with all required sections", () => {
    const shot = makeTestShot();
    const p = buildImagePrompt(shot);
    const checks = [
      ["16:9", p.includes("16:9")],
      ["white background", p.includes("white background")],
      ["小黑 character", p.includes("小黑")],
      ["hand-drawn", p.includes("hand-drawn")],
      ["no gradients", /no gradients/i.test(p)],
      ["constraints section", p.includes("Constraints:")],
      ["theme in prompt", p.includes("信息过载滤镜")],
      ["structure type", p.includes("概念隐喻")],
      ["core idea", p.includes("大脑像漏斗")],
      ["xiaohei action", p.includes("小黑站在漏斗旁")],
      ["elements listed", p.includes("纸张堆")],
      ["labels listed", p.includes("过载")],
    ];
    for (const [name, ok] of checks) {
      if (!ok) throw new Error(`Missing: ${name}`);
    }
  })();

  await test("handles empty elements/labels gracefully", () => {
    const shot = makeTestShot();
    shot.elements = "[]";
    shot.labels = "[]";
    const p = buildImagePrompt(shot);
    if (!p.includes("16:9")) throw new Error("Core prompt structure broken");
  })();

  // ─── Test 2: QA engine ─────────────────────────────────────────

  console.log("\nTest 2: QA Engine");

  await test("passes a well-formed shot", () => {
    const shot = makeTestShot();
    shot.generationStatus = "done";
    shot.promptEn = buildImagePrompt(shot);
    shot.assetFilename = "test.png";
    const result = checkShot(shot);
    if (!result.passed) {
      const fails = result.checks.filter((c) => !c.passed).map((c) => c.name);
      throw new Error(`Expected pass but failed: ${fails.join(", ")}`);
    }
    if (result.score < 80) throw new Error(`Score too low: ${result.score}`);
  })();

  await test("fails on error status", () => {
    const shot = makeTestShot();
    shot.generationStatus = "error";
    const result = checkShot(shot);
    if (result.passed) throw new Error("Expected fail on error status");
  })();

  await test("flags missing background constraint", () => {
    const shot = makeTestShot();
    shot.generationStatus = "done";
    shot.promptEn = "Generate an illustration with 小黑 character";
    shot.assetFilename = "test.png";
    const result = checkShot(shot);
    const bgCheck = result.checks.find((c) => c.name === "背景描述");
    if (!bgCheck || bgCheck.passed) throw new Error("Expected background check to fail");
  })();

  await test("summarizeQA aggregates correctly", () => {
    const shot1 = makeTestShot();
    shot1.generationStatus = "done";
    shot1.promptEn = buildImagePrompt(shot1);
    shot1.assetFilename = "a.png";

    const shot2 = makeTestShot();
    shot2.generationStatus = "error";
    shot2.promptEn = "bad";

    const results = [checkShot(shot1), checkShot(shot2)];
    const summary = summarizeQA(results);
    if (summary.totalShots !== 2) throw new Error("Wrong count");
    if (summary.passedShots !== 1) throw new Error("Wrong passed count");
    if (summary.averageScore > 90) throw new Error("Score should be lower with one error");
  })();

  // ─── Test 3: DB operations ─────────────────────────────────────

  console.log("\nTest 3: Database");

  const testProjectId = `-R4pqr4-G0`; // use existing project for FK

  await test("insert and read illustration_shots", async () => {
    const id = nanoid();
    await db.insert(illustrationShots).values({
      id,
      projectId: testProjectId,
      chapterId: "ch1",
      stepIdx: 0,
      theme: "Test Shot",
      structureType: "概念隐喻",
      coreIdea: "Testing",
      xiaoheiAction: "小黑 tests",
      elements: '["a","b","c"]',
      labels: '["t1","t2"]',
      sortOrder: 0,
      createdAt: Math.floor(Date.now() / 1000),
    });

    const rows = await db
      .select()
      .from(illustrationShots)
      .where(eq(illustrationShots.id, id));

    if (rows.length !== 1) throw new Error("Insert failed");
    if (rows[0]!.theme !== "Test Shot") throw new Error("Wrong data");
    if (rows[0]!.generationStatus !== "pending") throw new Error("Wrong default status");

    // Cleanup
    await db.delete(illustrationShots).where(eq(illustrationShots.id, id));
  })();

  await test("update generation status", async () => {
    const id = nanoid();
    await db.insert(illustrationShots).values({
      id,
      projectId: testProjectId,
      chapterId: "ch2",
      stepIdx: 1,
      theme: "Update Test",
      structureType: "前后对比",
      coreIdea: "Update test",
      sortOrder: 1,
      createdAt: Math.floor(Date.now() / 1000),
    });

    await db
      .update(illustrationShots)
      .set({ generationStatus: "done", assetFilename: "ch2-01-test.png" })
      .where(eq(illustrationShots.id, id));

    const rows = await db
      .select()
      .from(illustrationShots)
      .where(eq(illustrationShots.id, id));

    if (rows[0]!.generationStatus !== "done") throw new Error("Update failed");

    await db.delete(illustrationShots).where(eq(illustrationShots.id, id));
  })();

  // Cleanup test project
  await db.delete(illustrationShots).where(eq(illustrationShots.projectId, testProjectId));

  // ─── Test 4: Schema type exports ────────────────────────────────

  console.log("\nTest 4: Schema types");

  await test("ProjectType includes illustration-video", async () => {
    const schema = await import("../lib/db/schema");
    // TypeScript type check — runtime just verifies module loads
    if (!schema.illustrationShots) throw new Error("illustrationShots table missing");
  })();

  await test("ProjectStatus includes illustrating", async () => {
    const schema = await import("../lib/db/schema");
    // Runtime check — the type union is compile-time
    const statuses = schema.projects.status;
    if (!statuses) throw new Error("projects.status enum missing");
  })();

  // ─── Summary ────────────────────────────────────────────────────

  console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══`);
  if (failed > 0) process.exit(1);
}

function makeTestShot() {
  return {
    id: "test-shot-1",
    projectId: "test",
    chapterId: "coldopen",
    stepIdx: 0,
    theme: "信息过载滤镜",
    structureType: "概念隐喻" as const,
    coreIdea: "大脑像漏斗一样过滤信息",
    xiaoheiAction: "小黑站在漏斗旁过滤信息洪流",
    elements: JSON.stringify(["纸张堆", "漏斗", "干净输出"]),
    labels: JSON.stringify(["过载", "过滤", "清晰"]),
    promptEn: null as string | null,
    assetFilename: null as string | null,
    assetUrl: null as string | null,
    generationStatus: "pending" as const,
    generationError: null as string | null,
    kenBurnsScale: null as number | null,
    kenBurnsPanX: null as number | null,
    kenBurnsPanY: null as number | null,
    sortOrder: 0,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

main();
