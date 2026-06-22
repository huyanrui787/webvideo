import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tokenUsage } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireProjectAccess } from "@/lib/api-helpers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireProjectAccess(req, id);
  if (error) return error;

  const rows = await db
    .select()
    .from(tokenUsage)
    .where(eq(tokenUsage.projectId, id))
    .orderBy(desc(tokenUsage.createdAt));

  // Aggregate by model
  const summaryMap = new Map<string, { inputTokens: number; outputTokens: number; turns: number }>();
  for (const row of rows) {
    const s = summaryMap.get(row.model) ?? { inputTokens: 0, outputTokens: 0, turns: 0 };
    s.inputTokens += row.inputTokens;
    s.outputTokens += row.outputTokens;
    s.turns += 1;
    summaryMap.set(row.model, s);
  }

  const summary = Array.from(summaryMap.entries()).map(([model, s]) => ({
    model,
    ...s,
    totalTokens: s.inputTokens + s.outputTokens,
  }));

  const turns = rows.map((r) => ({
    id: r.id,
    model: r.model,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    totalTokens: r.inputTokens + r.outputTokens,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ summary, turns });
}
