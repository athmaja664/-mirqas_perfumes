import { NextRequest, NextResponse } from "next/server";
import { guardRequest, readJson } from "@/lib/security";
import { requestPasswordReset } from "@/lib/services/password-reset";

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, "admin-forgot-password", 5);
    if (blocked) return blocked;

    const body = (await readJson(req)) as { email?: string };
    const email = (body.email || "").trim();

    if (!email) {
      return NextResponse.json(
        { message: "Please enter your registered administrator email address." },
        { status: 400 }
      );
    }

    // Pass isAdminRequest = true so it strictly targets admin accounts only
    const result = await requestPasswordReset(email, true);

    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      message:
        "If this email belongs to an administrator account, a password reset link has been dispatched.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process administrator recovery.";
    console.error("POST /api/admin/auth/forgot-password error:", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}

