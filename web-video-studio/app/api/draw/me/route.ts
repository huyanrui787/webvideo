import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSessionFromRequest(
      new Request("http://localhost")
    );
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)
      .then((r) => r[0]);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json(
      { authenticated: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
