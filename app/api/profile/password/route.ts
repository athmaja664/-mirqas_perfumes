import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth/require-user";
import { destroyOtherSessions } from "@/lib/auth/session";
import { guardRequest, readJson } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { changePasswordSchema } from "@/lib/validations/profile";

export async function PATCH(req: NextRequest) {
  const blocked = guardRequest(req, "profile-password", 10);
  if (blocked) return blocked;
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = changePasswordSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  const { currentPassword, newPassword } = parsed.data;

  await connectDB();
  const user = await User.findById(auth.user.id).select("+passwordHash");
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });

  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ _id: user._id }, { passwordHash });

  // Anyone using the old password on another device is signed out. This device stays signed in.
  await destroyOtherSessions(String(user._id));

  return NextResponse.json({ message: "Password changed. Other devices were signed out." });
}