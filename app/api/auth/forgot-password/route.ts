import { NextRequest, NextResponse } from "next/server";
import { guardRequest, readJson } from "@/lib/security";
import { requestPasswordReset } from "@/lib/services/password-reset";

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, "forgot-password", 5);
    if (blocked) return blocked;

    const body = (await readJson(req)) as { identifier?: string; email?: string };
    const email = (body.email || body.identifier || "").trim();

    if (!email) {
      return NextResponse.json(
        { message: "Please enter your registered email address." },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(email, false);

    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      message: result.message,
      method: result.method,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process recovery request.";
    console.error("POST /api/auth/forgot-password error:", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}

