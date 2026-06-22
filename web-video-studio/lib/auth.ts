import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ─── Config ──────────────────────────────────────────────────────────────────

const SECRET_RAW = process.env.AUTH_SECRET;
if (!SECRET_RAW) throw new Error("AUTH_SECRET environment variable is required");

const SECRET = new TextEncoder().encode(SECRET_RAW);
const COOKIE_NAME = "__sid";
const TOKEN_TTL = "7d";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  role: "admin" | "user";
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Session cookie (Server Components / Route Handlers) ──────────────────────

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Read session from Next.js cookie store (Server Components / Route Handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── Session from raw Request (middleware) ────────────────────────────────────

/** Read session from a raw Request object (middleware context). */
export async function getSessionFromRequest(req: Request): Promise<SessionPayload | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifyToken(decodeURIComponent(match[1]!));
}
