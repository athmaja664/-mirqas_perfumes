"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { adminResetPasswordRequest } from "@/lib/authApi";

// Brand colours
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

function AdminResetPasswordContent() {
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
      setError("No administrator reset token provided. Please request a new recovery link.");
      return;
    }

    fetch(`/api/admin/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        setVerifyingToken(false);
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(data.message || "This administrator reset link is invalid or has expired.");
        }
      })
      .catch(() => {
        setVerifyingToken(false);
        setTokenValid(false);
        setError("Could not verify administrator reset link. Please check your connection.");
      });
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      return setError("Administrator password must be at least 8 characters long.");
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
      const res = await adminResetPasswordRequest({
        token,
        password,
        confirmPassword,
      });
      setSuccess(res.message || "Administrator password updated successfully!");
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update administrator password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-[540px] rounded-[14px] border bg-white p-6 shadow-[0_10px_30px_rgba(120,80,30,0.08)] sm:p-9"
      style={{ borderColor: CARD_LINE }}
    >
      <div className="mb-4 text-center">
        <span className="rounded bg-[#9C5A2B]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#9C5A2B]">
          Admin Portal
        </span>
      </div>

      <div className="mb-6">
        <Link
          href="/admin/login"
          className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#9C5A2B] hover:underline"
        >
          ← Back to Admin Sign In
        </Link>
      </div>

      <h1
        className="m-0 text-center text-3xl font-medium leading-tight sm:text-4xl"
        style={{ fontFamily: serif, color: COPPER }}
      >
        Set Admin Password
      </h1>
      <p className="mb-7 mt-2 text-center text-[14px]" style={{ color: MUTED }}>
        Create a new, highly secure password for your administrator account.
      </p>

      {verifyingToken && (
        <div className="flex flex-col items-center justify-center py-8">
          <Spinner />
          <p className="mt-3 text-sm" style={{ color: MUTED }}>
            Validating administrator token...
          </p>
        </div>
      )}

      {error && !verifyingToken && (
        <div
          role="alert"
          className="mb-5 rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-700"
        >
          {error}
          {!tokenValid && (
            <div className="mt-3">
              <Link
                href="/admin/forgot-password"
                className="inline-block text-xs font-semibold uppercase tracking-wider text-red-800 underline hover:no-underline"
              >
                Request New Admin Recovery Link
              </Link>
            </div>
          )}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-5 rounded-[10px] border px-4 py-3 text-[14px]"
          style={{ background: "#E3F2E6", borderColor: "#B7DBC0", color: "#1F7A3A" }}
        >
          {success}
          <p className="mt-1 text-xs">Redirecting to administrator sign in...</p>
        </div>
      )}

      {!verifyingToken && tokenValid && !success && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="admin-new-password"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#111111]"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="admin-new-password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border bg-transparent px-4 py-3 text-[14px] outline-none transition-colors pr-12 focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE, color: INK }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#7d4720]"
                style={{ color: COPPER }}
              >
                <EyeIcon off={!showPw} />
              </button>
            </div>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>
              Minimum 8 characters, including at least one letter and one number.
            </p>
          </div>

          <div>
            <label
              htmlFor="admin-confirm-password"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#111111]"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="admin-confirm-password"
                type={showConfirm ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-[10px] border bg-transparent px-4 py-3 text-[14px] outline-none transition-colors pr-12 focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE, color: INK }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#7d4720]"
                style={{ color: COPPER }}
              >
                <EyeIcon off={!showConfirm} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#854a22] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: COPPER }}
          >
            {loading ? (
              <>
                <Spinner />
                <span>Updating Password...</span>
              </>
            ) : (
              "Update Admin Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-4 sm:p-8"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-[#9C5A2B]">
            <Spinner /> Loading recovery portal...
          </div>
        }
      >
        <AdminResetPasswordContent />
      </Suspense>
    </main>
  );
}

