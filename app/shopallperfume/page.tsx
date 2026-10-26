"use client";

// app/perfumes/page.tsx  (Next.js App Router + Tailwind)
// Visit: http://localhost:3000/perfumes
// Layout: banner, title, filters sidebar, sort + count, product grid, features strip.
// Theme: black background, gold + copper text (same as /oud-arabian).

import { useEffect, useMemo, useRef, useState } from "react";

const GOLD = "#D4A017";
const COPPER = "#B87333";
const LINE = "#3a2a12";

// Where the "View All Collections" button goes
const COLLECTIONS_HREF = "/collections";

// Bottle sizes the customer can choose from on every card
const SIZES = ["6 ml", "12 ml"] as const;
type Size = (typeof SIZES)[number];

// ---------------------------------------------------------------------------
// 1. IMAGE URLS: paste yours here (https://... direct image link, or /perfumes/x.jpg
//    for a file inside /public). Leave "" to show the placeholder.
// ---------------------------------------------------------------------------
const BANNER_IMAGE = "https://images.pexels.com/photos/16239693/pexels-photo-16239693.jpeg";

type Perfume = {
  slug: string;
  name: string;
  size: string;
  price: number; // plain number so price sorting/filtering works
  prices?: Partial<Record<Size, number>>; // optional price per bottle size, e.g. { "6 ml": 899, "12 ml": 1499 }
  image?: string; // <- product image URL goes here
  hoverImage?: string; // <- second image URL, shown when the card is hovered
  badge?: string; // e.g. "#1 Best Seller", "Best Seller", "New"
  soldOut?: boolean;
  featured?: boolean;
  sales: number; // used by "Best selling"
  added: string; // YYYY-MM-DD, used by "Date" sorts
  gender: "Men" | "Women" | "Unisex";
  occasion: string[];
  family: string; // fragrance family
};

// ---------------------------------------------------------------------------
// 2. PRODUCTS: replace with your real data (or map data/products.tsx to this shape)
//    Add `prices: { "6 ml": ..., "12 ml": ... }` to a product if the two sizes cost different.
//    Without it, both sizes show the normal `price`.
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
// 3. FILTER GROUPS: add/remove options freely. "key" must be a field on Perfume.
//    If your men-section filters are different, just edit this list.
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
const formatPrice = (n: number) =>
  "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const priceFor = (p: Perfume, size: Size) => p.prices?.[size] ?? p.price;

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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? GOLD : "none"} stroke={filled ? GOLD : "currentColor"} strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
      <path d="M12 20.5s-7.5-4.6-9-9.3C2 7.9 4 5 7 5c1.9 0 3.5 1 5 3 1.5-2 3.1-3 5-3 3 0 5 2.9 4 6.2-1.5 4.7-9 9.3-9 9.3z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 4h2l2.2 11h10.6L20 7H6.2" />
      <circle cx="9" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </svg>
  );
}

