"use client";

// app/checkout/page.tsx
// The customer enters the delivery address and places the order (Cash on Delivery).
// The browser sends ONLY slug, size and quantity. The server finds the real price and stock.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CART_KEY, formatPrice, readList, writeList, type CartLine } from "@/lib/shopStorage";

const COPPER = "#9C5A2B";
const CREAM = "#FFF9F3";
const INK = "#111111";
const MUTED = "rgba(17,17,17,0.6)";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

type Form = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  note: string;
};

const EMPTY: Form = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", note: "" };

type Placed = { orderNumber: string; total: number; itemCount: number };

const unitOf = (l: CartLine) => l.sizes.find((s) => s.ml === l.ml) ?? l.sizes[0];

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  optional,
}: {
  label: string;
  name: keyof Form;
  value: string;
  onChange: (name: keyof Form, value: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
  maxLength?: number;
  optional?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {optional && <span className="ml-1 font-normal" style={{ color: MUTED }}>(optional)</span>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        className="mt-1.5 h-11 w-full rounded-[10px] border bg-white px-3 text-sm font-normal outline-none focus:border-[#9C5A2B]"
        style={{ borderColor: CARD_LINE }}
      />
    </label>
  );
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [usingSaved, setUsingSaved] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);
  // One key for this checkout. A double click or a refresh can never make two orders.
  const keyRef = useRef("");

  // Load the browser cart
  useEffect(() => {
    setItems(readList<CartLine>(CART_KEY));
    setReady(true);
  }, []);

  // Ask the server who is signed in. Then load the saved address (if there is one).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
        if (cancelled) return;
        const u = me?.user;
        setSignedIn(!!u);
        if (!u) return;

        // First fill the name and phone from the account
        setForm((f) => ({
          ...f,
          name: f.name || (typeof u.name === "string" ? u.name : ""),
          phone: f.phone || (typeof u.phone === "string" ? u.phone : ""),
        }));

        // Then the saved address replaces them
        const res = await fetch("/api/account/address", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.address) return;
        const a = data.address;
        setForm((f) => ({
          ...f,
          name: a.name ?? f.name,
          phone: a.phone ?? f.phone,
          line1: a.line1 ?? "",
          line2: a.line2 ?? "",
          city: a.city ?? "",
          state: a.state ?? "",
          pincode: a.pincode ?? "",
        }));
        setUsingSaved(true);
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (name: keyof Form, value: string) => setForm((f) => ({ ...f, [name]: value }));

  const count = items.reduce((n, l) => n + l.qty, 0);
  const subtotal = items.reduce((n, l) => n + unitOf(l).price * l.qty, 0);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (placing || items.length === 0) return;
    setError("");
    setPlacing(true);

    if (!keyRef.current) keyRef.current = crypto.randomUUID();

    const shipping = {
      name: form.name,
      phone: form.phone,
      line1: form.line1,
      line2: form.line2,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((l) => ({ slug: l.slug, ml: l.ml, qty: l.qty })),
          shipping,
          note: form.note,
          paymentMethod: "cod",
          idempotencyKey: keyRef.current,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setSignedIn(false);
        setError("Please log in to place your order.");
        return;
      }
      if (!res.ok) {
        setError(data?.message || "Could not place your order. Please try again.");
        return;
      }

      // Success: the order is saved. Now clear the browser cart.
      writeList(CART_KEY, []);
      setItems([]);
      setPlaced(data.order as Placed);

      // Save the address for next time. If this fails, the order is still fine.
      if (saveAddress) {
        try {
          await fetch("/api/account/address", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(shipping),
          });
        } catch {
          // ignore
        }
      }
    } catch {
      setError("Network problem. Please check your internet and try again.");
    } finally {
      setPlacing(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 lg:px-16"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>
      <div className="mx-auto max-w-[1100px]">{children}</div>
    </main>
  );

  // ---------- Success ----------
  if (placed) {
    return shell(
      <div
        className="mx-auto max-w-lg rounded-[14px] border bg-white p-8 text-center sm:p-10"
        style={{ borderColor: CARD_LINE }}
      >
        <h1 className="m-0 text-4xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
          Thank you
        </h1>
        <p className="m-0 mt-3 text-sm" style={{ color: MUTED }}>
          Your order is placed. You pay when it is delivered.
        </p>
        <div className="mt-6 rounded-[10px] bg-[#FFF9F3] p-4 text-sm">
          <p className="m-0" style={{ color: MUTED }}>Order number</p>
          <p className="m-0 mt-1 text-lg font-semibold">{placed.orderNumber}</p>
          <p className="m-0 mt-3" style={{ color: MUTED }}>
            {placed.itemCount} {placed.itemCount === 1 ? "item" : "items"} - Total
          </p>
          <p className="m-0 mt-1 text-xl font-semibold" style={{ color: COPPER }}>
            {formatPrice(placed.total)}
          </p>
        </div>
        <Link
          href="/shopallperfume"
          className="mt-6 inline-block rounded-[6px] px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
          style={{ background: COPPER }}
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  // ---------- Loading ----------
  if (!ready || signedIn === null) {
    return shell(<p className="m-0 py-20 text-center text-sm" style={{ color: MUTED }}>Loading checkout...</p>);
  }

  // ---------- Not logged in ----------
  if (!signedIn) {
    return shell(
      <div
        className="mx-auto max-w-md rounded-[14px] border bg-white p-10 text-center"
        style={{ borderColor: CARD_LINE }}
      >
        <h1 className="m-0 text-3xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
          Please log in
        </h1>
        <p className="m-0 mt-3 text-sm" style={{ color: MUTED }}>
          Log in or create an account to place your order. Your cart will stay saved.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-[6px] px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
          style={{ background: COPPER }}
        >
          Log in
        </Link>
        <p className="m-0 mt-4 text-xs" style={{ color: MUTED }}>
          After you log in, open your cart again and press Buy now.
        </p>
      </div>
    );
  }

  // ---------- Empty cart ----------
  if (items.length === 0) {
    return shell(
      <div
        className="mx-auto max-w-md rounded-[14px] border bg-white p-10 text-center"
        style={{ borderColor: CARD_LINE }}
      >
        <p className="m-0 text-sm" style={{ color: MUTED }}>Your cart is empty.</p>
        <Link
          href="/shopallperfume"
          className="mt-5 inline-block rounded-[6px] px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
          style={{ background: COPPER }}
        >
          Shop all perfumes
        </Link>
      </div>
    );
  }

  // ---------- Checkout form ----------
  return shell(
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 text-4xl font-medium sm:text-5xl" style={{ fontFamily: serif, color: COPPER }}>
          Checkout
        </h1>
        <Link href="/cart" className="text-sm underline underline-offset-4 transition-colors hover:text-[#9C5A2B]">
          Back to cart
        </Link>
      </div>

      <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
        {/* Address */}
        <section className="rounded-[14px] border bg-white p-5 sm:p-6" style={{ borderColor: CARD_LINE }}>
          <h2 className="m-0 text-2xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
            Delivery address
          </h2>
          {usingSaved && (
            <p className="m-0 mt-2 text-sm" style={{ color: MUTED }}>
              We filled in your saved address. You can change it for this order.
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" value={form.name} onChange={set} autoComplete="name" maxLength={100} />
            <Field label="Mobile number" name="phone" value={form.phone} onChange={set} type="tel" inputMode="tel" autoComplete="tel" maxLength={14} />
            <div className="sm:col-span-2">
              <Field label="Address" name="line1" value={form.line1} onChange={set} autoComplete="address-line1" maxLength={200} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Apartment, landmark" name="line2" value={form.line2} onChange={set} autoComplete="address-line2" maxLength={200} optional />
            </div>
            <Field label="City" name="city" value={form.city} onChange={set} autoComplete="address-level2" maxLength={80} />
            <Field label="State" name="state" value={form.state} onChange={set} autoComplete="address-level1" maxLength={80} />
            <Field label="Pincode" name="pincode" value={form.pincode} onChange={set} inputMode="numeric" autoComplete="postal-code" maxLength={6} />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="h-4 w-4 accent-[#9C5A2B]"
            />
            Save this address for my next order
          </label>

          <label className="mt-4 block text-sm font-medium">
            Order note <span className="font-normal" style={{ color: MUTED }}>(optional)</span>
            <textarea
              name="note"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              rows={3}
              maxLength={500}
              className="mt-1.5 w-full rounded-[10px] border bg-white p-3 text-sm font-normal outline-none focus:border-[#9C5A2B]"
              style={{ borderColor: CARD_LINE }}
            />
          </label>

          <div className="mt-6 rounded-[10px] border p-4" style={{ borderColor: CARD_LINE, background: CREAM }}>
            <p className="m-0 text-sm font-medium">Payment</p>
            <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>
              Cash on delivery. You pay when the parcel arrives.
            </p>
          </div>
        </section>

        {/* Summary */}
        <aside
          className="rounded-[14px] border bg-white p-5 sm:p-6 lg:sticky lg:top-40"
          style={{ borderColor: CARD_LINE }}
        >
          <h2 className="m-0 text-2xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
            Order summary
          </h2>

          <ul className="m-0 mt-4 list-none space-y-3 p-0">
            {items.map((l) => (
              <li key={`${l.slug}-${l.ml}`} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span style={{ color: MUTED }}>
                    {l.ml}ml x {l.qty}
                  </span>
                </span>
                <span className="shrink-0">{formatPrice(unitOf(l).price * l.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t pt-4 text-sm" style={{ borderColor: CARD_LINE, color: MUTED }}>
            <div className="flex justify-between">
              <span>Subtotal ({count} {count === 1 ? "item" : "items"})</span>
              <span style={{ color: INK }}>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span style={{ color: INK }}>Free</span>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between border-t pt-4" style={{ borderColor: CARD_LINE }}>
            <span className="text-xl" style={{ fontFamily: serif }}>Total</span>
            <span className="text-2xl font-semibold" style={{ color: COPPER }}>{formatPrice(subtotal)}</span>
          </div>
          <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
            The final price is checked again when you place the order.
          </p>

          {error && (
            <p
              role="alert"
              className="m-0 mt-4 rounded-[10px] border px-3 py-2 text-sm"
              style={{ borderColor: "#E8B7B0", background: "#F8E3E0", color: "#A32A1F" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={placing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-[6px] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-wait disabled:opacity-80"
            style={{ background: COPPER }}
          >
            {placing ? (
              <>
                <Spinner /> Placing order
              </>
            ) : (
              "Place order"
            )}
          </button>
        </aside>
      </form>
    </>
  );
}