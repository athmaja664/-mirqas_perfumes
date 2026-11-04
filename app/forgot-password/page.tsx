"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPasswordRequest } from "@/lib/authApi";

// Brand colours (same as Login and Shop All)
const COPPER = "#9C5A2B";
const CREAM = "#FFF9F3";
const INK = "#111111";
const MUTED = "rgba(17,17,17,0.6)";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return setError("Please enter a valid registered email address.");
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await forgotPasswordRequest(cleanEmail);
      setSuccess(
        res.message || "If an account exists with this email, a password reset link has been sent."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process password recovery request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="grid min-h-[calc(100dvh-92px)] grid-cols-1 lg:grid-cols-2"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>

      {/* Left: image (matching login page) */}
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/login.png"
          alt="Mirqas Haute Parfumerie"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Right: card */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:py-14">
        <div
          className="w-full max-w-[540px] rounded-[14px] border bg-white p-6 shadow-[0_10px_30px_rgba(120,80,30,0.08)] sm:p-9"
          style={{ borderColor: CARD_LINE }}
        >
          <div className="mb-6">
            <Link
              href="/login"
              className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#9C5A2B] hover:underline"
            >
              ← Back to Sign In
            </Link>
          </div>

          <h1
            className="m-0 text-center text-4xl font-medium leading-tight sm:text-[2.6rem]"
            style={{ fontFamily: serif, color: COPPER }}
          >
            Forgot Your Password?
          </h1>
          <p className="mb-7 mt-2 text-center text-[14px]" style={{ color: MUTED }}>
            Enter your registered email address and we will send you a secure link to reset your password.
          </p>

          {/* Error & Success Messages */}
          <div className="flex flex-col gap-4">
            {error && (
              <div
                role="alert"
                className="rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-[10px] border px-4 py-3 text-[14px]"
                style={{ background: "#E3F2E6", borderColor: "#B7DBC0", color: "#1F7A3A" }}
              >
                {success}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
            <div>
              <label
                htmlFor="customer-email"
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em]"
                style={{ color: MUTED }}
              >
                Registered Email Address
              </label>
              <input
                id="customer-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-12 w-full rounded-[6px] border bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-black/35 focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE, color: INK, fontFamily: sans }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-wait disabled:opacity-70"
              style={{ background: COPPER }}
            >
              {loading ? (
                <>
                  <Spinner /> Sending Instructions
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px]" style={{ color: MUTED }}>
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-semibold underline underline-offset-4 transition-colors hover:text-[#7d4720]"
              style={{ color: COPPER }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
