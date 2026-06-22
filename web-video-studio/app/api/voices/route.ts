import { NextResponse } from "next/server";
import { VOICE_META, OPENAI_VOICES, MINIMAX_FEATURED } from "@/lib/voice-meta";

export interface VoiceItem {
  id: string;
  zh: string;
  gender: "male" | "female" | "neutral";
  style: string;
  featured: boolean;
}

export interface VoicesResponse {
  minimax: VoiceItem[];
  openai: VoiceItem[];
}

function buildList(ids: string[], featured: string[]): VoiceItem[] {
  return ids.map(id => {
    const meta = VOICE_META[id];
    return {
      id,
      zh: meta?.zh ?? id,
      gender: meta?.gender ?? "neutral",
      style: meta?.style ?? "其他",
      featured: featured.includes(id),
    };
  });
}

export async function GET() {
  const minimaxList = buildList(MINIMAX_FEATURED, MINIMAX_FEATURED);
  const openaiList = buildList(OPENAI_VOICES, OPENAI_VOICES);
  return NextResponse.json({ minimax: minimaxList, openai: openaiList } satisfies VoicesResponse);
}
