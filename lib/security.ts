import { NextRequest, NextResponse } from "next/server";

// CSRF defence: state-changing requests must come from our own site.
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production"; // allows API clients in dev only
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

// Simple in-memory rate limit. Fine for development and a single server.
// For production on serverless hosting, replace with a shared store (e.g. Upstash Redis).
const hits = new Map<string, { count: number; resetAt: number }>();

function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

export function guardRequest(req: NextRequest, bucket: string, max = 10, windowMs = 15 * 60 * 1000) {
  if (!sameOrigin(req)) return NextResponse.json({ message: "Request blocked." }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (limited(`${bucket}:${ip}`, max, windowMs))
    return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  return null;
}

export async function readJson(req: NextRequest): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}