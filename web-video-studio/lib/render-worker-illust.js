/**
 * Standalone illustration-video render worker.
 *
 * Strategy:
 *   1. Read illust-timeline.json for image→step mapping
 *   2. Read audio-segments.json + probe mp3 durations for real timing
 *   3. For each segment: still-image → video clip
 *      Four tiers, auto-selected per image:
 *        0. Skeleton exists → Playwright bone animation (headless Chromium)
 *        1. Mask + depth     → layer-animate.py  (FG warp + BG parallax + inpaint)
 *        2. Depth only       → parallax-render.py (2.5D parallax)
 *        3. Neither          → ffmpeg zoompan     (legacy Ken Burns)
 *   4. Concat all video clips → single mp4
 *   5. Merge with concatenated audio track
 *   6. Burn subtitles from narrations
 *
 * Usage: node render-worker-illust.js <projectId> <projectsRoot>
 */

const path = require("path");
const fs = require("fs");
const { spawn: spawnSync } = require("child_process");
const { chromium } = require("playwright");
const {
  writeStatus, getMp3Duration, toSrtTime,
  concatAudioWithSilence, cleanupTempFiles,
  Ffmpeg, launchChromium,
} = require("./render-common");

const [, , projectId, projectsRoot] = process.argv;
const projDir = path.join(projectsRoot, projectId);
const assetsDir = path.join(projDir, "assets/illustrations");
const depthDir = path.join(assetsDir, "depth");
const audioDir = path.join(projDir, "presentation/public/audio");
const statusFile = path.join(projDir, ".render-status.json");
const timelineFile = path.join(projDir, "illust-timeline.json");
const clipsDir = path.join(projDir, ".render-clips");
const mergedAudio = path.join(projDir, ".render-audio.aac");
const outputPath = path.join(projDir, "render.mp4");

// Paths to render scripts
const repoRoot = path.resolve(projectsRoot, "..");
const parallaxScript = path.join(repoRoot, "scripts", "parallax-render.py");
const layerAnimScript = path.join(repoRoot, "scripts", "layer-animate.py");
const partsDir = path.join(assetsDir, "parts");

const FPS = 30;
const DEFAULT_DURATION = 5.0;

// ─── Playwright Bone Animation Render ─────────────────────────────────────

/**
 * Render a character animation clip using headless Chromium.
 * Loads skeleton body parts into an HTML page, animates via Canvas 2D,
 * captures frames with Playwright, pipes to ffmpeg.
 */
