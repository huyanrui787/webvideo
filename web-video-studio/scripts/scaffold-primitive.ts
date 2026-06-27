#!/usr/bin/env tsx
/**
 * Primitive 脚手架 — 一键生成新 primitive 并完成全部注册。
 *
 * 用法:
 *   npx tsx scripts/scaffold-primitive.ts --name=RippleWave --cat=animation --type=gsap
 *   npx tsx scripts/scaffold-primitive.ts --name=Sunburst --cat=animation --type=canvas
 *
 * 自动完成:
 *   1. 创建组件骨架文件
 *   2. 更新 barrel export (primitives/index.ts)
 *   3. 更新 compiler.ts (ALL_PRIMITIVES + COMPONENT_NAME)
 *   4. 更新 types.ts (PRIMITIVE_IDS + params schema)
 *   5. 更新 PRIMITIVES.md (快速选型表 + 完整文档)
 *   6. 在展示页插入占位卡片
 *
 * 参数:
 *   --name      Primitive 名称 (PascalCase, 必填)
 *   --cat       类别: text|data|media|layout|decor|svg|chart|animation (默认 animation)
 *   --type      类型: gsap|canvas|svg|react (默认 gsap)
 *   --desc      简短描述 (可选, 默认取 name)
 *   --dry-run   预览改动但不写文件
 */

import fs from "fs";
import path from "path";

// ─── Config ────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..");
const SKILL_PRIMITIVES = path.join(ROOT, "..", "skills", "main", "web-video-presentation", "templates", "src", "primitives");
const COMPILER_FILE = path.join(ROOT, "lib", "chapter-blueprint", "compiler.ts");
const TYPES_FILE = path.join(ROOT, "lib", "chapter-blueprint", "types.ts");
const PRIMITIVES_MD = path.join(ROOT, "..", "skills", "main", "web-video-presentation", "references", "PRIMITIVES.md");
const SHOWCASE_PAGE = path.join(ROOT, "app", "(main)", "showcase", "primitives", "page.tsx");

interface ScaffoldOptions {
  name: string;
  category: string;
  type: "gsap" | "canvas" | "svg" | "react";
  description: string;
  dryRun: boolean;
}

// ─── Parse args ────────────────────────────────────────────────────────────

function parseArgs(): ScaffoldOptions {
  const args = process.argv.slice(2);
  const get = (key: string, def: string) => {
    const found = args.find((a) => a.startsWith(`--${key}=`));
    return found ? found.split("=")[1] : def;
  };
  const name = get("name", "");
  if (!name || !/^[A-Z][a-zA-Z0-9]+$/.test(name)) {
    console.error("✗ --name 必填，且必须是 PascalCase，例如: --name=RippleWave");
    process.exit(1);
  }
  return {
    name,
    category: get("cat", "animation"),
    type: get("type", "gsap") as "gsap" | "canvas" | "svg" | "react",
    description: get("desc", name),
    dryRun: args.includes("--dry-run"),
  };
}

// ─── Component skeleton generators ─────────────────────────────────────────

function gsapSkeleton(name: string): string {
  return `import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { CSSProperties } from "react";

interface ${name}Props {
  /** TODO: 定义你的 props */
  color?: string;
  size?: number;
  duration?: number;
  delay?: number;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

export function ${name}({
  color = "var(--accent)",
  size = 200,
  duration = 3,
  delay = 0,
  stepTime,
  className,
  style,
}: ${name}Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const tl = gsap.timeline({ delay, repeat: -1, repeatDelay: 0.8 });
    tlRef.current = tl;

    // TODO: 在这里写你的 GSAP 动画逻辑
    // 示例: tl.to(svg.querySelector("#el"), { rotation: 360, duration, ease: "none" });

    return () => { tl.kill(); };
  }, [duration, delay]);

  useEffect(() => {
    if (stepTime != null && tlRef.current) {
      tlRef.current.seek(stepTime % (tlRef.current.duration() || 1));
    }
  }, [stepTime]);

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 200 200" className={className} style={style}>
      {/* TODO: 替换为你的 SVG 内容 */}
      <circle cx="100" cy="100" r="40" fill="none" stroke={color} strokeWidth={3} />
    </svg>
  );
}
`;
}

function canvasSkeleton(name: string): string {
  return `import type { CSSProperties } from "react";
import { useSeekableCanvas } from "../canvas/useSeekableCanvas";

interface ${name}Props {
  /** TODO: 定义你的 props */
  color?: string;
  size?: number;
  stepTime?: number;
  className?: string;
  style?: CSSProperties;
}

export function ${name}({
  color = "var(--accent)",
  size = 200,
  stepTime,
  className,
  style,
}: ${name}Props) {
  const ref = useSeekableCanvas((ctx, t, w, h) => {
    // TODO: 在这里写你的 Canvas 动画逻辑
    ctx.clearRect(0, 0, w, h);

    // 示例: 画一个旋转的方块
    const cx = w / 2, cy = h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.5);
    ctx.fillStyle = color;
    ctx.fillRect(-30, -30, 60, 60);
    ctx.restore();
  });

  const canvasH = size * 0.75;
  return (
    <canvas
      ref={ref}
      width={size}
      height={canvasH}
      className={className}
      style={{ background: "#0a0a14", width: size, height: canvasH, ...style }}
    />
  );
}
`;
}

