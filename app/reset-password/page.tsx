"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { resetPasswordRequest } from "@/lib/authApi";

// Brand colours (same as Login and Shop All)
const COPPER = "#9C5A2B";
const CREAM = "#FFF9F3";
const INK = "#111111";
const MUTED = "rgba(17,17,17,0.6)";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className="fill-none stroke-current" strokeWidth="1.5" aria-hidden>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifyingToken(false);
      setTokenValid(false);
      setError("No reset token provided. Please request a new password reset link.");
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        setVerifyingToken(false);
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(data.message || "This password reset link is invalid or has expired.");
        }
      })
      .catch(() => {
        setVerifyingToken(false);
        setTokenValid(false);
        setError("Could not verify password reset link. Please check your connection.");
      });
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Password must include at least one letter and one number.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await resetPasswordRequest({
        token,
        password,
        confirmPassword,
      });
      setSuccess(res.message || "Password updated successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
        Create New Password
      </h1>
      <p className="mb-7 mt-2 text-center text-[14px]" style={{ color: MUTED }}>
        Please enter and confirm your new password below.
      </p>

      {verifyingToken ? (
        <div className="py-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-[#111111]/70">
            <Spinner /> Verifying security token...
          </div>
        </div>
      ) : !tokenValid ? (
        <div className="flex flex-col gap-5">
          <div
            role="alert"
            className="rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-700"
          >
            {error || "This password reset link is invalid or has expired."}
          </div>
          <Link
            href="/forgot-password"
            className="flex h-12 w-full items-center justify-center rounded-[6px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#7d4720]"
            style={{ background: COPPER }}
          >
            Request New Reset Link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
              {success} Redirection to sign in...
            </div>
          )}

          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: MUTED }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters with letter & number"
                className="h-12 w-full rounded-[6px] border bg-white px-4 pr-12 text-[15px] outline-none transition-colors placeholder:text-black/35 focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE, color: INK, fontFamily: sans }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9C5A2B]"
              >
                <EyeIcon off={!showPw} />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: MUTED }}>
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-12 w-full rounded-[6px] border bg-white px-4 pr-12 text-[15px] outline-none transition-colors placeholder:text-black/35 focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE, color: INK, fontFamily: sans }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9C5A2B]"
              >
                <EyeIcon off={!showConfirm} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(success)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-wait disabled:opacity-70"
            style={{ background: COPPER }}
          >
            {loading ? <Spinner /> : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main
      className="grid min-h-[calc(100dvh-92px)] grid-cols-1 lg:grid-cols-2"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>

      {/* Left: image */}
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
        <Suspense
          fallback={
            <div className="w-full max-w-[540px] rounded-[14px] border bg-white p-9 text-center" style={{ borderColor: CARD_LINE }}>
              <Spinner />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </section>
    </main>
  );
}

