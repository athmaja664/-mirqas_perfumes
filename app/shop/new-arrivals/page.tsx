"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { productHref } from "@/lib/productHref";
import { COLLECTION_SECTIONS } from "@/lib/sections";
import {
  ShopProduct,
  addToCart,
  sizesOf,
  toggleWishlist,
  useSectionProducts,
  useWishlistSlugs,
} from "@/lib/sectionProducts";

const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const CREAM = "#FFF9F3";
const INK = "#111111";
const CARD_BORDER = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const BANNER_IMAGE = "/images/newlauchhero.png";
const BANNER_IMAGE_DESKTOP = "/images/newlaunchherolap.png";

// Top of the price slider, in rupees
const PRICE_MAX = 20000;

const CATEGORIES = COLLECTION_SECTIONS.map((c) => c.label);
const TABS = ["All", "Women", "Men", "Unisex"] as const;
type Tab = (typeof TABS)[number];

const money = (n: number) =>
  "Rs. " + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

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

function Placeholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#F6EEE0]">
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

function ProductCard({ p, wished }: { p: ShopProduct; wished: boolean }) {
  const sizes = sizesOf(p);
  const [selectedMl, setSelectedMl] = useState(sizes[0].ml);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Phones: show the second image while the card is in the middle of the screen
  const [inView, setInView] = useState(false);
  const imgBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!p.hoverImage) return;
    const el = imgBoxRef.current;
    if (!el || !window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "-35% 0px -35% 0px",
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [p.hoverImage]);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1600);
    return () => window.clearTimeout(t);
  }, [added]);

  const current = sizes.find((s) => s.ml === selectedMl) ?? sizes[0];
  const unavailable = !p.inStock;
  const discounted = current.originalPrice !== undefined && current.originalPrice > current.price;
  const pct = discounted
    ? Math.round(((current.originalPrice! - current.price) / current.originalPrice!) * 100)
    : 0;

  const detailHref = productHref(p);
  const buyHref = `${detailHref}?size=${current.ml}ml`;
  const badge = p.badge || "New";

  const handleAdd = () => {
    if (unavailable || adding || added) return;
    setAdding(true);
    window.setTimeout(() => {
      addToCart(p, current.ml);
      setAdding(false);
      setAdded(true);
    }, 500);
  };

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)]"
      style={{ borderColor: CARD_BORDER, fontFamily: sans }}
    >
      <div ref={imgBoxRef} className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px] bg-[#F6EEE0]">
        <Link
          href={detailHref}
          aria-label={`View ${p.name}`}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#9C5A2B]"
        >
          {p.image ? (
            <>
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
              {p.hoverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.hoverImage}
                  alt={`${p.name} alternate view`}
                  className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:opacity-100 ${
                    inView ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
          ) : (
            <Placeholder label={p.name} />
          )}
        </Link>

        <span
          className="pointer-events-none absolute left-0 top-2 max-w-[75%] px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-tight tracking-[0.1em] text-white md:top-3 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.12em]"
          style={{ background: COPPER }}
        >
          {badge}
        </span>

        {!p.inStock && (
          <span
            className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[9px] uppercase tracking-[0.15em] md:text-[10px]"
            style={{ color: COPPER }}
          >
            Sold out
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(p)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-105 md:right-3 md:top-3 md:h-9 md:w-9"
          style={{ color: wished ? "#C0392B" : "#555555" }}
        >
          <HeartIcon filled={wished} />
        </button>
      </div>

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

        {p.notes.length > 0 && (
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

        <div
          className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 md:mt-3 md:gap-x-2"
          style={{ fontFamily: sans }}
        >
          {discounted && (
            <span className="text-[9px] line-through md:text-[13px]" style={{ color: "#9A8F84" }}>
              {money(current.originalPrice!)}
            </span>
          )}
          <span className="text-[11px] font-semibold md:text-[17px]" style={{ color: COPPER }}>
            {money(current.price)}
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

        <fieldset className="m-0 mt-2 flex w-full flex-nowrap items-center justify-center gap-x-1.5 border-0 p-0 md:mt-3 md:gap-x-2.5 lg:gap-x-3">
          <legend className="sr-only">Choose a size</legend>
          {sizes.map((s) => {
            const checked = s.ml === selectedMl;
            const disabled = !p.inStock;
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
                  name={`size-${p.slug}`}
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

        <div className="mt-auto flex w-full flex-col items-stretch gap-1.5 pt-3 md:w-[90%] md:gap-2 md:pt-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={unavailable || adding || added}
            aria-live="polite"
            className={`flex items-center justify-center gap-1.5 rounded-[6px] border px-1 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 md:py-2.5 md:text-[12px] md:tracking-[0.12em] ${
              unavailable
                ? "cursor-not-allowed border-[#D9CDBA] bg-white text-[#B9AD9A]"
                : adding || added
                  ? "cursor-default border-[#9C5A2B] bg-white text-[#9C5A2B]"
                  : "border-[#9C5A2B] bg-white text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white"
            }`}
            style={{ fontFamily: sans }}
          >
            {unavailable ? (
              "Sold out"
            ) : adding ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent md:h-4 md:w-4" />
                Adding...
              </>
            ) : added ? (
              "Added ✓"
            ) : (
              <>
                Add to cart
                <CartIcon />
              </>
            )}
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

export default function NewArrivalsPage() {
  const { products: perfumes, loaded, error } = useSectionProducts("new-arrivals");
  const wishlist = useWishlistSlugs();

  const [tab, setTab] = useState<Tab>("All");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [showInStock, setShowInStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleCat = (label: string) =>
    setSelectedCats((prev) => (prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]));

  const filtersActive =
    selectedCats.length > 0 || minPrice > 0 || maxPrice < PRICE_MAX || showInStock || showOutOfStock;

  const clearAll = () => {
    setSelectedCats([]);
    setMinPrice(0);
    setMaxPrice(PRICE_MAX);
    setShowInStock(false);
    setShowOutOfStock(false);
  };

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

  const filtered = useMemo(
    () =>
      perfumes.filter((p) => {
        if (tab !== "All" && p.gender !== tab) return false;
        if (selectedCats.length && !selectedCats.includes(p.category)) return false;
        if (p.price < minPrice || p.price > maxPrice) return false;
        if (showInStock !== showOutOfStock) {
          if (showInStock && !p.inStock) return false;
          if (showOutOfStock && p.inStock) return false;
        }
        return true;
      }),
    [perfumes, tab, selectedCats, minPrice, maxPrice, showInStock, showOutOfStock]
  );

  const inStockCount = perfumes.filter((p) => p.inStock).length;
  const outOfStockCount = perfumes.length - inStockCount;
  const leftPct = (minPrice / PRICE_MAX) * 100;
  const rightPct = (maxPrice / PRICE_MAX) * 100;

  const filterSections = (
    <>
      <FilterSection title="Category">
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((label) => (
            <CircleOption
              key={label}
              label={label}
              count={perfumes.filter((p) => p.category === label).length}
              checked={selectedCats.includes(label)}
              onChange={() => toggleCat(label)}
            />
          ))}
        </div>
      </FilterSection>

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

      <FilterSection title="Availability">
        <div className="flex flex-col gap-3">
          <CircleOption label="In stock" count={inStockCount} checked={showInStock} onChange={() => setShowInStock((v) => !v)} />
          <CircleOption label="Out of stock" count={outOfStockCount} checked={showOutOfStock} onChange={() => setShowOutOfStock((v) => !v)} />
        </div>
      </FilterSection>
    </>
  );

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 lg:px-16"
      style={{ background: CREAM, color: INK, fontFamily: sans }}
    >
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
        {/* Banner (phone image, bigger image from laptop up) */}
        <section className="relative mb-6 w-full overflow-hidden sm:mb-8" style={{ background: CREAM }}>
          <picture>
            <source media="(min-width: 1024px)" srcSet={BANNER_IMAGE_DESKTOP} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BANNER_IMAGE}
              alt="New Launch: Four Fragrances. One Signature of Luxury"
              className="block h-auto w-full max-w-full"
              decoding="async"
              fetchPriority="high"
            />
          </picture>
        </section>

        <div className="mb-4 flex flex-wrap gap-3" role="tablist" aria-label="Filter new arrivals">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`border px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                tab === t
                  ? "border-[#9C5A2B] bg-[#9C5A2B] text-white"
                  : "border-[#9C5A2B]/40 text-[#9C5A2B] hover:border-[#9C5A2B]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-[#111111]/60">
            NEW ARRIVALS &nbsp;|&nbsp; {filtered.length} Products
          </p>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            className="flex items-center gap-2 border border-[#9C5A2B] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white lg:hidden"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="8" cy="17" r="2" />
            </svg>
            Filters{filtersActive ? " •" : ""}
          </button>
        </div>

        <div id="new-perfumes" className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr] lg:gap-12">
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

          <div className="min-w-0">
            {!loaded ? (
              <p className="py-20 text-center text-[#111111]/60">Loading perfumes…</p>
            ) : error ? (
              <p className="py-20 text-center text-[#111111]/60">Could not load perfumes. Please refresh.</p>
            ) : perfumes.length === 0 ? (
              <p className="py-20 text-center text-[#111111]/60">No new arrivals yet.</p>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[#111111]/60">No new arrivals match these filters.</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 text-sm uppercase tracking-[0.15em] text-[#9C5A2B] underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:gap-6 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard key={p.slug} p={p} wished={wishlist.includes(p.slug)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sidebar */}
      <div
        className={`fixed inset-0 z-[60] transition-[visibility] duration-0 lg:hidden ${
          filtersOpen ? "visible delay-0" : "pointer-events-none invisible delay-300"
        }`}
        aria-hidden={!filtersOpen}
      >
        <div
          onClick={() => setFiltersOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${filtersOpen ? "opacity-100" : "opacity-0"}`}
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
              <svg viewBox="0 0 24 24" width="22" height="22" className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
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