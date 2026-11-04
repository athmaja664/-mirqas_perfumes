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

  const { name, registrationMethod, email: rawEmail, phone: rawPhone, password, otp } = parsed.data;
  await connectDB();
  await ensureUserAuthColumns();

  // A. Phone Registration Path
  if (registrationMethod === "phone") {
    if (!rawPhone) {
      return NextResponse.json({ message: "Please provide a valid phone number." }, { status: 400 });
    }

    if (!isSmsConfigured()) {
      return NextResponse.json(
        {
          message:
            "SMS verification service is not currently configured on the server. Please register using your email address, or contact store support.",
        },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(rawPhone);
    const existingPhone = await User.count({ where: { phone: normalizedPhone } });
    if (existingPhone > 0) {
      return NextResponse.json(
        { message: "An account with this phone number already exists." },
        { status: 409 }
      );
    }

    // Require OTP verification before account creation when SMS is active
    if (!otp) {
      return NextResponse.json(
        { message: "An OTP verification code is required to complete phone registration." },
        { status: 400 }
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
        phoneVerified: true,
        emailVerified: false,
      });

      return NextResponse.json(
        { message: "Account created and phone number verified. Please sign in." },
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
  if (!rawEmail) {
    return NextResponse.json({ message: "Email address is required." }, { status: 400 });
  }

  const normalizedEmail = rawEmail.toLowerCase().trim();
  const count = await User.count({ where: { email: normalizedEmail } });
  if (count > 0) {
    return NextResponse.json(
      { message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : "";
  if (normalizedPhone) {
    const phoneCount = await User.count({ where: { phone: normalizedPhone } });
    if (phoneCount > 0) {
      return NextResponse.json(
        { message: "An account with this phone number already exists." },
        { status: 409 }
      );
    }
  }

  try {
    const rawVerifyToken = randomBytes(32).toString("hex");

    await User.create({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: await bcrypt.hash(password, 12),
      role: "customer",
      emailVerified: true, // Auto-verified on registration for smooth shopping flow
      phoneVerified: false,
    });

    // Optionally send verification or welcome email in the background
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
