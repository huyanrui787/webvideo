import { NextResponse } from "next/server";
import { getUserId } from "@/lib/api-helpers";

export interface SearchResult {
  id: string;
  title: string;
  previewUrl: string;
  downloadUrl: string;
  type: "image" | "video" | "gif";
  source: "pexels" | "giphy";
  credit?: string;
  width?: number;
  height?: number;
}

type Source = "pexels" | "pexels-video" | "giphy";

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const source = (searchParams.get("source") ?? "pexels") as Source;
  const page = parseInt(searchParams.get("page") ?? "1");

  if (!q) return NextResponse.json({ results: [] });

  try {
    if (source === "pexels") return NextResponse.json({ results: await searchPexelsImages(q, page) });
    if (source === "pexels-video") return NextResponse.json({ results: await searchPexelsVideos(q, page) });
    if (source === "giphy") return NextResponse.json({ results: await searchGiphy(q, page) });
    return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

async function searchPexelsImages(q: string, page: number): Promise<SearchResult[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY not configured");

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=20&page=${page}`,
    { headers: { Authorization: key } }
  );
  if (!res.ok) throw new Error(`Pexels error: ${res.status}`);
  const data = await res.json() as {
    photos: Array<{
      id: number; alt: string;
      photographer: string;
      src: { medium: string; large2x: string };
      width: number; height: number;
    }>;
  };

  return data.photos.map((p) => ({
    id: `pexels-${p.id}`,
    title: p.alt || `Photo by ${p.photographer}`,
    previewUrl: p.src.medium,
    downloadUrl: p.src.large2x,
    type: "image",
    source: "pexels",
    credit: p.photographer,
    width: p.width,
    height: p.height,
  }));
}

async function searchPexelsVideos(q: string, page: number): Promise<SearchResult[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY not configured");

  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=20&page=${page}`,
    { headers: { Authorization: key } }
  );
  if (!res.ok) throw new Error(`Pexels video error: ${res.status}`);
  const data = await res.json() as {
    videos: Array<{
      id: number;
      user: { name: string };
      image: string;
      video_files: Array<{ quality: string; link: string; width: number; height: number }>;
    }>;
  };

  return data.videos.map((v) => {
    const hd = v.video_files.find((f) => f.quality === "hd") ?? v.video_files[0];
    return {
      id: `pexels-video-${v.id}`,
      title: `Video by ${v.user.name}`,
      previewUrl: v.image,
      downloadUrl: hd?.link ?? "",
      type: "video" as const,
      source: "pexels" as const,
      credit: v.user.name,
      width: hd?.width,
      height: hd?.height,
    };
  }).filter((v) => v.downloadUrl);
}

async function searchGiphy(q: string, page: number): Promise<SearchResult[]> {
  const key = process.env.GIPHY_API_KEY;
  if (!key) throw new Error("GIPHY_API_KEY not configured");

  const offset = (page - 1) * 20;
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=20&offset=${offset}`
  );
  if (!res.ok) throw new Error(`Giphy error: ${res.status}`);
  const data = await res.json() as {
    data: Array<{
      id: string; title: string;
      images: {
        fixed_height: { url: string; width: string; height: string };
        original: { url: string };
      };
    }>;
  };

  return data.data.map((g) => ({
    id: `giphy-${g.id}`,
    title: g.title || "GIF",
    previewUrl: g.images.fixed_height.url,
    downloadUrl: g.images.original.url,
    type: "gif" as const,
    source: "giphy" as const,
    width: parseInt(g.images.fixed_height.width),
    height: parseInt(g.images.fixed_height.height),
  }));
}
