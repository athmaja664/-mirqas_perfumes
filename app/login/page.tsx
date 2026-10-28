"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { loginRequest, registerRequest } from "@/lib/authApi";

const CREAM = "#FEF8F2";
const PLUM = "#7A4A4A"; // active tab / primary button

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
      <label htmlFor={id} className="mb-2 block text-[12px] uppercase tracking-[0.2em] text-black/55">
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
          className={`h-[60px] w-full border border-black/20 bg-white px-5 text-[17px] text-[#111] outline-none transition-colors placeholder:text-black/35 focus:border-[#111] ${
            toggle ? "pr-14" : ""
          }`}
        />
        {toggle && (
          <button
            type="button"
            onClick={toggle.onToggle}
            aria-label={toggle.shown ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#111] transition-opacity hover:opacity-60"
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

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => switchTab(t)}
      className={`h-14 flex-1 text-[13px] font-semibold uppercase tracking-[0.25em] transition-colors ${
        tab === t ? "text-[#FCF8F0]" : "bg-white text-[#111] hover:bg-black/[0.03]"
      }`}
      style={tab === t ? { background: PLUM } : undefined}
    >
      {label}
    </button>
  );

  return (
    <main className="grid min-h-[calc(100dvh-92px)] grid-cols-1 lg:grid-cols-2" style={{ background: CREAM }}>
      {/* Left: image (hidden on phones to keep the form first) */}
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/4735908/pexels-photo-4735908.jpeg"
          alt="Spraying a Mirqas perfume"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Right: form */}
      <section className="flex items-start justify-center px-5 py-10 sm:px-10 lg:py-14">
        <div className="w-full max-w-[580px]">
          <h1 className="text-center text-[28px] font-light uppercase tracking-[0.2em] text-[#111] sm:text-[32px]">
            {tab === "login" ? "Welcome Back" : "Create Your Account"}
          </h1>
          <p className="mb-8 mt-3 text-center text-[16px] text-black/60">
            {tab === "login"
              ? "Sign in to view your orders and check out faster."
              : "Join Mirqas to save favourites and check out faster."}
          </p>

          <div role="tablist" aria-label="Login or register" className="flex border border-black/20">
            {tabBtn("login", "Login")}
            {tabBtn("register", "Register")}
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-6">
            {error && (
              <div
                role="alert"
                className="border border-red-400 bg-red-50 px-5 py-4 text-[15px] text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="border border-green-500 bg-green-50 px-5 py-4 text-[15px] text-green-800"
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
              <div className="flex items-center justify-between text-[14px] text-black/70">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-[#7A4A4A]"
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </div>
            ) : (
              <label className="flex cursor-pointer items-start gap-2 text-[14px] text-black/70">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#7A4A4A]"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="underline underline-offset-4">
                    Terms &amp; Conditions
                  </Link>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-[60px] w-full text-[13px] font-semibold uppercase tracking-[0.25em] text-[#FCF8F0] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: PLUM }}
            >
              {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
            </button>

            <p className="text-center text-[14px] text-black/65">
              {tab === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchTab(tab === "login" ? "register" : "login")}
                className="font-semibold text-[#111] underline underline-offset-4"
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