// ═══════════════════════════════════════════════════════════════════════════════
// Manim build engine — AI generates Python Manim code, validates, renders
// ═══════════════════════════════════════════════════════════════════════════════

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { projectDir, readProjectFile, writeProjectFile } from "@/lib/projects";
import { isManimInstalled, checkPythonSyntax, validateManimImports, renderManimScene } from "@/lib/manim-render";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const ANTHROPIC_BASE = process.env.ANTHROPIC_BASE_URL ?? "https://qqqapi.com";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ParsedScene {
  number: number;
  id: string;
  title: string;
  steps: number;
  visualStrategy: string;
  sceneClassName: string;
}

interface ManimBuildJob {
  status: "running" | "done" | "error";
  scenes: ManimSceneStatus[];
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

interface ManimSceneStatus {
  sceneId: string;
  title: string;
  status: "pending" | "building" | "done" | "error";
  sceneFile?: string;
  error?: string;
}

const jobs = new Map<string, ManimBuildJob>();

export function getManimBuildJob(projectId: string): ManimBuildJob | null {
  return jobs.get(projectId) ?? null;
}

// ─── Outline Parsing ──────────────────────────────────────────────────────────

function parseManimOutline(outline: string): ParsedScene[] {
  const sections = outline.split(/(?=^## \d+\.)/m).filter((s) => s.trim().startsWith("##"));
  return sections.map((section) => {
    const header = section.match(/^## (\d+)\.\s+(\S+)\s*[—–-]\s*(.+?)（/m);
    if (!header) return null;
    const num = parseInt(header[1], 10);
    const id = header[2];
    const title = header[3].trim();
    const stepsMatch = section.match(/(\d+)\s*steps?/);
    const steps = stepsMatch ? parseInt(stepsMatch[1], 10) : 4;
    return {
      number: num,
      id,
      title,
      steps,
      visualStrategy: section.trim(),
      sceneClassName: `Scene${String(num).padStart(2, "0")}`,
    };
  }).filter(Boolean) as ParsedScene[];
}

// ─── System Prompt for Manim Code Generation ──────────────────────────────────

const MANIM_CODE_SYSTEM = `你是 Manim 动画代码生成助手，只负责生成单个场景的 Python 代码。

## 可用工具
- ProjectRead(path) / ProjectWrite(path, content) / ProjectShell(cmd) — **只允许 python3**

## ManimCE 代码规范
- API: \`from manim import *\`
- 场景类命名: SceneNN（如 Scene01, Scene02）
- 继承 \`Scene\`，实现 \`construct()\` 方法
- 分辨率 1920×1080（16:9 横版）

## 颜色
BLUE, RED, YELLOW, GREEN, ORANGE, WHITE, GREY, PURPLE, TEAL, GOLD
禁止硬编码 #RRGGBB，除非需要自定义颜色。

## Mobject
- 数学公式: \`MathTex(r"...", font_size=48)\`
- 中文文字: \`Text("中文", font_size=36, font="PingFang SC")\`
- 坐标轴: \`Axes(x_range=[a,b,step], y_range, x_length=10, y_length=6, axis_config={"include_numbers": True})\`
- 函数曲线: \`axes.plot(lambda x: expr, color=BLUE)\`
- 几何: \`Circle()\`, \`Square()\`, \`Arrow()\`, \`Dot()\`, \`Rectangle()\`
- 3D: \`ThreeDAxes()\`, \`Sphere()\`, \`ParametricSurface()\`
- 组合: \`VGroup(*mobjects)\`

## 定位
- \`.to_edge(UP)\`, \`.to_edge(DOWN)\`, \`.to_corner(UR)\`
- \`.next_to(other, DOWN, buff=0.5)\`
- \`.shift(UP * 2)\`, \`.scale(1.5)\`

## 动画
- \`self.play(Create(mob), Write(text))\` — 并行播放
- \`self.play(Transform(a, b))\` — 变形
- \`mob.animate.set_color(RED)\` — 变色
- \`mob.animate.shift(UP)\` — 移动
- \`FadeIn(mob)\`, \`FadeOut(mob)\`
- \`self.wait(1)\` — 暂停
- 场景总时长 5-20 秒，动画节奏适中

## 模板
\`\`\`python
from manim import *

class Scene01(Scene):
    def construct(self):
        # 1. 创建并放置 mobject
        title = Text("场景标题", font_size=40, font="PingFang SC")
        title.to_edge(UP)
        formula = MathTex(r"E = mc^2", font_size=64)
        formula.move_to(ORIGIN)

        # 2. 动画序列
        self.play(Write(title))
        self.wait(0.5)
        self.play(Write(formula))
        self.play(Indicate(formula, scale_factor=1.2))
        self.wait(2)
\`\`\`

## 完工检查
写完代码后运行: ProjectShell("python3 -c \\"import ast; ast.parse(open('manim_project/scene_NN.py').read()); print('OK')\\"")
有错必须修复。只汇报结果（"OK"或错误），不叙述过程。`;

// ─── Anthropic API Call ───────────────────────────────────────────────────────

async function callAnthropic(body: Record<string, unknown>, retries = 3): Promise<{
  content: Array<{ type: "text"; text?: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }>;
  usage: { input_tokens: number; output_tokens: number };
}> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...body, stream: false }),
    });

    if (res.ok) return res.json();

    if (res.status === 429 && attempt < retries) {
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
      console.warn(`[manim-build] 429 rate limited, retrying in ${Math.round(delay / 1000)}s`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    if (res.status >= 500 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }

    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 200)}`);
  }
  throw new Error("Anthropic: max retries exceeded");
}

// ─── Tool Execution ───────────────────────────────────────────────────────────

async function executeToolCall(projectId: string, name: string, input: Record<string, unknown>) {
  if (name === "ProjectRead") {
    return { content: readProjectFile(projectId, input.path as string) ?? "(not found)" };
  }
  if (name === "ProjectWrite") {
    writeProjectFile(projectId, input.path as string, input.content as string);
    return { success: true };
  }
  if (name === "ProjectShell") {
    const cmd = input.cmd as string;
    if (!cmd.startsWith("python3 ") && !cmd.startsWith("manim ")) {
      return { error: `Manim 构建中只允许 python3/manim 命令。收到: ${cmd.slice(0, 60)}` };
    }
    return new Promise((resolve) => {
      const proc = spawn("sh", ["-c", cmd], {
        cwd: path.join(projectDir(projectId)),
        env: { ...process.env },
      });
      let out = "";
      proc.stdout.on("data", (d: Buffer) => { out += d.toString(); });
      proc.stderr.on("data", (d: Buffer) => { out += d.toString(); });
      proc.on("close", (code) => resolve({ exitCode: code, output: out.slice(0, 2000) }));
      setTimeout(() => { proc.kill(); resolve({ error: "timeout" }); }, 60_000);
    });
  }
  return { error: `Unknown tool: ${name}` };
}

// ─── Build One Scene ──────────────────────────────────────────────────────────

async function buildOneScene(
  scene: ParsedScene,
  projectId: string,
  mainModel: string,
  outlineSection: string,
  statusRef: ManimSceneStatus,
): Promise<void> {
  statusRef.status = "building";
  const model = mainModel;

  type Msg = { role: "user" | "assistant"; content: Array<{ type: "text"; text: string }> };

  const messages: Msg[] = [{
    role: "user",
    content: [{
      type: "text",
      text: `生成场景 ${scene.sceneClassName}（${scene.title}）的 Manim Python 代码。\n\n场景规划:\n${outlineSection}\n\n写入 manim_project/scene_${String(scene.number).padStart(2, "0")}.py，然后用 python3 做 ast 语法检查。`,
    }],
  }];

  const sceneFile = `scene_${String(scene.number).padStart(2, "0")}.py`;

  for (let step = 0; step < 15; step++) {
    const body: Record<string, unknown> = {
      model,
      max_tokens: 8000,
      system: MANIM_CODE_SYSTEM,
      messages,
      tools: [
        { name: "ProjectRead", description: "Read a file", input_schema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
        { name: "ProjectWrite", description: "Write a file", input_schema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
        { name: "ProjectShell", description: "Run python3 command for syntax check", input_schema: { type: "object", properties: { cmd: { type: "string" } }, required: ["cmd"] } },
      ],
    };

    const data = await callAnthropic(body);
    const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
    for (const block of data.content) {
      if (block.type === "tool_use") toolCalls.push(block);
    }

    messages.push({ role: "assistant", content: data.content.map((c: any) => {
      if (c.type === "tool_use") return { type: "text", text: `[调用 ${c.name}]` };
      return { type: "text", text: c.text ?? "" };
    }) });

    if (toolCalls.length === 0) break;

    for (const tc of toolCalls) {
      const result = await executeToolCall(projectId, tc.name, tc.input);
      messages.push({ role: "user", content: [{ type: "text", text: JSON.stringify(result) }] });
    }
  }

  // Validate the generated code
  const code = readProjectFile(projectId, `manim_project/${sceneFile}`);
  if (!code) {
    statusRef.status = "error";
    statusRef.error = "场景文件未生成";
    return;
  }

  const importErr = validateManimImports(code);
  if (importErr) {
    statusRef.status = "error";
    statusRef.error = importErr;
    return;
  }

  const syntaxErr = checkPythonSyntax(code);
  if (syntaxErr) {
    statusRef.status = "error";
    statusRef.error = `Python 语法错误: ${syntaxErr}`;
    return;
  }

  statusRef.status = "done";
  statusRef.sceneFile = sceneFile;
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export function startManimBuild(projectId: string): void {
  if (jobs.get(projectId)?.status === "running") return;

  const outline = readProjectFile(projectId, "outline.md");
  if (!outline) {
    jobs.set(projectId, { status: "error", scenes: [], startedAt: Date.now(), error: "outline.md not found" });
    return;
  }

  const scenes = parseManimOutline(outline);
  if (scenes.length === 0) {
    jobs.set(projectId, { status: "error", scenes: [], startedAt: Date.now(), error: "outline.md 中未找到场景" });
    return;
  }

  const sceneStatuses: ManimSceneStatus[] = scenes.map((s) => ({
    sceneId: s.id,
    title: s.title,
    status: "pending",
  }));

  const job: ManimBuildJob = { status: "running", scenes: sceneStatuses, startedAt: Date.now() };
  jobs.set(projectId, job);

  // Create manim_project directory
  const manimDir = path.join(projectDir(projectId), "manim_project");
  fs.mkdirSync(manimDir, { recursive: true });
  fs.mkdirSync(path.join(manimDir, "output"), { recursive: true });

  // Run async
  (async () => {
    try {
      // Build scenes with concurrency of 2
      const CONCURRENCY = 2;
      const queue = [...scenes];
      async function worker() {
        while (queue.length > 0) {
          const scene = queue.shift()!;
          await buildOneScene(
            scene,
            projectId,
            "claude-sonnet-4-6", // Always use Claude for code gen
            scene.visualStrategy,
            sceneStatuses[scenes.indexOf(scene)],
          );
        }
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

      const allDone = sceneStatuses.every((s) => s.status === "done");
      job.status = allDone ? "done" : "error";
      job.finishedAt = Date.now();

      // If all scenes done and manim is installed, trigger render
      if (allDone && isManimInstalled()) {
        for (const ss of sceneStatuses) {
          const sf = scenes.find((s) => sceneStatuses[scenes.indexOf(s)] === ss);
          if (sf && ss.sceneFile) {
            renderManimScene(projectId, ss.sceneFile, sf.sceneClassName, "m");
          }
        }
      }
    } catch (err: any) {
      job.status = "error";
      job.error = err.message;
      job.finishedAt = Date.now();
    }
  })();
}
