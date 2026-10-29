"use client";

import Link from "next/link";
import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { CATEGORIES, Category, Product, products as allProducts } from "@/data/products";
import { productHref } from "@/lib/productHref";

const CREAM = "#FFF9F3";

// ---- Fonts and colours: same as the "Choose Your Bottle" section ----
const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const INK = "#111111";
const BORDER = "#EADFCC";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// Size of the heading "You are in Best Sellers" (same as the other section headings)
const HEADING_SIZE = "clamp(2rem, 4vw, 3rem)";

// Prices look like the reference: Rs. 799.00
const money = (n: number) =>
  "Rs. " + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// "Musk & Powdery" -> "musk-powdery" (matches the slugs used in the navbar)
const slugOf = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ---- Sizes ----
type SizeOption = {
  ml: number;
  price: number;
  originalPrice?: number;
  soldOut?: boolean;
};

// Optional extra fields. If a product in "@/data/products" has them, they are used.
//   slug:    "silky-oudh"  (if missing, it is made from the name)
//   sizes:   [{ ml: 10, price: 799, originalPrice: 1598 }, { ml: 30, ... }, { ml: 50, ... }, { ml: 100, ... }]
//   notes:   ["Fresh", "Marine", "Powdery"]
//   soldOut: true
type ProductEx = Product & {
  slug?: string;
  sizes?: SizeOption[];
  notes?: string[];
  soldOut?: boolean;
};

// If a product has no "sizes" yet, its normal price is treated as the 10ml price
// and the other sizes are worked out from it. Add real prices to the data when you have them.
const DEFAULT_STEPS = [
  { ml: 10, mult: 1 },
  { ml: 30, mult: 2.25 },
  { ml: 50, mult: 3.4 },
  { ml: 100, mult: 5.6 },
];

function getSizes(p: ProductEx): SizeOption[] {
  if (p.sizes && p.sizes.length > 0) return p.sizes;
  return DEFAULT_STEPS.map(({ ml, mult }) => ({
    ml,
    price: Math.round(p.price * mult),
    originalPrice: p.originalPrice ? Math.round(p.originalPrice * mult) : undefined,
  }));
}

// ---------------------------------------------------------------------------
// WISHLIST + CART STORAGE
// Same keys and item shape as app/wishlist/page.tsx and app/cart/page.tsx.
// After every change we fire "mirqas-storage" so the pages and the navbar update.
// ---------------------------------------------------------------------------
const WISHLIST_KEY = "mirqas-wishlist";
const CART_KEY = "mirqas-cart";
const SYNC_EVENT = "mirqas-storage";

type WishItem = {
  slug: string;
  name: string;
  image?: string;
  notes?: string[];
  sizes: SizeOption[];
  soldOut?: boolean;
};

type CartLine = {
  slug: string;
  name: string;
  image?: string;
  notes?: string[];
  sizes: SizeOption[];
  ml: number;
  qty: number;
};

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

