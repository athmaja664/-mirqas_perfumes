import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB, Op } from "@/lib/db";
import { User } from "@/models/User";
import { guardRequest, readJson } from "@/lib/security";
import { profileSchema } from "@/lib/validations/profile";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: NextRequest) {
  const blocked = guardRequest(req, "profile", 15);
  if (blocked) return blocked;

  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ message: "Please sign in." }, { status: 401 });

  const parsed = profileSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  const { name, email, phone, currentPassword } = parsed.data;

  await connectDB();
  const doc = await User.findByPk(current.id);
  if (!doc) return NextResponse.json({ message: "Please sign in." }, { status: 401 });

  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail !== doc.email) {
    if (!currentPassword)
      return NextResponse.json({ message: "Enter your current password to change your email." }, { status: 400 });
    if (!(await bcrypt.compare(currentPassword, doc.passwordHash)))
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 403 });
    const exists = await User.count({ where: { email: cleanEmail, id: { [Op.ne]: doc.id } } });
    if (exists > 0)
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
  }

  doc.name = name;
  doc.phone = phone || "";
  doc.email = cleanEmail;
  try {
    await doc.save();
  } catch (e: unknown) {
    const err = e as { name?: string; original?: { errno?: number } };
    if (err.name === "SequelizeUniqueConstraintError" || err.original?.errno === 1062)
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ message: "Could not save your profile." }, { status: 500 });
  }

  return NextResponse.json({ user: { id: String(doc.id), name: doc.name, email: doc.email, phone: doc.phone, role: doc.role } });
}