"use client";

// Save as: app/shop/men/page.tsx
// Images go in: public/perfumes/<slug>/main.jpg  and  public/perfumes/<slug>/hover.jpg

import { ReactNode, useEffect, useMemo, useState } from "react";

// Brand (same as the other pages)
const COPPER = "#9C5A2B";
const COPPER_DARK = "#7d4720";
const IVORY = "#FCF8F0";
const SAND = "#F6EEE0";
const INK = "#111111";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// Product photos (shared placeholders, replace per product)
const IMG = "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";
const IMG_HOVER = "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";

type Perfume = {
    slug: string;
    name: string;
    price: number;
    mrp: number;
    category: string; // must match a slug in `categories` below
    inStock: boolean;
    badge?: string;
};

const categories = [
    { label: "Oud & Woody", slug: "oud-woody" },
    { label: "Fresh & Aquatic", slug: "fresh-aquatic" },
    { label: "Floral", slug: "floral" },
    { label: "Citrus & Fruity", slug: "citrus-fruity" },
    { label: "Amber & Spicy", slug: "amber-spicy" },
    { label: "Musk & Powdery", slug: "musk-powdery" },
    { label: "Sweet & Gourmand", slug: "sweet-gourmand" },
];

const perfumes: Perfume[] = [
    { slug: "celeste", name: "Celeste Eau De Parfum", price: 556, mrp: 695, category: "floral", inStock: true, badge: "Bestseller" },
    { slug: "pristine", name: "Pristine Eau De Parfum", price: 556, mrp: 695, category: "fresh-aquatic", inStock: true },
    { slug: "tales-vanilla", name: "Tales Vanilla Eau De Parfum", price: 596, mrp: 745, category: "sweet-gourmand", inStock: true, badge: "Shop 2 Tales and get 10% extra off" },
    { slug: "sheer", name: "Sheer Eau De Parfum", price: 556, mrp: 695, category: "musk-powdery", inStock: false },
    { slug: "nude", name: "Nude Eau De Parfum", price: 556, mrp: 695, category: "musk-powdery", inStock: true },
    { slug: "verve", name: "Verve Eau De Parfum", price: 596, mrp: 745, category: "citrus-fruity", inStock: true },
    { slug: "aura", name: "Aura Eau De Parfum", price: 596, mrp: 745, category: "oud-woody", inStock: false },
    { slug: "amber-glow", name: "Amber Glow Eau De Parfum", price: 646, mrp: 795, category: "amber-spicy", inStock: true },
    { slug: "bloom", name: "Bloom Eau De Parfum", price: 556, mrp: 695, category: "floral", inStock: true },
    { slug: "midnight-rose", name: "Midnight Rose Eau De Parfum", price: 646, mrp: 795, category: "oud-woody", inStock: true, badge: "New" },
];

// Slider range: from 0 up to the highest price, rounded up to the next 100
const PRICE_MAX = Math.ceil(Math.max(...perfumes.map((p) => p.price)) / 100) * 100;

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

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            className={filled ? "fill-[#9C5A2B] stroke-[#9C5A2B]" : "fill-none stroke-current"}
            strokeWidth="1.5"
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
            width="16"
            height="16"
            className="fill-none stroke-current"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M3 4h2l2.2 11h10.6L20 7H6.2" />
            <circle cx="9" cy="19" r="1.3" />
            <circle cx="17" cy="19" r="1.3" />
        </svg>
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

// Round selector instead of the square checkbox
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

