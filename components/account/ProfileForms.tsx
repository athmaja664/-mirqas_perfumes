"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

type Msg = { type: "ok" | "err"; text: string } | null;

async function send(url: string, body: unknown) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Please check your connection.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? "Something went wrong. Please try again.");
  return json;
}

function Banner({ msg }: { msg: Msg }) {
  if (!msg) return null;
  const ok = msg.type === "ok";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`m-0 border px-4 py-3 text-[14px] ${
        ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"
      }`}
    >
      {msg.text}
    </p>
  );
}

// A password box with an eye button that shows or hides what you typed.
function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  className,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  className: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={`${className} pr-12`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-black/50 hover:text-black/80"
      >
        {visible ? (
          // Eye with a line through it: the password is showing, tap to hide
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c5.2 0 8.6 4.2 9.6 6a11.9 11.9 0 0 1-2.7 3.3" />
            <path d="M6.6 6.7A12 12 0 0 0 2.4 12c1 1.8 4.4 6 9.6 6 1.5 0 2.8-.3 4-.9" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          // Open eye: the password is hidden, tap to show
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.4 12C3.4 10.2 6.8 6 12 6s8.6 4.2 9.6 6c-1 1.8-4.4 6-9.6 6s-8.6-4.2-9.6-6z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function ProfileForms({
  user,
}: {
  user: { name: string; email: string; phone: string; role: string };
}) {
  const router = useRouter();

  // Profile form
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [emailPassword, setEmailPassword] = useState("");
  const [savedEmail, setSavedEmail] = useState(user.email);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<Msg>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== savedEmail;

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const json = await send("/api/profile", {
        name,
        email,
        phone,
        ...(emailChanged ? { currentPassword: emailPassword } : {}),
      });
      setName(json.user.name);
      setEmail(json.user.email);
      setPhone(json.user.phone);
      setSavedEmail(json.user.email);
      setEmailPassword("");
      setProfileMsg({ type: "ok", text: "Your profile was saved." });
      router.refresh();
    } catch (err) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Could not save." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    setSavingPassword(true);
    try {
      const json = await send("/api/profile/password", { currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "ok", text: json.message ?? "Password changed." });
    } catch (err) {
      setPasswordMsg({ type: "err", text: err instanceof Error ? err.message : "Could not change the password." });
    } finally {
      setSavingPassword(false);
    }
  }

  // 16px text on phones stops iPhones from zooming in when a field is tapped.
  const input =
    "w-full border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-black/40 sm:py-2.5 sm:text-[14px]";
  const label = "mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/55";
  const card = "grid max-w-[760px] gap-6 border border-black/10 bg-white p-4 sm:p-6 md:p-8 [&>*]:min-w-0";
  const button =
    "w-full px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7d4720] disabled:opacity-50 sm:w-auto sm:py-3";

  return (
    <div className="grid gap-8">
      <form onSubmit={onSaveProfile} className={card}>
        <h2 className="m-0 text-2xl font-medium sm:text-3xl" style={{ fontFamily: serif, color: COPPER }}>
          Your details
        </h2>

        <Banner msg={profileMsg} />

        <div>
          <label className={label} htmlFor="p-name">Name</label>
          <input id="p-name" className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="p-email">Email</label>
            <input id="p-email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div>
            <label className={label} htmlFor="p-phone">Phone</label>
            <input id="p-phone" type="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="Optional" />
          </div>
        </div>

        {emailChanged && (
          <div>
            <label className={label} htmlFor="p-email-pw">Current password (needed to change your email)</label>
            <PasswordInput
              id="p-email-pw"
              value={emailPassword}
              onChange={setEmailPassword}
              autoComplete="current-password"
              className={input}
            />
          </div>
        )}

        <p className="m-0 text-[13px] text-black/50">
          Role: <span className="uppercase tracking-[0.15em]">{user.role}</span> (this cannot be changed here)
        </p>

        <div>
          <button type="submit" disabled={savingProfile} className={button} style={{ background: COPPER }}>
            {savingProfile ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <form onSubmit={onChangePassword} className={card}>
        <h2 className="m-0 text-2xl font-medium sm:text-3xl" style={{ fontFamily: serif, color: COPPER }}>
          Change password
        </h2>

        <Banner msg={passwordMsg} />

        <div>
          <label className={label} htmlFor="pw-current">Current password</label>
          <PasswordInput
            id="pw-current"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            className={input}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="pw-new">New password</label>
            <PasswordInput
              id="pw-new"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              className={input}
            />
          </div>
          <div>
            <label className={label} htmlFor="pw-confirm">Confirm new password</label>
            <PasswordInput
              id="pw-confirm"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              className={input}
            />
          </div>
        </div>

        <p className="m-0 text-[13px] text-black/50">At least 8 characters, with a letter and a number.</p>

        <div>
          <button type="submit" disabled={savingPassword} className={button} style={{ background: COPPER }}>
            {savingPassword ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}