import { createHash, randomBytes, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { connectDB, Op } from "@/lib/db";
import { User, ensureUserAuthColumns } from "@/models/User";
import { Session } from "@/models/Session";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { isSmsConfigured, sendSmsOtp } from "@/lib/sms/sms-provider";
import { normalizePhone, isEmail, isPhone } from "@/lib/auth/normalize";

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

// 30 minutes for email reset link
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
// 5 minutes for phone SMS OTP
const PHONE_OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export interface PasswordResetRequestResult {
  ok: boolean;
  message: string;
  method: "email" | "phone";
}

/**
 * Initiates a password reset via email or phone
 */
export async function requestPasswordReset(
  identifier: string,
  isAdminRequest = false
): Promise<PasswordResetRequestResult> {
  await connectDB();
  await ensureUserAuthColumns();

  const trimmed = identifier.trim();

  // 1. Email Recovery Flow
  if (isEmail(trimmed)) {
    const emailNorm = trimmed.toLowerCase();
    const user = await User.findOne({ where: { email: emailNorm, isActive: true } });

    // Protect against account enumeration: only proceed if user exists and role matches,
    // but return the same success message to the caller.
    if (user && (!isAdminRequest || user.role === "admin")) {
      const rawToken = randomBytes(32).toString("hex");
      user.resetTokenHash = hashToken(rawToken);
      user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: rawToken,
        isAdmin: isAdminRequest,
      });
    }

    return {
      ok: true,
      method: "email",
      message:
        "If an account is associated with this email address, you will receive password reset instructions shortly.",
    };
  }

  // 2. Phone Recovery Flow (Disabled - Email-Only Recovery)
  if (isPhone(trimmed)) {
    return {
      ok: false,
      method: "phone",
      message:
        "Password reset is only supported via email. Please enter your registered email address to receive reset instructions.",
    };
  }

  return {
    ok: false,
    method: "email",
    message: "Please enter a valid email address.",
  };
}

/**
 * Validates whether an email password reset token is valid
 */
export async function validateResetToken(
  token: string,
  isAdminRequest = false
): Promise<{ ok: boolean; message?: string; email?: string }> {
  if (!token || typeof token !== "string") {
    return { ok: false, message: "Invalid password reset link." };
  }

  await connectDB();
  await ensureUserAuthColumns();

  const hashed = hashToken(token.trim());
  const user = await User.findOne({
    where: {
      resetTokenHash: hashed,
      resetTokenExpiry: { [Op.gt]: new Date() },
      isActive: true,
      ...(isAdminRequest ? { role: "admin" } : { role: "customer" }),
    },
  });

  if (!user) {
    return { ok: false, message: "This password reset link is invalid or has expired." };
  }

  return { ok: true, email: user.email };
}

/**
 * Completes an email password reset with token
 */
export async function completePasswordResetWithToken(
  token: string,
  newPassword: string,
  isAdminRequest = false
): Promise<{ ok: boolean; message: string }> {
  if (!token || !newPassword || newPassword.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters long." };
  }

  await connectDB();
  await ensureUserAuthColumns();

  const hashed = hashToken(token.trim());
  const user = await User.findOne({
    where: {
      resetTokenHash: hashed,
      resetTokenExpiry: { [Op.gt]: new Date() },
      isActive: true,
      ...(isAdminRequest ? { role: "admin" } : { role: "customer" }),
    },
  });

  if (!user) {
    return { ok: false, message: "Password reset token is invalid or has expired." };
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetTokenHash = null;
  user.resetTokenExpiry = null;
  await user.save();

  // Revoke all existing sessions for this user so they must log in with the new password
  await Session.destroy({ where: { userId: user.id } }).catch(() => {});

  return {
    ok: true,
    message: "Your password has been successfully updated. Please sign in with your new password.",
  };
}

/**
 * Completes a phone OTP password reset
 */
export async function completePasswordResetWithPhone(
  phone: string,
  otp: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  if (!phone || !otp) {
    return { ok: false, message: "Phone number and OTP are required." };
  }
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters long." };
  }

  await connectDB();
  await ensureUserAuthColumns();

  const normalized = normalizePhone(phone);
  const user = await User.findOne({ where: { phone: normalized, role: "customer", isActive: true } });

  if (!user || !user.phoneOtpHash || !user.phoneOtpExpiry) {
    return { ok: false, message: "No active password recovery request found for this phone number." };
  }

  if (new Date() > new Date(user.phoneOtpExpiry)) {
    user.phoneOtpHash = null;
    user.phoneOtpExpiry = null;
    await user.save();
    return { ok: false, message: "The verification code has expired. Please request a new code." };
  }

  if ((user.phoneOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    user.phoneOtpHash = null;
    user.phoneOtpExpiry = null;
    await user.save();
    return { ok: false, message: "Maximum verification attempts exceeded. Please request a new code." };
  }

  const enteredHash = hashToken(otp.trim());
  if (enteredHash !== user.phoneOtpHash) {
    user.phoneOtpAttempts = (user.phoneOtpAttempts || 0) + 1;
    await user.save();
    return { ok: false, message: "Invalid verification code. Please check and try again." };
  }

  // Success
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.phoneOtpHash = null;
  user.phoneOtpExpiry = null;
  user.phoneOtpAttempts = 0;
  user.phoneVerified = true;
  await user.save();

  // Invalidate all active sessions
  await Session.destroy({ where: { userId: user.id } }).catch(() => {});

  return {
    ok: true,
    message: "Your password has been successfully updated. Please sign in with your new password.",
  };
}

