import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export interface BgmTrack {
  id: string;
  name: string;
  nameZh: string;
  mood: string;
  moodZh: string;
  desc: string;
  bpm: number;
  duration: number;
  available: boolean;
}

export async function GET() {
  const catalogPath = path.join(process.cwd(), "public/bgm/catalog.json");
  if (!fs.existsSync(catalogPath)) {
    return NextResponse.json([]);
  }

  const catalog: Omit<BgmTrack, "available">[] = JSON.parse(
    fs.readFileSync(catalogPath, "utf-8")
  );

  const tracks: BgmTrack[] = catalog.map((t) => ({
    ...t,
    available: fs.existsSync(path.join(process.cwd(), `public/bgm/${t.id}.mp3`)),
  }));

  return NextResponse.json(tracks);
}
