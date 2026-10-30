"use client";

// Shop All Perfumes. Products come from MongoDB through /api/products.
// Card media: the first image is the thumbnail. On hover (laptop) or when the card is
// scrolled into the middle of the screen (phone) the card plays the admin's video,
// or changes to the admin's hover image, or (if neither was chosen) to the 2nd image.

import Link from "next/link";
import { ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COLLECTION_SECTIONS } from "@/lib/sections";
import { productHref } from "@/lib/productHref";

// Brand colours (same as the other shop pages)
const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const CREAM = "#FFF9F3";
const PASTEL = "#F3E7D5";
const INK = "#111111";
const MUTED = "rgba(17,17,17,0.6)";
const LINE = "rgba(156,90,43,0.25)";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// ---- Banner content (change these) ----
const PAGE_LABEL = "SHOP ALL";
const ANCHOR_ID = "all-perfumes";
const TAGLINE = "Discover your signature scent";
const HEADING_TOP = "Make every moment";
const HEADING_BOTTOM = "Special";
const BANNER_IMAGE = "/images/shopallhero1.png";

// How many products show first, and how many more each "Load more" click adds
const PAGE_SIZE = 6;

// Top of the price slider, in rupees. Raise it if you add a more expensive perfume.
const PRICE_MAX = 20000;

// A link ending in .mp4 or .webm is a video. Any other link is an image.
const isVideoUrl = (url: string) => /\.(mp4|webm)(\?.*)?$/i.test(url);

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type SizeOption = {
  ml: number;
  price: number;
  originalPrice?: number;
  soldOut?: boolean;
};

type Perfume = {
  slug: string;
  name: string;
  size: string;
  price: number; // rupees
  originalPrice?: number; // rupees
  sizes?: SizeOption[];
  notes?: string[];
  image?: string; // thumbnail
  hoverImage?: string; // shown on hover / scroll (instead of a video)
  hoverVideo?: string; // plays on hover / scroll
  badge?: string;
  soldOut?: boolean;
  featured?: boolean;
  sales: number;
  added: string;
  gender: "Men" | "Women" | "Unisex";
  occasion: string[];
  family: string;
};

// What /api/products sends (prices are in paise)
type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  video?: string; // the admin's "card hover media": one video OR one image
  badge: string;
  isFeatured: boolean;
  sales: number;
  inStock: boolean;
  createdAt: string;
  gender: "Men" | "Women" | "Unisex";
  occasion: string[];
  family: string;
  notes: string[];
};

