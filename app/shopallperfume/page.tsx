"use client";

// app/perfumes/page.tsx  (Next.js App Router + Tailwind)
// Visit: http://localhost:3000/perfumes
// Layout: dark hero (banner + title), then a light cream shop area:
//         filters sidebar, sort + count, product grid, features strip.
// The product card now matches the Best Sellers card on the home page:
// curved corners, 10ml / 30ml / 50ml / 100ml sizes, same fonts, colours and sizes.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

// Hero colours
const GOLD = "#D4A017";
const COPPER = "#B87333";

// Light section colours (same family as the home page)
const CREAM = "#FFF9F3";
const PASTEL = "#F3E7D5";
const INK = "#242424";
const BURGUNDY = "#754747";
const COPPER_L = "#9C5A2B";
const MUTED = "rgba(36,36,36,0.65)";
const LINE = "rgba(36,36,36,0.15)";
const BORDER = "rgba(36,36,36,0.3)";

// Product card colours and fonts (same as the Best Sellers cards on the home page)
const CARD_INK = "#111111";
const CARD_LINE = "#EADFCC";
const CARD_SOFT = "#5F554B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// ---------------------------------------------------------------------------
// SIZES (same as the home page card): 10ml 30ml 50ml 100ml
// ---------------------------------------------------------------------------
type SizeOption = {
  ml: number;
  price: number;
  originalPrice?: number;
  soldOut?: boolean;
};

// If a perfume has no "sizes" yet, its normal price is treated as the 10ml price
// and the other sizes are worked out from it. Add real prices with the "sizes" field when you have them.
const DEFAULT_STEPS = [
  { ml: 10, mult: 1 },
  { ml: 30, mult: 2.25 },
  { ml: 50, mult: 3.4 },
  { ml: 100, mult: 5.6 },
];

function getSizes(p: Perfume): SizeOption[] {
  if (p.sizes && p.sizes.length > 0) return p.sizes;
  return DEFAULT_STEPS.map(({ ml, mult }) => ({
    ml,
    price: Math.round(p.price * mult),
    originalPrice: p.originalPrice ? Math.round(p.originalPrice * mult) : undefined,
  }));
}

// ---------------------------------------------------------------------------
// 1. IMAGE URLS
// ---------------------------------------------------------------------------
const BANNER_IMAGE = "https://images.pexels.com/photos/16239693/pexels-photo-16239693.jpeg";

type Perfume = {
  slug: string;
  name: string;
  size: string;
  // Normal price. It is used as the 10ml price when "sizes" is not given.
  price: number;
  // Optional: the old price. If you add it, the card shows it struck through with a green "% OFF" badge.
  originalPrice?: number;
  // Optional: real prices per size, e.g. [{ ml: 10, price: 799, originalPrice: 1598 }, { ml: 30, ... }, ...]
  sizes?: SizeOption[];
  // Optional: a notes line under the name, e.g. ["Fresh", "Marine", "Powdery"]
  notes?: string[];
  image?: string;
  hoverImage?: string;
  badge?: string;
  soldOut?: boolean;
  featured?: boolean;
  sales: number;
  added: string;
  gender: "Men" | "Women" | "Unisex";
  occasion: string[];
  family: string;
};

