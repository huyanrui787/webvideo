/**
 * Standalone animation-video render worker.
 *
 * Strategy:
 *   1. Read anim-timeline.json for video→step mapping
 *   2. Probe audio durations for real timing
 *   3. For each segment: trim video clip to duration
 *   4. Concat all video clips → single mp4
 *   5. Merge with concatenated audio track
 *   6. Burn subtitles from narrations
 *
 * Much simpler than render-worker-illust.js — no Ken Burns, no bone
 * animation, no parallax, no Python scripts. The T2V provider already
 * generated animated MP4s; we just assemble them.
 *
 * Usage: node render-worker-anim.js <projectId> <projectsRoot>
 */

const path = require("path");
const fs = require("fs");
const {
  writeStatus, getMp3Duration, toSrtTime,
  concatAudioWithSilence, cleanupTempFiles,
  Ffmpeg,
} = require("./render-common");

const [, , projectId, projectsRoot] = process.argv;
const projDir = path.join(projectsRoot, projectId);
const assetsDir = path.join(projDir, "assets/animations");
const audioDir = path.join(projDir, "presentation/public/audio");
const statusFile = path.join(projDir, ".render-status.json");
const timelineFile = path.join(projDir, "anim-timeline.json");
const clipsDir = path.join(projDir, ".render-anim-clips");
const mergedAudio = path.join(projDir, ".render-audio.aac");
const outputPath = path.join(projDir, "render.mp4");

const FPS = 30;
const DEFAULT_DURATION = 5.0;

// ─── Single video → trimmed clip ───────────────────────────────────────────

/**
 * Trim a video segment to the target duration.
 */
function videoToClip(videoPath, durationSec, outputPath, segmentIndex) {
  return new Promise((resolve, reject) => {
    Ffmpeg()
      .input(videoPath)
      .duration(durationSec)
      .fps(FPS)
      .videoCodec("libx264")
      .outputOptions([
        "-crf 18",
        "-preset fast",
        "-pix_fmt yuv420p",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(new Error(`clip ${segmentIndex} failed: ${err.message}`)))
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
    writeStatus(statusFile, { status: "error", error: "anim-timeline.json not found" });
    process.exit(1);
  }

  const raw = fs.readFileSync(timelineFile, "utf-8");
  const wrapper = JSON.parse(raw);
  const timeline = wrapper.timeline;

  // 2. Match audio files
  const audioLookup = new Map();
  const stepDir = path.join(audioDir, "step");
  if (fs.existsSync(stepDir)) {
    for (const f of fs.readdirSync(stepDir)) {
      const match = f.match(/^(\d+)\.mp3$/);
      if (match) {
        const idx = parseInt(match[1]) - 1;
        audioLookup.set(idx, path.join(stepDir, f));
      }
    }
  }

  // 3. Merge timeline with real audio durations
  writeStatus(statusFile, { status: "running", progress: "分析音频时间轴…" });

  const merged = await Promise.all(
    timeline.map(async (seg) => {
      const mp3Path = audioLookup.get(seg.stepIdx) || null;
      let durationSec = seg.durationSec || DEFAULT_DURATION;
      if (mp3Path) {
        durationSec = await getMp3Duration(mp3Path);
      }
      return { ...seg, mp3Path, durationSec };
    })
  );

  const totalDuration = merged.reduce((s, t) => s + t.durationSec, 0);
  const totalSegments = merged.length;

  if (totalSegments === 0) {
    writeStatus(statusFile, { status: "error", error: "时间轴为空" });
    process.exit(1);
  }

  // 4. Trim each video to a clip
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
    const videoPath = path.join(assetsDir, `step-${String(seg.stepIdx + 1).padStart(2, "0")}.mp4`);
    if (!fs.existsSync(videoPath)) {
      console.warn(`[anim-render] Video not found for step ${seg.stepIdx + 1}: ${videoPath} — skipping`);
      continue;
    }

    const clipPath = path.join(clipsDir, `${String(i).padStart(4, "0")}.mp4`);
    try {
      await videoToClip(videoPath, seg.durationSec, clipPath, i);
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
    segmentsDone: clipFiles.length,
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
