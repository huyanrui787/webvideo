import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { getSkill, MAIN_SKILL_ID } from "@/lib/skills";

const SKILL_ROOT = getSkill(MAIN_SKILL_ID)?.path ?? "";

// Cache compiled HTML to avoid re-running esbuild on every request
const cache = new Map<string, { mtime: number; html: string }>();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const codePath = path.join(SKILL_ROOT, "showcase-effects", slug, "code.tsx");

  if (!fs.existsSync(codePath)) {
    return new Response("Not found", { status: 404 });
  }

  const mtime = fs.statSync(codePath).mtimeMs;
  const cached = cache.get(slug);
  if (cached && cached.mtime === mtime) {
    return new Response(cached.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const code = fs.readFileSync(codePath, "utf-8");

  const exportMatch = code.match(/export\s+function\s+(\w+)\s*\(/);
  const componentName = exportMatch?.[1] ?? "Effect";

  const stripped = code
    .replace(/"use client";?\n?/g, "")
    .replace(/^import\s+.*?from\s+["'].*?["'];?\n?/gm, "")
    .replace(/^export\s+function\s+(\w+)/m, "function $1");

  const fullSrc = `const { useRef, useEffect } = React;\n${stripped}\nconst __c = document.getElementById("root");\nReactDOM.createRoot(__c).render(React.createElement(${componentName}, null));\n`;

  let bundled: string;
  try {
    const tmp = path.join("/tmp", `effect-preview-${slug}-${Date.now()}.tsx`);
    fs.writeFileSync(tmp, fullSrc, "utf-8");
    bundled = execSync(
      `npx esbuild "${tmp}" --bundle=false --format=iife --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment`,
      { encoding: "utf-8", timeout: 15_000 }
    );
    fs.unlinkSync(tmp);
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 800);
    bundled = `var __el=document.getElementById("error");if(__el){__el.style.display="flex";__el.textContent=${JSON.stringify("Build error:\n" + msg)};}`;
  }

  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  #root { position: absolute; inset: 0; }
  #error { display: none; position: absolute; inset: 0; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); font-size: 11px; font-family: monospace; padding: 16px; text-align: center; white-space: pre-wrap; background: #111; }
</style>
</head>
<body>
<div id="root"></div>
<div id="error"></div>
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script>
window.onerror = function(msg) {
  var el = document.getElementById("error");
  if (el) { el.style.display = "flex"; el.textContent = msg; }
  return true;
};
try { ${bundled} } catch(e) {
  var el = document.getElementById("error");
  if (el) { el.style.display = "flex"; el.textContent = String(e); }
}
</script>
</body>
</html>`;

  cache.set(slug, { mtime, html });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
