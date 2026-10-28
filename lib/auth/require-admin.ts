import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

// Returns { admin } when the caller is a signed-in admin, otherwise { error } to send back.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ message: "Please sign in." }, { status: 401 }) };
  if (user.role !== "admin")
    return { error: NextResponse.json({ message: "Admin access required." }, { status: 403 }) };
  return { admin: user };
}