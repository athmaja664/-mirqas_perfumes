"use client";

// app/wishlist/page.tsx  (Next.js App Router + Tailwind)
// Visit: http://localhost:3000/wishlist
// Self-contained page: the wishlist is saved in localStorage under "mirqas-wishlist".
// "Add to cart" here saves into localStorage under "mirqas-cart" (the Cart page reads it).
// Cards use the same design as the Shop All product card.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Brand colours (same as Shop All)
const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const CREAM = "#FFF9F3";
const INK = "#111111";
const MUTED = "rgba(17,17,17,0.6)";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const WISHLIST_KEY = "mirqas-wishlist";
const CART_KEY = "mirqas-cart";
const SYNC_EVENT = "mirqas-storage"; // tells other components (navbar count) that storage changed

// ---------------------------------------------------------------------------
// Types (the Shop All card saves items in this shape)
// ---------------------------------------------------------------------------
type SizeOption = {
  ml: number;
  price: number;
  originalPrice?: number;
  soldOut?: boolean;
};

type WishItem = {
  slug: string;
  name: string;
  image?: string;
  hoverImage?: string;
  notes?: string[];
  sizes: SizeOption[]; // 10ml, 30ml, 50ml, 100ml
  soldOut?: boolean;
};

type CartItem = {
  slug: string;
  name: string;
  image?: string;
  notes?: string[];
  sizes: SizeOption[];
  ml: number; // chosen size
  qty: number;
};

// Prices show like Rs. 799.00
const formatPrice = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch {
    // storage full or blocked: ignore
  }
}

