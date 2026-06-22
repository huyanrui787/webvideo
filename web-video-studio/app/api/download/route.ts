/**
 * Self-hosted DMG download endpoint.
 *
 * GET /api/download — serves the latest macOS DMG from the release/ directory.
 * Falls back to CDN redirect if the local file doesn't exist.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAppDataDir } from "@/lib/env";

export async function GET() {
  // Look for DMG in release/ directory (electron-builder output)
  const releaseDir = path.join(getAppDataDir(), "release");

  let dmgPath: string | null = null;

  if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir);
    // Find the first .dmg file, preferring universal/arm64
    const dmgFiles = files.filter((f) => f.endsWith(".dmg"));
    const arm64 = dmgFiles.find((f) => f.includes("arm64"));
    const anyDmg = dmgFiles[0];
    const best = arm64 || anyDmg;
    if (best) {
      dmgPath = path.join(releaseDir, best);
    }
  }

  if (dmgPath && fs.existsSync(dmgPath)) {
    const stat = fs.statSync(dmgPath);
    const fileBuffer = fs.readFileSync(dmgPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${path.basename(dmgPath)}"`,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Fallback: redirect to GitHub Releases
  const fallbackUrl =
    process.env.NEXT_PUBLIC_DOWNLOAD_URL ||
    "https://github.com/webvideostudio/app/releases/latest";

  return NextResponse.redirect(fallbackUrl);
}
