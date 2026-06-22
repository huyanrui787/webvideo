import { NextResponse } from "next/server";
import { analyzeTelemetry, quickSummary } from "@/lib/build-telemetry";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const report = analyzeTelemetry(7);
    const summary = quickSummary();
    return NextResponse.json({ projectId: id, summary, report });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Telemetry read failed: ${err.message}` },
      { status: 500 }
    );
  }
}
