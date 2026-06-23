import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/api-helpers";
import { subscribeToProject } from "@/lib/events";
import { getRenderJob } from "@/lib/render";
import fs from "fs";
import path from "path";
import { projectDir } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const encoder = new TextEncoder();
  let closed = false;
  let lastRenderStatus: string | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = subscribeToProject(id, (event) => {
        if (closed) return;
        try {
          const line = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(line));
        } catch { /* client disconnected */ }
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try { controller.enqueue(encoder.encode(": heartbeat\n\n")); } catch { clearInterval(heartbeat); }
      }, 30_000);

      // ── Render status polling: detect render completion & progress ──
      const renderPoller = setInterval(() => {
        if (closed) { clearInterval(renderPoller); return; }
        try {
          const job = getRenderJob(id);
          if (!job) return;
          const currentStatus = `${job.status}:${job.progress || ""}`;
          if (currentStatus !== lastRenderStatus) {
            lastRenderStatus = currentStatus;
            const line = `event: render\ndata: ${JSON.stringify({
              status: job.status,
              progress: job.progress,
              outputFile: job.outputFile,
              totalDuration: job.totalDuration,
            })}\n\n`;
            controller.enqueue(encoder.encode(line));
          }
        } catch { /* best-effort */ }
      }, 5000);

      // Close on abort
      req.signal?.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(renderPoller);
        unsubscribe();
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