function addLineToCart(item: WishItem, ml: number) {
  const cart = readList<CartLine>(CART_KEY);
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

// ---- Icons ----
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

/**
 * Shows the product VIDEO directly (no image thumbnail on top of it).
 * - autoplays muted + inline, which phones allow
 * - plays while on screen and pauses when scrolled away (saves battery and data)
 * - the image is only a last-resort fallback if a product has no video, or the video fails to load
 */
function ProductMedia({ src, video, alt }: { src: string; video?: string; alt: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const showVideo = !!video && !videoFailed;

  useEffect(() => {
    const v = videoRef.current;
    const box = boxRef.current;
    if (!v || !box) return;

    // React does not always write the "muted" attribute, and phones refuse to autoplay without it
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;

    const play = () => {
      if (reduce || !visible) return;
      v.play().catch(() => {
        // Blocked (e.g. battery saver): it will retry on the first touch below
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
        else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(box);

    // Some phones only allow playback after the first touch: retry once then
    window.addEventListener("touchstart", play, { once: true, passive: true });
    v.addEventListener("loadeddata", play);

    return () => {
      io.disconnect();
      window.removeEventListener("touchstart", play);
      v.removeEventListener("loadeddata", play);
      v.pause();
    };
  }, [video]);

  return (
    <div ref={boxRef} className="relative h-full w-full bg-[#F6EEE0]">
      {showVideo ? (
        <video
          ref={videoRef}
          src={video}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-label={alt}
          onError={() => setVideoFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : src && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-center text-[12px] text-black/45">
          Video unavailable
        </div>
      )}
    </div>
  );
}

type CartItem = { productId: string | number | undefined; name: string; ml: number; price: number };

function ProductCard({
  p,
  onAddToCart,
}: {
  p: ProductEx;
  onAddToCart?: (item: CartItem) => void;
}) {
  const sizes = getSizes(p);
  const firstAvailable = sizes.find((s) => !s.soldOut) ?? sizes[0];
  const [selectedMl, setSelectedMl] = useState(firstAvailable.ml);
  const [wished, setWished] = useState(false);
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");

  const slug = p.slug ?? slugOf(p.name);

  const current = sizes.find((s) => s.ml === selectedMl) ?? firstAvailable;
  const unavailable = !!p.soldOut || !!current.soldOut;

  const discounted = current.originalPrice !== undefined && current.originalPrice > current.price;
  const pct = discounted
    ? Math.round(((current.originalPrice! - current.price) / current.originalPrice!) * 100)
    : 0;

  // Every card now opens /product/<slug>, for example /product/silky-oudh
  const base = productHref(p);
  const buyHref = `${base}?size=${current.ml}ml`;

  // What gets saved into the wishlist / cart pages
  const storedItem: WishItem = {
    slug,
    name: p.name,
    image: p.image,
    notes: p.notes,
    sizes,
    soldOut: p.soldOut,
  };

  // The heart follows the saved wishlist (also when it changes on another page or tab)
  useEffect(() => {
    const sync = () => setWished(readList<WishItem>(WISHLIST_KEY).some((i) => i.slug === slug));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SYNC_EVENT, sync);
    };
  }, [slug]);

  const toggleWish = () => {
    const list = readList<WishItem>(WISHLIST_KEY);
    const next = list.some((i) => i.slug === slug)
      ? list.filter((i) => i.slug !== slug)
      : [...list, storedItem];
    writeList(WISHLIST_KEY, next);
  };

  // Spinner for a moment, then the item goes into the cart page's list
  const handleAdd = () => {
    if (unavailable || status !== "idle") return;
    setStatus("adding");
    window.setTimeout(() => {
      addLineToCart(storedItem, current.ml);
      onAddToCart?.({ productId: p.id, name: p.name, ml: current.ml, price: current.price });
      setStatus("added");
      window.setTimeout(() => setStatus("idle"), 1500);
    }, 700);
  };

  const radioName = `size-${p.id ?? p.name}`;

  return (
    <li
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)]"
      style={{ borderColor: BORDER }}
    >
      {/* Video / image with a heart on top. Soft curved corners. */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px]">
        <Link
          href={base}
          aria-label={`View ${p.name}`}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#9C5A2B]"
        >
          <ProductMedia src={p.image} video={p.video} alt={p.name} />
        </Link>

        <button
          type="button"
          onClick={toggleWish}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-105 md:right-3 md:top-3 md:h-9 md:w-9"
          style={{ color: wished ? "#C0392B" : "#555555" }}
        >
          <HeartIcon filled={wished} />
        </button>
      </div>

      {/* Details (no brand heading) */}
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
          <Link href={base}>{p.name}</Link>
        </h3>

        {/* Notes: Fresh • Marine • Powdery (only if the product has notes) */}
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

        {/* Buttons (pushed to the bottom so every card lines up) */}
        <div className="mt-auto flex w-full flex-col items-stretch gap-1.5 pt-3 md:w-[90%] md:gap-2 md:pt-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={unavailable || status === "adding"}
            aria-live="polite"
            className={`flex items-center justify-center gap-1.5 rounded-[6px] border px-1 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 md:py-2.5 md:text-[12px] md:tracking-[0.12em] ${
              unavailable
                ? "cursor-not-allowed border-[#D9CDBA] bg-white text-[#B9AD9A]"
                : "border-[#9C5A2B] bg-white text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white disabled:cursor-wait"
            }`}
            style={{ fontFamily: sans }}
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
    </li>
  );
}

interface Props {
  products?: Product[];
  // Optional: called after an item is added to the cart (the cart page is already updated).
  onAddToCart?: (item: CartItem) => void;
}

export default function PerfumeCategorySection({ products = allProducts, onAddToCart }: Props) {
  const [selected, setSelected] = useState<Category>("Best Sellers");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  // Only 4 cards: the 4th product is removed and the 5th product takes its place.
  const visible = useMemo(() => {
    const list =
      selected === "Best Sellers"
        ? products.filter((p) => p.isBestSeller)
        : products.filter((p) => p.category === selected);
    return list.length >= 5 ? [list[0], list[1], list[2], list[4]] : list.slice(0, 4);
  }, [products, selected]);

  // Jump here from the navbar: select the category and scroll to this section.
  //  - from another page:  /?category=musk-powdery#perfume-categories
  //  - already on the homepage: the navbar sends a "select-category" event
  useEffect(() => {
    const apply = (slug: string | null) => {
      if (!slug) return;
      const match = CATEGORIES.find((c) => slugOf(c) === slug);
      if (!match) return;
      setSelected(match);
      setOpen(false);
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    apply(new URLSearchParams(window.location.search).get("category"));

    const onSelect = (e: Event) => apply((e as CustomEvent<string>).detail);
    window.addEventListener("select-category", onSelect);
    return () => window.removeEventListener("select-category", onSelect);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const openMenu = () => {
    setActive(CATEGORIES.indexOf(selected));
    setOpen(true);
  };

  const choose = (c: Category) => {
    setSelected(c);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const last = CATEGORIES.length - 1;
    switch (e.key) {
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else setActive((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(last);
        }
        break;
      case "Enter":
      case " ":
        if (open) {
          e.preventDefault();
          choose(CATEGORIES[active]);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <section
      ref={sectionRef}
      id="perfume-categories"
      aria-labelledby={`${listId}-heading`}
      className="w-full scroll-mt-4"
      style={{ background: CREAM, fontFamily: sans }}
    >
      <div className="mx-auto max-w-[1600px] px-3 py-14 md:px-8 md:py-20 lg:px-12">
        {/* Heading + dropdown: serif, copper, medium (same style as "Choose Your Bottle") */}
        <div className="flex flex-wrap items-baseline justify-center gap-x-3">
          <h2
            id={`${listId}-heading`}
            className="m-0 font-medium leading-tight"
            style={{ fontFamily: serif, color: COPPER, fontSize: HEADING_SIZE }}
          >
            You are in
          </h2>

          <div ref={wrapRef} className="relative" onKeyDown={onKeyDown}>
            <button
              ref={btnRef}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listId}
              aria-label={`Fragrance category: ${selected}. Change category`}
              onClick={() => (open ? setOpen(false) : openMenu())}
              className="inline-flex items-center gap-2 border-b pb-0.5 font-medium leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9C5A2B]"
              style={{ fontFamily: serif, color: COPPER, borderColor: COPPER, fontSize: HEADING_SIZE }}
            >
              {selected}
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden
                className={`fill-none stroke-current transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                strokeWidth="1.8"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <ul
              id={listId}
              role="listbox"
              aria-label="Fragrance categories"
              aria-activedescendant={open ? `${listId}-opt-${active}` : undefined}
              className={`absolute left-1/2 top-full z-20 mt-3 w-[min(78vw,260px)] -translate-x-1/2 rounded-[12px] border bg-white py-2 shadow-sm transition-all duration-200 ease-out motion-reduce:transition-none ${
                open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-2 opacity-0"
              }`}
              style={{ borderColor: BORDER, fontFamily: sans }}
            >
              {CATEGORIES.map((c, i) => {
                const isSelected = c === selected;
                return (
                  <li
                    key={c}
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => choose(c)}
                    className="cursor-pointer px-5 py-2.5 text-left text-[15px] tracking-[0.04em] transition-colors"
                    style={{
                      color: isSelected ? COPPER : INK,
                      fontWeight: isSelected ? 600 : 400,
                      background: i === active ? "#F6EDE3" : "transparent",
                    }}
                  >
                    {c}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Products: 2 per row on phones (like the reference), 4 per row on large screens */}
        <div className="mt-10 md:mt-12" aria-live="polite">
          {visible.length > 0 ? (
            <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 md:grid-cols-4 md:gap-4 lg:gap-6">
              {visible.map((p, i) => (
                <ProductCard key={p.id ?? `${p.name}-${i}`} p={p as ProductEx} onAddToCart={onAddToCart} />
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-[16px]" style={{ color: INK }}>
              No perfumes found in this category.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}