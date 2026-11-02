import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { guardRequest, readJson } from "@/lib/security";
import { verifyCredentials } from "@/lib/services/auth";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, "login");
    if (blocked) return blocked;

    const parsed = loginSchema.safeParse(await readJson(req));
    if (!parsed.success)
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });

    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });

    await createSession(String(user._id), parsed.data.remember);
    // The role comes from the database, never from the browser.
    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred during login.";
    console.error("Login route error:", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
