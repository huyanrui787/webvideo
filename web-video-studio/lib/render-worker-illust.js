/**
 * Standalone illustration-video render worker.
 *
 * Strategy:
 *   1. Read illust-timeline.json for image→step mapping
 *   2. Read audio-segments.json + probe mp3 durations for real timing
 *   3. For each segment: still-image → video clip (Ken Burns via zoompan or static)
 *   4. Concat all video clips → single mp4
 *   5. Merge with concatenated audio track
 *   6. Burn subtitles from narrations
 *
 * Usage: node render-worker-illust.js <projectId> <projectsRoot>
 */

const path = require("path");
const fs = require("fs");
const {
  writeStatus, getMp3Duration, toSrtTime, buildSrt,
  concatAudioWithSilence, concatClips, cleanupTempFiles,
} = require("./render-common");

const [, , projectId, projectsRoot] = process.argv;
const projDir = path.join(projectsRoot, projectId);
const assetsDir = path.join(projDir, "assets/illustrations");
const audioDir = path.join(projDir, "presentation/public/audio");
const statusFile = path.join(projDir, ".render-status.json");
const timelineFile = path.join(projDir, "illust-timeline.json");
const clipsDir = path.join(projDir, ".render-clips");
const mergedAudio = path.join(projDir, ".render-audio.aac");
const outputPath = path.join(projDir, "render.mp4");

const FPS = 30;
const DEFAULT_DURATION = 5.0;

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

function imageToClip(imagePath, durationSec, kenBurns, outputPath) {
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

  const timeline = JSON.parse(fs.readFileSync(timelineFile, "utf-8"));

  // 2. Match audio files (if any)
  const audioSegmentsFile = path.join(projDir, "presentation/audio-segments.json");
  let audioSegments = [];
  if (fs.existsSync(audioSegmentsFile)) {
    audioSegments = JSON.parse(fs.readFileSync(audioSegmentsFile, "utf-8"));
  }

  const audioLookup = new Map();
  for (const s of audioSegments) {
    const mp3 = path.join(audioDir, s.audio);
    if (fs.existsSync(mp3)) {
      audioLookup.set(`${s.chapter}::${s.step - 1}`, mp3);
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
      await imageToClip(imagePath, seg.durationSec, seg.kenBurns, clipPath);
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
