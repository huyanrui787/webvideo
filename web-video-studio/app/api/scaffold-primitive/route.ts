import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let { name, cat, type, desc } = body;

  // Auto-capitalize first letter for convenience
  if (name) name = name.charAt(0).toUpperCase() + name.slice(1);

  if (!name || !/^[A-Z][a-zA-Z0-9]+$/.test(name)) {
    return NextResponse.json({ ok: false, error: `名称 "${name || '(空)'}" 不合法。只允许英文字母和数字，如 RippleWave` }, { status: 400 });
  }

  const scriptPath = path.resolve(process.cwd(), "scripts", "scaffold-primitive.ts");
  const args = [
    scriptPath,
    `--name=${name}`,
    `--cat=${cat ?? "animation"}`,
    `--type=${type ?? "gsap"}`,
    `--desc=${desc ?? name}`,
  ];

  return new Promise((resolve) => {
    const proc = spawn("npx", ["tsx", ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ ok: true, output: stdout.trim() }));
      } else {
        resolve(NextResponse.json({ ok: false, error: stderr || stdout }, { status: 500 }));
      }
    });

    proc.on("error", (err) => {
      resolve(NextResponse.json({ ok: false, error: err.message }, { status: 500 }));
    });
  });
}
