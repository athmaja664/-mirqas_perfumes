"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { loginRequest, logoutRequest } from "@/lib/authApi";
import { setActiveUserId } from "@/lib/shopStorage";

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

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return setError("Please enter your administrator email address or phone.");
    }
    if (!password) {
      return setError("Please enter your password.");
    }

    setError("");
    setLoading(true);

    try {
      const data = await loginRequest(identifier.trim(), password, false);
      if (data?.user?.role !== "admin") {
        await logoutRequest();
        setError("Access restricted. This portal is exclusively for administrators.");
        return;
      }

      if (data?.user?.id) {
        setActiveUserId(String(data.user.id));
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4 sm:p-8"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>

      <div
        className="w-full max-w-[480px] rounded-[14px] border bg-white p-6 shadow-[0_10px_30px_rgba(120,80,30,0.08)] sm:p-9"
        style={{ borderColor: CARD_LINE }}
      >
        <div className="mb-4 text-center">
          <span className="rounded bg-[#9C5A2B]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#9C5A2B]">
            Admin Portal
          </span>
        </div>

        <h1
          className="m-0 text-center text-3xl font-medium leading-tight sm:text-4xl"
          style={{ fontFamily: serif, color: COPPER }}
        >
          Administrator Sign In
        </h1>
        <p className="mb-7 mt-2 text-center text-[14px]" style={{ color: MUTED }}>
          Sign in to manage catalog, orders, and system settings.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="admin-identifier"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#111111]"
            >
              Email Address or Phone Number
            </label>
            <input
              id="admin-identifier"
              type="text"
              required
              autoComplete="username"
              placeholder="admin@mirqasperfumes.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-[10px] border bg-transparent px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#9C5A2B]"
              style={{ borderColor: CARD_LINE, color: INK }}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#111111]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Enter password"
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
          </div>

          <div className="flex items-center justify-end text-xs">
            <Link
              href="/admin/forgot-password"
              className="font-medium text-[#9C5A2B] hover:underline"
            >
              Forgot Password?
            </Link>
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
                <span>Authenticating...</span>
              </>
            ) : (
              "Sign In to Admin Portal"
            )}
          </button>
        </form>

        <div className="mt-8 border-t pt-5 text-center" style={{ borderColor: CARD_LINE }}>
          <Link
            href="/login"
            className="text-xs font-medium text-[#111111] opacity-75 hover:opacity-100 hover:underline"
          >
            ← Back to Customer Store
          </Link>
        </div>
      </div>
    </main>
  );
}