// If a perfume has no "sizes" yet, its normal price is treated as the 10ml price
// and the other sizes are worked out from it.
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
// FILTER GROUPS
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
// FEATURES SECTION
// ---------------------------------------------------------------------------
const FEATURES = [
  { title: "100% Authentic", text: "Every bottle is genuine and sealed.", icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z M8.5 12l2.5 2.5 4.5-5" },
  { title: "Long Lasting", text: "High oil concentration that stays all day.", icon: "M12 7v5l3 2 M12 3a9 9 0 100 18 9 9 0 000-18z" },
  { title: "Luxury Gift Packaging", text: "Presented in a premium gold box.", icon: "M4 10h16v10H4z M3 7h18v3H3z M12 7v13 M12 7c-2-4-6-3-5 0 M12 7c2-4 6-3 5 0" },
];

// Prices show like Rs. 799.00
const formatPrice = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className={`fill-none stroke-current transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ---- Card icons ----
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

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-[#9C5A2B]/25 py-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mq-serif flex w-full items-center justify-between text-left text-xl font-medium text-[#9C5A2B]"
      >
        {title}
        <Chevron open={open} />
      </button>

      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

// Round selector instead of the square checkbox (used by the filters)
function CircleOption({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-[#111111]/80 hover:text-[#111111]">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#9C5A2B] peer-focus-visible:ring-offset-2 ${
          checked ? "border-[#9C5A2B]" : "border-[#9C5A2B]/50"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full bg-[#9C5A2B] transition-transform duration-200 ${
            checked ? "scale-100" : "scale-0"
          }`}
        />
      </span>
      <span>
        {label} <span className="text-[#111111]/50">({count})</span>
      </span>
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
    <div ref={ref} className="relative w-44 sm:w-52" style={{ fontFamily: sans }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between border bg-white px-3 py-2.5 text-left text-[13px] outline-none focus-visible:border-[#9C5A2B]"
        style={{ borderColor: open ? COPPER : "rgba(156,90,43,0.4)", color: INK }}
      >
        <span className="truncate">{current}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-30 mt-1 w-full overflow-hidden border bg-white shadow-[0_10px_30px_rgba(36,36,36,0.15)]"
          style={{ borderColor: "rgba(156,90,43,0.4)" }}
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
                  className={`block w-full px-3 py-2.5 text-left text-[13px] transition-colors ${
                    active ? "bg-[#9C5A2B] text-[#FFF9F3]" : "text-[#111111] hover:bg-[#F3E7D5]"
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
// PRODUCT CARD: same design as the other shop pages
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

  // Phone / tablet: true while the card is in the middle of the screen
  const [inView, setInView] = useState(false);
  // Laptop: true while the mouse is over the picture
  const [hovering, setHovering] = useState(false);
  // The video is shown only after it really started playing (no black flash)
  const [videoReady, setVideoReady] = useState(false);

  const imgBoxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasHoverMedia = !!p.hoverImage || !!p.hoverVideo;
  const active = hovering || inView;

  // Phones / tablets (cannot hover): watch when the card is in the middle of the screen
  useEffect(() => {
    if (!hasHoverMedia) return;
    const el = imgBoxRef.current;
    if (!el) return;

    const noHover = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (!noHover) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "-35% 0px -35% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasHoverMedia]);

  // Play the video while the card is active, pause it when not
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.muted = true;
      v.play().catch(() => {
        // The browser blocked it (for example battery saver). The thumbnail stays.
      });
    } else {
      v.pause();
    }
  }, [active, p.hoverVideo]);

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

  // Every card opens /product/<slug>, for example /product/nadeem
  const detailHref = productHref(p);
  const buyHref = `${detailHref}?size=${current.ml}ml`;

  const addToCart = () => {
    if (unavailable) return;
    // TODO: connect the cart here (cart stage)
    setAdded(true);
  };

  const radioName = `size-${p.slug}`;

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)]"
      style={{ borderColor: CARD_LINE, fontFamily: sans }}
    >
      {/* image / video + wishlist heart */}
      <div
        ref={imgBoxRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px] bg-[#F6EEE0]"
      >
        <Link
          href={detailHref}
          aria-label={`View ${p.name}`}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#9C5A2B]"
        >
          {p.image ? (
            <>
              {/* Thumbnail (the first image). It fades out when a hover image takes its place. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt={p.name}
                className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
                  p.hoverImage
                    ? `group-hover:opacity-0 ${inView ? "opacity-0" : "opacity-100"}`
                    : p.hoverVideo
                    ? ""
                    : "group-hover:scale-105"
                }`}
              />

              {/* Hover image: fades in on hover (laptop) or when scrolled into view (phone) */}
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

              {/* Hover video: plays on hover (laptop) or when scrolled into view (phone) */}
              {p.hoverVideo && (
                <video
                  ref={videoRef}
                  src={p.hoverVideo}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  disablePictureInPicture
                  aria-hidden
                  onPlaying={() => setVideoReady(true)}
                  className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                    active && videoReady ? "opacity-100" : "opacity-0"
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
            className="pointer-events-none absolute left-0 top-2 max-w-[75%] px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-tight tracking-[0.1em] text-white md:top-3 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.12em]"
            style={{ background: COPPER }}
          >
            {p.badge}
          </span>
        )}
        {p.soldOut && (
          <span
            className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[9px] uppercase tracking-[0.15em] md:text-[10px]"
            style={{ color: COPPER }}
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
          <Link href={detailHref}>{p.name}</Link>
        </h3>

        {/* Notes line (only if the product has notes) */}
        {p.notes && p.notes.length > 0 && (
          <p
            className="m-0 mt-1 flex flex-wrap items-center justify-center gap-x-1 text-[9px] font-medium tracking-[0.06em] md:mt-1.5 md:gap-x-2 md:text-[12px]"
            style={{ color: INK, fontFamily: sans }}
          >
            {p.notes.map((n, i) => (
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
        <div
          className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 md:mt-3 md:gap-x-2"
          style={{ fontFamily: sans }}
        >
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

        {/* Sizes in ONE line */}
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
                style={{ color: checked ? INK : "#5F554B", fontFamily: sans }}
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
              style={{ background: COPPER, fontFamily: sans }}
            >
              Buy now
            </button>
          ) : (
            <Link
              href={buyHref}
              className="rounded-[6px] px-1 py-1.5 text-center text-[8px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#7d4720] md:py-2.5 md:text-[12px] md:tracking-[0.12em]"
              style={{ background: COPPER, fontFamily: sans }}
            >
              Buy now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ShopAllPerfumes() {
  // The home page "See more" button sends ?collection=oud-woody or ?bestseller=true
  const params = useSearchParams();
  const collectionSlug = params.get("collection") ?? "";
  const bestOnly = params.get("bestseller") === "true";
  const collectionLabel = COLLECTION_SECTIONS.find((c) => c.value === collectionSlug)?.label ?? "";
  const apiQuery = new URLSearchParams({ limit: "48" });
  if (collectionLabel) apiQuery.set("collection", collectionSlug);
  if (bestOnly) apiQuery.set("bestseller", "true");
  const apiQueryString = apiQuery.toString();
  const [sort, setSort] = useState("featured");
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>({ gender: [], occasion: [], family: [] });
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [showInStock, setShowInStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile drawer
  const [wishlist, setWishlist] = useState<string[]>([]);

  // The perfumes come from the database
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/products?${apiQueryString}`)
      .then((r) => r.json())
      .then((d: { items: ApiProduct[] }) => {
        if (cancelled) return;
        setPerfumes(
          d.items.map((a): Perfume => {
            const onSale = a.salePrice != null;

            // Card media rule:
            //  - the admin chose a VIDEO  -> the card plays it
            //  - the admin chose an IMAGE -> the card changes to it
            //  - nothing chosen           -> the card uses the 2nd gallery image (if there is one)
            const media = (a.video ?? "").trim();
            const mediaIsVideo = media !== "" && isVideoUrl(media);
            const hoverVideo = mediaIsVideo ? media : undefined;
            const hoverImage = media === "" ? a.images[1] : mediaIsVideo ? undefined : media;

            return {
              slug: a.slug,
              name: a.name,
              size: "100ML",
              price: (onSale ? a.salePrice! : a.price) / 100,
              originalPrice: onSale ? a.price / 100 : undefined,
              notes: a.notes.length ? a.notes : undefined,
              image: a.images[0],
              hoverImage,
              hoverVideo,
              badge: a.badge || undefined,
              soldOut: !a.inStock,
              featured: a.isFeatured,
              sales: a.sales,
              added: a.createdAt.slice(0, 10),
              gender: a.gender,
              occasion: a.occasion,
              family: a.family,
            };
          })
        );
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiQueryString]);

  const countFor = (key: FilterKey, option: string) =>
    perfumes.filter((p) => (key === "occasion" ? p.occasion.includes(option) : p[key] === option)).length;

  // "Load more": how many products are showing. It starts again from PAGE_SIZE whenever a filter or the sort changes.
  const filterKey = `${sort}|${selected.gender.join(",")}|${selected.occasion.join(",")}|${selected.family.join(",")}|${minPrice}|${maxPrice}|${showInStock}|${showOutOfStock}`;
  const [limit, setLimit] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = limit.key === filterKey ? limit.count : PAGE_SIZE;

  const toggleWish = (slug: string) =>
    setWishlist((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug]));

  const toggleOption = (key: FilterKey, value: string) =>
    setSelected((s) => ({
      ...s,
      [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value],
    }));

  const filtersActive =
    selected.gender.length > 0 ||
    selected.occasion.length > 0 ||
    selected.family.length > 0 ||
    minPrice > 0 ||
    maxPrice < PRICE_MAX ||
    showInStock ||
    showOutOfStock;

  const clearAll = () => {
    setSelected({ gender: [], occasion: [], family: [] });
    setMinPrice(0);
    setMaxPrice(PRICE_MAX);
    setShowInStock(false);
    setShowOutOfStock(false);
  };

  // Mobile drawer: stop the page behind from scrolling, and close with the Escape key
  useEffect(() => {
    if (!filtersOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const filtered = useMemo(() => {
    const list = perfumes.filter((p) => {
      if (selected.gender.length && !selected.gender.includes(p.gender)) return false;
      if (selected.family.length && !selected.family.includes(p.family)) return false;
      if (selected.occasion.length && !p.occasion.some((o) => selected.occasion.includes(o))) return false;
      if (p.price < minPrice || p.price > maxPrice) return false;
      // If both or neither availability box is ticked, show everything
      if (showInStock !== showOutOfStock) {
        const inStock = !p.soldOut;
        if (showInStock && !inStock) return false;
        if (showOutOfStock && inStock) return false;
      }
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
  }, [perfumes, sort, selected, minPrice, maxPrice, showInStock, showOutOfStock]);

  const shown = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;
  const loadMore = () => setLimit({ key: filterKey, count: visibleCount + PAGE_SIZE });

  const inStockCount = perfumes.filter((p) => !p.soldOut).length;
  const outOfStockCount = perfumes.length - inStockCount;

  const leftPct = (minPrice / PRICE_MAX) * 100;
  const rightPct = (maxPrice / PRICE_MAX) * 100;

  // The filter groups. Used in the desktop sidebar AND in the mobile drawer.
  const filterSections = (
    <>
      {FILTER_GROUPS.map((g) => (
        <FilterSection key={g.key} title={g.title}>
          <div className="flex flex-col gap-3">
            {g.options.map((opt) => (
              <CircleOption
                key={opt}
                label={opt}
                count={countFor(g.key, opt)}
                checked={selected[g.key].includes(opt)}
                onChange={() => toggleOption(g.key, opt)}
              />
            ))}
          </div>
        </FilterSection>
      ))}

      {/* Price */}
      <FilterSection title="Price">
        <div className="relative mx-1 h-6">
          <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded bg-[#9C5A2B]/20" />
          <div
            className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded bg-[#9C5A2B]"
            style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
          />
          <input
            type="range"
            min={0}
            max={PRICE_MAX}
            step={50}
            value={minPrice}
            aria-label="Minimum price"
            onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
            className="dual-range"
          />
          <input
            type="range"
            min={0}
            max={PRICE_MAX}
            step={50}
            value={maxPrice}
            aria-label="Maximum price"
            onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
            className="dual-range"
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <label className="flex h-11 w-full items-center gap-2 border border-[#9C5A2B]/40 bg-white px-3 text-sm focus-within:border-[#9C5A2B]">
            <span>₹</span>
            <input
              type="number"
              min={0}
              max={PRICE_MAX}
              value={minPrice}
              aria-label="Minimum price"
              onChange={(e) => setMinPrice(Math.min(Math.max(Number(e.target.value) || 0, 0), maxPrice))}
              className="w-full bg-transparent outline-none"
            />
          </label>

          <span className="text-sm text-[#111111]/60">To</span>

          <label className="flex h-11 w-full items-center gap-2 border border-[#9C5A2B]/40 bg-white px-3 text-sm focus-within:border-[#9C5A2B]">
            <span>₹</span>
            <input
              type="number"
              min={0}
              max={PRICE_MAX}
              value={maxPrice}
              aria-label="Maximum price"
              onChange={(e) =>
                setMaxPrice(Math.max(Math.min(Number(e.target.value) || 0, PRICE_MAX), minPrice))
              }
              className="w-full bg-transparent outline-none"
            />
          </label>
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <div className="flex flex-col gap-3">
          <CircleOption
            label="In stock"
            count={inStockCount}
            checked={showInStock}
            onChange={() => setShowInStock((v) => !v)}
          />
          <CircleOption
            label="Out of stock"
            count={outOfStockCount}
            checked={showOutOfStock}
            onChange={() => setShowOutOfStock((v) => !v)}
          />
        </div>
      </FilterSection>
    </>
  );

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 lg:px-16"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
      {/* Fonts, serif helper and the two-handle price slider */}
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
        .mq-serif{font-family:${serif}}
        .dual-range{-webkit-appearance:none;appearance:none;background:transparent;pointer-events:none;height:24px;margin:0;position:absolute;inset:0;width:100%}
        .dual-range::-webkit-slider-runnable-track{background:transparent;height:24px}
        .dual-range::-moz-range-track{background:transparent;height:24px}
        .dual-range::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;width:18px;height:18px;border-radius:9999px;background:${COPPER};border:0;cursor:pointer;margin-top:3px}
        .dual-range::-moz-range-thumb{pointer-events:auto;width:18px;height:18px;border-radius:9999px;background:${COPPER};border:0;cursor:pointer}
      `}</style>

      <div className="mx-auto max-w-[1400px]">
        {/* Banner */}
        <section className="relative mb-6 h-[260px] w-full overflow-hidden bg-[#111111] sm:mb-8 sm:h-[360px] lg:h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BANNER_IMAGE}
            alt="Perfume campaign"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/30 sm:bg-gradient-to-l sm:from-black/70 sm:via-black/40 sm:to-black/10" />

          <div className="absolute inset-0 flex items-center justify-center px-5 text-center sm:justify-end sm:pr-[8%] sm:text-left lg:pr-[10%]">
            <div className="max-w-xl text-white" style={{ textShadow: "0 2px 14px rgba(0,0,0,0.7)" }}>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] sm:text-sm">{TAGLINE}</p>

              <h1 className="mq-serif text-3xl font-medium leading-tight sm:text-5xl lg:text-7xl">
                {HEADING_TOP}
                <span className="block text-4xl sm:text-6xl lg:text-8xl">{HEADING_BOTTOM}</span>
              </h1>

              <a
                href={`#${ANCHOR_ID}`}
                className="mt-6 inline-flex border border-white bg-black/20 px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-white hover:text-[#9C5A2B] sm:mt-8"
                style={{ textShadow: "none" }}
              >
                Shop Now
              </a>
            </div>
          </div>
        </section>

        {/* Top bar: count, sort, and the mobile Filters button */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="m-0 text-sm text-[#111111]/60">
              {PAGE_LABEL} &nbsp;|&nbsp; {filtered.length} Products
            </p>
            {(collectionLabel || bestOnly) && (
              <Link
                href="/shopallperfume"
                className="inline-flex items-center gap-2 border border-[#9C5A2B] px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white"
              >
                {collectionLabel || "Best Sellers"} <span aria-hidden>✕</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <SortDropdown value={sort} onChange={setSort} options={SORTS} />

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              className="flex items-center gap-2 border border-[#9C5A2B] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white lg:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                className="fill-none stroke-current"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="8" cy="17" r="2" />
              </svg>
              Filters{filtersActive ? " •" : ""}
            </button>
          </div>
        </div>

        <div id={ANCHOR_ID} className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr] lg:gap-12">
          {/* Desktop filter sidebar */}
          <aside
            aria-label="Filters"
            className="hidden lg:sticky lg:top-40 lg:block lg:max-h-[calc(100vh-10rem)] lg:self-start lg:overflow-y-auto lg:pr-2 lg:[scrollbar-width:thin] lg:[scrollbar-color:#9C5A2B66_transparent]"
          >
            <div className="flex items-center justify-between">
              <h2 className="mq-serif text-3xl font-medium text-[#9C5A2B]">Filters</h2>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs uppercase tracking-[0.15em] text-[#9C5A2B] underline underline-offset-4 hover:text-[#7d4720]"
                >
                  Clear all
                </button>
              )}
            </div>

            {filterSections}
          </aside>

          {/* Product grid */}
          <div className="min-w-0">
            {!loaded ? (
              <p className="py-20 text-center text-[#111111]/60">Loading perfumes…</p>
            ) : loadError ? (
              <p className="py-20 text-center text-[#111111]/60">Could not load perfumes. Please refresh.</p>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[#111111]/60">No perfumes match these filters.</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 text-sm uppercase tracking-[0.15em] text-[#9C5A2B] underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:gap-6 xl:grid-cols-4">
                  {shown.map((p) => (
                    <ProductCard
                      key={p.slug}
                      p={p}
                      wished={wishlist.includes(p.slug)}
                      onToggleWish={toggleWish}
                    />
                  ))}
                </div>

                {filtered.length > PAGE_SIZE && (
                  <div className="mt-10 flex flex-col items-center gap-4 md:mt-12">
                    <p className="m-0 text-xs" style={{ color: MUTED }} aria-live="polite">
                      Showing {shown.length} of {filtered.length} products
                    </p>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={loadMore}
                        className="border border-[#9C5A2B] px-10 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white"
                      >
                        Load more
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="mt-16 border-y py-16" style={{ borderColor: LINE, background: PASTEL }}>
        <div className="mx-auto grid max-w-4xl gap-10 px-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              <svg viewBox="0 0 24 24" className="mx-auto h-9 w-9" fill="none" stroke={COPPER} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.icon} />
              </svg>
              <h3 className="mq-serif mt-4 text-xl font-medium" style={{ color: COPPER }}>
                {f.title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: MUTED }}>
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile filter sidebar */}
      <div
        className={`fixed inset-0 z-[60] transition-[visibility] duration-0 lg:hidden ${
          filtersOpen ? "visible delay-0" : "pointer-events-none invisible delay-300"
        }`}
        aria-hidden={!filtersOpen}
      >
        <div
          onClick={() => setFiltersOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            filtersOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Filter"
          className={`absolute left-0 top-0 flex h-full w-[min(86vw,380px)] flex-col shadow-xl transition-transform duration-300 ease-out ${
            filtersOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: CREAM, color: INK, fontFamily: sans }}
        >
          <div className="relative border-b border-[#9C5A2B]/25 px-5 py-4 text-center">
            <h2 className="mq-serif text-2xl font-medium text-[#9C5A2B]">Filter</h2>
            <p className="mt-0.5 text-xs text-[#111111]/60">{filtered.length} products</p>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
              className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#9C5A2B]"
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                className="fill-none stroke-current"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">{filterSections}</div>

          <div className="flex items-center justify-between gap-4 border-t border-[#9C5A2B]/25 px-5 py-4">
            <button
              type="button"
              onClick={clearAll}
              disabled={!filtersActive}
              className="text-sm text-[#111111] underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[#111111]/35"
            >
              Remove all
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="flex-1 rounded-[6px] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
              style={{ background: COPPER, fontFamily: sans }}
            >
              Apply
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function ShopAllPerfumesPage() {
  return (
    <Suspense fallback={null}>
      <ShopAllPerfumes />
    </Suspense>
  );
}