async function boneRenderToClip(imageStem, skeleton, durationSec, outputPath, imagePath) {
  // 1. Read background image as base64
  let bgDataUrl = "";
  if (fs.existsSync(imagePath)) {
    const bgBuf = fs.readFileSync(imagePath);
    const bgExt = path.extname(imagePath).slice(1);
    bgDataUrl = `data:image/${bgExt};base64,${bgBuf.toString("base64")}`;
  }

  // 2. Read all part images as base64
  const partData = {};
  for (const [name, def] of Object.entries(skeleton.parts)) {
    const partPath = path.join(partsDir, imageStem, def.file);
    if (!fs.existsSync(partPath)) continue;
    const buf = fs.readFileSync(partPath);
    const b64 = buf.toString("base64");
    const ext = path.extname(def.file).slice(1); // png
    partData[name] = {
      dataUrl: `data:image/${ext};base64,${b64}`,
      pivot: def.pivot,
      bone: def.bone,
    };
  }

  // 3. Build self-contained HTML page
  const html = buildBoneHtml(skeleton.imageSize, partData, durationSec, FPS, bgDataUrl);

  // 4. Launch headless Chromium
  const browser = await launchChromium(chromium);
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });
  await page.setContent(html, { waitUntil: "networkidle" });
  // Wait for all images (parts + background) to load
  await page.waitForFunction("loaded >= total && bgLoaded", [], { timeout: 15000 });

  // 4. Capture frames → pipe to ffmpeg
  const totalFrames = Math.ceil(durationSec * FPS);
  const { spawn } = require("child_process");

  const ffmpegArgs = [
    "-y",
    "-f", "image2pipe",
    "-vcodec", "png",
    "-r", String(FPS),
    "-i", "-",
    "-c:v", "libx264",
    "-crf", "18",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", ffmpegArgs, {
      stdio: ["pipe", "ignore", "ignore"],
    });

    let frameIdx = 0;
    const captureNext = async () => {
      if (frameIdx >= totalFrames) {
        ffmpeg.stdin.end();
        return;
      }

      const t = (frameIdx / totalFrames) * durationSec;
      try {
        // Set time and render frame
        await page.evaluate((time) => {
          window.__BONE_TIME = time;
          if (typeof window.renderBoneFrame === "function") {
            window.renderBoneFrame(time);
          }
        }, t);

        // Small delay for canvas to paint
        await new Promise((r) => setTimeout(r, 5));

        const screenshot = await page.screenshot({ type: "png" });
        ffmpeg.stdin.write(screenshot);

        frameIdx++;
        // Yield to event loop to avoid blocking
        setImmediate(captureNext);
      } catch (err) {
        ffmpeg.stdin.end();
        reject(err);
      }
    };

    ffmpeg.on("close", async (code) => {
      await browser.close();
      if (code === 0) resolve(outputPath);
      else reject(new Error(`ffmpeg exited ${code}`));
    });

    ffmpeg.on("error", async (err) => {
      await browser.close();
      reject(err);
    });

    captureNext();
  });
}

/**
 * Build a self-contained HTML page with Canvas bone character animation.
 */
function buildBoneHtml(imageSize, parts, durationSec, fps, bgDataUrl) {
  const [imgW, imgH] = imageSize;
  const scale = 1920 / imgW;
  const canvasH = Math.round(imgH * scale);
  const hasBg = bgDataUrl && bgDataUrl.length > 0;

  // Sort parts for render order
  const order = ["legs", "torso", "arm_l", "arm_r", "head"];
  const sortedNames = Object.keys(parts).sort((a, b) => {
    const ai = order.indexOf(a), bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  // Build part image preload array
  const partsJson = JSON.stringify(
    sortedNames.reduce((acc, name) => {
      acc[name] = parts[name];
      return acc;
    }, {})
  );

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;display:flex;justify-content:center;align-items:center;width:1920px;height:1080px;overflow:hidden}
canvas{display:block}
</style></head><body>
<canvas id="c" width="1920" height="${canvasH}"></canvas>
<script>
const PARTS = ${partsJson};
const IMG_W = ${imgW}, IMG_H = ${imgH};
const SCALE = ${scale};
const DURATION = ${durationSec};
const ORDER = ${JSON.stringify(sortedNames)};
const HAS_BG = ${hasBg};

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Preload background
let bgLoaded = !HAS_BG;
let bgImg = null;
if (HAS_BG) {
  bgImg = new Image();
  bgImg.onload = () => { bgLoaded = true; };
  bgImg.src = "${bgDataUrl.replace(/"/g, '\\"')}";
}

// Preload all part images
const images = {};
let loaded = 0;
const total = ORDER.length;

ORDER.forEach(name => {
  const img = new Image();
  img.onload = () => { loaded++; };
  img.src = PARTS[name].dataUrl;
  images[name] = img;
});

// Idle animation parameters
function getAnimParams(t) {
  const phase = t / DURATION;
  const headRot = Math.sin(phase * 2 * Math.PI * 0.6) * 3 + Math.sin(phase * 2 * Math.PI * 1.2) * 1.5;
  const headNod = Math.cos(phase * 2 * Math.PI * 0.5) * 2;
  const torsoBreathe = Math.sin(phase * 2 * Math.PI * 0.4) * 0.008;
  const armLSwing = Math.sin(phase * 2 * Math.PI * 0.55 + 0.3) * 8;
  const armRSwing = Math.sin(phase * 2 * Math.PI * 0.55 - 0.3) * 7;
  return { headRot, headNod, torsoBreathe, armLSwing, armRSwing };
}

