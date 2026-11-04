import { NextRequest, NextResponse } from "next/server";
import { guardRequest, readJson } from "@/lib/security";
import {
  validateResetToken,
  completePasswordResetWithToken,
} from "@/lib/services/password-reset";

// GET: Validate administrator reset token
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    if (!token) {
      return NextResponse.json({ valid: false, message: "Missing reset token." }, { status: 400 });
    }

    const validation = await validateResetToken(token, true);
    return NextResponse.json({
      valid: validation.ok,
      message: validation.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation error.";
    return NextResponse.json({ valid: false, message }, { status: 500 });
  }
}

// POST: Execute administrator password reset
export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, "admin-reset-password", 5);
    if (blocked) return blocked;

    const body = (await readJson(req)) as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };

    const token = (body.token || "").trim();
    const password = body.password || "";
    const confirmPassword = body.confirmPassword || "";

    if (!token) {
      return NextResponse.json({ message: "Reset token is required." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { message: "Password must include at least one letter and one number." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }

    const result = await completePasswordResetWithToken(token, password, true);
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reset administrator password.";
    console.error("POST /api/admin/auth/reset-password error:", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}

