import { spawn } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

// Simple in-memory cache: `${provider}:${voiceId}:${text}` → Buffer
const cache = new Map<string, Buffer>();

export async function POST(req: Request) {
  const { provider, voiceId, text } = await req.json() as {
    provider?: string;
    voiceId?: string;
    text?: string;
  };

  if (!provider || !voiceId || !text?.trim()) {
    return new Response("Missing required fields", { status: 400 });
  }

  const previewText = text.trim().slice(0, 60); // limit length
  const cacheKey = `${provider}:${voiceId}:${previewText}`;

  if (cache.has(cacheKey)) {
    return audioResponse(cache.get(cacheKey)!);
  }

  const tmpFile = path.join(os.tmpdir(), `voice-preview-${Date.now()}.mp3`);

  try {
    if (provider === "minimax") {
      await runCmd("mmx", [
        "speech", "synthesize",
        "--text", previewText,
        "--voice", voiceId,
        "--out", tmpFile,
      ]);
    } else if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return new Response("OPENAI_API_KEY not set", { status: 500 });
      // Use curl like the openai.sh provider does
      const payload = JSON.stringify({ model: "tts-1", input: previewText, voice: voiceId, response_format: "mp3" });
      await runCmd("bash", ["-c",
        `curl -fsS -o '${tmpFile}' -X POST https://api.openai.com/v1/audio/speech ` +
        `-H 'Authorization: Bearer ${apiKey}' ` +
        `-H 'Content-Type: application/json' ` +
        `-d '${payload.replace(/'/g, "'\\''")}'`
      ]);
    } else {
      return new Response("Unknown provider", { status: 400 });
    }

    if (!fs.existsSync(tmpFile)) {
      return new Response("Synthesis failed", { status: 500 });
    }

    const buf = fs.readFileSync(tmpFile);
    cache.set(cacheKey, buf);
    // Keep cache bounded
    if (cache.size > 200) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    return audioResponse(buf);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

function audioResponse(buf: Buffer) {
  return new Response(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buf.length),
      "Cache-Control": "public, max-age=300",
    },
  });
}

function runCmd(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "ignore" });
    proc.on("close", code => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)));
    setTimeout(() => { proc.kill(); reject(new Error("timeout")); }, 30_000);
  });
}
