import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, Op } from "@/lib/db";
import { User, ensureUserAuthColumns } from "@/models/User";
import { registerSchema } from "@/lib/validations/auth";
import { guardRequest, readJson } from "@/lib/security";
import { isSmsConfigured, sendSmsOtp } from "@/lib/sms/sms-provider";
import { normalizePhone } from "@/lib/auth/normalize";
import { sendVerificationEmail } from "@/lib/email/resend";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "register", 5);
  if (blocked) return blocked;

  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });

  const { name, registrationMethod, identifier: rawId, email: rawEmail, phone: rawPhone, password, otp } = parsed.data;
  await connectDB();
  await ensureUserAuthColumns();

  // Detect whether input is an email address or a phone number
  let isEmailReg = true;
  let emailValue = (rawEmail || "").trim().toLowerCase();
  let phoneValue = (rawPhone || "").trim();

  if (rawId) {
    const trimmedId = rawId.trim();
    if (trimmedId.includes("@")) {
      isEmailReg = true;
      emailValue = trimmedId.toLowerCase();
    } else {
      isEmailReg = false;
      phoneValue = trimmedId;
    }
  } else if (registrationMethod === "phone" || phoneValue) {
    isEmailReg = false;
  }

  // A. Phone Registration Path
  if (!isEmailReg) {
    if (!phoneValue) {
      return NextResponse.json({ message: "Please provide a valid phone number." }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phoneValue);
    const existingPhone = await User.count({ where: { phone: normalizedPhone } });
    if (existingPhone > 0) {
      return NextResponse.json(
        { message: "An account with this phone number already exists." },
        { status: 409 }
      );
    }

    // Synthetic unique email to fulfill SQL schema NOT NULL & UNIQUE constraints
    const cleanDigits = normalizedPhone.replace(/\D/g, "");
    const placeholderEmail = `phone_${cleanDigits}@phone.mirqas.local`;

    try {
      await User.create({
        name,
        email: placeholderEmail,
        phone: normalizedPhone,
        passwordHash: await bcrypt.hash(password, 12),
        role: "customer",
        phoneVerified: false,
        emailVerified: false,
      });

      return NextResponse.json(
        { message: "Account created successfully. Please sign in." },
        { status: 201 }
      );
    } catch (e: unknown) {
      console.error("Phone register error:", e);
      return NextResponse.json(
        { message: "Could not create phone account. Please try again." },
        { status: 500 }
      );
    }
  }

  // B. Email Registration Path
  if (!emailValue) {
    return NextResponse.json({ message: "Email address is required." }, { status: 400 });
  }

  const normalizedEmail = emailValue.toLowerCase().trim();
  const count = await User.count({ where: { email: normalizedEmail } });
  if (count > 0) {
    return NextResponse.json(
      { message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  try {
    const rawVerifyToken = randomBytes(32).toString("hex");

    await User.create({
      name,
      email: normalizedEmail,
      phone: "",
      passwordHash: await bcrypt.hash(password, 12),
      role: "customer",
      emailVerified: true,
      phoneVerified: false,
    });

    sendVerificationEmail({
      to: normalizedEmail,
      name,
      token: rawVerifyToken,
    }).catch(() => {});

    return NextResponse.json(
      { message: "Account created successfully. Please sign in." },
      { status: 201 }
    );
  } catch (e: unknown) {
    const err = e as { name?: string; original?: { errno?: number } };
    if (err.name === "SequelizeUniqueConstraintError" || err.original?.errno === 1062)
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    console.error("Email register error:", e);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