// Round selector (instead of the square checkbox). Works as a checkbox or a radio.
function CircleOption({
  type,
  name,
  checked,
  onChange,
  label,
  className = "",
  disabled,
}: {
  type: "checkbox" | "radio";
  name?: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
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
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#D4A017]/70 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black"
        style={{ borderColor: checked ? GOLD : COPPER }}
      >
        <span
          className={`h-2 w-2 rounded-full transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`}
          style={{ background: GOLD }}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}

// Custom sort dropdown so the highlight colour matches the theme
// (the browser's native <select> list always shows a blue highlight).
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
        className="flex w-full items-center justify-between border bg-black px-4 py-2.5 text-left text-[#D4A017] outline-none focus-visible:border-[#D4A017]"
        style={{ borderColor: open ? GOLD : COPPER }}
      >
        <span>{current}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-30 mt-1 w-full overflow-hidden border bg-black shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          style={{ borderColor: COPPER }}
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
                  className={`block w-full px-4 py-2.5 text-left normal-case tracking-[0.1em] transition-colors ${
                    active
                      ? "bg-[#D4A017] text-black"
                      : "text-[#D4A017] hover:bg-[#B87333] hover:text-black"
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

function ProductCard({
  p,
  wished,
  onToggleWish,
}: {
  p: Perfume;
  wished: boolean;
  onToggleWish: (slug: string) => void;
}) {
  const [size, setSize] = useState<Size>(SIZES[0]);
  const [added, setAdded] = useState(false);

  // "Added" confirmation goes back to normal after 1.8 seconds
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  const addToCart = () => {
    if (p.soldOut) return;
    // TODO: connect your cart here, e.g. addItem({ slug: p.slug, size, price: priceFor(p, size) })
    setAdded(true);
  };

  return (
    <div className="text-center">
      {/* image + wishlist heart */}
      <div className="group relative overflow-hidden">
        <a href={`/perfumes/${p.slug}`} className="block" aria-label={p.name}>
          {p.image ? (
            <>
              {/* main image (fades out on hover when a hover image exists) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt={p.name}
                className={`aspect-square w-full object-cover transition duration-700 ${
                  p.hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"
                }`}
              />
              {/* hover image (fades in on top) */}
              {p.hoverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.hoverImage}
                  alt={`${p.name} alternate view`}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <Placeholder label={p.name} className="aspect-square w-full" />
          )}
        </a>

        {p.badge && (
          <span
            className="pointer-events-none absolute left-0 top-3 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-black sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.2em]"
            style={{ background: COPPER }}
          >
            {p.badge}
          </span>
        )}
        {p.soldOut && (
          <span
            className="pointer-events-none absolute bottom-2 left-2 bg-black/85 px-2 py-1 text-[9px] uppercase tracking-[0.25em] sm:text-[10px]"
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
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-[#D4A017] transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4A017]"
        >
          <HeartIcon filled={wished} />
        </button>
      </div>

      {/* name + price */}
      <a href={`/perfumes/${p.slug}`} className="block">
        <h3 className="mt-4 text-[11px] uppercase tracking-[0.15em] sm:mt-5 sm:text-sm sm:tracking-[0.3em]">{p.name}</h3>
        <p className="mt-2 text-xs text-white sm:text-sm">{formatPrice(priceFor(p, size))}</p>
      </a>

      {/* size choice: 6 ml / 12 ml */}
      <div role="radiogroup" aria-label={`${p.name} bottle size`} className="mt-3 flex items-center justify-center gap-4">
        {SIZES.map((s) => (
          <CircleOption
            key={s}
            type="radio"
            name={`size-${p.slug}`}
            checked={size === s}
            onChange={() => setSize(s)}
            label={s}
            className="gap-1.5 text-[11px] text-[#C9A24B] hover:text-[#D4A017] sm:text-xs"
          />
        ))}
      </div>

      {/* add to cart */}
      <button
        type="button"
        onClick={addToCart}
        disabled={p.soldOut}
        aria-live="polite"
        className="mt-3 flex w-full items-center justify-center gap-2 border px-2 py-2.5 text-[10px] uppercase tracking-[0.15em] transition-colors hover:bg-[#D4A017] hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#D4A017] sm:text-xs sm:tracking-[0.2em]"
        style={{ borderColor: GOLD }}
      >
        {p.soldOut ? (
          "Sold out"
        ) : added ? (
          "Added ✓"
        ) : (
          <>
            Add to cart <CartIcon />
          </>
        )}
      </button>
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

  const FiltersPanel = (
    <div>
      {activeCount > 0 && (
        <button onClick={clearAll} className="mb-6 text-xs uppercase tracking-[0.3em] underline" style={{ color: COPPER }}>
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
                    className="text-sm text-[#C9A24B] hover:text-[#D4A017]"
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
            <input type="number" min={0} placeholder="₹ Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setVisible(PAGE_SIZE); }} className="w-full border bg-black px-3 py-2 text-sm text-[#D4A017] outline-none placeholder:text-[#6b5320] focus:border-[#D4A017]" style={{ borderColor: COPPER }} />
            <span style={{ color: COPPER }}>-</span>
            <input type="number" min={0} placeholder="₹ Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setVisible(PAGE_SIZE); }} className="w-full border bg-black px-3 py-2 text-sm text-[#D4A017] outline-none placeholder:text-[#6b5320] focus:border-[#D4A017]" style={{ borderColor: COPPER }} />
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
    <main className="min-h-screen bg-black text-[#D4A017]">
      {/* BANNER */}
      <section className="relative h-48 w-full overflow-hidden md:h-64">
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

      {/* FILTER + GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        {/* top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: LINE }}>
          <button onClick={() => setMobileFilters(true)} className="flex items-center gap-3 uppercase tracking-[0.3em] lg:pointer-events-none">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7h18M3 12h18M3 17h18" />
              <circle cx="8" cy="7" r="2" fill="#000" />
              <circle cx="16" cy="12" r="2" fill="#000" />
              <circle cx="10" cy="17" r="2" fill="#000" />
            </svg>
            Filters{activeCount > 0 && ` (${activeCount})`}
          </button>

          <div className="flex flex-wrap items-center gap-5 text-xs uppercase tracking-[0.2em]">
            <span style={{ color: COPPER }}>Showing - {shown.length} out of {filtered.length} products</span>
            <SortDropdown value={sort} onChange={setSort} options={SORTS} />
          </div>
        </div>

        <div className="mt-8 flex gap-10">
          {/* sidebar (desktop) - stays in view while you scroll */}
          <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-64 shrink-0 self-start overflow-y-auto pr-2 [scrollbar-color:#B87333_#000] [scrollbar-width:thin] lg:block">
            {FiltersPanel}
          </aside>

          {/* grid: 2 columns on phones, 2 on tablets, 3 on large screens */}
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-7 xl:grid-cols-3">
              {shown.map((p) => (
                <ProductCard key={p.slug} p={p} wished={wishlist.includes(p.slug)} onToggleWish={toggleWish} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-20 text-center">
                <p className="uppercase tracking-[0.3em]" style={{ color: COPPER }}>No products found</p>
                <button onClick={clearAll} className="mt-6 border px-6 py-2 text-xs uppercase tracking-[0.3em] hover:bg-[#D4A017] hover:text-black" style={{ borderColor: GOLD }}>
                  Clear filters
                </button>
              </div>
            )}

            {visible < filtered.length && (
              <div className="mt-12 text-center">
                <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="border px-10 py-3 text-xs uppercase tracking-[0.3em] transition hover:bg-[#D4A017] hover:text-black" style={{ borderColor: GOLD }}>
                  Load more
                </button>
              </div>
            )}

            {/* View All Collections */}
            <div className="mt-12 text-center">
              {/* <a
                href={COLLECTIONS_HREF}
                className="inline-flex items-center justify-center gap-3 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:bg-[#D4A017] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4A017]"
                style={{ background: COPPER }}
              >
                View All Collections
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a> */}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y py-16" style={{ borderColor: LINE }}>
        <div className="mx-auto grid max-w-4xl gap-10 px-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              <svg viewBox="0 0 24 24" className="mx-auto h-9 w-9" fill="none" stroke={COPPER} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.icon} />
              </svg>
              <h3 className="mt-4 text-sm uppercase tracking-[0.3em]">{f.title}</h3>
              <p className="mt-2 text-sm text-[#C9A24B]">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto border-r bg-black p-6" style={{ borderColor: COPPER }}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg uppercase tracking-[0.3em]">Filters</h2>
              <button onClick={() => setMobileFilters(false)} aria-label="Close filters" className="text-2xl leading-none">×</button>
            </div>
            {FiltersPanel}
            <button onClick={() => setMobileFilters(false)} className="mt-6 w-full border py-3 text-xs uppercase tracking-[0.3em] hover:bg-[#D4A017] hover:text-black" style={{ borderColor: GOLD }}>
              Show {filtered.length} products
            </button>
          </div>
        </div>
      )}
    </main>
  );
}