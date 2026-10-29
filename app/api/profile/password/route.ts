import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser, createSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { guardRequest, readJson } from "@/lib/security";
import { passwordSchema } from "@/lib/validations/profile";

export async function PATCH(req: NextRequest) {
  const blocked = guardRequest(req, "password", 5);
  if (blocked) return blocked;

  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ message: "Please sign in." }, { status: 401 });

  const parsed = passwordSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });

  await connectDB();
  const doc = await User.findById(current.id).select("+passwordHash");
  if (!doc) return NextResponse.json({ message: "Please sign in." }, { status: 401 });

  if (!(await bcrypt.compare(parsed.data.currentPassword, doc.passwordHash)))
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 403 });

  doc.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await doc.save();

  // Sign out every session (other devices too), then start a fresh one for this browser.
  await Session.deleteMany({ userId: doc._id });
  await createSession(String(doc._id), false);

  return NextResponse.json({ message: "Password updated." });
}