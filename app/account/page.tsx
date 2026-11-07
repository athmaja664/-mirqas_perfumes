import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, destroySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

async function logout() {
  "use server";
  await destroySession();
  redirect("/");
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = [
    { label: "Full name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Mobile number", value: user.phone || "Not added" },
  ];

  return (
    <main className="px-5 py-12 md:px-10 md:py-16" style={{ background: IVORY, fontFamily: sans }}>
      <div className="mx-auto max-w-[640px]">
        <h1
          className="m-0 text-center font-medium leading-tight"
          style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          My Account
        </h1>
        <p className="mb-6 mt-3 text-center text-[15px] text-black/60">Your details with Mirqas Perfumes.</p>

        <div className="mb-8 flex items-center justify-center gap-2 rounded-[8px] border border-[#B7DBC0] bg-[#EBF5ED] px-4 py-2.5 text-center text-[13px] text-[#1F7A3A]">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Login saved permanently — you stay signed in automatically without re-entering your password.</span>
        </div>

        <dl className="m-0 border border-black/10 bg-white">
          {rows.map((r) => (
            <div key={r.label} className="border-b border-black/10 px-6 py-5 last:border-0">
              <dt className="text-[11px] uppercase tracking-[0.25em] text-black/50">{r.label}</dt>
              <dd className="m-0 mt-2 text-[17px] text-[#111]">{r.value}</dd>
            </div>
          ))}
        </dl>

        <Link
          href="/account/orders"
          className="mt-8 flex h-[52px] items-center justify-center border border-[#9C5A2B] text-[12px] font-semibold uppercase tracking-[0.2em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white"
        >
          My orders
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/"
            className="flex h-[52px] flex-1 items-center justify-center border border-black/20 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#111] transition-colors hover:bg-black/[0.03]"
          >
            Continue shopping
          </Link>
          <form action={logout} className="flex-1">
            <button
              type="submit"
              className="h-[52px] w-full text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#7d4720]"
              style={{ background: COPPER }}
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}