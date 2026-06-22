import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

// Public paths that don't require authentication
const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/download"]);
// Public paths that redirect to /studio when already logged in
const REDIRECT_IF_AUTHED = new Set(["/", "/login", "/register"]);
// API routes that don't require authentication (login/register/logout only)
const PUBLIC_API_PATHS = new Set(["/api/auth/login", "/api/auth/register", "/api/auth/logout"]);

// Regex patterns for public API routes (asset/audio file serving — accessed by Vite iframe proxy)
const PUBLIC_API_PATTERNS = [
  /^\/api\/projects\/[^/]+\/assets\//,
  /^\/api\/projects\/[^/]+\/audio\//,
  /^\/api\/effects\/[^/]+\/preview$/,
  /^\/api\/projects\/[^/]+\/preflight$/,
  // Payment webhooks — called by Stripe and WeChat Pay (no auth)
  /^\/api\/billing\/payments\/stripe\/webhook$/,
  /^\/api\/billing\/payments\/wechat\/notify$/,
  // Manim check — lightweight readiness check, no auth needed
  /^\/api\/manim\/check$/,
  // DMG download — public
  /^\/api\/download$/,
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public auth API routes (login/register/logout don't need session)
  if (PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Allow public asset/audio serving (accessed by Vite presentation via proxy)
  if (PUBLIC_API_PATTERNS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // Allow /draw SPA and static assets without auth
  // (API calls under /api/draw/ are protected by individual route handlers)
  if (pathname.startsWith("/draw") && !pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow share pages and API without auth (public sharing)
  if (pathname.startsWith("/share") || pathname.startsWith("/api/share")) {
    return NextResponse.next();
  }

  // Allow render streaming for shared video pages
  if (/^\/api\/projects\/[^/]+\/render/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow public pages
  if (PUBLIC_PATHS.has(pathname)) {
    // If already logged in and this is a redirect-if-authed page, go to studio
    if (REDIRECT_IF_AUTHED.has(pathname)) {
      const session = await getSessionFromRequest(req);
      if (session) {
        return NextResponse.redirect(new URL("/studio", req.url));
      }
    }
    return NextResponse.next();
  }

  // Everything else requires authentication
  const session = await getSessionFromRequest(req);

  if (!session) {
    // API routes → 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Pages → redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Inject user info into request headers for route handlers
  const headers = new Headers(req.headers);
  headers.set("x-user-id", session.userId);
  headers.set("x-user-role", session.role);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
