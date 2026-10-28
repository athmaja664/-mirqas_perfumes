import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { registerSchema } from "@/lib/validations/auth";
import { guardRequest, readJson } from "@/lib/security";

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "register", 5);
  if (blocked) return blocked;

  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });

  const { name, email, phone, password } = parsed.data;
  await connectDB();

  if (await User.exists({ email }))
    return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });

  try {
    // role is set here on the server. The browser can never choose it.
    await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 12), role: "customer" });
  } catch (e) {
    if ((e as { code?: number }).code === 11000)
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ message: "Account created. Please sign in." }, { status: 201 });
}