function addToCartStorage(item: WishItem, ml: number) {
  const cart = readList<CartItem>(CART_KEY);
  const i = cart.findIndex((c) => c.slug === item.slug && c.ml === ml);
  if (i >= 0) {
    cart[i] = { ...cart[i], qty: cart[i].qty + 1 };
  } else {
    cart.push({
      slug: item.slug,
      name: item.name,
      image: item.image,
      notes: item.notes,
      sizes: item.sizes,
      ml,
      qty: 1,
    });
  }
  writeList(CART_KEY, cart);
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg {...iconProps} className="h-[14px] w-[14px] md:h-[18px] md:w-[18px]" fill={filled ? "currentColor" : "none"}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const CartIcon = () => (
  <svg {...iconProps} className="h-[11px] w-[11px] md:h-[15px] md:w-[15px]">
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const Spinner = () => (
  <svg className="h-3 w-3 animate-spin md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
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
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em]" style={{ color: COPPER }}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wishlist card: same design as the Shop All product card
// ---------------------------------------------------------------------------
function WishCard({ item, onRemove }: { item: WishItem; onRemove: (slug: string) => void }) {
  const router = useRouter();
  const sizes = item.sizes;
  const firstAvailable = sizes.find((s) => !s.soldOut) ?? sizes[0];
  const [selectedMl, setSelectedMl] = useState(firstAvailable.ml);
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "going">("idle");

  const current = sizes.find((s) => s.ml === selectedMl) ?? firstAvailable;
  const unavailable = !!item.soldOut || !!current.soldOut;
  const detailHref = `/product/${item.slug}`;

  const discounted = current.originalPrice !== undefined && current.originalPrice > current.price;
  const pct = discounted
    ? Math.round(((current.originalPrice! - current.price) / current.originalPrice!) * 100)
    : 0;

  const handleAdd = () => {
    if (unavailable || status !== "idle") return;
    setStatus("adding");
    setTimeout(() => {
      addToCartStorage(item, current.ml);
      setStatus("added");
      setTimeout(() => setStatus("idle"), 1500);
    }, 700);
  };

  const handleBuyNow = () => {
    if (unavailable || status !== "idle") return;
    setStatus("going");
    setTimeout(() => {
      addToCartStorage(item, current.ml);
      router.push("/cart");
    }, 700);
  };

  const busy = status === "adding" || status === "going";
  const radioName = `wish-size-${item.slug}`;

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)]"
      style={{ borderColor: CARD_LINE, fontFamily: sans }}
    >
      {/* image + heart (tap the filled heart to remove) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px] bg-[#F6EEE0]">
        <Link href={detailHref} aria-label={`View ${item.name}`} className="block h-full w-full">
          {item.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
                  item.hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"
                }`}
              />
              {item.hoverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.hoverImage}
                  alt={`${item.name} alternate view`}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <Placeholder label={item.name} className="h-full w-full" />
          )}
        </Link>

        {item.soldOut && (
          <span
            className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[9px] uppercase tracking-[0.15em] md:text-[10px]"
            style={{ color: COPPER }}
          >
            Sold out
          </span>
        )}

        <button
          type="button"
          onClick={() => onRemove(item.slug)}
          aria-label={`Remove ${item.name} from wishlist`}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-105 md:right-3 md:top-3 md:h-9 md:w-9"
          style={{ color: "#C0392B" }}
        >
          <HeartIcon filled />
        </button>
      </div>

      {/* text + buttons */}
      <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-3 text-center md:px-3 md:pb-5 md:pt-4">
        <h3
          className="m-0 line-clamp-2 font-medium leading-[1.2]"
          style={{
            fontFamily: serif,
            color: COPPER,
            fontSize: "clamp(1rem, 1.7vw, 1.5rem)",
            fontVariantNumeric: "lining-nums",
            fontFeatureSettings: '"lnum" 1',
          }}
        >
          <Link href={detailHref}>{item.name}</Link>
        </h3>

        {item.notes && item.notes.length > 0 && (
          <p
            className="m-0 mt-1 flex flex-wrap items-center justify-center gap-x-1 text-[9px] font-medium tracking-[0.06em] md:mt-1.5 md:gap-x-2 md:text-[12px]"
            style={{ color: INK }}
          >
            {item.notes.map((n, i) => (
              <span key={n} className="flex items-center gap-x-1 md:gap-x-2">
                {i > 0 && (
                  <span aria-hidden className="h-[3px] w-[3px] rounded-full md:h-[4px] md:w-[4px]" style={{ background: COPPER }} />
                )}
                {n}
              </span>
            ))}
          </p>
        )}

        {/* Price */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 md:mt-3 md:gap-x-2">
          {discounted && (
            <span className="text-[9px] line-through md:text-[13px]" style={{ color: "#9A8F84" }}>
              {formatPrice(current.originalPrice!)}
            </span>
          )}
          <span className="text-[11px] font-semibold md:text-[17px]" style={{ color: COPPER }}>
            {formatPrice(current.price)}
          </span>
          {discounted && (
            <span
              className="rounded-[4px] px-1 py-px text-[8px] font-bold tracking-[0.03em] md:px-1.5 md:py-0.5 md:text-[11px]"
              style={{ background: "#E3F2E6", color: "#1F7A3A" }}
            >
              {pct}% OFF
            </span>
          )}
        </div>

        {/* Sizes in ONE line: 10ml 30ml 50ml 100ml */}
        <fieldset className="m-0 mt-2 flex w-full flex-nowrap items-center justify-center gap-x-1.5 border-0 p-0 md:mt-3 md:gap-x-2.5 lg:gap-x-3">
          <legend className="sr-only">Choose a size</legend>
          {sizes.map((s) => {
            const checked = s.ml === selectedMl;
            const disabled = !!item.soldOut || !!s.soldOut;
            return (
              <label
                key={s.ml}
                className={`flex items-center gap-[3px] whitespace-nowrap text-[9px] lowercase md:gap-1 md:text-[10px] lg:text-[12px] ${
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
                  onChange={() => setSelectedMl(s.ml)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="flex h-[8px] w-[8px] shrink-0 items-center justify-center rounded-[2px] border transition-colors peer-focus-visible:ring-1 md:h-[11px] md:w-[11px] md:rounded-[3px]"
                  style={{ borderColor: checked ? COPPER : COPPER_SOFT }}
                >
                  {checked && (
                    <span
                      className="h-[4px] w-[4px] rounded-[1px] md:h-[6px] md:w-[6px] md:rounded-[2px]"
                      style={{ background: COPPER }}
                    />
                  )}
                </span>
                {s.ml}ml
              </label>
            );
          })}
        </fieldset>

        {/* Buttons */}
        <div className="mt-auto flex w-full flex-col items-stretch gap-1.5 pt-3 md:w-[90%] md:gap-2 md:pt-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={unavailable || busy}
            aria-live="polite"
            className={`flex items-center justify-center gap-1.5 rounded-[6px] border px-1 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 md:py-2.5 md:text-[12px] md:tracking-[0.12em] ${
              unavailable
                ? "cursor-not-allowed border-[#D9CDBA] bg-white text-[#B9AD9A]"
                : "border-[#9C5A2B] bg-white text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white disabled:cursor-wait"
            }`}
          >
            {unavailable ? (
              "Sold out"
            ) : status === "adding" ? (
              <>
                <Spinner /> Adding
              </>
            ) : status === "added" ? (
              "Added ✓"
            ) : (
              <>
                Add to cart <CartIcon />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={unavailable || busy}
            className="flex items-center justify-center gap-1.5 rounded-[6px] px-1 py-1.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-not-allowed disabled:opacity-60 md:py-2.5 md:text-[12px] md:tracking-[0.12em]"
            style={{ background: COPPER }}
          >
            {status === "going" ? (
              <>
                <Spinner /> Please wait
              </>
            ) : (
              "Buy now"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export default function WishlistPage() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [ready, setReady] = useState(false);

  // Load the wishlist and keep it in sync with other tabs / the navbar
  useEffect(() => {
    const load = () => setItems(readList<WishItem>(WISHLIST_KEY));
    load();
    setReady(true);
    window.addEventListener("storage", load);
    window.addEventListener(SYNC_EVENT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(SYNC_EVENT, load);
    };
  }, []);

  const remove = (slug: string) => writeList(WISHLIST_KEY, items.filter((i) => i.slug !== slug));

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 lg:px-16"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>

      <div className="mx-auto max-w-[1400px]">
        <div className="mb-10 text-center">
          <h1
            className="m-0 text-4xl font-medium sm:text-5xl"
            style={{ fontFamily: serif, color: COPPER }}
          >
            My Wishlist
          </h1>
          {ready && (
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </p>
          )}
        </div>

        {ready && items.length === 0 && (
          <div
            className="mx-auto max-w-md rounded-[14px] border bg-white p-10 text-center"
            style={{ borderColor: CARD_LINE }}
          >
            <p className="m-0 text-sm" style={{ color: MUTED }}>
              Your wishlist is empty. Tap the heart on any perfume to save it here.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-block rounded-[6px] px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
              style={{ background: COPPER }}
            >
              Shop all perfumes
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:gap-6 xl:grid-cols-4">
            {items.map((item) => (
              <WishCard key={item.slug} item={item} onRemove={remove} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}