function renderBoneFrame(t) {
  if (loaded < total) return; // Wait for images
  ${hasBg ? "if (!bgLoaded) return;" : ""}

  ctx.clearRect(0, 0, 1920, ${canvasH});
  ${hasBg ? "ctx.drawImage(bgImg, 0, 0, 1920, " + canvasH + ");" : ""}
  const ap = getAnimParams(t);

  ORDER.forEach(name => {
    const part = PARTS[name];
    const img = images[name];
    if (!img) return;

    const [px, py] = part.pivot;
    const bone = part.bone;

    let rotDeg = 0, tx = 0, ty = 0, s = 1;

    switch (bone.type) {
      case 'head':
        rotDeg = ap.headRot;
        ty = ap.headNod * -2;
        break;
      case 'torso':
        s = 1 + ap.torsoBreathe * 50;
        tx = ap.headRot * 0.3;
        break;
      case 'arm':
        rotDeg = bone.side === 'left' ? ap.armLSwing : ap.armRSwing;
        break;
      case 'legs':
        tx = ap.headRot * 0.15;
        break;
      case 'prop':
        ty = Math.sin(t * 2 * Math.PI * 0.7) * (bone.float || 3);
        break;
    }

    ctx.save();
    ctx.translate(px * SCALE, py * SCALE);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.scale(s, s);
    ctx.translate(-px * SCALE, -py * SCALE);
    ctx.translate(tx * SCALE, ty * SCALE);
    ctx.drawImage(img, 0, 0, IMG_W * SCALE, IMG_H * SCALE);
    ctx.restore();
  });
}

