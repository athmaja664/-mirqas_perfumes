import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { guardRequest } from "@/lib/security";

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "logout", 50);
  if (blocked) return blocked;
  await destroySession();
  return NextResponse.json({ message: "Signed out." });
}