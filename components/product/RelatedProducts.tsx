"use client";

// "Related products": cards with curved corners, a heart, Add to cart and
// the 4 sizes (10ml, 30ml, 50ml, 100ml) in curved square boxes.

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addLineToCart,
  formatPrice,
  sizesFor,
  toggleWishlist,
  useWished,
  type WishItem,
} from "@/lib/shopStorage";

const COPPER = "#9C5A2B";
const INK = "#111111";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// What /api/products sends (prices are in paise)
type ApiProduct = {
  slug: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  notes: string[];
  inStock: boolean;
  category: string;
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function RelatedCard({ p }: { p: ApiProduct }) {
  const onSale = p.salePrice != null;
  const base = (onSale ? p.salePrice! : p.price) / 100;
  const mrp = onSale ? p.price / 100 : undefined;
  const sizes = sizesFor(base, mrp);

  const [sizeIndex, setSizeIndex] = useState(0); // 10ml, same as the shop cards
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");
  const wished = useWished(p.slug);

  const current = sizes[sizeIndex];
  const discounted = current.originalPrice !== undefined && current.originalPrice > current.price;
  const pct = discounted
    ? Math.round(((current.originalPrice! - current.price) / current.originalPrice!) * 100)
    : 0;
  const unavailable = !p.inStock;

  const href = `/product/${p.slug}?size=${current.ml}ml`;

  const item: WishItem = {
    slug: p.slug,
    name: p.name,
    image: p.images[0],
    hoverImage: p.images[1],
    notes: p.notes.length ? p.notes : undefined,
    sizes,
    soldOut: unavailable,
  };

  const handleAdd = () => {
    if (unavailable || status !== "idle") return;
    setStatus("adding");
    setTimeout(() => {
      addLineToCart(item, current.ml);
      setStatus("added");
      setTimeout(() => setStatus("idle"), 1500);
    }, 700);
  };

  return (
    <li
      className="group flex h-full list-none flex-col overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)]"
      style={{ borderColor: CARD_LINE, fontFamily: sans }}
    >
      {/* Picture + heart */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F6EEE0]">
        <Link href={href} aria-label={`View ${p.name}`} className="block h-full w-full">
          {p.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.images[0]}
              alt={p.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : null}
        </Link>

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
          onClick={() => toggleWishlist(item)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-105 md:right-3 md:top-3 md:h-9 md:w-9"
          style={{ color: wished ? "#C0392B" : "#555555" }}
        >
          <svg {...iconProps} className="h-[14px] w-[14px] md:h-[18px] md:w-[18px]" fill={wished ? "currentColor" : "none"}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>

      {/* Text + sizes + button */}
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
          <Link href={href}>{p.name}</Link>
        </h3>

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

        {/* 4 sizes: square boxes, every corner curved */}
        <div className="mt-2 grid w-full grid-cols-4 gap-1.5 md:mt-3 md:gap-2" role="radiogroup" aria-label="Choose a size">
          {sizes.map((s, i) => {
            const active = i === sizeIndex;
            return (
              <button
                key={s.ml}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSizeIndex(i)}
                className={`flex aspect-square items-center justify-center rounded-[8px] border text-[9px] font-medium lowercase transition-colors md:rounded-[10px] md:text-[11px] lg:text-[12px] ${
                  active
                    ? "border-[#9C5A2B] bg-[#9C5A2B]/10 text-[#9C5A2B]"
                    : "border-[#EADFCC] bg-white text-[#5F554B] hover:border-[#9C5A2B]/50"
                }`}
              >
                {s.ml}ml
              </button>
            );
          })}
        </div>

        {/* Add to cart */}
        <div className="mt-auto w-full pt-3 md:pt-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={unavailable || status === "adding"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-1.5 rounded-[6px] border px-1 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 md:py-2.5 md:text-[12px] md:tracking-[0.12em] ${
              unavailable
                ? "cursor-not-allowed border-[#D9CDBA] bg-white text-[#B9AD9A]"
                : "border-[#9C5A2B] bg-white text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white disabled:cursor-wait"
            }`}
          >
            {unavailable ? (
              "Sold out"
            ) : status === "adding" ? (
              <>
                <svg className="h-3 w-3 animate-spin md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Adding
              </>
            ) : status === "added" ? (
              "Added ✓"
            ) : (
              <>
                Add to cart
                <svg {...iconProps} className="h-[11px] w-[11px] md:h-[15px] md:w-[15px]">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function RelatedProducts({ slug, category }: { slug: string; category: string }) {
  const [items, setItems] = useState<ApiProduct[]>([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const get = async (query: string): Promise<ApiProduct[]> => {
      const res = await fetch(`/api/products?${query}`);
      if (!res.ok) return [];
      const d = (await res.json()) as { items?: ApiProduct[] };
      return d.items ?? [];
    };

    (async () => {
      // 1) same fragrance category  2) fill the rest with other perfumes
      const same = category ? await get(`category=${encodeURIComponent(category)}&limit=12`) : [];
      const list = same.filter((p) => p.slug !== slug);

      if (list.length < 4) {
        const more = await get("limit=12");
        for (const p of more) {
          if (p.slug !== slug && !list.some((x) => x.slug === p.slug)) list.push(p);
        }
      }
      if (!cancelled) setItems(list.slice(0, 4));
    })().catch(() => {
      if (!cancelled) setItems([]);
    });

    return () => {
      cancelled = true;
    };
  }, [slug, category]);

  if (items.length === 0) return null;

  return (
    <section className="border-t pt-10" style={{ borderColor: "rgba(156,90,43,0.25)", color: INK }}>
      <h2 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
        Related products
      </h2>

      <ul className="m-0 mt-8 grid list-none grid-cols-2 gap-2.5 p-0 md:grid-cols-4 md:gap-4 lg:gap-6">
        {items.map((p) => (
          <RelatedCard key={p.slug} p={p} />
        ))}
      </ul>
    </section>
  );
}