function ProductCard({
    p,
    wished,
    onToggleWish,
}: {
    p: Perfume;
    wished: boolean;
    onToggleWish: (slug: string) => void;
}) {
    const [added, setAdded] = useState(false);

    // "Added" message goes back to normal after about 2 seconds
    useEffect(() => {
        if (!added) return;
        const t = setTimeout(() => setAdded(false), 1800);
        return () => clearTimeout(t);
    }, [added]);

    const addToCart = () => {
        if (!p.inStock) return;
        // TODO: connect your cart here, e.g. addItem({ slug: p.slug, price: p.price })
        setAdded(true);
    };

    return (
        <div className="group relative">
            {p.badge && (
                <span className="pointer-events-none absolute left-0 top-0 z-10 max-w-[140px] bg-[#9C5A2B] px-3 py-2 text-xs font-semibold leading-tight text-white">
                    {p.badge}
                </span>
            )}

            {/* Wishlist heart */}
            <button
                type="button"
                onClick={() => onToggleWish(p.slug)}
                aria-pressed={wished}
                aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
                className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#9C5A2B] shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9C5A2B]"
            >
                <HeartIcon filled={wished} />
            </button>

            {/* Product images (image only, no box behind it) */}
            <a href={`/product/${p.slug}`} className="block" aria-label={p.name}>
                <div className="relative aspect-[3/4] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={IMG}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500 group-hover:opacity-0"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={IMG_HOVER}
                        alt={`${p.name} alternate view`}
                        className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />

                    {!p.inStock && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-[#F6EEE0] px-2.5 py-1 text-[10px] font-bold uppercase text-[#111111]/60">
                            Sold out
                        </span>
                    )}
                </div>
            </a>

            {/* Product details */}
            <div className="mt-4 text-center">
                <a href={`/product/${p.slug}`} className="block">
                    <h3 className="mq-serif text-xl font-medium leading-snug text-[#9C5A2B]">{p.name}</h3>
                    <p className="mt-2 text-sm font-semibold">
                        ₹ {p.price}
                        <span className="ml-2 text-xs font-normal text-[#111111]/45 line-through">₹ {p.mrp}</span>
                    </p>
                </a>

                {/* Add to cart */}
                <button
                    type="button"
                    onClick={addToCart}
                    disabled={!p.inStock}
                    aria-live="polite"
                    className="mt-3 flex w-full items-center justify-center gap-2 border border-[#9C5A2B] bg-[#9C5A2B] px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-not-allowed disabled:border-[#111111]/20 disabled:bg-transparent disabled:text-[#111111]/30 disabled:hover:bg-transparent sm:text-xs"
                >
                    {!p.inStock ? (
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
        </div>
    );
}

export default function MenShopPage() {
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
    const [showInStock, setShowInStock] = useState(false);
    const [showOutOfStock, setShowOutOfStock] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false); // mobile only
    const [wishlist, setWishlist] = useState<string[]>([]);

    const toggleCat = (slug: string) =>
        setSelectedCats((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

    const toggleWish = (slug: string) =>
        setWishlist((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug]));

    const filtersActive =
        selectedCats.length > 0 || minPrice > 0 || maxPrice < PRICE_MAX || showInStock || showOutOfStock;

    const clearAll = () => {
        setSelectedCats([]);
        setMinPrice(0);
        setMaxPrice(PRICE_MAX);
        setShowInStock(false);
        setShowOutOfStock(false);
    };

    const filtered = useMemo(() => {
        return perfumes.filter((p) => {
            if (selectedCats.length && !selectedCats.includes(p.category)) return false;
            if (p.price < minPrice || p.price > maxPrice) return false;
            // If both or neither availability box is ticked, show everything
            if (showInStock !== showOutOfStock) {
                if (showInStock && !p.inStock) return false;
                if (showOutOfStock && p.inStock) return false;
            }
            return true;
        });
    }, [selectedCats, minPrice, maxPrice, showInStock, showOutOfStock]);

    const inStockCount = perfumes.filter((p) => p.inStock).length;
    const outOfStockCount = perfumes.length - inStockCount;

    const leftPct = (minPrice / PRICE_MAX) * 100;
    const rightPct = (maxPrice / PRICE_MAX) * 100;

    return (
        <main className="min-h-screen px-6 py-12 lg:px-16" style={{ background: IVORY, color: INK, fontFamily: sans }}>
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
                {/* Men's perfume video banner */}
                <section className="group relative mb-8 h-[300px] w-full overflow-hidden bg-[#111111] sm:h-[360px] lg:h-[420px]">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster="/perfumes/men-banner-poster.jpg"
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        aria-label="Men's perfume campaign video"
                    >
                        <source
                            src="/videos/w_video.mp4"
                            type="video/mp4"
                        />
                    </video>

                    {/* Warm overlay for readable text */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/25" />

                    {/* Campaign text */}
                    <div className="absolute inset-0 flex items-center justify-center px-5 text-center sm:justify-end sm:pr-[8%] sm:text-left lg:pr-[10%]">
                        <div className="max-w-xl text-white drop-shadow-md">
                            <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] sm:text-sm">
                                Discover your signature scent
                            </p>

                            <h1 className="mq-serif text-4xl font-medium leading-tight sm:text-5xl lg:text-7xl">
                                Make every moment
                                <span className="block text-5xl sm:text-6xl lg:text-8xl">
                                    Special
                                </span>
                            </h1>

                            <a
                                href="#men-perfumes"
                                className="mt-6 inline-flex border border-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-white hover:text-[#9C5A2B] sm:mt-8"
                            >
                                Shop Now
                            </a>
                        </div>
                    </div>
                </section>

                <div className="mb-8 flex items-center justify-between">
                    <p className="text-sm text-[#111111]/60">
                        MEN &nbsp;|&nbsp; {filtered.length} Products
                    </p>

                    {/* Mobile filter toggle */}
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
                        aria-expanded={filtersOpen}
                        className="border border-[#9C5A2B] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9C5A2B] lg:hidden"
                    >
                        {filtersOpen ? "Hide Filters" : "Filters"}
                    </button>
                </div>

                <div
                    id="men-perfumes"
                    className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr] lg:gap-12"
                >
                    {/* ---------- Filter sidebar (stays in place while scrolling) ---------- */}
                    <aside
                        aria-label="Filters"
                        className={`${filtersOpen ? "block" : "hidden"} lg:sticky lg:top-40 lg:block lg:max-h-[calc(100vh-10rem)] lg:self-start lg:overflow-y-auto lg:pr-2 lg:[scrollbar-width:thin] lg:[scrollbar-color:#9C5A2B66_transparent]`}
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

                        {/* Category */}
                        <FilterSection title="Category">
                            <div className="flex flex-col gap-3">
                                {categories.map((c) => (
                                    <CircleOption
                                        key={c.slug}
                                        label={c.label}
                                        count={perfumes.filter((p) => p.category === c.slug).length}
                                        checked={selectedCats.includes(c.slug)}
                                        onChange={() => toggleCat(c.slug)}
                                    />
                                ))}
                            </div>
                        </FilterSection>

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
                                    step={10}
                                    value={minPrice}
                                    aria-label="Minimum price"
                                    onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                                    className="dual-range"
                                />
                                <input
                                    type="range"
                                    min={0}
                                    max={PRICE_MAX}
                                    step={10}
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
                                        onChange={(e) =>
                                            setMinPrice(Math.min(Math.max(Number(e.target.value) || 0, 0), maxPrice))
                                        }
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
                                            setMaxPrice(
                                                Math.max(Math.min(Number(e.target.value) || 0, PRICE_MAX), minPrice)
                                            )
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
                    </aside>

                    {/* ---------- Product grid ---------- */}
                    <div>
                        {filtered.length === 0 ? (
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
                            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 sm:gap-y-14 md:grid-cols-3 xl:grid-cols-4">
                                {filtered.map((p) => (
                                    <ProductCard
                                        key={p.slug}
                                        p={p}
                                        wished={wishlist.includes(p.slug)}
                                        onToggleWish={toggleWish}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}