// Expose for Playwright
window.renderBoneFrame = renderBoneFrame;
</script></body></html>`;
}

// ─── Ken Burns zoompan filter ─────────────────────────────────────────────

/**
 * Build ffmpeg filter string for Ken Burns effect.
 * Returns null if no effect needed (static image).
 */
function buildZoompanFilter(scale, panX, panY, durationSec) {
  if (scale <= 1.0 && panX === 0 && panY === 0) return null;

  const totalFrames = Math.ceil(durationSec * FPS);
  const zoomInc = (scale - 1.0) / totalFrames;
  const panXInc = panX / totalFrames;
  const panYInc = panY / totalFrames;

  // Upscale for zoom headroom, then zoompan
  return [
    "scale=8000:-1",
    `zoompan=` +
      `z='min(zoom+${zoomInc.toFixed(6)},${scale.toFixed(3)})':` +
      `x='iw/2-(iw/zoom/2)+${panXInc.toFixed(3)}*on':` +
      `y='ih/2-(ih/zoom/2)+${panYInc.toFixed(3)}*on':` +
      `d=${totalFrames}:s=1920x1080:fps=${FPS}`,
  ].join(",");
}

// ─── Single image → video clip ────────────────────────────────────────────

/**
 * Render a single image into a video clip.
 *
 * Four tiers, auto-selected per image:
 *   0. Bone animation  — skeleton exists → Playwright Chromium canvas render
 *   1. Layer animation — mask + depth → FG warp + BG parallax + inpaint
 *   2. Parallax        — depth only → 2.5D depth-weighted parallax
 *   3. Ken Burns       — neither → legacy zoom/pan
 */
function imageToClip(imagePath, durationSec, kenBurns, outputPath, segmentIndex) {
  const imageStem = path.basename(imagePath, path.extname(imagePath));
  const maskDir = path.join(assetsDir, "masks");
  const maskPath = path.join(maskDir, `${imageStem}_mask.png`);
  const depthPath = path.join(depthDir, `${imageStem}_depth.png`);
  const skeletonPath = path.join(partsDir, imageStem, "skeleton.json");

  // ── Tier 0: Bone animation (skeleton + part images exist) ───────────
  if (fs.existsSync(skeletonPath)) {
    try {
      const skeleton = JSON.parse(fs.readFileSync(skeletonPath, "utf-8"));
      // Verify at least one part image exists on disk
      const partFiles = Object.values(skeleton.parts || {});
      const hasParts = partFiles.some((def) =>
        fs.existsSync(path.join(partsDir, imageStem, def.file))
      );
      if (hasParts) {
        return boneRenderToClip(imageStem, skeleton, durationSec, outputPath, imagePath);
      }
    } catch (e) {
      console.error(`[bone-render] Failed for segment ${segmentIndex}: ${e.message}, falling back`);
    }
  }

  // ── Tier 1: Layer animation (mask + depth) ──────────────────────────
  if (fs.existsSync(maskPath) && fs.existsSync(depthPath)) {
    return new Promise((resolve, reject) => {
      const args = [
        layerAnimScript,
        imagePath,
        maskPath,
        depthPath,
        outputPath,
        "--duration", String(durationSec),
        "--fps", String(FPS),
        "--resolution", "1920x1080",
      ];
      const proc = spawnSync("python3", args, {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("close", (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`layer-animate failed for segment ${segmentIndex}: ${stderr}`));
      });
    });
  }

  // ── Tier 2: Parallax (depth only) ───────────────────────────────────
  if (fs.existsSync(depthPath)) {
    return new Promise((resolve, reject) => {
      const args = [
        parallaxScript,
        imagePath,
        depthPath,
        outputPath,
        "--duration", String(durationSec),
        "--fps", String(FPS),
        "--resolution", "1920x1080",
      ];
      const proc = spawnSync("python3", args, {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("close", (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`parallax failed for segment ${segmentIndex}: ${stderr}`));
      });
    });
  }

  // ── Tier 3: Ken Burns zoompan (legacy fallback) ─────────────────────
  return new Promise((resolve, reject) => {
    const vf = buildZoompanFilter(
      kenBurns?.scale ?? 1.0,
      kenBurns?.panX ?? 0,
      kenBurns?.panY ?? 0,
      durationSec
    );

    let cmd = Ffmpeg()
      .input(imagePath)
      .inputOptions(["-loop 1"]);

    if (vf) {
      cmd = cmd.videoFilters(vf);
    }

    cmd
      .duration(durationSec)
      .fps(FPS)
      .videoCodec("libx264")
      .outputOptions([
        "-crf 18",
        "-preset fast",
        "-pix_fmt yuv420p",
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(new Error(`clip failed: ${err.message}`)))
      .run();
  });
}

// ─── Audio concat ─────────────────────────────────────────────────────────

function concatAudio(segments, outPath) {
  const withAudio = segments.filter((s) => s.mp3Path);
  if (withAudio.length === 0) return Promise.resolve(false);

  const listFile = path.join(projDir, ".render-audio-list.txt");
  const lines = [];
  for (const seg of segments) {
    if (seg.mp3Path) {
      // Escape: backslashes → forward, single quotes → \', newlines → literal \n
      const safePath = seg.mp3Path
        .replace(/\\/g, "/")
        .replace(/'/g, "'\\''")
        .replace(/\r?\n/g, "\\n");
      lines.push(`file '${safePath}'`);
      lines.push(`duration ${seg.durationSec.toFixed(4)}`);
    }
  }
  fs.writeFileSync(listFile, lines.join("\n") + "\n");

  return new Promise((resolve, reject) => {
    Ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .audioCodec("aac")
      .audioBitrate("192k")
      .output(outPath)
      .on("end", () => resolve(true))
      .on("error", reject)
      .run();
  });
}

// ─── Clips concat ─────────────────────────────────────────────────────────

function concatClips(clipFiles, outPath) {
  if (clipFiles.length === 1) {
    fs.copyFileSync(clipFiles[0], outPath);
    return Promise.resolve(outPath);
  }

  const listFile = path.join(projDir, ".render-clips-list.txt");
  const lines = clipFiles.map(
    (f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "\\'")}'`
  );
  fs.writeFileSync(listFile, lines.join("\n") + "\n");

  return new Promise((resolve, reject) => {
    Ffmpeg()
      .input(listFile)
      .inputOptions(["-f concat", "-safe 0"])
      .videoCodec("copy")
      .output(outPath)
      .on("end", () => resolve(outPath))
      .on("error", reject)
      .run();
  });
}

