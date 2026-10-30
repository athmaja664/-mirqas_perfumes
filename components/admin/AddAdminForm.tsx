"use client";

import { useState, useTransition } from "react";
import { addAdminAction, type AddState } from "@/app/admin/admins/actions";

const COPPER = "#9C5A2B";

const inputClass =
  "w-full border border-black/15 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#9C5A2B]";
const labelClass = "mb-1 block text-[11px] uppercase tracking-[0.15em] text-black/60";

function PasswordField({ id, name, label }: { id: string; name: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={10}
          autoComplete="new-password"
          className={inputClass + " pr-11"}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-black/55 hover:text-black"
        >
          {show ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AddAdminForm() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<AddState>({ ok: false, message: "" });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await addAdminAction(data);
      setState(result);
      // Clear the form only when the admin was added. On an error the boxes keep their text.
      if (result.ok) form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="border border-black/10 bg-white p-5">
      <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.18em]">Add a new admin</h2>
      <p className="mb-4 mt-1 text-[13px] text-black/55">
        This creates a new account. The password needs 10 or more characters, with a letter and a number. Share it
        with the person safely.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="admin-name" className={labelClass}>
            Name
          </label>
          <input id="admin-name" name="name" type="text" required maxLength={80} autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="admin-email" className={labelClass}>
            Email
          </label>
          <input id="admin-email" name="email" type="email" required autoComplete="off" className={inputClass} />
        </div>
        <PasswordField id="admin-password" name="password" label="Starting password" />
        <PasswordField id="admin-confirm" name="confirmPassword" label="Confirm password" />
      </div>

      {state.message && (
        <p
          role="status"
          className="mb-0 mt-4 px-3 py-2 text-[13px]"
          style={
            state.ok
              ? { background: "#E3F2E6", color: "#1F7A3A" }
              : { background: "#F8E3E0", color: "#A32A1F" }
          }
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
        style={{ background: COPPER }}
      >
        {pending ? "Adding..." : "Add admin"}
      </button>
    </form>
  );
}