import { NextResponse } from "next/server";
import { isManimInstalled } from "@/lib/manim-render";

export async function GET() {
  return NextResponse.json({ installed: isManimInstalled() });
}