// ─── Final mux (video + audio + subtitles) ────────────────────────────────

function muxWithAudioAndSubtitles(videoPath, audioPath, srtPath, output) {
  return new Promise((resolve, reject) => {
    let cmd = Ffmpeg().input(videoPath);

    if (audioPath && fs.existsSync(audioPath)) {
      cmd = cmd.input(audioPath);
    }

    const vfParts = [];
    if (srtPath && fs.existsSync(srtPath)) {
      const escaped = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
      vfParts.push(
        `subtitles='${escaped}':force_style='FontSize=28,PrimaryColour=&HFFFFFF,OutlineColour=&H80000000,Outline=2,Shadow=1,Alignment=2,MarginV=40'`
      );
    }

    cmd
      .videoCodec("libx264")
      .outputOptions([
        "-crf 18",
        "-preset fast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        ...(vfParts.length > 0 ? [`-vf ${vfParts.join(",")}`] : []),
        ...(audioPath && fs.existsSync(audioPath) ? ["-c:a aac", "-shortest"] : []),
      ])
      .output(output)
      .on("end", () => resolve(output))
      .on("error", (err) => reject(new Error(`mux failed: ${err.message}`)))
      .run();
  });
}

// ─── SRT generation ───────────────────────────────────────────────────────

function buildSrt(timeline) {
  let idx = 1;
  let cursor = 0;
  const lines = [];

  for (const seg of timeline) {
    const text = seg.narration || "";
    const start = cursor;
    const end = cursor + seg.durationSec;
    if (text) {
      lines.push(String(idx++));
      lines.push(`${toSrtTime(start)} --> ${toSrtTime(end)}`);
      lines.push(text);
      lines.push("");
    }
    cursor = end;
  }

  if (idx === 1) return null;
  const srtPath = path.join(projDir, ".render-subtitles.srt");
  fs.writeFileSync(srtPath, lines.join("\n"), "utf-8");
  return srtPath;
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function run() {
  // 1. Read timeline
  if (!fs.existsSync(timelineFile)) {
    writeStatus(statusFile, { status: "error", error: "illust-timeline.json not found" });
    process.exit(1);
  }

  const raw = fs.readFileSync(timelineFile, "utf-8");
  const wrapper = JSON.parse(raw);
  const timeline = wrapper.timeline;

  // 2. Match audio files (if any)
  const audioSegmentsFile = path.join(projDir, "presentation/audio-segments.json");
  let audioSegments = [];
  if (fs.existsSync(audioSegmentsFile)) {
    audioSegments = JSON.parse(fs.readFileSync(audioSegmentsFile, "utf-8"));
  }

  const audioLookup = new Map();
  for (const s of audioSegments) {
    // Construct path from chapter + step (audio-segments may not have .audio field)
    const audioPath = path.join(audioDir, s.chapter, `${s.step}.mp3`);
    if (fs.existsSync(audioPath)) {
      audioLookup.set(`${s.chapter}::${s.step - 1}`, audioPath);
    }
  }
  // 3. Merge timeline with real audio durations
  writeStatus(statusFile, { status: "running", progress: "分析音频时间轴…" });

  const merged = await Promise.all(
    timeline.map(async (seg) => {
      const key = `${seg.chapterId}::${seg.stepIdx}`;
      const mp3Path = audioLookup.get(key) || null;
      let durationSec = seg.durationSec || DEFAULT_DURATION;
      if (mp3Path) {
        durationSec = await getMp3Duration(mp3Path);
      }
      return {
        ...seg,
        mp3Path,
        durationSec,
        kenBurns: seg.kenBurns || { scale: 1.0, panX: 0, panY: 0 },
      };
    })
  );

  const totalDuration = merged.reduce((s, t) => s + t.durationSec, 0);
  const totalSegments = merged.length;

  if (totalSegments === 0) {
    writeStatus(statusFile, { status: "error", error: "时间轴为空" });
    process.exit(1);
  }

  // 4. Render each image to a video clip
  fs.mkdirSync(clipsDir, { recursive: true });
  writeStatus(statusFile, {
    status: "running",
    progress: `渲染 ${totalSegments} 个片段 (预计 ${totalDuration.toFixed(1)}s)…`,
    totalDuration,
    totalSegments,
  });

  const clipFiles = [];
  for (let i = 0; i < merged.length; i++) {
    const seg = merged[i];
    const imagePath = path.join(assetsDir, seg.illustration);
    if (!fs.existsSync(imagePath)) {
      writeStatus(statusFile, { status: "error", error: `图片不存在: ${seg.illustration}` });
      process.exit(1);
    }

    const clipPath = path.join(clipsDir, `${String(i).padStart(4, "0")}.mp4`);
    try {
      await imageToClip(imagePath, seg.durationSec, seg.kenBurns, clipPath, i);
    } catch (e) {
      writeStatus(statusFile, { status: "error", error: `片段 ${i + 1} 渲染失败: ${e.message}` });
      process.exit(1);
    }
    clipFiles.push(clipPath);

    if (i % 5 === 0 || i === merged.length - 1) {
      const pct = Math.round(((i + 1) / totalSegments) * 100);
      writeStatus(statusFile, {
        status: "running",
        progress: `渲染片段 ${i + 1}/${totalSegments} (${pct}%)…`,
        totalDuration,
        totalSegments,
        segmentsDone: i + 1,
      });
    }
  }

  // 5. Concat all clips
  writeStatus(statusFile, {
    status: "running",
    progress: "拼接视频片段…",
    totalDuration,
    totalSegments,
    segmentsDone: totalSegments,
  });
  const concatenatedVideo = path.join(projDir, ".render-concat.mp4");
  await concatClips(clipFiles, concatenatedVideo);

  // 6. Merge audio
  let hasAudio = false;
  try {
    hasAudio = await concatAudio(merged, mergedAudio);
  } catch (e) {
    console.error("Audio concat failed (continuing without):", e.message);
  }

  // 7. Build SRT
  const srtPath = buildSrt(merged);
  if (srtPath) {
    console.log(`字幕文件已生成: ${srtPath}`);
  }

  // 8. Final mux
  writeStatus(statusFile, {
    status: "running",
    progress: "合成最终视频…",
    totalDuration,
    totalSegments,
  });
  await muxWithAudioAndSubtitles(
    concatenatedVideo,
    hasAudio ? mergedAudio : null,
    srtPath,
    outputPath
  );

  // 9. Cleanup
  fs.rmSync(clipsDir, { recursive: true, force: true });
  if (fs.existsSync(concatenatedVideo)) fs.unlinkSync(concatenatedVideo);
  if (fs.existsSync(mergedAudio)) fs.unlinkSync(mergedAudio);

  writeStatus(statusFile, {
    status: "done",
    progress: `完成 (${totalDuration.toFixed(1)}s, ${totalSegments} 片段${hasAudio ? "，含音频" : ""})`,
    outputFile: "render.mp4",
    totalDuration,
    totalSegments,
  });
}

run().catch((err) => {
  writeStatus(statusFile, {
    status: "error",
    error: String(err?.message ?? err),
    progress: String(err?.message ?? err),
  });
  try { fs.rmSync(clipsDir, { recursive: true, force: true }); } catch {}
  process.exit(1);
});
