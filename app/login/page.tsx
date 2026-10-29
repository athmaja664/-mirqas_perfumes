"use client";

// app/login/page.tsx
// Login / Register page in the same style as the rest of the site:
// cream background, copper buttons, Cormorant Garamond headings, Inter text,
// 14px rounded card, 6px rounded fields and buttons.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { loginRequest, registerRequest } from "@/lib/authApi";

// Brand colours (same as Shop All)
const COPPER = "#9C5A2B";
const CREAM = "#FFF9F3";
const INK = "#111111";
const MUTED = "rgba(17,17,17,0.6)";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

type Tab = "login" | "register";

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

function Field({
  label, id, type = "text", value, onChange, autoComplete, placeholder, inputMode, toggle,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel";
  toggle?: { shown: boolean; onToggle: () => void };
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={toggle ? (toggle.shown ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          className={`h-12 w-full rounded-[6px] border bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-black/35 focus:border-[#9C5A2B] ${
            toggle ? "pr-12" : ""
          }`}
          style={{ borderColor: CARD_LINE, color: INK, fontFamily: sans }}
        />
        {toggle && (
          <button
            type="button"
            onClick={toggle.onToggle}
            aria-label={toggle.shown ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#7d4720]"
            style={{ color: COPPER }}
          >
            <EyeIcon off={!toggle.shown} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(false);
  const [terms, setTerms] = useState(false);

  // Allow /login?tab=register to open the Register tab
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "register") setTab("register");
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setSuccess("");
  };

  const validate = (): string => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Please enter a valid email address.";
    if (tab === "login") return password ? "" : "Please enter your password.";
    if (name.trim().length < 2) return "Please enter your full name.";
    if (!/^\+?[0-9\s-]{7,15}$/.test(phone.trim())) return "Please enter a valid mobile number.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
      return "Password must include a letter and a number.";
    if (password !== confirm) return "Passwords do not match.";
    if (!terms) return "Please accept the terms and conditions.";
    return "";
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setSuccess("");
      return setError(problem);
    }

    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (tab === "login") {
        // One login form for everyone: the server reads the role from the database.
        const data = await loginRequest(email.trim(), password, remember);
        router.push(data?.user?.role === "admin" ? "/admin/dashboard" : "/");
        router.refresh();
      } else {
        await registerRequest({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirmPassword: confirm,
        });
        setTab("login");
        setPassword("");
        setConfirm("");
        setTerms(false);
        setSuccess("Account created. Please sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Tabs: copper when active, white with a copper outline when not (same as the Add to cart button)
  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => switchTab(t)}
      className={`h-11 flex-1 rounded-[6px] text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors ${
        tab === t ? "text-white" : "text-[#9C5A2B] hover:bg-[#9C5A2B]/10"
      }`}
      style={tab === t ? { background: COPPER } : undefined}
    >
      {label}
    </button>
  );

  return (
    <main
      className="grid min-h-[calc(100dvh-92px)] grid-cols-1 lg:grid-cols-2"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>

      {/* Left: image (hidden on phones to keep the form first) */}
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/login.png"
          alt="Spraying a Mirqas perfume"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Right: form in a rounded card */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:py-14">
        <div
          className="w-full max-w-[540px] rounded-[14px] border bg-white p-6 shadow-[0_10px_30px_rgba(120,80,30,0.08)] sm:p-9"
          style={{ borderColor: CARD_LINE }}
        >
          <h1
            className="m-0 text-center text-4xl font-medium leading-tight sm:text-[2.6rem]"
            style={{ fontFamily: serif, color: COPPER }}
          >
            {tab === "login" ? "Welcome Back" : "Create Your Account"}
          </h1>
          <p className="mb-7 mt-2 text-center text-[14px]" style={{ color: MUTED }}>
            {tab === "login"
              ? "Sign in to view your orders and check out faster."
              : "Join Mirqas to save favourites and check out faster."}
          </p>

          <div
            role="tablist"
            aria-label="Login or register"
            className="flex gap-1.5 rounded-[8px] border p-1.5"
            style={{ borderColor: CARD_LINE, background: CREAM }}
          >
            {tabBtn("login", "Login")}
            {tabBtn("register", "Register")}
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-5">
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

            {tab === "register" && (
              <Field label="Full name" id="name" value={name} onChange={setName} autoComplete="name" />
            )}

            <Field
              label="Email"
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            {tab === "register" && (
              <Field
                label="Mobile number"
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
              />
            )}

            <Field
              label="Password"
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              toggle={{ shown: showPw, onToggle: () => setShowPw((v) => !v) }}
            />

            {tab === "register" && (
              <Field
                label="Confirm password"
                id="confirm"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                toggle={{ shown: showConfirm, onToggle: () => setShowConfirm((v) => !v) }}
              />
            )}

            {tab === "login" ? (
              <div className="flex items-center justify-between text-[13px]" style={{ color: "rgba(17,17,17,0.75)" }}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-[#9C5A2B]"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="underline-offset-4 transition-colors hover:text-[#9C5A2B] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            ) : (
              <label
                className="flex cursor-pointer items-start gap-2 text-[13px]"
                style={{ color: "rgba(17,17,17,0.75)" }}
              >
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#9C5A2B]"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="underline underline-offset-4 hover:text-[#9C5A2B]">
                    Terms &amp; Conditions
                  </Link>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-wait disabled:opacity-70"
              style={{ background: COPPER }}
            >
              {loading ? (
                <>
                  <Spinner /> Please wait
                </>
              ) : tab === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>

            <p className="m-0 text-center text-[13px]" style={{ color: MUTED }}>
              {tab === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchTab(tab === "login" ? "register" : "login")}
                className="font-semibold underline underline-offset-4 transition-colors hover:text-[#7d4720]"
                style={{ color: COPPER }}
              >
                {tab === "login" ? "Create Account" : "Sign In"}
              </button>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}