function svgSkeleton(name: string): string {
  return `import type { CSSProperties } from "react";

interface ${name}Props {
  /** TODO: 定义你的 props */
  color?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function ${name}({
  color = "var(--accent)",
  size = 200,
  className,
  style,
}: ${name}Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} style={style}>
      {/* TODO: 替换为你的 SVG 内容 */}
      <rect x="40" y="40" width="120" height="120" rx="12" fill="none" stroke={color} strokeWidth={3} />
    </svg>
  );
}
`;
}

function reactSkeleton(name: string): string {
  return `import type { CSSProperties } from "react";

interface ${name}Props {
  /** TODO: 定义你的 props */
  color?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function ${name}({
  color = "var(--accent)",
  size = 200,
  className,
  style,
}: ${name}Props) {
  return (
    <div className={className} style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      {/* TODO: 替换为你的组件内容 */}
      <div style={{ width: "60%", height: "60%", background: color, borderRadius: 12 }} />
    </div>
  );
}
`;
}

const SKELETONS: Record<string, (name: string) => string> = {
  gsap: gsapSkeleton,
  canvas: canvasSkeleton,
  svg: svgSkeleton,
  react: reactSkeleton,
};

// ─── Category → directory mapping ──────────────────────────────────────────

const CAT_DIR: Record<string, string> = {
  text: "text",
  data: "data",
  media: "media",
  layout: "layout",
  decor: "decor",
  svg: "svg-fx",
  chart: "chart",
  animation: "animation",
};

// ─── Barrel export marker ──────────────────────────────────────────────────

const BARREL_MARKERS: Record<string, string> = {
  text: "export { Caption }",
  data: "// ─── Data",
  media: "// ─── Media",
  layout: "// ─── Layout",
  decor: "// ─── Decor",
  svg: "// ─── SVG FX",
  chart: "// ─── Chart",
  animation: "// ─── Animation (GSAP)",
};

// ─── Compiler markers ──────────────────────────────────────────────────────

const COMPILER_ALL_MARKER = "// Animation (GSAP)";
const COMPILER_NAME_MARKER = "// Animation (GSAP)";

// ─── Types markers ─────────────────────────────────────────────────────────

