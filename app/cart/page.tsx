"use client";

// app/cart/page.tsx  (Next.js App Router + Tailwind)
// Visit: http://localhost:3000/cart
// Self-contained page: the cart is saved in localStorage under "mirqas-cart".
// Each cart item is a rounded card in the Shop All style, with the 4 sizes
// (10ml 30ml 50ml 100ml) to switch, quantity buttons and a remove button.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Brand colours (same as Shop All)
const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const CREAM = "#FFF9F3";
const INK = "#111111";
const MUTED = "rgba(17,17,17,0.6)";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const CART_KEY = "mirqas-cart";
const SYNC_EVENT = "mirqas-storage"; // tells other components (navbar count) that storage changed

type SizeOption = {
  ml: number;
  price: number;
  originalPrice?: number;
  soldOut?: boolean;
};

type CartItem = {
  slug: string;
  name: string;
  image?: string;
  notes?: string[];
  sizes: SizeOption[]; // 10ml, 30ml, 50ml, 100ml
  ml: number; // chosen size
  qty: number;
};

// Prices show like Rs. 799.00
const formatPrice = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(list: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch {
    // storage full or blocked: ignore
  }
}

const unitOf = (it: CartItem) =>
  it.sizes.find((s) => s.ml === it.ml) ?? it.sizes[0];

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const TrashIcon = () => (
  <svg {...iconProps} className="h-[18px] w-[18px]">
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
);

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center bg-[#F6EEE0] ${className}`}>
      <svg viewBox="0 0 200 200" className="h-1/2 w-1/2 opacity-70" fill="none" stroke={COPPER}>
        <rect x="70" y="80" width="60" height="90" rx="10" strokeWidth="3" />
        <rect x="88" y="55" width="24" height="25" rx="4" strokeWidth="3" />
        <path d="M80 120h40" strokeWidth="2" />
      </svg>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em]" style={{ color: COPPER }}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cart item card (Shop All style: rounded 14px, copper serif name, sizes in one line)
