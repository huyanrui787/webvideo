import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSkill, MAIN_SKILL_ID } from "@/lib/skills";

function getThemesDir(): string {
  const s = getSkill(MAIN_SKILL_ID);
  if (s) return path.join(s.path, "themes");
  // fallback for when skill isn't found
  return path.join(process.cwd(), "../web-video-presentation/themes");
}

const THEMES_DIR = getThemesDir();

export interface ThemeMeta {
  id: string;
  name: string;
  nameZh: string;
  descriptionZh: string;
  mood: string[];
  bestFor: string[];
  preview: { shell: string; surface: string; text: string; accent: string };
  // AI auto-config fields
  category?: string;
  content_signals?: string[];
  not_for_signals?: string[];
  chapter_type_fit?: Record<string, number>;
  layout_template?: string;
}

export async function GET() {
  try {
    const entries = fs.readdirSync(THEMES_DIR);
    const themes: ThemeMeta[] = [];

    for (const entry of entries) {
      const jsonPath = path.join(THEMES_DIR, entry, "theme.json");
      if (fs.existsSync(jsonPath)) {
        const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        themes.push({
          id: raw.id,
          name: raw.name,
          nameZh: raw.nameZh,
          descriptionZh: raw.descriptionZh,
          mood: raw.mood ?? [],
          bestFor: raw.bestFor ?? [],
          preview: raw.preview,
          category: raw.category,
          content_signals: raw.content_signals,
          not_for_signals: raw.not_for_signals,
          chapter_type_fit: raw.chapter_type_fit,
          layout_template: raw.layout_template,
        });
      }
    }

    return NextResponse.json(themes);
  } catch {
    return NextResponse.json(
      { error: "Themes directory not found" },
      { status: 500 }
    );
  }
}
