import { NextResponse } from "next/server";
import { exportToPPTX, loadBlueprintsFromDisk } from "@/lib/pptx-export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const blueprints = loadBlueprintsFromDisk(id);

    if (blueprints.length === 0) {
      return NextResponse.json(
        { error: "No blueprints found. Build the project first." },
        { status: 404 }
      );
    }

    const buffer = await exportToPPTX(id, blueprints);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="project-${id}.pptx"`,
      },
    });
  } catch (err) {
    console.error("PPTX export failed:", err);
    return NextResponse.json(
      { error: `Export failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
