"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const COPPER = "#9C5A2B";
const input = "h-[52px] w-full border border-black/20 bg-white px-4 text-[15px] outline-none focus:border-[#111]";
const label = "mb-2 block text-[12px] uppercase tracking-[0.2em] text-black/55";
const btn = "h-[52px] w-full text-[13px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#7d4720] disabled:opacity-60 sm:w-[240px]";

type Msg = { type: "ok" | "error"; text: string } | null;

function Banner({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return msg.type === "error" ? (
    <div role="alert" className="border border-red-400 bg-red-50 px-5 py-4 text-[15px] text-red-700">{msg.text}</div>
  ) : (
    <div role="status" className="border border-green-500 bg-green-50 px-5 py-4 text-[15px] text-green-800">{msg.text}</div>
  );
}

async function send(url: string, body: unknown) {
  let res: Response;
  try {
    res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("Cannot reach the server. Please check your connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "Something went wrong.");
}

export default function ProfileForm({ user }: { user: { name: string; email: string; phone: string } }) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [emailPw, setEmailPw] = useState("");
  const [pMsg, setPMsg] = useState<Msg>(null);
  const [pLoading, setPLoading] = useState(false);

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [wMsg, setWMsg] = useState<Msg>(null);
  const [wLoading, setWLoading] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setPMsg(null);
    setPLoading(true);
    try {
      await send("/api/profile", { name, email, phone, currentPassword: emailPw || undefined });
      setEmailPw("");
      setPMsg({ type: "ok", text: "Profile updated." });
      router.refresh();
    } catch (err) {
      setPMsg({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setPLoading(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setWMsg(null);
    setWLoading(true);
    try {
      await send("/api/profile/password", { currentPassword: cur, newPassword: next, confirmPassword: conf });
      setCur(""); setNext(""); setConf("");
      setWMsg({ type: "ok", text: "Password updated. Other devices have been signed out." });
    } catch (err) {
      setWMsg({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setWLoading(false);
    }
  };

  return (
    <div className="flex max-w-[640px] flex-col gap-12">
      <form onSubmit={saveProfile} className="flex flex-col gap-5">
        <h2 className="m-0 text-3xl font-medium" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: COPPER }}>Your details</h2>
        <Banner msg={pMsg} />
        <div>
          <label htmlFor="pname" className={label}>Name</label>
          <input id="pname" value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="pemail" className={label}>Email</label>
          <input id="pemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </div>
        {email.trim().toLowerCase() !== user.email && (
          <div>
            <label htmlFor="pemailpw" className={label}>Current password (needed to change email)</label>
            <input id="pemailpw" type="password" autoComplete="current-password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} className={input} />
          </div>
        )}
        <div>
          <label htmlFor="pphone" className={label}>Mobile number</label>
          <input id="pphone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
        </div>
        <button type="submit" disabled={pLoading} className={btn} style={{ background: COPPER }}>
          {pLoading ? "Saving…" : "Save details"}
        </button>
      </form>

      <form onSubmit={savePassword} className="flex flex-col gap-5">
        <h2 className="m-0 text-3xl font-medium" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: COPPER }}>Change password</h2>
        <Banner msg={wMsg} />
        <div>
          <label htmlFor="cur" className={label}>Current password</label>
          <input id="cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="new" className={label}>New password</label>
          <input id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="conf" className={label}>Confirm new password</label>
          <input id="conf" type="password" autoComplete="new-password" value={conf} onChange={(e) => setConf(e.target.value)} className={input} />
        </div>
        <button type="submit" disabled={wLoading} className={btn} style={{ background: COPPER }}>
          {wLoading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}