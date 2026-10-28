import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

// Returns { user } when the caller is signed in (customer or admin), otherwise { error } to send back.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ message: "Please sign in." }, { status: 401 }) };
  return { user };
}