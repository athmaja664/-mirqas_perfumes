/**
 * Email Service (Resend feature disabled as requested)
 */

interface SendResetEmailOptions {
  to: string;
  name?: string;
  token: string;
  isAdmin?: boolean;
}

interface SendVerificationEmailOptions {
  to: string;
  name?: string;
  token: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
  isAdmin,
}: SendResetEmailOptions): Promise<{ ok: boolean; error?: string; id?: string }> {
  // Feature disabled
  return { ok: false, error: "Password reset via email is currently disabled." };
}

export async function sendVerificationEmail({
  to,
  name,
  token,
}: SendVerificationEmailOptions): Promise<{ ok: boolean; error?: string; id?: string }> {
  // Feature disabled
  return { ok: true };
}