const TYPES_IDS_MARKER = '// ── GSAP 动画 (18) ──';
const TYPES_PARAMS_MARKER = '  // ── 包装器';

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs();
  const { name, category, type, description, dryRun } = opts;
  const dir = CAT_DIR[category] ?? "animation";
  const compDir = path.join(SKILL_PRIMITIVES, dir);
  const compFile = path.join(compDir, `${name}.tsx`);
  const skeleton = (SKELETONS[type] ?? gsapSkeleton)(name);

  console.log(`\n🧱 Scaffolding primitive: ${name}`);
  console.log(`   类别: ${category}  类型: ${type}  目录: primitives/${dir}/`);
  if (dryRun) console.log("   ⚠️  DRY RUN — 不会写入任何文件\n");

  // ── 1. 创建组件文件 ──────────────────────────────────────────────────
  if (!dryRun) {
    if (fs.existsSync(compFile)) {
      console.log(`   ⚠️  ${name}.tsx 已存在，跳过创建`);
    } else {
      fs.mkdirSync(compDir, { recursive: true });
      fs.writeFileSync(compFile, skeleton, "utf-8");
      console.log(`   ✓ 创建 ${name}.tsx`);
    }
  } else {
    console.log(`   [dry] 将创建 ${name}.tsx`);
  }

  // ── 2. Barrel export ─────────────────────────────────────────────────
  const barrelFile = path.join(SKILL_PRIMITIVES, "index.ts");
  let barrel = fs.readFileSync(barrelFile, "utf-8");
  // Find the right category marker and insert export after its section
  const barrelMarker = BARREL_MARKERS[category] ?? BARREL_MARKERS.animation;
  const barrelLines = barrel.split("\n");
  let insertAt = barrelLines.length - 1;
  for (let i = 0; i < barrelLines.length; i++) {
    if (barrelLines[i].includes(barrelMarker)) {
      // Find the last export in that section
      let j = i;
      while (j < barrelLines.length && (barrelLines[j].includes("export") || barrelLines[j].trim() === "" || j === i)) {
        j++;
      }
      insertAt = j;
      break;
    }
  }
  const exportLine = `export { ${name} } from "./${dir}/${name}";`;
  if (!dryRun) {
    const existing = barrel.includes(exportLine);
    if (existing) {
      console.log(`   ⚠️  barrel 中已存在 ${name} 导出，跳过`);
    } else {
      barrelLines.splice(insertAt, 0, exportLine);
      fs.writeFileSync(barrelFile, barrelLines.join("\n"), "utf-8");
      console.log(`   ✓ barrel export 已注册`);
    }
  } else {
    console.log(`   [dry] barrel: +${exportLine}`);
  }

  // ── 3. Compiler ──────────────────────────────────────────────────────
  let compiler = fs.readFileSync(COMPILER_FILE, "utf-8");
  const allPrimsLine = `"${name}",`;
  const compNameLine = `  ${name}: "${name}",`;

  if (!dryRun) {
    if (!compiler.includes(allPrimsLine)) {
      compiler = compiler.replace(
        `"Editorial",`,
        `"Editorial",\n  "${name}",`
      );
      compiler = compiler.replace(
        "Editorial: \"Editorial\",",
        `Editorial: "Editorial",\n  ${name}: "${name}",`
      );
      fs.writeFileSync(COMPILER_FILE, compiler, "utf-8");
      console.log(`   ✓ compiler 已注册`);
    } else {
      console.log(`   ⚠️  compiler 中已存在 ${name}，跳过`);
    }
  } else {
    console.log(`   [dry] compiler ALL_PRIMITIVES: +"${name}"`);
    console.log(`   [dry] compiler COMPONENT_NAME: +${name}: "${name}"`);
  }

  // ── 4. Types ─────────────────────────────────────────────────────────
  let types = fs.readFileSync(TYPES_FILE, "utf-8");
  const idsLine = `  "${name}",`;
  const paramsLine = `  ${name}: z.object({ /* TODO: 定义 params */ }),`;

  if (!dryRun) {
    if (!types.includes(idsLine)) {
      types = types.replace(
        `  "Editorial",`,
        `  "Editorial",\n  "${name}",`
      );
      types = types.replace(
        '  // ── 包装器',
        `  ${paramsLine}\n  // ── 包装器`
      );
      fs.writeFileSync(TYPES_FILE, types, "utf-8");
      console.log(`   ✓ types 已注册`);
    } else {
      console.log(`   ⚠️  types 中已存在 ${name}，跳过`);
    }
  } else {
    console.log(`   [dry] types PRIMITIVE_IDS: +"${name}"`);
    console.log(`   [dry] types PRIMITIVE_PARAMS: +${name}: z.object({...})`);
  }

  // ── 5. PRIMITIVES.md ─────────────────────────────────────────────────
  if (fs.existsSync(PRIMITIVES_MD)) {
    let md = fs.readFileSync(PRIMITIVES_MD, "utf-8");
    const mdEntry = `| **${name}** | TODO | TODO |`;
    if (!dryRun && !md.includes(`**${name}**`)) {
      // Insert at the end of the quick-select table (before the "---" separator)
      const lastTableLine = md.lastIndexOf("|");
      const insertPos = md.indexOf("\n\n---", lastTableLine);
      if (insertPos > 0) {
        md = md.slice(0, insertPos) + `\n${mdEntry}` + md.slice(insertPos);
      }
      fs.writeFileSync(PRIMITIVES_MD, md, "utf-8");
      console.log(`   ✓ PRIMITIVES.md 已更新`);
    } else if (dryRun) {
      console.log(`   [dry] PRIMITIVES.md: +${mdEntry}`);
    } else {
      console.log(`   ⚠️  PRIMITIVES.md 中已存在 ${name}，跳过`);
    }
  }

  // ── 6. Showcase page placeholder ─────────────────────────────────────
  if (fs.existsSync(SHOWCASE_PAGE)) {
    let page = fs.readFileSync(SHOWCASE_PAGE, "utf-8");
    const cardCode = `
        <Card name="${name}" desc="${description}">
          <div style={{ width: 240, height: 160, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-mute)", fontSize:12 }}>
            TODO: ${name} 预览 — 实现 ${name}Inline 组件
          </div>
        </Card>`;

    if (!dryRun && !page.includes(`name="${name}"`)) {
      // Insert before the last </Section> that precedes "综合排版"
      const marker = "综合排版";
      const markerIdx = page.indexOf(marker);
      if (markerIdx > 0) {
        // Find the closing </Section> before this
        const before = page.lastIndexOf("</Section>", markerIdx);
        if (before > 0) {
          page = page.slice(0, before) + cardCode + "\n      " + page.slice(before);
          fs.writeFileSync(SHOWCASE_PAGE, page, "utf-8");
          console.log(`   ✓ 展示页已插入占位卡片`);
        }
      }
    } else if (dryRun) {
      console.log(`   [dry] 展示页: +<Card name="${name}">`);
    } else {
      console.log(`   ⚠️  展示页中已存在 ${name}，跳过`);
    }
  }

  console.log(`\n✅ 完成！${dryRun ? " (dry run, 未写入文件)" : ""}`);
  console.log(`   下一步: 编辑 ${name}.tsx 实现动画逻辑`);
  console.log(`   预览: http://localhost:3100/showcase/primitives\n`);
}

main();
