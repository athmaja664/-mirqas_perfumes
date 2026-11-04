import { NextRequest, NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { guardRequest, readJson } from "@/lib/security";
import { isSmsConfigured, sendSmsOtp } from "@/lib/sms/sms-provider";
import { normalizePhone, isPhone } from "@/lib/auth/normalize";
import { connectDB } from "@/lib/db";
import { User, ensureUserAuthColumns } from "@/models/User";

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const OTP_TTL_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, "phone-otp", 5);
    if (blocked) return blocked;

    const body = (await readJson(req)) as {
      action: "send" | "verify";
      phone?: string;
      otp?: string;
      purpose?: "registration" | "recovery";
    };

    const { action, phone, otp, purpose = "registration" } = body;

    if (!phone || !isPhone(phone)) {
      return NextResponse.json({ message: "Please enter a valid phone number." }, { status: 400 });
    }

    if (!isSmsConfigured()) {
      return NextResponse.json(
        {
          message:
            "SMS service is not currently configured. Please register or recover your account using your email address, or contact store support.",
        },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);
    await connectDB();
    await ensureUserAuthColumns();

    if (action === "send") {
      if (purpose === "registration") {
        const existing = await User.count({ where: { phone: normalized } });
        if (existing > 0) {
          return NextResponse.json(
            { message: "An account with this phone number is already registered." },
            { status: 409 }
          );
        }
      }

      const generatedOtp = randomInt(100000, 999999).toString();
      // Store in memory or database temporary field
      const hashed = hashToken(generatedOtp);

      const user = await User.findOne({ where: { phone: normalized } });
      if (user) {
        user.phoneOtpHash = hashed;
        user.phoneOtpExpiry = new Date(Date.now() + OTP_TTL_MS);
        user.phoneOtpAttempts = 0;
        await user.save();
      }

      const sendRes = await sendSmsOtp(normalized, generatedOtp);
      if (!sendRes.ok) {
        return NextResponse.json({ message: sendRes.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Verification code sent to your phone number.",
      });
    }

    if (action === "verify") {
      if (!otp) {
        return NextResponse.json({ message: "Verification code is required." }, { status: 400 });
      }

      const user = await User.findOne({ where: { phone: normalized } });
      if (!user || !user.phoneOtpHash || !user.phoneOtpExpiry) {
        return NextResponse.json({ message: "No active verification code found." }, { status: 400 });
      }

      if (new Date() > new Date(user.phoneOtpExpiry)) {
        return NextResponse.json({ message: "Verification code has expired." }, { status: 400 });
      }

      if (hashToken(otp.trim()) !== user.phoneOtpHash) {
        return NextResponse.json({ message: "Invalid verification code." }, { status: 400 });
      }

      user.phoneVerified = true;
      user.phoneOtpHash = null;
      user.phoneOtpExpiry = null;
      await user.save();

      return NextResponse.json({ ok: true, message: "Phone number verified successfully." });
    }

    return NextResponse.json({ message: "Invalid action." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Phone OTP error.";
    console.error("POST /api/auth/phone-otp error:", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}

