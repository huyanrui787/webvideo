import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/api-helpers";
import { projectDir } from "@/lib/projects";
import path from "path";
import fs from "fs";
import { getSynthJob } from "../synthesize/route";

interface ChapterAudioStatus {
  chapterId: string;
  status: "idle" | "pending" | "running" | "done" | "error";
  total: number;
  done: number;
  segments: { step: number; hasMp3: boolean }[];
}

interface AudioStatusResponse {
  global: {
    total: number;
    done: number;
    running: boolean;
    pending: number;
  };
  chapters: ChapterAudioStatus[];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const presDir = path.join(projectDir(id), "presentation");
  const segmentsPath = path.join(presDir, "audio-segments.json");
  const audioDir = path.join(presDir, "public/audio");

  // No segments file → nothing to report
  if (!fs.existsSync(segmentsPath)) {
    return NextResponse.json({
      global: { total: 0, done: 0, running: false, pending: 0 },
      chapters: [],
    });
  }

  // Read segments
  let segments: { chapter: string; step: number; audio: string }[] = [];
  try {
    segments = JSON.parse(fs.readFileSync(segmentsPath, "utf-8"));
  } catch {
    return NextResponse.json({
      global: { total: 0, done: 0, running: false, pending: 0 },
      chapters: [],
    });
  }

  // Check if synthesis is currently running
  const synthJob = getSynthJob(id);
  const isRunning = synthJob?.status === "running";

  // Group by chapter
  const chapterMap = new Map<string, ChapterAudioStatus>();
  for (const seg of segments) {
    let ch = chapterMap.get(seg.chapter);
    if (!ch) {
      ch = {
        chapterId: seg.chapter,
        status: "pending",
        total: 0,
        done: 0,
        segments: [],
      };
      chapterMap.set(seg.chapter, ch);
    }
    ch.total++;

    const mp3Path = path.join(audioDir, path.basename(seg.audio));
    const hasMp3 = fs.existsSync(mp3Path);
    if (hasMp3) ch.done++;
    ch.segments.push({ step: seg.step, hasMp3 });
  }

  // Determine per-chapter status
  for (const ch of chapterMap.values()) {
    if (ch.done === ch.total) {
      ch.status = "done";
    } else if (ch.done > 0 && isRunning) {
      ch.status = "running";
    } else if (ch.done > 0) {
      ch.status = "pending"; // partially done but not running
    } else {
      ch.status = "pending";
    }
  }

  const chapters = Array.from(chapterMap.values());
  const totalSegments = segments.length;
  const doneSegments = chapters.reduce((sum, c) => sum + c.done, 0);

  return NextResponse.json({
    global: {
      total: totalSegments,
      done: doneSegments,
      running: isRunning,
      pending: totalSegments - doneSegments,
    },
    chapters,
  });
}
