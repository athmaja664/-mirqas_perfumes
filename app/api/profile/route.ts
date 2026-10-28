import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth/require-user";
import { guardRequest, readJson } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { updateProfileSchema } from "@/lib/validations/profile";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  return NextResponse.json({ user: auth.user }, { headers: NO_STORE });
}

export async function PATCH(req: NextRequest) {
  const blocked = guardRequest(req, "profile", 20);
  if (blocked) return blocked;
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const parsed = updateProfileSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  const { name, email, phone, currentPassword } = parsed.data;

  await connectDB();
  // The user always comes from the session, never from the browser.
  const user = await User.findById(auth.user.id).select("+passwordHash");
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });

  if (email !== user.email) {
    if (!currentPassword)
      return NextResponse.json({ message: "Enter your current password to change your email." }, { status: 400 });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
    if (await User.exists({ email, _id: { $ne: user._id } }))
      return NextResponse.json({ message: "That email is already in use." }, { status: 409 });
    user.email = email;
  }

  // Only these three fields can change. The role is never touched here.
  user.name = name;
  user.phone = phone;

  try {
    await user.save();
  } catch (e) {
    if ((e as { code?: number }).code === 11000)
      return NextResponse.json({ message: "That email is already in use." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ message: "Could not save your profile." }, { status: 500 });
  }

  return NextResponse.json({
    user: { id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
}