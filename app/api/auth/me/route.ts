import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: unknown) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
