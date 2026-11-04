import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "";
const resend = apiKey ? new Resend(apiKey) : null;

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "Mirqas Perfumes <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

/**
 * Sends a password reset email via Resend
 */
export async function sendPasswordResetEmail({
  to,
  name = "Valued Customer",
  token,
  isAdmin = false,
}: SendResetEmailOptions): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.error("Resend API key is not configured.");
    return { ok: false, error: "Email service is temporarily unavailable." };
  }

  const resetPath = isAdmin ? "/admin/reset-password" : "/reset-password";
  const resetUrl = `${APP_URL.replace(/\/$/, "")}${resetPath}?token=${encodeURIComponent(token)}`;

  const subject = isAdmin
    ? "Reset Your Mirqas Perfumes Admin Password"
    : "Reset Your Mirqas Perfumes Password";

  const greeting = name ? `Hello ${name},` : "Hello,";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FCF8F0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111111;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF8F0; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560px" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #EADFCC; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(156,90,43,0.06);">
                <tr>
                  <td style="background-color: #9C5A2B; padding: 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #FCF8F0; font-family: Georgia, serif; font-size: 28px; font-weight: 500; letter-spacing: 2px;">MIRQAS</h1>
                    <p style="margin: 4px 0 0 0; color: #F3E7D5; font-size: 11px; text-transform: uppercase; letter-spacing: 3px;">Haute Parfumerie</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #9C5A2B; font-family: Georgia, serif; font-size: 22px; font-weight: normal;">Password Reset Request</h2>
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #333333;">${greeting}</p>
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #555555;">
                      We received a request to reset your password for your Mirqas Perfumes ${isAdmin ? "administrator" : "store"} account. Click the button below to set a new password:
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${resetUrl}" style="background-color: #9C5A2B; color: #ffffff; padding: 14px 32px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 6px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">
                        Reset My Password
                      </a>
                    </div>
                    <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #777777;">
                      This link will securely expire in <strong>30 minutes</strong>.
                    </p>
                    <hr style="border: none; border-top: 1px solid #EADFCC; margin: 28px 0;" />
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #999999;">
                      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F8F3EA; padding: 20px 40px; text-align: center; border-top: 1px solid #EADFCC;">
                    <p style="margin: 0; font-size: 11px; color: #888888; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Mirqas Perfumes. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    });

    if (data.error) {
      console.error("Resend delivery error:", data.error);
      return { ok: false, error: data.error.message };
    }

    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to deliver email.";
    console.error("Resend exception:", err);
    return { ok: false, error: msg };
  }
}

/**
 * Sends an email verification link
 */
export async function sendVerificationEmail({
  to,
  name = "Valued Customer",
  token,
}: SendVerificationEmailOptions): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.error("Resend API key is not configured.");
    return { ok: false, error: "Email service is temporarily unavailable." };
  }

  const verifyUrl = `${APP_URL.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = "Verify Your Mirqas Perfumes Account";
  const greeting = name ? `Hello ${name},` : "Hello,";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #FCF8F0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111111;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF8F0; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560px" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #EADFCC; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(156,90,43,0.06);">
                <tr>
                  <td style="background-color: #9C5A2B; padding: 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #FCF8F0; font-family: Georgia, serif; font-size: 28px; font-weight: 500; letter-spacing: 2px;">MIRQAS</h1>
                    <p style="margin: 4px 0 0 0; color: #F3E7D5; font-size: 11px; text-transform: uppercase; letter-spacing: 3px;">Haute Parfumerie</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #9C5A2B; font-family: Georgia, serif; font-size: 22px; font-weight: normal;">Verify Your Email Address</h2>
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #333333;">${greeting}</p>
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #555555;">
                      Thank you for creating an account with Mirqas Perfumes. Please confirm your email address by clicking the button below:
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${verifyUrl}" style="background-color: #9C5A2B; color: #ffffff; padding: 14px 32px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 6px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">
                        Confirm Email Address
                      </a>
                    </div>
                    <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #777777;">
                      This verification link will remain active for 24 hours.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #F8F3EA; padding: 20px 40px; text-align: center; border-top: 1px solid #EADFCC;">
                    <p style="margin: 0; font-size: 11px; color: #888888; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} Mirqas Perfumes. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    });

    if (data.error) {
      console.error("Resend delivery error:", data.error);
      return { ok: false, error: data.error.message };
    }

    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to deliver verification email.";
    console.error("Resend exception:", err);
    return { ok: false, error: msg };
  }
}

