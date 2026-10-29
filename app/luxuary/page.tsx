"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import Link from "next/link";
import { productHref } from "@/lib/productHref";
import {
  CART_KEY,
  CartLine,
  ShopProduct,
  SIZE_STEPS,
  addToCart,
  readList,
  sizesOf,
  toggleWishlist,
  useSectionProducts,
  useStoredCart,
  useWishlistSlugs,
  writeList,
} from "@/lib/sectionProducts";

/* ================= COPPER + FONT (same as the other pages) ================= */
const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const CREAM = "#FFF9F3";
const INK = "#111111";
const CARD_BORDER = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "'Inter', system-ui, sans-serif";

/* ================= EDIT HERE: your colours ================= */
const THEME = {
  primary: "#ffffff",
  primaryDark: "#5A3039",
  soft: "#F6EEE0",
  page: CREAM,
  accent: "#cfcbc2",
  heroText: "#3B2116",
  heroBottle: "#B4C646",
};

/* ================= EDIT HERE: your image / video URLs ================= */
const CONFIG = {
  heroVideo: "",
  heroBottle: "/images/luxhero.png",
  collage: [
    { src: "/images/mirqas2.png", type: "image" },
    { src: "/images/mirqas1.png", type: "image" },
    { src: "https://www.pexels.com/download/video/35200638/", type: "video" },
  ] as { src: string; type: "image" | "video" }[],
  currency: "₹",
};

const T = THEME;
const DEFAULT_ML = 50; // the size each card starts on
const money = (n: number) => CONFIG.currency + Math.round(n);

const z: CSSProperties = { margin: 0, boxSizing: "border-box" };
const fill: CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

const GRID = "flex flex-wrap justify-center gap-2.5 md:gap-4 lg:gap-6";
const GRID_ITEM =
  "flex w-[calc(50%-0.3125rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-1.125rem)] xl:w-[calc(20%-1.2rem)]";

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return match;
}

function Bottle({ color, cap, style }: { color: string; cap: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 160" aria-hidden="true" style={{ display: "block", ...style }}>
      <rect x="38" y="6" width="24" height="26" rx="3" fill={cap} />
      <rect x="44" y="30" width="12" height="8" fill={cap} opacity=".7" />
      <rect x="14" y="38" width="72" height="116" rx="12" fill={color} />
      <rect x="24" y="46" width="8" height="98" rx="4" fill="#fff" opacity=".18" />
      <rect x="30" y="84" width="44" height="34" rx="3" fill="#fff" opacity=".9" />
      <rect x="36" y="94" width="32" height="3" fill="#1a1a1a" />
      <rect x="40" y="102" width="24" height="3" fill="#1a1a1a" opacity=".5" />
    </svg>
  );
}

