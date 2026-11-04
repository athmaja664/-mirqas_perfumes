/**
 * SMS Provider Service Abstraction
 * 
 * Supports pluggable SMS gateways (MSG91, Twilio, Generic HTTP).
 * Returns clear unavailable errors when credentials are not configured in environment variables.
 */

export interface SendSmsResult {
  ok: boolean;
  message: string;
  provider?: string;
  referenceId?: string;
}

export function isSmsConfigured(): boolean {
  const provider = (process.env.SMS_PROVIDER || "").trim().toLowerCase();
  const apiKey = (process.env.SMS_API_KEY || "").trim();
  return Boolean(provider && apiKey);
}

/**
 * Sends a single-use SMS OTP to a normalized phone number.
 */
export async function sendSmsOtp(
  phone: string,
  otp: string
): Promise<SendSmsResult> {
  const provider = (process.env.SMS_PROVIDER || "").trim().toLowerCase();
  const apiKey = (process.env.SMS_API_KEY || "").trim();
  const senderId = (process.env.SMS_SENDER_ID || "MIRQAS").trim();

  if (!isSmsConfigured()) {
    return {
      ok: false,
      message:
        "SMS service is not currently configured. Please register or recover your account using your email address, or contact store support.",
    };
  }

  try {
    // 1. MSG91 implementation
    if (provider === "msg91") {
      const templateId = process.env.MSG91_OTP_TEMPLATE_ID || "";
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${encodeURIComponent(
        phone.replace(/^\+/, "")
      )}&authkey=${apiKey}&otp=${otp}`;

      const res = await fetch(url, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.type === "error") {
        console.error("MSG91 SMS failure:", data);
        return {
          ok: false,
          message: data.message || "Failed to deliver SMS OTP.",
        };
      }

      return {
        ok: true,
        message: "OTP sent successfully via SMS.",
        provider: "msg91",
        referenceId: data.request_id,
      };
    }

    // 2. Generic / Custom Gateway implementation
    if (provider === "custom" || provider === "generic") {
      const endpoint = process.env.SMS_GATEWAY_URL || "";
      if (!endpoint) {
        return {
          ok: false,
          message: "SMS gateway endpoint URL is missing in configuration.",
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: phone,
          sender: senderId,
          message: `Your Mirqas Perfumes verification code is: ${otp}. It will expire in 5 minutes. Do not share this code.`,
        }),
      });

      if (!res.ok) {
        return { ok: false, message: "Gateway rejected SMS transmission." };
      }

      return {
        ok: true,
        message: "OTP sent successfully via SMS.",
        provider: "generic",
      };
    }

    return {
      ok: false,
      message: `Unsupported SMS provider '${provider}'. Supported: msg91, generic.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error during SMS dispatch.";
    console.error("SMS Dispatch Exception:", err);
    return {
      ok: false,
      message: errorMsg,
    };
  }
}

