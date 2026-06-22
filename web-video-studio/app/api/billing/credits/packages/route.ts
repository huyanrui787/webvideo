import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { creditPackages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const packages = await db
    .select()
    .from(creditPackages)
    .where(eq(creditPackages.isActive, true))
    .orderBy(asc(creditPackages.sortOrder));

  return NextResponse.json(packages.map((p) => ({
    id: p.id,
    credits: p.credits,
    priceCents: p.priceCents,
    label: p.label,
  })));
}
