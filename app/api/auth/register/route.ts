import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User, ensureUserAuthColumns } from "@/models/User";
import { registerSchema } from "@/lib/validations/auth";
import { guardRequest, readJson } from "@/lib/security";
import { normalizePhone } from "@/lib/auth/normalize";

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "register", 10);
  if (blocked) return blocked;

  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, email: rawEmail, phone: rawPhone, password } = parsed.data;
  await connectDB();
  await ensureUserAuthColumns();

  const cleanEmail = (rawEmail || "").trim().toLowerCase();
  const cleanPhone = (rawPhone || "").trim();

  // Validate that at least one (email or phone) is provided
  if (!cleanEmail && !cleanPhone) {
    return NextResponse.json(
      { message: "Please enter either an email address or a phone number." },
      { status: 400 }
    );
  }

  let normalizedPhone = "";
  if (cleanPhone) {
    normalizedPhone = normalizePhone(cleanPhone);
    const existingPhone = await User.count({ where: { phone: normalizedPhone } });
    if (existingPhone > 0) {
      return NextResponse.json(
        { message: "An account with this phone number already exists." },
        { status: 409 }
      );
    }
  }

  let finalEmail = cleanEmail;
  if (cleanEmail) {
    const existingEmail = await User.count({ where: { email: cleanEmail } });
    if (existingEmail > 0) {
      return NextResponse.json(
        { message: "An account with this email address already exists." },
        { status: 409 }
      );
    }
  } else {
    // If user provided phone only, generate a unique synthetic placeholder email for MySQL NOT NULL & UNIQUE schema constraints
    const cleanDigits = normalizedPhone.replace(/\D/g, "");
    finalEmail = `phone_${cleanDigits}@phone.mirqas.local`;
  }

  try {
    await User.create({
      name: name.trim(),
      email: finalEmail,
      phone: normalizedPhone,
      passwordHash: await bcrypt.hash(password, 12),
      role: "customer",
      isActive: true,
      emailVerified: Boolean(cleanEmail),
      phoneVerified: Boolean(cleanPhone),
    });

    return NextResponse.json(
      { message: "Account created successfully. Please sign in." },
      { status: 201 }
    );
  } catch (e: unknown) {
    const err = e as { name?: string; original?: { errno?: number } };
    if (err.name === "SequelizeUniqueConstraintError" || err.original?.errno === 1062) {
      return NextResponse.json(
        { message: "An account with these details already exists." },
        { status: 409 }
      );
    }
    console.error("Register error:", e);
    return NextResponse.json({ message: "Could not create account. Please try again." }, { status: 500 });
  }
}
