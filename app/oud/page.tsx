"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { productHref } from "@/lib/productHref";
import {
  ShopProduct,
  addToCart,
  sizesOf,
  toggleWishlist,
  useSectionProducts,
  useWishlistSlugs,
} from "@/lib/sectionProducts";

const GOLD = "#D4A017";
const COPPER = "#B87333";
const COPPER_SOFT = "rgba(184,115,51,0.55)";
const CARD_BG = "#0d0d0d";
const CARD_BORDER = "#3a2a12";
const MUTED_GOLD = "#C9A24B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const HERO_IMAGE = "https://images.pexels.com/photos/30618765/pexels-photo-30618765.jpeg";
const HISTORY_IMAGE = "/images/history.jpg";

// Prices look like: ₹ 6,290.00
const money = (n: number) =>
  "₹ " + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const history = [
  {
    year: "Origins",
    text: "Oud, the dark resinous heartwood of the Aquilaria tree, has been treasured in Arabia for centuries. Burned in homes and worn as oil, it became a sign of hospitality and honour.",
  },
  {
    year: "The Craft",
    text: "Master perfumers age oud for months, sometimes years, distilling it slowly to draw out its deep, smoky-sweet character. Every batch is blended by hand.",
  },
  {
    year: "Today",
    text: "Oud Arabian carries this heritage forward, pairing time-honoured attars with modern perfumes in bottles worthy of the tradition.",
  },
];