/* Product photo (with a hover photo). If a product has no photo, a drawn bottle is shown. */
function CardImage({ p, lift, reduce }: { p: ShopProduct; lift: boolean; reduce: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [p.image]);

  if (!p.image || failed) {
    return (
      <Bottle
        color="#6e6e6e"
        cap="#9a9a9a"
        style={{
          width: "42%",
          margin: "0 auto",
          transition: reduce ? "none" : "transform .5s",
          filter: "drop-shadow(0 24px 20px rgba(0,0,0,.25))",
          transform: lift ? "translateY(-10px) rotate(-3deg)" : "none",
        }}
      />
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.image}
        alt={p.name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
          p.hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"
        }`}
      />
      {p.hoverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.hoverImage}
          alt={`${p.name} alternate view`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
        />
      )}
    </>
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

const CartIcon = ({ size = 15 }: { size?: number }) => (
  <svg {...iconProps} width={size} height={size}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const unitOf = (l: CartLine) => l.sizes?.find((s) => s.ml === l.ml)?.price ?? 0;

export default function PerfumeSection() {
  const { products, loaded, error } = useSectionProducts("luxury");
  const wishSlugs = useWishlistSlugs();
  const cartLines = useStoredCart();

  const [cartAction, setCartAction] = useState<Record<string, "loading" | "added">>({});
  const cartActionTimers = useRef<Record<string, number>>({});
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const bottleRef = useRef<HTMLDivElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const m = useMedia("(max-width: 820px)");
  const xs = useMedia("(max-width: 480px)");
  const reduce = useMedia("(prefers-reduced-motion: reduce)");

  const count = cartLines.reduce((n, l) => n + (Number(l.qty) || 1), 0);
  const subtotal = cartLines.reduce((n, l) => n + unitOf(l) * (Number(l.qty) || 1), 0);

  useEffect(() => {
    if (!document.getElementById("inter-font")) {
      const link = document.createElement("link");
      link.id = "inter-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const timers = cartActionTimers.current;
    return () => {
      Object.values(timers).forEach((t) => window.clearTimeout(t));
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1800);
  };

  const add = (p: ShopProduct) => {
    const ml = sizes[p.slug] ?? DEFAULT_ML;
    setCartAction((c) => ({ ...c, [p.slug]: "loading" }));
    window.clearTimeout(cartActionTimers.current[p.slug]);
    addToCart(p, ml);

    cartActionTimers.current[p.slug] = window.setTimeout(() => {
      setCartAction((c) => ({ ...c, [p.slug]: "added" }));
      cartActionTimers.current[p.slug] = window.setTimeout(() => {
        setCartAction((c) => {
          const next = { ...c };
          delete next[p.slug];
          return next;
        });
      }, 1500);
    }, 700);
  };

  // Change the quantity of one cart line (use a negative number to remove)
  const change = (line: CartLine, d: number) => {
    const next = readList<CartLine>(CART_KEY).flatMap((l) => {
      if (l.slug !== line.slug || l.ml !== line.ml) return [l];
      const qty = (Number(l.qty) || 1) + d;
      return qty > 0 ? [{ ...l, qty }] : [];
    });
    writeList(CART_KEY, next);
  };

  const toggleWish = (p: ShopProduct) => {
    const saved = toggleWishlist(p);
    say(saved ? "Saved to wishlist" : "Removed from wishlist");
  };

  const onHeroMove = (e: MouseEvent) => {
    if (reduce || !window.matchMedia("(hover:hover)").matches || !bottleRef.current) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 24;
    const y = (e.clientY / window.innerHeight - 0.5) * 16;
    bottleRef.current.style.transform = `translate(calc(-50% + ${x}px),calc(-52% + ${y}px)) rotate(${x / 6}deg)`;
  };

  const closeCart = () => {
    setOpen(false);
    cartBtnRef.current?.focus();
  };

  const tile = (i: number): CSSProperties => {
    const base: CSSProperties = { position: "absolute", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,.18)" };
    if (i === 0) return { ...base, width: "48%", top: 0, left: 0, background: T.accent };
    if (i === 1) return { ...base, width: "52%", height: "66%", bottom: 0, right: 0, background: "#1a1a1a" };
    return { ...base, width: "38%", height: "44%", top: "10%", right: "2%", background: T.primaryDark };
  };

  return (
    <div style={{ ...z, width: "100%", maxWidth: "100%", fontFamily: sans, background: T.page, color: INK, lineHeight: 1.55, overflowX: "clip" }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
        .mq-serif { font-family: ${serif}; }
      `}</style>

      <main>
        {/* hero */}
        <div
          onMouseMove={onHeroMove}
          style={{
            ...z, position: "relative", minHeight: "100svh", color: T.heroText, display: "grid", placeItems: "center",
            overflow: "hidden", textAlign: "center", padding: xs ? "76px 14px 132px" : "clamp(80px,10vh,120px) 16px clamp(130px,16vh,170px)",
            background: `radial-gradient(ellipse 60% 55% at 50% 45%, color-mix(in srgb, ${T.accent} 16%, transparent), transparent 70%), ${T.primary}`,
          }}
        >
          {CONFIG.heroVideo && (
            <video src={CONFIG.heroVideo} autoPlay muted loop playsInline
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
          )}

          <h1 style={{ ...z, position: "relative", fontFamily: sans, color: COPPER, fontWeight: 800, lineHeight: 0.95, letterSpacing: "-.045em", textTransform: "uppercase", fontSize: xs ? "clamp(36px,11vw,54px)" : "clamp(42px,9.5vw,150px)" }}>
            <span style={{ display: "block" }}>Awaken senses</span>
            <span style={{ display: "block", fontSize: ".5em", letterSpacing: "-.03em" }}>with unforgettable</span>
            <span style={{ display: "block" }}>fragrance</span>
          </h1>

          <div
            ref={bottleRef}
            style={{
              position: "absolute", left: "50%", top: "50%", width: xs ? "clamp(112px,31vw,160px)" : m ? "clamp(145px,27vw,230px)" : "clamp(180px,22vw,300px)", transform: "translate(-50%,-52%)",
              zIndex: 3, filter: "drop-shadow(0 30px 30px rgba(0,0,0,.6))", transition: "transform .2s ease-out", pointerEvents: "none",
            }}
          >
            {CONFIG.heroBottle ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={CONFIG.heroBottle} alt="" style={{ width: "100%", display: "block" }} />
            ) : (
              <Bottle color={T.heroBottle} cap={T.accent} style={{ width: "100%" }} />
            )}
          </div>

          <div
            style={{
              position: "absolute", left: "50%", bottom: m ? -50 : -60, transform: "translateX(-50%)", width: m ? 116 : 140, height: m ? 116 : 140,
              borderRadius: "50%", background: T.primary, zIndex: 5, display: "grid", placeItems: "center",
              boxShadow: `0 0 0 12px ${T.page}`, border: `1px solid color-mix(in srgb, ${T.accent} 55%, transparent)`,
            }}
          >
            <svg viewBox="0 0 150 150" aria-hidden="true" style={{ position: "absolute", inset: 6 }}>
              <defs>
                <path id="mq-circle" d="M75,75 m-60,0 a60,60 0 1,1 120,0 a60,60 0 1,1 -120,0" />
              </defs>
              <g>
                {!reduce && <animateTransform attributeName="transform" type="rotate" from="0 75 75" to="360 75 75" dur="18s" repeatCount="indefinite" />}
                <text fontSize="12.5" fontFamily={sans} fill={COPPER} letterSpacing="3">
                  <textPath href="#mq-circle">EXPLORE THE SCENT LIBRARY • EXPLORE THE SCENT LIBRARY •</textPath>
                </text>
              </g>
            </svg>
            <a
              href="#mq-list"
              aria-label="Shop perfumes"
              style={{ width: m ? 44 : 52, height: m ? 44 : 52, borderRadius: "50%", background: COPPER, fontFamily: sans, color: "#fff", display: "grid", placeItems: "center", fontSize: 22, textDecoration: "none" }}
            >
              ↓
            </a>
          </div>
        </div>

        {/* listing: products ticked "Luxury Collection" in admin */}
        <section
          id="mq-list"
          className="mx-auto w-full max-w-[1600px] px-3 pb-14 md:px-8 md:pb-20 lg:px-12"
          style={{ paddingTop: xs ? 100 : m ? 118 : 130 }}
        >
          <div className="text-center">
            <p className="m-0 text-[11px] font-medium uppercase tracking-[0.3em] text-[#111111]/60 md:text-xs">
              Small-batch eaux de parfum
            </p>
            <h2
              className="mq-serif m-0 mt-3 font-medium leading-tight"
              style={{ color: COPPER, fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              The luxury collection
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[#111111]/70 md:text-[15px]">
              Small-batch eaux de parfum, each built on natural ingredients and aged for six weeks before bottling.
            </p>
          </div>

          {!loaded ? (
            <p className="py-16 text-center text-[#111111]/60">Loading perfumes…</p>
          ) : error ? (
            <p className="py-16 text-center text-[#111111]/60">Could not load perfumes. Please refresh.</p>
          ) : products.length === 0 ? (
            <p className="py-16 text-center text-[#111111]/60">No perfumes in the luxury collection yet.</p>
          ) : (
            <ul className={`m-0 mt-8 list-none p-0 md:mt-14 ${GRID}`}>
              {products.map((p) => {
                const productSizes = sizesOf(p);
                const ml = sizes[p.slug] ?? DEFAULT_ML;
                const current = productSizes.find((s) => s.ml === ml) ?? productSizes[0];
                const saved = wishSlugs.includes(p.slug);
                const href = productHref(p);
                const unavailable = !p.inStock;
                const discounted = current.originalPrice !== undefined && current.originalPrice > current.price;
                const pct = discounted
                  ? Math.round(((current.originalPrice! - current.price) / current.originalPrice!) * 100)
                  : 0;
                const action = cartAction[p.slug];

                return (
                  <li key={p.slug} className={GRID_ITEM}>
                    <article
                      onMouseEnter={() => setHover(p.slug)}
                      onMouseLeave={() => setHover(null)}
                      className="group flex h-full w-full flex-col overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)]"
                      style={{ borderColor: CARD_BORDER, fontFamily: sans }}
                    >
                      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px]" style={{ background: T.soft }}>
                        <Link
                          href={href}
                          aria-label={`View ${p.name}`}
                          className="relative grid h-full w-full place-items-center focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#9C5A2B]"
                        >
                          <CardImage p={p} lift={hover === p.slug} reduce={reduce} />
                        </Link>

                        {p.badge && (
                          <span
                            className="pointer-events-none absolute left-0 top-2 max-w-[75%] px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-tight tracking-[0.1em] text-white md:top-3 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.12em]"
                            style={{ background: COPPER }}
                          >
                            {p.badge}
                          </span>
                        )}

                        {unavailable && (
                          <span
                            className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[9px] uppercase tracking-[0.15em] md:text-[10px]"
                            style={{ color: COPPER }}
                          >
                            Sold out
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleWish(p)}
                          aria-pressed={saved}
                          aria-label={saved ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-105 md:right-3 md:top-3 md:h-9 md:w-9"
                          style={{ color: saved ? "#C0392B" : "#555555" }}
                        >
                          <HeartIcon filled={saved} />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-3 text-center md:px-3 md:pb-5 md:pt-4">
                        <p className="m-0 text-[9px] uppercase tracking-[0.15em] text-[#111111]/50 md:text-[11px] md:tracking-[0.2em]">
                          {p.category}
                        </p>

                        <h3
                          className="m-0 mt-1 line-clamp-2 font-medium leading-[1.2]"
                          style={{
                            fontFamily: serif,
                            color: COPPER,
                            fontSize: "clamp(1rem, 1.7vw, 1.5rem)",
                            fontVariantNumeric: "lining-nums",
                            fontFeatureSettings: '"lnum" 1',
                          }}
                        >
                          <Link href={href}>{p.name}</Link>
                        </h3>

                        {p.notes.length > 0 && (
                          <p
                            className="m-0 mt-1 flex flex-wrap items-center justify-center gap-x-1 text-[9px] font-medium tracking-[0.06em] md:mt-1.5 md:gap-x-2 md:text-[12px]"
                            style={{ color: INK, fontFamily: sans }}
                          >
                            {p.notes.map((n, i) => (
                              <span key={n} className="flex items-center gap-x-1 md:gap-x-2">
                                {i > 0 && <span aria-hidden className="h-[3px] w-[3px] rounded-full md:h-[4px] md:w-[4px]" style={{ background: COPPER }} />}
                                {n}
                              </span>
                            ))}
                          </p>
                        )}

                        {p.description && (
                          <p className="m-0 mt-2 line-clamp-3 max-w-[46ch] text-[11px] leading-snug text-[#111111]/75 md:mt-3 md:text-[14px] md:leading-relaxed">
                            {p.description}
                          </p>
                        )}

                        <div
                          className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 md:mt-4 md:gap-x-2"
                          style={{ fontFamily: sans }}
                        >
                          {discounted && (
                            <span className="text-[9px] line-through md:text-[13px]" style={{ color: "#9A8F84" }}>
                              {money(current.originalPrice!)}
                            </span>
                          )}
                          <span aria-live="polite" className="text-[11px] font-semibold md:text-[17px]" style={{ color: COPPER }}>
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
                          <legend className="sr-only">Choose a size for {p.name}</legend>
                          {SIZE_STEPS.map((s) => {
                            const checked = s.ml === ml;
                            return (
                              <label
                                key={s.ml}
                                className={`flex items-center gap-[3px] whitespace-nowrap text-[9px] lowercase md:gap-1 md:text-[10px] lg:text-[12px] ${
                                  unavailable ? "cursor-not-allowed opacity-45" : "cursor-pointer"
                                }`}
                                style={{ color: checked ? INK : "#5F554B", fontFamily: sans }}
                              >
                                <input
                                  type="radio"
                                  name={`size-${p.slug}`}
                                  value={s.ml}
                                  checked={checked}
                                  disabled={unavailable && !checked}
                                  onChange={() => setSizes((cur) => ({ ...cur, [p.slug]: s.ml }))}
                                  className="peer sr-only"
                                />
                                <span
                                  aria-hidden
                                  className="flex h-[8px] w-[8px] shrink-0 items-center justify-center rounded-[2px] border transition-colors peer-focus-visible:ring-1 md:h-[11px] md:w-[11px] md:rounded-[3px]"
                                  style={{ borderColor: checked ? COPPER : COPPER_SOFT }}
                                >
                                  {checked && <span className="h-[4px] w-[4px] rounded-[1px] md:h-[6px] md:w-[6px] md:rounded-[2px]" style={{ background: COPPER }} />}
                                </span>
                                {s.ml}ml
                              </label>
                            );
                          })}
                        </fieldset>

                        <div className="mt-auto flex w-full flex-col items-stretch gap-1.5 pt-3 md:w-[90%] md:gap-2 md:pt-4">
                          <button
                            type="button"
                            onClick={() => add(p)}
                            disabled={unavailable || action === "loading"}
                            aria-live="polite"
                            className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-[6px] border px-1 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 md:min-h-[42px] md:py-2.5 md:text-[12px] md:tracking-[0.12em] ${
                              unavailable
                                ? "cursor-not-allowed border-[#D9CDBA] bg-white text-[#B9AD9A]"
                                : "border-[#9C5A2B] bg-white text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white disabled:cursor-wait disabled:opacity-80"
                            }`}
                            style={{ fontFamily: sans }}
                          >
                            {unavailable ? (
                              "Sold out"
                            ) : action === "loading" ? (
                              <>
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
                                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                Adding
                              </>
                            ) : action === "added" ? (
                              <>
                                <span aria-hidden="true">✓</span>
                                Added
                              </>
                            ) : (
                              <>
                                Add to cart
                                <CartIcon size={xs || m ? 11 : 15} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* collage */}
        <section className="relative overflow-hidden" style={{ background: T.soft }}>
          <div className="mx-auto grid max-w-[1400px] items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-12 md:px-8 md:py-20 lg:px-12">
            <div className="relative order-1 h-[270px] w-full sm:h-[360px] md:order-2 md:h-[460px] lg:h-[520px]">
              {CONFIG.collage.map((c, i) => (
                <div key={i} style={tile(i)}>
                  {c.src &&
                    (c.type === "video" ? (
                      <video src={c.src} autoPlay muted loop playsInline style={fill} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.src}
                        alt=""
                        loading="lazy"
                        style={i === 0 ? { width: "100%", height: "auto", display: "block" } : fill}
                      />
                    ))}
                </div>
              ))}
            </div>

            <div className="order-2 text-center md:order-1 md:text-left">
              <p className="m-0 text-[11px] font-medium uppercase tracking-[0.3em] text-[#111111]/60 md:text-xs">
                Just landed
              </p>
              <h2
                className="mq-serif m-0 mt-3 font-medium leading-[1.05]"
                style={{ color: COPPER, fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
              >
                New perfume collection
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[#111111]/70 md:mx-0 md:text-[15px]">
                Fresh scents, made in small batches and made to last. Find the one that feels like you.
              </p>
              <a
                href="/shopallperfume"
                className="mt-7 inline-block rounded-[6px] px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#7d4720]"
                style={{ background: COPPER, fontFamily: sans }}
              >
                Explore Collection
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Floating cart button (appears once something is in the cart) */}
      {count > 0 && !open && (
        <button
          ref={cartBtnRef}
          type="button"
          aria-label={`Open cart, ${count} items`}
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-[6px] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white shadow-lg transition-colors hover:bg-[#7d4720]"
          style={{ background: COPPER, fontFamily: sans }}
        >
          <CartIcon size={16} /> Cart ({count})
        </button>
      )}

      {/* cart drawer (reads the same saved cart as the cart page) */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        aria-label="Cart"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-[60] flex h-[100dvh] w-[min(420px,100vw)] flex-col shadow-xl transition-[transform,visibility] duration-300 ease-out ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
        style={{ background: CREAM, color: INK, fontFamily: sans }}
      >
        <div className="flex items-center justify-between border-b border-[#9C5A2B]/25 px-5 py-4">
          <h2 className="mq-serif m-0 text-2xl font-medium" style={{ color: COPPER }}>Your cart</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            tabIndex={open ? 0 : -1}
            className="flex h-9 w-9 items-center justify-center text-[#9C5A2B]"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {cartLines.length === 0 && (
            <p className="m-0 py-10 text-center text-[14px] text-[#111111]/60">Your cart is empty. Choose a fragrance to begin.</p>
          )}
          {cartLines.map((l) => {
            const qty = Number(l.qty) || 1;
            return (
              <div
                key={l.slug + "-" + l.ml}
                className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-3 border-b border-[#9C5A2B]/20 py-4"
              >
                <div className="grid h-[80px] w-[64px] place-items-center overflow-hidden rounded-[10px]" style={{ background: T.soft }}>
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt={l.name} style={fill} />
                  ) : (
                    <Bottle color="#6e6e6e" cap="#9a9a9a" style={{ width: "60%" }} />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="mq-serif m-0 text-lg font-medium leading-tight" style={{ color: COPPER }}>{l.name}</h4>
                  <p className="m-0 mt-0.5 text-[12px] text-[#111111]/60">{l.ml} ml · {money(unitOf(l))}</p>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="inline-flex items-center rounded-[6px] border border-[#9C5A2B] text-[#9C5A2B]">
                      <button type="button" onClick={() => change(l, -1)} aria-label="Decrease" tabIndex={open ? 0 : -1} className="flex h-8 w-8 items-center justify-center text-base">−</button>
                      <span className="w-6 text-center text-[13px] font-semibold">{qty}</span>
                      <button type="button" onClick={() => change(l, 1)} aria-label="Increase" tabIndex={open ? 0 : -1} className="flex h-8 w-8 items-center justify-center text-base">+</button>
                    </span>
                    <button
                      type="button"
                      onClick={() => change(l, -qty)}
                      tabIndex={open ? 0 : -1}
                      className="text-[12px] text-[#9C5A2B] underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <strong className="text-[14px] font-semibold" style={{ color: COPPER }}>{money(unitOf(l) * qty)}</strong>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#9C5A2B]/25 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <div className="flex items-center justify-between text-base font-semibold" style={{ color: COPPER }}>
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <Link
            href="/cart"
            onClick={closeCart}
            tabIndex={open ? 0 : -1}
            className={`mt-3 block w-full rounded-[6px] px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-colors ${
              cartLines.length ? "hover:bg-[#7d4720]" : "pointer-events-none opacity-40"
            }`}
            style={{ background: COPPER, fontFamily: sans }}
          >
            View cart
          </Link>
        </div>
      </aside>

      <div
        role="status"
        className={`pointer-events-none fixed bottom-20 left-1/2 z-[80] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 px-5 py-3 text-center text-sm text-white shadow-lg transition-all duration-300 md:bottom-6 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
        style={{ background: COPPER, fontFamily: sans }}
      >
        {toast}
      </div>
    </div>
  );
}