// ---------------------------------------------------------------------------
function CartCard({
  item,
  onSize,
  onQty,
  onRemove,
}: {
  item: CartItem;
  onSize: (ml: number) => void;
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const current = unitOf(item);
  const detailHref = `/product/${item.slug}`;
  const discounted = current.originalPrice !== undefined && current.originalPrice > current.price;
  const pct = discounted
    ? Math.round(((current.originalPrice! - current.price) / current.originalPrice!) * 100)
    : 0;
  const radioName = `cart-size-${item.slug}-${item.ml}`;

  return (
    <div
      className="flex overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)]"
      style={{ borderColor: CARD_LINE }}
    >
      {/* image */}
      <Link
        href={detailHref}
        aria-label={`View ${item.name}`}
        className="relative block aspect-[4/5] w-[34%] max-w-[190px] shrink-0 overflow-hidden bg-[#F6EEE0]"
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Placeholder label={item.name} className="h-full w-full" />
        )}
      </Link>

      {/* details */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3 sm:p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3
              className="m-0 line-clamp-2 font-medium leading-[1.2]"
              style={{
                fontFamily: serif,
                color: COPPER,
                fontSize: "clamp(1.1rem, 2vw, 1.6rem)",
                fontVariantNumeric: "lining-nums",
                fontFeatureSettings: '"lnum" 1',
              }}
            >
              <Link href={detailHref}>{item.name}</Link>
            </h3>

            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${item.name} from cart`}
              className="shrink-0 transition-transform hover:scale-110"
              style={{ color: COPPER }}
            >
              <TrashIcon />
            </button>
          </div>

          {item.notes && item.notes.length > 0 && (
            <p
              className="m-0 mt-1 flex flex-wrap items-center gap-x-2 text-[11px] font-medium tracking-[0.06em] sm:text-[12px]"
              style={{ color: INK }}
            >
              {item.notes.map((n, i) => (
                <span key={n} className="flex items-center gap-x-2">
                  {i > 0 && <span aria-hidden className="h-[4px] w-[4px] rounded-full" style={{ background: COPPER }} />}
                  {n}
                </span>
              ))}
            </p>
          )}

          {/* Price of one bottle */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {discounted && (
              <span className="text-[12px] line-through sm:text-[13px]" style={{ color: "#9A8F84" }}>
                {formatPrice(current.originalPrice!)}
              </span>
            )}
            <span className="text-[14px] font-semibold sm:text-[17px]" style={{ color: COPPER }}>
              {formatPrice(current.price)}
            </span>
            {discounted && (
              <span
                className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.03em] sm:text-[11px]"
                style={{ background: "#E3F2E6", color: "#1F7A3A" }}
              >
                {pct}% OFF
              </span>
            )}
          </div>

          {/* 4 sizes in one line: change the size right here */}
          <fieldset className="m-0 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-0 p-0 sm:gap-x-4">
            <legend className="sr-only">Choose a size</legend>
            {item.sizes.map((s) => {
              const checked = s.ml === item.ml;
              const disabled = !!s.soldOut;
              return (
                <label
                  key={s.ml}
                  className={`flex items-center gap-1 whitespace-nowrap text-[11px] lowercase sm:text-[12px] ${
                    disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
                  }`}
                  style={{ color: checked ? INK : "#5F554B" }}
                >
                  <input
                    type="radio"
                    name={radioName}
                    value={s.ml}
                    checked={checked}
                    disabled={disabled && !checked}
                    onChange={() => onSize(s.ml)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-[3px] border transition-colors peer-focus-visible:ring-1"
                    style={{ borderColor: checked ? COPPER : COPPER_SOFT }}
                  >
                    {checked && <span className="h-[6px] w-[6px] rounded-[2px]" style={{ background: COPPER }} />}
                  </span>
                  {s.ml}ml
                </label>
              );
            })}
          </fieldset>
        </div>

        {/* quantity + line total */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-[6px] border bg-white" style={{ borderColor: CARD_LINE }}>
            <button
              type="button"
              onClick={() => onQty(item.qty - 1)}
              disabled={item.qty <= 1}
              aria-label="Decrease quantity"
              className="h-9 w-9 text-lg transition-colors hover:text-[#9C5A2B] disabled:opacity-40"
            >
              −
            </button>
            <span className="w-9 text-center text-sm">{item.qty}</span>
            <button
              type="button"
              onClick={() => onQty(item.qty + 1)}
              aria-label="Increase quantity"
              className="h-9 w-9 text-lg transition-colors hover:text-[#9C5A2B]"
            >
              +
            </button>
          </div>

          <p className="m-0 text-[15px] font-semibold sm:text-[17px]" style={{ color: INK }}>
            {formatPrice(current.price * item.qty)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export default function CartPage() {
    const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  // Load the cart and keep it in sync with other tabs / the navbar
  useEffect(() => {
    const load = () => setItems(readCart());
    load();
    setReady(true);
    window.addEventListener("storage", load);
    window.addEventListener(SYNC_EVENT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(SYNC_EVENT, load);
    };
  }, []);

  const changeSize = (index: number, ml: number) => {
    const list = [...items];
    const target = list[index];
    const twin = list.findIndex((c, i) => i !== index && c.slug === target.slug && c.ml === ml);
    if (twin >= 0) {
      // same perfume + size already in the cart: merge the two lines
      list[twin] = { ...list[twin], qty: list[twin].qty + target.qty };
      list.splice(index, 1);
    } else {
      list[index] = { ...target, ml };
    }
    writeCart(list);
  };

  const changeQty = (index: number, qty: number) => {
    const list = [...items];
    list[index] = { ...list[index], qty: Math.max(1, qty) };
    writeCart(list);
  };

  const removeAt = (index: number) => writeCart(items.filter((_, i) => i !== index));

  const count = items.reduce((n, it) => n + it.qty, 0);
  const subtotal = items.reduce((n, it) => n + unitOf(it).price * it.qty, 0);
  const total = subtotal;

  // const handleCheckout = () => {
  //   if (checkingOut) return;
  //   setCheckingOut(true);
  //   // TODO: connect your real checkout here, e.g. router.push("/checkout")
  //   setTimeout(() => setCheckingOut(false), 1200);
  // };
    const handleCheckout = () => {
    if (checkingOut) return;
    setCheckingOut(true);
    router.push("/checkout");
  };

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 lg:px-16"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>

      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h1 className="m-0 text-4xl font-medium sm:text-5xl" style={{ fontFamily: serif, color: COPPER }}>
            Your cart
          </h1>
          <Link
            href="/"
            className="text-sm underline underline-offset-4 transition-colors hover:text-[#9C5A2B]"
          >
            Continue shopping
          </Link>
        </div>

        {/* Empty cart */}
        {ready && items.length === 0 && (
          <div
            className="mx-auto max-w-md rounded-[14px] border bg-white p-10 text-center"
            style={{ borderColor: CARD_LINE }}
          >
            <p className="m-0 text-sm" style={{ color: MUTED }}>
              Your cart is empty.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-[6px] px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
              style={{ background: COPPER }}
            >
              Shop all perfumes
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
            {/* Items */}
            <div className="flex min-w-0 flex-col gap-4">
              {items.map((it, i) => (
                <CartCard
                  key={`${it.slug}-${it.ml}`}
                  item={it}
                  onSize={(ml) => changeSize(i, ml)}
                  onQty={(q) => changeQty(i, q)}
                  onRemove={() => removeAt(i)}
                />
              ))}
            </div>

            {/* Summary box */}
            <aside
              className="rounded-[14px] border bg-white p-5 sm:p-6 lg:sticky lg:top-40"
              style={{ borderColor: CARD_LINE }}
            >
              <h2 className="m-0 text-2xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
                Order summary
              </h2>

              <div className="mt-4 space-y-2 text-sm" style={{ color: MUTED }}>
                <div className="flex justify-between">
                  <span>
                    Subtotal ({count} {count === 1 ? "item" : "items"})
                  </span>
                  <span style={{ color: INK }}>{formatPrice(subtotal)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t pt-4" style={{ borderColor: CARD_LINE }}>
                <span className="text-xl" style={{ fontFamily: serif }}>
                  Estimated total
                </span>
                <span className="text-2xl font-semibold" style={{ color: COPPER }}>
                  {formatPrice(total)}
                </span>
              </div>
              <p className="m-0 mt-1 text-xs" style={{ color: MUTED }}>
                Taxes included. Shipping calculated at checkout.
              </p>

              <label htmlFor="order-note" className="mt-5 block text-sm font-medium">
                Order special instructions
              </label>
              <textarea
                id="order-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-[10px] border bg-white p-3 text-sm outline-none focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE }}
              />

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-[6px] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-wait disabled:opacity-80"
                style={{ background: COPPER }}
              >
                {checkingOut ? (
                  <>
                    <Spinner /> Please wait
                  </>
                ) : (
                  "Buy now"
                )}
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}