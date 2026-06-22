import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { projectDir } from "@/lib/projects";
import { analyzeAsset } from "@/lib/analyze-asset";
import { patchAssetMeta } from "@/lib/projects";
import { requireProjectAccess } from "@/lib/api-helpers";

const IMAGE_EXTS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const { urls } = await req.json() as { urls: string[] };
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "urls required" }, { status: 400 });
  }

  const assetsDir = path.join(projectDir(id), "assets");
  fs.mkdirSync(assetsDir, { recursive: true });

  const results: Array<{ original: string; local: string }> = [];
  const errors: Array<{ url: string; status?: number; error?: string }> = [];

  async function downloadOne(url: string) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Referer": "https://mp.weixin.qq.com/",
          "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      });
      const contentType = res.headers.get("content-type") ?? "";
      console.log(`[proxy-images] ${url.slice(0, 80)} → status=${res.status} type=${contentType}`);
      if (!res.ok) {
        errors.push({ url: url.slice(0, 100), status: res.status });
        return;
      }

      const ext = IMAGE_EXTS[contentType.split(";")[0]] ?? "jpg";
      const safeName = `${nanoid(10)}.${ext}`;
      const dest = path.join(assetsDir, safeName);
      const buffer = Buffer.from(await res.arrayBuffer());

      if (buffer.length < 100) {
        errors.push({ url: url.slice(0, 100), status: res.status, error: `body too small (${buffer.length}b)` });
        return;
      }

      fs.writeFileSync(dest, buffer);
      const localUrl = `/api/projects/${id}/assets/${encodeURIComponent(safeName)}`;
      results.push({ original: url, local: localUrl });

      analyzeAsset(dest, "image").then(({ caption }) => {
        patchAssetMeta(id, safeName, { caption });
      }).catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[proxy-images] error for ${url.slice(0, 80)}:`, msg);
      errors.push({ url: url.slice(0, 100), error: msg });
    }
  }

  // Process in batches of 8 to avoid overwhelming the network
  const BATCH = 8;
  for (let i = 0; i < urls.length; i += BATCH) {
    await Promise.all(urls.slice(i, i + BATCH).map(downloadOne));
  }

  return NextResponse.json({ results, errors, total: urls.length });
}