// ---------------------------------------------------------------------------
// 2. PRODUCTS
// ---------------------------------------------------------------------------
const perfumes: Perfume[] = [
  { slug: "nadeem", name: "Nadeem", size: "100ML", price: 6290, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", badge: "#1 Best Seller", featured: true, sales: 980, added: "2026-03-10", gender: "Unisex", occasion: ["Evening", "Gifting"], family: "Oud" },
  { slug: "oudh-al-ayal", name: "Oudh Al Ayal", size: "100ML", price: 2490, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", badge: "Best Seller", sales: 860, added: "2026-01-22", gender: "Men", occasion: ["Everyday", "Office"], family: "Oud" },
  { slug: "a-poem", name: "A Poem", size: "100ML", price: 5990, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", featured: true, sales: 540, added: "2026-05-02", gender: "Women", occasion: ["Date Night", "Party"], family: "Floral" },
  { slug: "rouge-vanilla", name: "Rouge Vanilla", size: "100ML", price: 5990, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", badge: "Best Seller", sales: 720, added: "2026-02-14", gender: "Women", occasion: ["Date Night", "Evening"], family: "Gourmand" },
  { slug: "7-moons", name: "7 Moons", size: "100ML", price: 5990, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", sales: 610, added: "2026-06-18", gender: "Unisex", occasion: ["Evening", "Party"], family: "Amber" },
  { slug: "maliki", name: "Maliki", size: "100ML", price: 5990, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", featured: true, sales: 450, added: "2026-08-01", gender: "Men", occasion: ["Casual", "Gifting"], family: "Woody" },
  { slug: "amber-noir", name: "Amber Noir", size: "100ML", price: 3799, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", badge: "New", sales: 300, added: "2026-10-05", gender: "Men", occasion: ["Office", "Everyday"], family: "Amber" },
  { slug: "oud-royale", name: "Oud Royale", size: "100ML", price: 4999, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", soldOut: true, sales: 690, added: "2025-11-30", gender: "Unisex", occasion: ["Gifting", "Party"], family: "Oud" },
  { slug: "golden-musk", name: "Golden Musk", size: "100ML", price: 3299, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", sales: 270, added: "2026-09-12", gender: "Women", occasion: ["Casual", "Everyday"], family: "Musk" },
  { slug: "desert-rose", name: "Desert Rose", size: "100ML", price: 4290, image: "/images/collection-one.jpg", hoverImage: "/images/collection-two.jpg", sales: 380, added: "2026-07-07", gender: "Women", occasion: ["Date Night", "Gifting"], family: "Floral" },
];

// ---------------------------------------------------------------------------
// 3. FILTER GROUPS
// ---------------------------------------------------------------------------
type FilterKey = "gender" | "occasion" | "family";
const FILTER_GROUPS: { key: FilterKey; title: string; options: string[] }[] = [
  { key: "gender", title: "Gender", options: ["Men", "Women", "Unisex"] },
  { key: "occasion", title: "Occasion", options: ["Casual", "Date Night", "Evening", "Everyday", "Gifting", "Office", "Party"] },
  { key: "family", title: "Fragrance Family", options: ["Oud", "Amber", "Woody", "Floral", "Gourmand", "Musk"] },
];

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "relevant", label: "Most relevant" },
  { value: "best", label: "Best selling" },
  { value: "az", label: "Alphabetically, A-Z" },
  { value: "za", label: "Alphabetically, Z-A" },
  { value: "low", label: "Price, low to high" },
  { value: "high", label: "Price, high to low" },
  { value: "old", label: "Date, old to new" },
  { value: "new", label: "Date, new to old" },
];

// ---------------------------------------------------------------------------
// 4. FEATURES SECTION
// ---------------------------------------------------------------------------
const FEATURES = [
  { title: "100% Authentic", text: "Every bottle is genuine and sealed.", icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z M8.5 12l2.5 2.5 4.5-5" },
  { title: "Long Lasting", text: "High oil concentration that stays all day.", icon: "M12 7v5l3 2 M12 3a9 9 0 100 18 9 9 0 000-18z" },
  { title: "Luxury Gift Packaging", text: "Presented in a premium gold box.", icon: "M4 10h16v10H4z M3 7h18v3H3z M12 7v13 M12 7c-2-4-6-3-5 0 M12 7c2-4 6-3 5 0" },
];

const PAGE_SIZE = 6;
// Prices show like Rs. 799.00 (same as the home page cards)
const formatPrice = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 ${className}`}>
      <svg viewBox="0 0 200 200" className="h-1/2 w-1/2 opacity-80" fill="none">
        <defs>
          <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor={COPPER} />
          </linearGradient>
        </defs>
        <rect x="70" y="80" width="60" height="90" rx="10" stroke="url(#pg)" strokeWidth="3" />
        <rect x="88" y="55" width="24" height="25" rx="4" stroke="url(#pg)" strokeWidth="3" />
        <path d="M80 120h40" stroke="url(#pg)" strokeWidth="2" />
      </svg>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em]" style={{ color: COPPER }}>
        {label}
      </span>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ---- Card icons (same as the home page card) ----
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

// Round selector (instead of the square checkbox). Used by the filters.
function CircleOption({
  type,
  name,
  checked,
  onChange,
  label,
  className = "",
  disabled,
  accent = BURGUNDY,
}: {
  type: "checkbox" | "radio";
  name?: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
  accent?: string;
}) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}>
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#754747]/70 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#FFF9F3]"
        style={{ borderColor: checked ? accent : "rgba(36,36,36,0.45)" }}
      >
        <span
          className={`h-2 w-2 rounded-full transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`}
          style={{ background: accent }}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}

// Custom sort dropdown so the highlight colour matches the theme
function SortDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const current = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div ref={ref} className="relative w-52">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between border bg-white px-4 py-2.5 text-left normal-case tracking-[0.05em] outline-none focus-visible:border-[#754747]"
        style={{ borderColor: open ? BURGUNDY : BORDER, color: INK }}
      >
        <span>{current}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-30 mt-1 w-full overflow-hidden border bg-white shadow-[0_10px_30px_rgba(36,36,36,0.15)]"
          style={{ borderColor: BORDER }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-left normal-case tracking-[0.05em] transition-colors ${
                    active ? "bg-[#754747] text-[#FFF9F3]" : "text-[#242424] hover:bg-[#F3E7D5]"
                  }`}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRODUCT CARD: same design as the Best Sellers card on the home page
// ---------------------------------------------------------------------------
function ProductCard({
  p,
  wished,
  onToggleWish,
}: {
  p: Perfume;
  wished: boolean;
  onToggleWish: (slug: string) => void;
}) {
  const sizes = getSizes(p);
  const firstAvailable = sizes.find((s) => !s.soldOut) ?? sizes[0];
  const [selectedMl, setSelectedMl] = useState(firstAvailable.ml);
  const [added, setAdded] = useState(false);

  // Mobile / touch: show the second image while the card is in the middle of the screen
  const [inView, setInView] = useState(false);
  const imgBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!p.hoverImage) return;
    const el = imgBoxRef.current;
    if (!el) return;

    // Only on devices that cannot hover (phones / tablets). Desktop keeps the normal hover.
    const noHover = window.matchMedia("(hover: none)").matches;
    if (!noHover) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // Only the horizontal band across the middle of the screen counts
      { rootMargin: "-35% 0px -35% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [p.hoverImage]);

  // "Added" confirmation goes back to normal after 1.6 seconds
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  const current = sizes.find((s) => s.ml === selectedMl) ?? firstAvailable;
  const unavailable = !!p.soldOut || !!current.soldOut;

  const discounted = current.originalPrice !== undefined && current.originalPrice > current.price;
  const pct = discounted
    ? Math.round(((current.originalPrice! - current.price) / current.originalPrice!) * 100)
    : 0;

  const detailHref = `/perfumes/${p.slug}`;
  const buyHref = `${detailHref}?size=${current.ml}ml`;

  const addToCart = () => {
    if (unavailable) return;
    // TODO: connect your cart here, e.g. addItem({ slug: p.slug, ml: current.ml, price: current.price })
    setAdded(true);
  };

  const radioName = `size-${p.slug}`;

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)]"
      style={{ borderColor: CARD_LINE, fontFamily: sans }}
    >
      {/* image + wishlist heart. Soft curved corners. */}
      <div
        ref={imgBoxRef}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px]"
        style={{ background: "#F6EEE0" }}
      >
        <Link
          href={detailHref}
          aria-label={`View ${p.name}`}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#9C5A2B]"
        >
          {p.image ? (
            <>
              {/* main image (fades out on hover / when scrolled into view on mobile) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt={p.name}
                className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
                  p.hoverImage
                    ? `group-hover:opacity-0 ${inView ? "opacity-0" : "opacity-100"}`
                    : "group-hover:scale-105"
                }`}
              />
              {/* second image (fades in on hover / when scrolled into view on mobile) */}
              {p.hoverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.hoverImage}
                  alt={`${p.name} alternate view`}
                  className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-100 ${
                    inView ? "scale-105 opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
          ) : (
            <Placeholder label={p.name} className="h-full w-full" />
          )}
        </Link>

        {p.badge && (
          <span
            className="pointer-events-none absolute left-0 top-2 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-white md:top-3 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.12em]"
            style={{ background: COPPER_L }}
          >
            {p.badge}
          </span>
        )}
        {p.soldOut && (
          <span
            className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[9px] uppercase tracking-[0.15em] md:text-[10px]"
            style={{ color: COPPER_L }}
          >
            Sold out
          </span>
        )}

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => onToggleWish(p.slug)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-105 md:right-3 md:top-3 md:h-9 md:w-9"
          style={{ color: wished ? "#C0392B" : "#555555" }}
        >
          <HeartIcon filled={wished} />
        </button>
      </div>

      {/* text + buttons */}
      <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-3 text-center md:px-3 md:pb-5 md:pt-4">
        {/* name (serif, copper) */}
        <h3
          className="m-0 line-clamp-2 font-medium leading-[1.2]"
          style={{
            fontFamily: serif,
            color: COPPER_L,
            fontSize: "clamp(1rem, 1.7vw, 1.5rem)",
            fontVariantNumeric: "lining-nums",
            fontFeatureSettings: '"lnum" 1',
          }}
        >
          <Link href={detailHref}>{p.name}</Link>
        </h3>

        {/* Notes: Fresh • Marine • Powdery (only if the product has notes) */}
        {p.notes && p.notes.length > 0 && (
          <p
            className="m-0 mt-1 flex flex-wrap items-center justify-center gap-x-1 text-[9px] font-medium tracking-[0.06em] md:mt-1.5 md:gap-x-2 md:text-[12px]"
            style={{ color: CARD_INK, fontFamily: sans }}
          >
            {p.notes.map((n, i) => (
              <span key={n} className="flex items-center gap-x-1 md:gap-x-2">
                {i > 0 && (
                  <span aria-hidden className="h-[3px] w-[3px] rounded-full md:h-[4px] md:w-[4px]" style={{ background: COPPER_L }} />
                )}
                {n}
              </span>
            ))}
          </p>
        )}

        {/* Price */}
        <div
          className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 md:mt-3 md:gap-x-2"
          style={{ fontFamily: sans }}
        >
          {discounted && (
            <span className="text-[9px] line-through md:text-[13px]" style={{ color: "#9A8F84" }}>
              {formatPrice(current.originalPrice!)}
            </span>
          )}
          <span className="text-[11px] font-semibold md:text-[17px]" style={{ color: COPPER_L }}>
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
            const disabled = !!p.soldOut || !!s.soldOut;
            return (
              <label
                key={s.ml}
                className={`flex items-center gap-[3px] whitespace-nowrap text-[9px] lowercase md:gap-1 md:text-[10px] lg:text-[12px] ${
                  disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
                }`}
                style={{ color: checked ? CARD_INK : CARD_SOFT, fontFamily: sans }}
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
                  className="flex h-[8px] w-[8px] shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-1 md:h-[11px] md:w-[11px]"
                  style={{ borderColor: checked ? COPPER_L : COPPER_SOFT }}
                >
                  {checked && <span className="h-[4px] w-[4px] rounded-full md:h-[6px] md:w-[6px]" style={{ background: COPPER_L }} />}
                </span>
                {s.ml}ml
              </label>
            );
          })}
        </fieldset>

        {/* Buttons (pushed to the bottom so every card lines up) */}
        <div className="mt-auto flex w-full flex-col items-stretch gap-1.5 pt-3 md:w-[90%] md:gap-2 md:pt-4">
          <button
            type="button"
            onClick={addToCart}
            disabled={unavailable}
            aria-live="polite"
            className={`flex items-center justify-center gap-1.5 rounded-[6px] border px-1 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 md:py-2.5 md:text-[12px] md:tracking-[0.12em] ${
              unavailable
                ? "cursor-not-allowed border-[#D9CDBA] bg-white text-[#B9AD9A]"
                : "border-[#9C5A2B] bg-white text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white"
            }`}
            style={{ fontFamily: sans }}
          >
            {unavailable ? "Sold out" : added ? "Added ✓" : "Add to cart"}
            {!added && !unavailable && <CartIcon />}
          </button>

          {unavailable ? (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-[6px] px-1 py-1.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-white opacity-45 md:py-2.5 md:text-[12px] md:tracking-[0.12em]"
              style={{ background: COPPER_L, fontFamily: sans }}
            >
              Buy now
            </button>
          ) : (
            <Link
              href={buyHref}
              className="rounded-[6px] px-1 py-1.5 text-center text-[8px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#7d4720] md:py-2.5 md:text-[12px] md:tracking-[0.12em]"
              style={{ background: COPPER_L, fontFamily: sans }}
            >
              Buy now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopAllPerfumesPage() {
  const [sort, setSort] = useState("featured");
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>({ gender: [], occasion: [], family: [] });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ gender: true, occasion: true, family: true, price: true });
  const [mobileFilters, setMobileFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const toggleWish = (slug: string) =>
    setWishlist((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug]));

  const toggleOption = (key: FilterKey, value: string) => {
    setSelected((s) => ({ ...s, [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value] }));
    setVisible(PAGE_SIZE);
  };

  const activeCount =
    selected.gender.length + selected.occasion.length + selected.family.length +
    (inStockOnly ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

  const clearAll = () => {
    setSelected({ gender: [], occasion: [], family: [] });
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setVisible(PAGE_SIZE);
  };

  const filtered = useMemo(() => {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;
    const list = perfumes.filter((p) => {
      if (inStockOnly && p.soldOut) return false;
      if (p.price < min || p.price > max) return false;
      if (selected.gender.length && !selected.gender.includes(p.gender)) return false;
      if (selected.family.length && !selected.family.includes(p.family)) return false;
      if (selected.occasion.length && !p.occasion.some((o) => selected.occasion.includes(o))) return false;
      return true;
    });
    switch (sort) {
      case "featured": list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured)); break;
      case "best": list.sort((a, b) => b.sales - a.sales); break;
      case "az": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "za": list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "low": list.sort((a, b) => a.price - b.price); break;
      case "high": list.sort((a, b) => b.price - a.price); break;
      case "old": list.sort((a, b) => a.added.localeCompare(b.added)); break;
      case "new": list.sort((a, b) => b.added.localeCompare(a.added)); break;
    }
    return list;
  }, [sort, selected, inStockOnly, minPrice, maxPrice]);

  const shown = filtered.slice(0, visible);

  const priceInput =
    "w-full border bg-white px-3 py-2 text-sm text-[#242424] outline-none placeholder:text-[#242424]/40 focus:border-[#754747]";

  const FiltersPanel = (
    <div>
      {activeCount > 0 && (
        <button onClick={clearAll} className="mb-6 text-xs uppercase tracking-[0.3em] underline" style={{ color: BURGUNDY }}>
          Clear all ({activeCount})
        </button>
      )}

      {FILTER_GROUPS.map((g) => (
        <div key={g.key} className="border-b py-5" style={{ borderColor: LINE }}>
          <button onClick={() => setOpenGroups((o) => ({ ...o, [g.key]: !o[g.key] }))} className="flex w-full items-center justify-between text-left uppercase tracking-[0.25em]">
            <span>{g.title}</span>
            <Chevron open={!!openGroups[g.key]} />
          </button>
          {openGroups[g.key] && (
            <ul className="mt-4 space-y-3">
              {g.options.map((opt) => (
                <li key={opt}>
                  <CircleOption
                    type="checkbox"
                    checked={selected[g.key].includes(opt)}
                    onChange={() => toggleOption(g.key, opt)}
                    label={opt}
                    className="text-sm hover:text-[#242424]"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className="border-b py-5" style={{ borderColor: LINE }}>
        <button onClick={() => setOpenGroups((o) => ({ ...o, price: !o.price }))} className="flex w-full items-center justify-between text-left uppercase tracking-[0.25em]">
          <span>Price</span>
          <Chevron open={!!openGroups.price} />
        </button>
        {openGroups.price && (
          <div className="mt-4 flex items-center gap-3">
            <input type="number" min={0} placeholder="₹ Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setVisible(PAGE_SIZE); }} className={priceInput} style={{ borderColor: BORDER }} />
            <span style={{ color: MUTED }}>-</span>
            <input type="number" min={0} placeholder="₹ Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setVisible(PAGE_SIZE); }} className={priceInput} style={{ borderColor: BORDER }} />
          </div>
        )}
      </div>

      <div className="py-5">
        <CircleOption
          type="checkbox"
          checked={inStockOnly}
          onChange={() => { setInStockOnly((v) => !v); setVisible(PAGE_SIZE); }}
          label="In stock only"
          className="uppercase tracking-[0.25em]"
        />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen" style={{ background: CREAM, color: INK }}>
      {/* ---------- HERO (dark, original) ---------- */}
      <div className="bg-black text-[#D4A017]">
        {/* BANNER */}
        <section className="relative h-48 w-full overflow-hidden bg-black md:h-64">
          {BANNER_IMAGE ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={BANNER_IMAGE} alt="Perfumes" className="h-full w-full object-cover opacity-60" />
          ) : (
            <Placeholder label="Banner image" className="h-full w-full opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
        </section>

        {/* TITLE */}
        <section className="px-6 pb-10 pt-10 text-center">
          <nav className="mb-5 text-xs uppercase tracking-[0.3em]" style={{ color: COPPER }}>
            <a href="/" className="hover:text-[#D4A017]">Home</a>
            <span className="mx-3">/</span>
            <span>Shop All Perfumes</span>
          </nav>
          <h1 className="text-4xl font-light uppercase tracking-[0.3em] md:text-5xl">Shop All Perfumes</h1>
          <div className="mx-auto mt-6 h-px w-24" style={{ background: COPPER }} />
        </section>
      </div>

      {/* ---------- LIGHT SHOP AREA ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-10">
        {/* top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: LINE }}>
          <button onClick={() => setMobileFilters(true)} className="flex items-center gap-3 uppercase tracking-[0.3em] lg:pointer-events-none">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7h18M3 12h18M3 17h18" />
              <circle cx="8" cy="7" r="2" fill={CREAM} />
              <circle cx="16" cy="12" r="2" fill={CREAM} />
              <circle cx="10" cy="17" r="2" fill={CREAM} />
            </svg>
            Filters{activeCount > 0 && ` (${activeCount})`}
          </button>

          <div className="flex flex-wrap items-center gap-5 text-xs uppercase tracking-[0.2em]">
            <span style={{ color: MUTED }}>Showing - {shown.length} out of {filtered.length} products</span>
            <SortDropdown value={sort} onChange={setSort} options={SORTS} />
          </div>
        </div>

        <div className="mt-8 flex gap-10">
          {/* sidebar (desktop) */}
          <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-64 shrink-0 self-start overflow-y-auto pr-2 [scrollbar-color:#c9b8a3_transparent] [scrollbar-width:thin] lg:block">
            {FiltersPanel}
          </aside>

          {/* grid: 2 per row on phones, 3 per row on large screens */}
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-2 gap-2.5 md:gap-4 lg:gap-6 xl:grid-cols-3">
              {shown.map((p) => (
                <ProductCard key={p.slug} p={p} wished={wishlist.includes(p.slug)} onToggleWish={toggleWish} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="uppercase tracking-[0.3em]" style={{ color: BURGUNDY }}>No products found</p>
                <button onClick={clearAll} className="mt-6 border px-6 py-2 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-[#754747] hover:text-[#FFF9F3]" style={{ borderColor: BURGUNDY, color: BURGUNDY }}>
                  Clear filters
                </button>
              </div>
            )}

            {visible < filtered.length && (
              <div className="mt-12 text-center">
                <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="border px-10 py-3 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-[#754747] hover:text-[#FFF9F3]" style={{ borderColor: BURGUNDY, color: BURGUNDY }}>
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y py-16" style={{ borderColor: LINE, background: PASTEL }}>
        <div className="mx-auto grid max-w-4xl gap-10 px-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              <svg viewBox="0 0 24 24" className="mx-auto h-9 w-9" fill="none" stroke={BURGUNDY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.icon} />
              </svg>
              <h3 className="mt-4 text-sm uppercase tracking-[0.3em]" style={{ color: INK }}>{f.title}</h3>
              <p className="mt-2 text-sm" style={{ color: MUTED }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto border-r p-6" style={{ borderColor: LINE, background: CREAM, color: INK }}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg uppercase tracking-[0.3em]">Filters</h2>
              <button onClick={() => setMobileFilters(false)} aria-label="Close filters" className="text-2xl leading-none">×</button>
            </div>
            {FiltersPanel}
            <button onClick={() => setMobileFilters(false)} className="mt-6 w-full border py-3 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-[#754747] hover:text-[#FFF9F3]" style={{ borderColor: BURGUNDY, color: BURGUNDY }}>
              Show {filtered.length} products
            </button>
          </div>
        </div>
      )}
    </main>
  );
}