function ExampleImage({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-black to-neutral-900 ${className}`}>
      <svg viewBox="0 0 200 200" className="h-1/2 w-1/2 opacity-80" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor={COPPER} />
          </linearGradient>
        </defs>
        <rect x="70" y="80" width="60" height="90" rx="10" stroke="url(#g)" strokeWidth="3" />
        <rect x="88" y="55" width="24" height="25" rx="4" stroke="url(#g)" strokeWidth="3" />
        <path d="M80 120h40" stroke="url(#g)" strokeWidth="2" />
      </svg>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em]" style={{ color: COPPER }}>
        {label}
      </span>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px] md:h-[18px] md:w-[18px]"
      fill={filled ? GOLD : "none"}
      stroke={filled ? GOLD : "currentColor"}
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20.5s-7.5-4.6-9-9.3C2 7.9 4 5 7 5c1.9 0 3.5 1 5 3 1.5-2 3.1-3 5-3 3 0 5 2.9 4 6.2-1.5 4.7-9 9.3-9 9.3z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[11px] w-[11px] md:h-[15px] md:w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function ProductCard({ p, wished }: { p: ShopProduct; wished: boolean }) {
  const sizes = sizesOf(p);
  // Starts on the 100ml bottle
  const [selectedMl, setSelectedMl] = useState(100);
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

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
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  const current = sizes.find((s) => s.ml === selectedMl) ?? sizes[0];
  const unavailable = !p.inStock;

  const discounted = current.originalPrice !== undefined && current.originalPrice > current.price;
  const pct = discounted
    ? Math.round(((current.originalPrice! - current.price) / current.originalPrice!) * 100)
    : 0;

  const detailHref = productHref(p);
  const buyHref = `${detailHref}?size=${current.ml}ml`;

  const handleAdd = () => {
    if (unavailable || isAdding) return;
    setIsAdding(true);
    window.setTimeout(() => {
      addToCart(p, current.ml);
      setIsAdding(false);
      setAdded(true);
    }, 450);
  };

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(212,160,23,0.12)]"
      style={{ borderColor: CARD_BORDER, background: CARD_BG, fontFamily: sans }}
    >
      <div ref={imgBoxRef} className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px] bg-neutral-900">
        <Link
          href={detailHref}
          aria-label={`View ${p.name}`}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#D4A017]"
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
                  className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-100 ${
                    inView ? "scale-105 opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
          ) : (
            <ExampleImage label={p.name} className="h-full w-full" />
          )}
        </Link>

        {!p.inStock && (
          <span
            className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/80 px-2 py-1 text-[9px] uppercase tracking-[0.15em] md:text-[10px]"
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
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[#D4A017] shadow-sm backdrop-blur-sm transition hover:scale-105 hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4A017] md:right-3 md:top-3 md:h-9 md:w-9"
        >
          <HeartIcon filled={wished} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-3 text-center md:px-3 md:pb-5 md:pt-4">
        <h3
          className="m-0 line-clamp-2 font-medium leading-[1.2]"
          style={{
            fontFamily: serif,
            color: GOLD,
            fontSize: "clamp(1rem, 1.7vw, 1.5rem)",
            fontVariantNumeric: "lining-nums",
            fontFeatureSettings: '"lnum" 1',
          }}
        >
          <Link href={detailHref}>{p.name}</Link>
        </h3>

        <div
          className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 md:mt-3 md:gap-x-2"
          style={{ fontFamily: sans }}
        >
          {discounted && (
            <span className="text-[9px] line-through md:text-[13px]" style={{ color: "#8A7A5A" }}>
              {money(current.originalPrice!)}
            </span>
          )}
          <span className="text-[11px] font-semibold text-white md:text-[17px]">{money(current.price)}</span>
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
                style={{ color: checked ? GOLD : MUTED_GOLD, fontFamily: sans }}
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
                  style={{ borderColor: checked ? GOLD : COPPER_SOFT }}
                >
                  {checked && (
                    <span
                      className="h-[4px] w-[4px] rounded-[1px] md:h-[6px] md:w-[6px] md:rounded-[2px]"
                      style={{ background: GOLD }}
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
            disabled={unavailable || isAdding}
            aria-live="polite"
            className={`flex items-center justify-center gap-1.5 rounded-[6px] border px-1 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 md:py-2.5 md:text-[12px] md:tracking-[0.12em] ${
              unavailable
                ? "cursor-not-allowed border-[#3a2a12] bg-transparent text-[#6b5a3a]"
                : "border-[#D4A017] bg-transparent text-[#D4A017] hover:bg-[#D4A017] hover:text-black"
            }`}
            style={{ fontFamily: sans }}
          >
            {unavailable ? (
              "Sold out"
            ) : isAdding ? (
              <>
                <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent md:h-4 md:w-4" />
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
              className="cursor-not-allowed rounded-[6px] px-1 py-1.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#6b5a3a] opacity-60 md:py-2.5 md:text-[12px] md:tracking-[0.12em]"
              style={{ background: "#3a2a12", fontFamily: sans }}
            >
              Buy now
            </button>
          ) : (
            <Link
              href={buyHref}
              className="rounded-[6px] px-1 py-1.5 text-center text-[8px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:brightness-110 md:py-2.5 md:text-[12px] md:tracking-[0.12em]"
              style={{ background: GOLD, fontFamily: sans }}
            >
              Buy now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OudArabianPage() {
  const { products, loaded, error } = useSectionProducts("oud-arabian");
  const wishlist = useWishlistSlugs();

  return (
    <main className="min-h-screen bg-black text-[#D4A017]">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
      `}</style>

      {/* HERO */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0">
          {HERO_IMAGE ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={HERO_IMAGE} alt="Oud Arabian" className="h-full w-full object-cover opacity-50" />
          ) : (
            <ExampleImage label="Hero image" className="h-full w-full opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
        </div>
        <div className="relative z-10">
          <p className="mb-4 text-sm uppercase tracking-[0.5em]" style={{ color: COPPER }}>
            Mirqas Presents
          </p>
          <h1 className="text-5xl font-light uppercase tracking-[0.25em] md:text-7xl">Oud Arabian</h1>
          <div className="mx-auto my-6 h-px w-24" style={{ background: COPPER }} />
          <p className="mx-auto max-w-xl text-lg" style={{ color: COPPER }}>
            A tribute to the ancient art of oud, crafted in gold and shadow.
          </p>
          <a
            href="#collection"
            className="mt-10 inline-block border px-8 py-3 text-sm uppercase tracking-[0.3em] transition hover:bg-[#D4A017] hover:text-black"
            style={{ borderColor: GOLD }}
          >
            Explore Collection
          </a>
        </div>
      </section>

      {/* HISTORY */}
      <section className="border-y py-20" style={{ borderColor: "#3a2a12" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          {HISTORY_IMAGE ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={HISTORY_IMAGE} alt="Oud Arabian history" className="aspect-[4/5] w-full object-cover" />
          ) : (
            <ExampleImage label="History image" className="aspect-[4/5] w-full" />
          )}
          <div>
            <h2 className="mb-10 text-3xl uppercase tracking-[0.3em]">Our History</h2>
            <div className="space-y-8">
              {history.map((h) => (
                <div key={h.year} className="border-l-2 pl-6" style={{ borderColor: COPPER }}>
                  <h3 className="mb-2 text-sm uppercase tracking-[0.3em]" style={{ color: COPPER }}>
                    {h.year}
                  </h3>
                  <p className="leading-relaxed text-[#C9A24B]">{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION: products ticked "Oud & Arabian" in admin */}
      <section id="collection" className="mx-auto max-w-7xl px-3 py-20 sm:px-4">
        <h2 className="mb-14 text-center text-3xl uppercase tracking-[0.3em]">The Collection</h2>

        {!loaded ? (
          <p className="py-10 text-center" style={{ color: MUTED_GOLD }}>Loading perfumes…</p>
        ) : error ? (
          <p className="py-10 text-center" style={{ color: MUTED_GOLD }}>Could not load perfumes. Please refresh.</p>
        ) : products.length === 0 ? (
          <p className="py-10 text-center" style={{ color: MUTED_GOLD }}>No perfumes in this collection yet.</p>
        ) : (
          <div className="mx-auto grid grid-cols-2 gap-2.5 md:max-w-[840px] md:grid-cols-3 md:gap-4 lg:max-w-[1100px] lg:grid-cols-4 lg:gap-6">
            {products.map((p) => (
              <ProductCard key={p.slug} p={p} wished={wishlist.includes(p.slug)} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}