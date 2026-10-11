import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The Lovable journal studio (journal-studio/) runs on its own origin and calls
// these API routes from the browser. Extra origins: CORS_ALLOWED_ORIGINS,
// comma-separated, e.g. "https://studio.example.com".
const ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^http:\/\/localhost:\d+$/,
];

function isAllowed(origin: string) {
  const extra = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return extra.includes(origin) || ORIGIN_PATTERNS.some((p) => p.test(origin));
}

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "600",
  Vary: "Origin",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = origin !== "" && isAllowed(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: allowed ? { ...CORS_HEADERS, "Access-Control-Allow-Origin": origin } : {},
    });
  }

  const response = NextResponse.next();
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    for (const [k, v] of Object.entries(CORS_HEADERS)) response.headers.set(k, v);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
