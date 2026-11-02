"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { productHref } from "@/lib/productHref";
import { ShopProduct, useSectionProducts } from "@/lib/sectionProducts";
import GiftWrapConfirmModal from "@/components/gift/GiftWrapConfirmModal";
import { readList, CART_KEY, SYNC_EVENT, type CartLine, type WrappedItemRef } from "@/lib/shopStorage";
import {
  addLineToCart,
  toggleWishlist,
  useWished,
  sizesFor,
  type WishItem,
} from "@/lib/shopStorage";

/* ───────────────────────── Brand ───────────────────────── */

const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const IVORY = "#FCF8F0";
const SAND = "#F6EEE0";
const INK = "#111111";
const CARD_BORDER = "#EADFCC";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const BTN =
  "bg-[#9C5A2B] text-white transition-colors hover:bg-[#7d4720] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]";
const BTN_LINE =
  "border border-[#9C5A2B] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white";
const LINE = "border-[#9C5A2B]/25";
const MUTED = "text-[#111111]/60";
const HEAD = "mq-serif font-medium text-[#9C5A2B]";
const CAPS = "uppercase tracking-[0.12em] font-semibold";

const GRID = "flex flex-wrap justify-center gap-3 sm:gap-4";
const GRID_ITEM =
  "flex w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.667rem)]";

/* ───────────────────────── Types ───────────────────────── */

type StepId = 1 | 2;

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  color: string;
  image?: string;
  inStock?: boolean;
}

export interface GiftBox {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  color?: string;
  category?: string;
  inStock?: boolean;
  isActive?: boolean;
}

interface Selection {
  perfumes: Record<string, number>; // key = "<perfume slug>__<ml>", value = quantity
  box: string | null;
  message: string | null;
}

interface LineItem {
  key: string;
  product: Product;
  ml: number;
  qty: number;
  unit: number;
}

/* ───────────────────────── Data & Defaults ───────────────────────── */

const FAMILY_COLORS: Record<string, string> = {
  "Oud & Woody": "#4a3b34",
  "Fresh & Aquatic": "#7fb3c8",
  Floral: "#e3b5c4",
  "Citrus & Fruity": "#f0b93a",
  "Amber & Spicy": "#c9772b",
  "Musk & Powdery": "#d8cfc8",
  "Sweet & Gourmand": "#b5784a",
};

const toGiftProduct = (p: ShopProduct): Product => ({
  id: p.slug,
  name: p.name,
  category: p.category,
  price: p.price,
  color: FAMILY_COLORS[p.category] ?? "#c9772b",
  image: p.image,
  inStock: p.inStock !== false,
});

const SIZE_STEPS = [
  { ml: 10, mult: 1 },
  { ml: 30, mult: 2.25 },
  { ml: 50, mult: 3.4 },
  { ml: 100, mult: 5.6 },
];
const DEFAULT_ML = 10;

const sizePrice = (p: Product, ml: number) =>
  Math.round(p.price * (SIZE_STEPS.find((s) => s.ml === ml)?.mult ?? 1));
const sizeOptions = (p: Product) =>
  SIZE_STEPS.map((s) => ({ ml: s.ml, price: sizePrice(p, s.ml) }));
const pKey = (id: string, ml: number) => `${id}__${ml}`;

function lineItems(perfumes: Record<string, number>, products: Product[]): LineItem[] {
  const out: LineItem[] = [];
  for (const [key, qty] of Object.entries(perfumes)) {
    const [id, mlStr] = key.split("__");
    const product = products.find((x) => x.id === id);
    const ml = Number(mlStr);
    if (product && qty > 0)
      out.push({ key, product, ml, qty, unit: sizePrice(product, ml) });
  }
  return out.sort(
    (a, b) => products.indexOf(a.product) - products.indexOf(b.product) || a.ml - b.ml
  );
}

const STEPS: { id: StepId; label: string; title: string; hint: string }[] = [
  {
    id: 1,
    label: "Choose Your Perfumes",
    title: "Choose your perfumes",
    hint: "Pick a size, then add as many fragrances as you like. Repeat a favourite with the + button.",
  },
  {
    id: 2,
    label: "Choose Your Box",
    title: "Choose a gift box / cover",
    hint: "Pick the box or cover your perfumes arrive in, or select gift covers individually.",
  },
];

const MAX_PERFUME_QTY = 20;
const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const MAX_MESSAGE = 200;
const EMPTY: Selection = { perfumes: {}, box: null, message: null };

/* ───────────────────────── Icons ───────────────────────── */

function Icon({ d, size = 20, label }: { d: string; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      <path d={d} />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 sm:h-5 sm:w-5"
      fill={filled ? "#C0392B" : "none"}
      stroke={filled ? "#C0392B" : "#9C5A2B"}
      strokeWidth={1.7}
      aria-hidden
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

const ICONS = {
  bag: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
};

/* ───────────────────────── Visuals ───────────────────────── */

function Bottle({ color, small = false }: { color: string; small?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 150"
      className="h-full w-full"
      role="img"
      aria-label="Perfume bottle"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="120" height="150" fill={SAND} />
      <ellipse cx="60" cy="136" rx="30" ry="5" fill="#0001" />
      <rect x="50" y="14" width="20" height={small ? 18 : 22} rx="2" fill={COPPER} />
      <rect x="54" y="32" width="12" height="8" fill="#c9c9c9" />
      <rect x="32" y="40" width="56" height="92" rx="8" fill="#ffffffcc" stroke="#d8d4cc" />
      <rect x="35" y="72" width="50" height="57" rx="6" fill={color} opacity={0.85} />
      <rect x="42" y="86" width="36" height="22" fill="#fff" opacity={0.9} />
      <rect x="47" y="93" width="26" height="2" fill="#1a1a1a" />
      <rect x="51" y="99" width="18" height="2" fill="#1a1a1a" opacity={0.5} />
    </svg>
  );
}

function BoxArt({ color = "#9C5A2B" }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-full w-full"
      role="img"
      aria-label="Gift box"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="120" height="120" fill={SAND} />
      <rect x="18" y="42" width="84" height="58" rx="3" fill={color} stroke="#0002" />
      <rect x="12" y="32" width="96" height="16" rx="3" fill={color} stroke="#0002" />
      <rect x="56" y="32" width="8" height="68" fill="#fff" opacity={0.7} />
    </svg>
  );
}

function PerfumeImage({
  image,
  name,
  color,
  small = false,
}: {
  image?: string;
  name: string;
  color: string;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return <Bottle color={color} small={small} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={name}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
    />
  );
}

function CoverImageDisplay({
  src,
  name,
  color = "#9C5A2B",
}: {
  src?: string;
  name: string;
  color?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <BoxArt color={color} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

/* ───────────────────────── Components ───────────────────────── */

function Hero({ onShop }: { onShop: () => void }) {
  return (
    <section className={`border-b ${LINE}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 sm:py-14 lg:py-20">
        <h1
          className={`${HEAD} mx-auto max-w-3xl leading-tight`}
          style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)" }}
        >
          You Know Their Taste. Build Their Gift
        </h1>
        <p className={`mx-auto mt-4 max-w-xl text-sm sm:text-base ${MUTED}`}>
          Personalise a fragrance gift bundle in two steps: choose as many perfumes as you like,
          then a box they will keep. You can also purchase luxury gift boxes individually.
        </p>
        <button
          type="button"
          onClick={onShop}
          className={`${BTN} ${CAPS} mt-7 w-full px-10 py-3.5 text-[13px] sm:w-auto rounded-lg`}
        >
          Shop now
        </button>
        <ol className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:mt-14 sm:gap-6 md:gap-0">
          {/* Step 1: Left Side - Choose your perfumes */}
          <li className="flex flex-col items-center gap-3 sm:gap-4 md:px-6">
            <div className="aspect-square w-full max-w-[16rem] overflow-hidden rounded-xl border border-[#EADFCC] bg-[#F6EEE0] p-2 sm:p-2.5">
              <div className="grid h-full w-full grid-cols-2 gap-2">
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/gifthero1.jpg"
                    alt="Choose your perfumes - Fragrance 1"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/gifthero3.png"
                    alt="Choose your perfumes - Fragrance 2"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
            <p className="mq-serif text-lg leading-snug text-[#9C5A2B] sm:text-2xl">
              1. Choose your perfumes
            </p>
          </li>

          {/* Step 2: Right Side - Choose a gift box / cover */}
          <li className="flex flex-col items-center gap-3 sm:gap-4 md:border-l md:px-6 border-[#9C5A2B]/25">
            <div className="aspect-square w-full max-w-[16rem] overflow-hidden rounded-xl border border-[#EADFCC] bg-[#F6EEE0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/gifthbox.png"
                alt="Choose a gift box / cover"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mq-serif text-lg leading-snug text-[#9C5A2B] sm:text-2xl">
              2. Choose a gift box / cover
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}

function ProgressIndicator({
  step,
  maxReached,
  onGo,
}: {
  step: StepId;
  maxReached: StepId;
  onGo: (s: StepId) => void;
}) {
  return (
    <nav aria-label="Gift builder progress" className="mx-auto max-w-3xl">
      <ol className="flex items-start">
        {STEPS.map((s, i) => {
          const done = s.id < step;
          const active = s.id === step;
          const reachable = s.id <= maxReached;
          return (
            <li key={s.id} className="flex flex-1 items-start last:flex-none">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onGo(s.id)}
                aria-current={active ? "step" : undefined}
                className="relative z-10 flex w-24 flex-col items-center gap-2 text-center disabled:cursor-not-allowed sm:w-32"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                    active || done
                      ? "border-[#9C5A2B] bg-[#9C5A2B] text-white"
                      : "border-[#9C5A2B]/40 bg-[#FCF8F0] text-[#9C5A2B]/60"
                  }`}
                >
                  {done ? <Icon d={ICONS.check} size={16} /> : s.id}
                </span>
                <span
                  className={`text-[11px] leading-tight sm:text-xs ${
                    active ? "font-semibold text-[#9C5A2B]" : MUTED
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={`pointer-events-none -mx-6 mt-4 h-px flex-1 sm:-mx-10 ${
                    done ? "bg-[#9C5A2B]" : "bg-[#9C5A2B]/30"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ───────────────────────── Perfume Card ───────────────────────── */

function PerfumeCard({
  p,
  perfumes,
  canAdd,
  onAdd,
  onRemove,
  onNotify,
}: {
  p: Product;
  perfumes: Record<string, number>;
  canAdd: boolean;
  onAdd: (key: string) => void;
  onRemove: (key: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [ml, setMl] = useState(DEFAULT_ML);
  const key = pKey(p.id, ml);
  const qty = perfumes[key] ?? 0;
  const selected = qty > 0;
  const href = productHref({ slug: p.id, name: p.name });

  const wished = useWished(p.id);

  const handleToggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wishItem: WishItem = {
      slug: p.id,
      name: p.name,
      image: p.image,
      sizes: sizesFor(p.price),
      soldOut: !p.inStock,
    };
    toggleWishlist(wishItem);
    onNotify(wished ? `Removed ${p.name} from wishlist.` : `Added ${p.name} to wishlist!`);
  };

  return (
    <article
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[14px] border bg-white transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)] ${
        selected ? "border-[#9C5A2B]" : ""
      }`}
      style={{ borderColor: selected ? COPPER : CARD_BORDER, fontFamily: sans }}
      aria-label={p.name}
    >
      {/* Top Image area */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px] bg-[#F6EEE0]">
        <Link href={href} aria-label={`View ${p.name}`} className="block h-full w-full">
          <PerfumeImage image={p.image} name={p.name} color={p.color} />
        </Link>

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={handleToggleWish}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 sm:h-9 sm:w-9"
        >
          <HeartIcon filled={wished} />
        </button>
      </div>

      {/* Info Area */}
      <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-3 text-center md:px-3 md:pb-5 md:pt-4">
        <h3
          className="m-0 line-clamp-2 font-medium leading-[1.2]"
          style={{
            fontFamily: serif,
            color: COPPER,
            fontSize: "clamp(1.05rem, 2vw, 1.45rem)",
          }}
        >
          <Link href={href} className="hover:underline">
            {p.name}
          </Link>
        </h3>
        <p className="m-0 mt-1 text-[11px] leading-snug text-[#111111]/60 md:text-[13px]">
          {p.category}
        </p>
        <p className="m-0 mt-2 text-[13px] font-semibold md:mt-3 md:text-[16px]" style={{ color: COPPER }}>
          {money(sizePrice(p, ml))}
        </p>

        {/* Sizes */}
        <fieldset className="m-0 mt-2 flex w-full flex-nowrap items-center justify-center gap-x-1.5 border-0 p-0 md:mt-3 md:gap-x-2.5 lg:gap-x-3">
          <legend className="sr-only">Choose a size</legend>
          {sizeOptions(p).map((s) => {
            const checked = s.ml === ml;
            return (
              <label
                key={s.ml}
                className="flex cursor-pointer items-center gap-[3px] whitespace-nowrap text-[9px] lowercase md:gap-1 md:text-[10px] lg:text-[12px]"
                style={{ color: checked ? INK : "#5F554B" }}
              >
                <input
                  type="radio"
                  name={`size-${p.id}`}
                  value={s.ml}
                  checked={checked}
                  onChange={() => setMl(s.ml)}
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
        <div className="mt-auto w-full pt-3 md:w-[92%] md:pt-4">
          {selected ? (
            <div className="flex items-center justify-between rounded-[6px] border border-[#9C5A2B] text-[#9C5A2B]">
              <button
                type="button"
                aria-label={`Remove one ${p.name}`}
                onClick={() => onRemove(key)}
                className="flex h-10 w-10 items-center justify-center md:h-11 md:w-11 hover:bg-[#9C5A2B]/10"
              >
                <Icon d={ICONS.minus} size={16} />
              </button>
              <span aria-live="polite" className="text-sm font-semibold">
                {qty}
              </span>
              <button
                type="button"
                aria-label={`Add one more ${p.name}`}
                onClick={() => onAdd(key)}
                disabled={!canAdd}
                className="flex h-10 w-10 items-center justify-center disabled:opacity-30 md:h-11 md:w-11 hover:bg-[#9C5A2B]/10"
              >
                <Icon d={ICONS.plus} size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(key)}
              disabled={!canAdd}
              className={`${BTN_LINE} flex h-10 w-full items-center justify-center rounded-[6px] bg-white text-[10px] font-semibold uppercase tracking-[0.1em] md:h-11 md:text-[12px] md:tracking-[0.12em] disabled:cursor-not-allowed disabled:border-[#111111]/20 disabled:text-[#111111]/30`}
            >
              Add to Box
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────── Gift Cover Card ───────────────────────── */

function GiftCoverCard({
  box,
  isSelected,
  onSelect,
  onDeselect,
  onNotify,
}: {
  box: GiftBox;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onNotify: (msg: string) => void;
}) {
  const href = `/product/${box.slug}`;
  const wished = useWished(box.slug);

  const handleToggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wishItem: WishItem = {
      slug: box.slug,
      name: box.name,
      image: box.image,
      sizes: [{ ml: 0, price: box.price, soldOut: !box.inStock }],
      soldOut: !box.inStock,
    };
    toggleWishlist(wishItem);
    onNotify(wished ? `Removed ${box.name} from wishlist.` : `Added ${box.name} to wishlist!`);
  };

  return (
    <article
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[14px] border bg-white transition-all duration-300 hover:shadow-[0_10px_30px_rgba(120,80,30,0.12)] ${
        isSelected ? "border-[#9C5A2B] ring-2 ring-[#9C5A2B]/40" : ""
      }`}
      style={{ borderColor: isSelected ? COPPER : CARD_BORDER, fontFamily: sans }}
      aria-label={box.name}
    >
      {/* Top Image area */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[14px] bg-[#F6EEE0]">
        <Link href={href} aria-label={`View details of ${box.name}`} className="block h-full w-full">
          <CoverImageDisplay src={box.image} name={box.name} color={box.color} />
        </Link>

        {/* Wishlist Heart */}
        <button
          type="button"
          onClick={handleToggleWish}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 sm:h-9 sm:w-9"
        >
          <HeartIcon filled={wished} />
        </button>

        {/* Out of stock badge */}
        {!box.inStock && (
          <span className="absolute bottom-2.5 left-2.5 rounded bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Out of stock
          </span>
        )}
      </div>

      {/* Info Area */}
      <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-3 text-center sm:px-4 sm:pb-5 sm:pt-4">
        <h3
          className="m-0 line-clamp-2 font-medium leading-[1.2]"
          style={{
            fontFamily: serif,
            color: COPPER,
            fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
          }}
        >
          <Link href={href} className="hover:underline">
            {box.name}
          </Link>
        </h3>
        <p className="m-0 mt-1 line-clamp-2 text-[11px] leading-snug text-[#111111]/60 sm:text-[12px]">
          {box.description}
        </p>
        <p className="m-0 mt-2 text-[14px] font-semibold sm:mt-3 sm:text-[17px]" style={{ color: COPPER }}>
          {money(box.price)}
        </p>

        {/* Action Button: ONLY ONE CLEAR OPTION */}
        <div className="mt-auto flex w-full flex-col gap-2 pt-4">
          <button
            type="button"
            onClick={isSelected ? onDeselect : onSelect}
            disabled={!box.inStock}
            className={`${
              isSelected ? BTN : BTN_LINE
            } flex h-10 w-full items-center justify-center gap-1.5 rounded-[6px] text-[11px] font-semibold uppercase tracking-[0.1em] transition-all disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {isSelected ? (
              <>
                <Icon d={ICONS.check} size={16} /> Using This Gift Cover
              </>
            ) : (
              "Use This Gift Cover"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────── Gift Card Note Editor ───────────────────────── */

function GiftCardEditor({
  message,
  onChange,
}: {
  message: string | null;
  onChange: (m: string | null) => void;
}) {
  const enabled = message !== null;
  const text = message ?? "";
  return (
    <section
      aria-labelledby="card-title"
      className={`mt-6 rounded-xl border bg-white/70 p-4 sm:mt-8 sm:p-5 ${LINE}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h3 id="card-title" className={`${HEAD} text-2xl`}>
            Add a personal gift card
          </h3>
          <p className={`text-sm ${MUTED}`}>
            Write a personal note. It will be printed on a luxury card inside the box. Free.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked ? "" : null)}
            className="h-4 w-4 accent-[#9C5A2B]"
          />
          Include gift card
        </label>
      </div>
      {enabled && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="card-text" className="mb-1 block text-sm font-medium">
              Your message
            </label>
            <textarea
              id="card-text"
              value={text}
              maxLength={MAX_MESSAGE}
              rows={6}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Dear Aanya, happy birthday! I chose these perfumes especially for you."
              className="w-full resize-none rounded-lg border border-[#9C5A2B]/40 bg-white p-3 text-base outline-none focus:border-[#9C5A2B] sm:text-sm"
            />
            <p className={`mt-1 text-right text-xs ${MUTED}`} aria-live="polite">
              {text.length}/{MAX_MESSAGE}
            </p>
          </div>
          <div
            aria-label="Card preview"
            className="flex min-h-48 flex-col justify-between rounded-lg border border-[#9C5A2B]/30 bg-[#F6EEE0] p-5 shadow-sm"
          >
            <p className="mq-serif whitespace-pre-wrap break-words text-xl italic leading-relaxed text-[#111111]">
              {text.trim() ? text : "Your personal message will be printed here."}
            </p>
            <p className="mt-4 text-center text-[10px] tracking-[0.3em] text-[#9C5A2B]">
              MIRQAS PERFUMES
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ───────────────────────── Bundle Summary ───────────────────────── */

interface SummaryProps {
  step: StepId;
  sel: Selection;
  products: Product[];
  boxes: GiftBox[];
  perfumeCount: number;
  subtotal: number;
  error: string | null;
  onClear: () => void;
  onNext: () => void;
  onBack: () => void;
  onRemovePerfume: (key: string) => void;
  onRemoveBox: () => void;
  onRemoveMessage: () => void;
  onAddToCart: () => void;
}

function BundleSummary(p: SummaryProps) {
  const box = p.boxes.find((x) => x.id === p.sel.box);
  const perfumes = lineItems(p.sel.perfumes, p.products);
  const note = p.sel.message?.trim() ? p.sel.message.trim() : null;
  const count = p.perfumeCount + (box ? 1 : 0) + (note ? 1 : 0);

  const Row = ({
    art,
    label,
    sub,
    onRemove,
  }: {
    art: ReactNode;
    label: string;
    sub: string;
    onRemove: () => void;
  }) => (
    <li className="flex items-center gap-3 py-2.5">
      <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border ${LINE}`}>{art}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className={`text-xs ${MUTED}`}>{sub}</p>
      </div>
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="p-1 text-[#111111]/50 hover:text-[#9C5A2B]"
      >
        <Icon d={ICONS.x} size={16} />
      </button>
    </li>
  );

  return (
    <aside
      aria-label="Your bundle"
      className={`rounded-xl border bg-white p-5 lg:sticky lg:top-6 shadow-sm ${LINE}`}
    >
      <div className="flex items-baseline justify-between">
        <h2 className={`${HEAD} text-3xl`}>Your Bundle</h2>
        <button
          type="button"
          onClick={p.onClear}
          disabled={count === 0}
          className="text-sm text-[#9C5A2B] underline disabled:text-[#111111]/25 disabled:no-underline"
        >
          Clear
        </button>
      </div>
      <p className={`mt-1 text-sm ${MUTED}`}>
        Review your bundle · {count} {count === 1 ? "item" : "items"}
      </p>

      {count === 0 ? (
        <p className={`my-6 rounded-lg border border-dashed p-4 text-center text-sm ${LINE} ${MUTED}`}>
          Your bundle is empty. Start by choosing your perfumes.
        </p>
      ) : (
        <ul className="my-4 divide-y divide-[#9C5A2B]/15">
          {perfumes.map((m) => (
            <Row
              key={m.key}
              art={
                <PerfumeImage
                  image={m.product.image}
                  name={m.product.name}
                  color={m.product.color}
                  small
                />
              }
              label={`${m.product.name} · ${m.ml}ml`}
              sub={`${m.qty} × ${money(m.unit)} = ${money(m.unit * m.qty)}`}
              onRemove={() => p.onRemovePerfume(m.key)}
            />
          ))}
          {box && (
            <Row
              art={<CoverImageDisplay src={box.image} name={box.name} color={box.color} />}
              label={box.name}
              sub={money(box.price)}
              onRemove={p.onRemoveBox}
            />
          )}
          {note && (
            <Row
              art={
                <div className="mq-serif flex h-full w-full items-center justify-center bg-[#F6EEE0] text-xl italic text-[#9C5A2B]">
                  “
                </div>
              }
              label="Gift card"
              sub={note.length > 36 ? `${note.slice(0, 36)}…` : note}
              onRemove={p.onRemoveMessage}
            />
          )}
        </ul>
      )}

      <p className={`text-xs ${MUTED}`}>Perfumes selected: {p.perfumeCount}</p>
      <dl className={`mt-3 space-y-1 border-t pt-3 text-sm ${LINE}`}>
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{money(p.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold text-[#9C5A2B]">
          <dt>Total</dt>
          <dd>{money(p.subtotal)}</dd>
        </div>
      </dl>

      {p.error && (
        <p role="alert" className="mt-3 rounded border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-700">
          {p.error}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {p.step < 2 ? (
          <button
            type="button"
            onClick={p.onNext}
            className={`${BTN} ${CAPS} w-full rounded-lg py-3.5 text-[13px]`}
          >
            Next: Choose Box
          </button>
        ) : (
          <button
            type="button"
            onClick={p.onAddToCart}
            className={`${BTN} ${CAPS} w-full rounded-lg py-3.5 text-[13px]`}
          >
            Add Bundle to Cart
          </button>
        )}
        {p.step > 1 && (
          <button
            type="button"
            onClick={p.onBack}
            className={`${BTN_LINE} ${CAPS} w-full rounded-lg py-3.5 text-[13px]`}
          >
            Back
          </button>
        )}
      </div>
    </aside>
  );
}

/* ───────────────────────── Page Main ───────────────────────── */

export function isGiftCoverCategory(category?: string): boolean {
  if (!category) return false;
  const c = category.toLowerCase().trim();
  return (
    c === "gift cover" ||
    c === "gift covers" ||
    c === "gift box" ||
    c === "gift boxes" ||
    c.includes("gift cover") ||
    c.includes("gift box") ||
    c === "packaging"
  );
}

export default function GiftPage() {
  const { products: apiProducts, loaded, error: loadError } = useSectionProducts("gift-sets");
  const products = useMemo(
    () => apiProducts.filter((p) => p.inStock && !isGiftCoverCategory(p.category)).map(toGiftProduct),
    [apiProducts]
  );

  const [boxes, setBoxes] = useState<GiftBox[]>([]);
  const [boxesLoaded, setBoxesLoaded] = useState(false);
  const [boxesError, setBoxesError] = useState(false);
  const [modalBox, setModalBox] = useState<GiftBox | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const syncCart = () => setCartLines(readList<CartLine>(CART_KEY));
    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener(SYNC_EVENT, syncCart);
    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(SYNC_EVENT, syncCart);
    };
  }, []);

  const handleModalConfirm = (selectedWrapped: WrappedItemRef[]) => {
    if (!modalBox) return;
    const boxItem: WishItem = {
      slug: modalBox.slug,
      name: modalBox.name,
      image: modalBox.image,
      sizes: [{ ml: 0, price: modalBox.price, soldOut: false }],
      soldOut: false,
    };
    addLineToCart(boxItem, 0, 1, { isGiftCover: true, wrappedItems: selectedWrapped });
    setSel((s) => ({ ...s, box: modalBox.id }));
    setModalOpen(false);
    showToast(`✓ Added ${modalBox.name} to wrap ${selectedWrapped.length} fragrance(s)!`, "/cart");
  };

  // Fetch gift covers dynamically from backend (no hardcoded fallback)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/gift-covers", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load gift covers");
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d.giftCovers)) {
          setBoxes(d.giftCovers.filter((b: GiftBox) => b.isActive !== false));
        } else {
          setBoxes([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load gift covers:", err);
        if (!cancelled) setBoxesError(true);
      })
      .finally(() => {
        if (!cancelled) setBoxesLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const builderRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState<StepId>(1);
  const [maxReached, setMaxReached] = useState<StepId>(1);
  const [sel, setSel] = useState<Selection>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; link?: string } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const perfumeCount = useMemo(
    () => Object.values(sel.perfumes).reduce((a, b) => a + b, 0),
    [sel.perfumes]
  );

  const subtotal = useMemo(() => {
    const perfumesTotal = lineItems(sel.perfumes, products).reduce(
      (t, l) => t + l.unit * l.qty,
      0
    );
    const boxPrice = boxes.find((b) => b.id === sel.box)?.price ?? 0;
    return perfumesTotal + boxPrice;
  }, [sel, products, boxes]);

  const bundleCount = perfumeCount + (sel.box ? 1 : 0) + (sel.message?.trim() ? 1 : 0);

  const scrollToBuilder = () =>
    builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const showToast = (msg: string, link?: string) => {
    setToast({ msg, link });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const validate = (s: StepId): string | null => {
    if (s === 1 && perfumeCount < 1) return "Choose at least one perfume to continue.";
    if (s === 2 && !sel.box) return "Choose a gift box to complete your bundle.";
    if (s === 2 && sel.message !== null && !sel.message.trim())
      return "Write your gift card message, or untick Include card.";
    return null;
  };

  const goTo = (s: StepId) => {
    setError(null);
    setStep(s);
    setSummaryOpen(false);
    scrollToBuilder();
  };

  const next = () => {
    const err = validate(step);
    if (err) return setError(err);
    const n = (step + 1) as StepId;
    setMaxReached((m) => (n > m ? n : m));
    goTo(n);
  };

  const back = () => goTo((step - 1) as StepId);

  const addPerfume = (key: string) => {
    if (perfumeCount >= MAX_PERFUME_QTY)
      return setError(`You can add up to ${MAX_PERFUME_QTY} perfumes per bundle.`);
    setError(null);
    setSel((s) => ({
      ...s,
      perfumes: { ...s.perfumes, [key]: (s.perfumes[key] ?? 0) + 1 },
    }));
  };

  const removePerfume = (key: string) => {
    setError(null);
    setSel((s) => {
      const q = (s.perfumes[key] ?? 0) - 1;
      const perfumes = { ...s.perfumes };
      if (q <= 0) delete perfumes[key];
      else perfumes[key] = q;
      return { ...s, perfumes };
    });
  };

  const removePerfumeAll = (key: string) =>
    setSel((s) => {
      const perfumes = { ...s.perfumes };
      delete perfumes[key];
      return { ...s, perfumes };
    });

  const clear = () => {
    setSel(EMPTY);
    setError(null);
    setStep(1);
    setMaxReached(1);
  };

  /* Add whole bundle into the real cart */
  const addBundleToCart = () => {
    const err = validate(1) ?? validate(2);
    if (err) {
      setError(err);
      if (perfumeCount < 1) setStep(1);
      return;
    }
    const box = boxes.find((b) => b.id === sel.box);
    if (!box) return;

    const chosen = lineItems(sel.perfumes, products);

    // 1. Add chosen perfumes to real cart
    for (const m of chosen) {
      const item: WishItem = {
        slug: m.product.id,
        name: m.product.name,
        image: m.product.image,
        sizes: sizesFor(m.product.price),
        soldOut: false,
      };
      addLineToCart(item, m.ml, m.qty);
    }

    // 2. Add chosen gift cover to real cart (ml: 0)
    const boxItem: WishItem = {
      slug: box.slug,
      name: box.name,
      image: box.image,
      sizes: [{ ml: 0, price: box.price, soldOut: false }],
      soldOut: false,
    };
    const wrappedItems: WrappedItemRef[] = chosen.map((m) => ({
      slug: m.product.id,
      name: m.product.name,
      ml: m.ml,
    }));
    addLineToCart(boxItem, 0, 1, { isGiftCover: true, wrappedItems });

    // 3. Feedback and reset
    showToast("✓ Your custom gift bundle was added to the cart!", "/cart");
    setSel(EMPTY);
    setStep(1);
    setMaxReached(1);
    setError(null);
    setSummaryOpen(false);
  };

  const summary = (
    <BundleSummary
      step={step}
      sel={sel}
      products={products}
      boxes={boxes}
      perfumeCount={perfumeCount}
      subtotal={subtotal}
      error={error}
      onClear={clear}
      onNext={next}
      onBack={back}
      onAddToCart={addBundleToCart}
      onRemovePerfume={removePerfumeAll}
      onRemoveBox={() => setSel((s) => ({ ...s, box: null }))}
      onRemoveMessage={() => setSel((s) => ({ ...s, message: null }))}
    />
  );

  const cur = STEPS[step - 1];

  return (
    <div className="min-h-screen" style={{ background: IVORY, color: INK, fontFamily: sans }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap");
        .mq-serif { font-family: ${serif}; }
      `}</style>

      <main>
        <Hero onShop={scrollToBuilder} />

        {/* ─── GIFT BUILDER SECTION ─── */}
        <section
          ref={builderRef}
          id="builder"
          aria-labelledby="builder-title"
          className="mx-auto max-w-7xl scroll-mt-4 px-4 py-8 pb-28 sm:px-6 sm:py-12 sm:pb-32 lg:pb-16"
        >
          <ProgressIndicator step={step} maxReached={maxReached} onGo={goTo} />
          <div className="mt-10 text-center">
            <h2
              id="builder-title"
              className={`${HEAD}`}
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              {cur.title}
            </h2>
            <p className={`mx-auto mt-1 max-w-md text-sm ${MUTED}`}>{cur.hint}</p>
            {step === 1 && (
              <p className="mt-2 text-sm font-medium text-[#9C5A2B]" aria-live="polite">
                {perfumeCount} {perfumeCount === 1 ? "perfume" : "perfumes"} selected
              </p>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="min-w-0">
              {step === 1 ? (
                !loaded ? (
                  <p className={`py-16 text-center ${MUTED}`}>Loading perfumes…</p>
                ) : loadError ? (
                  <p className={`py-16 text-center ${MUTED}`}>
                    Could not load perfumes. Please refresh.
                  </p>
                ) : products.length === 0 ? (
                  <p className={`py-16 text-center ${MUTED}`}>
                    No gift perfumes are available right now.
                  </p>
                ) : (
                  <div className={GRID}>
                    {products.map((p) => (
                      <div key={p.id} className={GRID_ITEM}>
                        <PerfumeCard
                          p={p}
                          perfumes={sel.perfumes}
                          canAdd={perfumeCount < MAX_PERFUME_QTY}
                          onAdd={addPerfume}
                          onRemove={removePerfume}
                          onNotify={(m) => showToast(m)}
                        />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div>
                  {!boxesLoaded ? (
                    <div className="py-16 text-center">
                      <p className={`text-sm ${MUTED}`}>Loading luxury gift covers…</p>
                    </div>
                  ) : boxesError ? (
                    <div className="py-16 text-center">
                      <p className={`text-sm ${MUTED}`}>
                        Could not load gift covers. Please refresh.
                      </p>
                    </div>
                  ) : boxes.length === 0 ? (
                    <div className="mx-auto max-w-md rounded-xl border border-dashed border-[#9C5A2B]/30 bg-white/60 p-8 text-center">
                      <p className="font-medium text-[#111111]">No gift covers are currently available.</p>
                      <p className={`mt-1 text-xs ${MUTED}`}>
                        Please check back soon or continue with your selected fragrances.
                      </p>
                    </div>
                  ) : (
                    <div className={GRID}>
                      {boxes.map((b) => (
                        <div key={b.id} className={GRID_ITEM}>
                          <GiftCoverCard
                            box={b}
                            isSelected={sel.box === b.id}
                            onSelect={() => {
                              setSel((s) => ({ ...s, box: b.id }));
                              setError(null);
                            }}
                            onDeselect={() => setSel((s) => ({ ...s, box: null }))}
                            onNotify={(m) => showToast(m)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <GiftCardEditor
                    message={sel.message}
                    onChange={(m) => {
                      setSel((x) => ({ ...x, message: m }));
                      setError(null);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="hidden lg:block">{summary}</div>
          </div>
        </section>

        {/* ─── STANDALONE GIFT COVERS SECTION (Browse & Buy Boxes) ─── */}
        <section className={`border-t bg-white/50 py-12 sm:py-16 ${LINE}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9C5A2B]">
                Mirqas Collection
              </span>
              <h2
                className={`${HEAD} mt-1`}
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}
              >
                Signature Gift Boxes & Covers
              </h2>
              <p className={`mx-auto mt-2 max-w-xl text-sm ${MUTED}`}>
                Handcrafted presentation cases designed to preserve and showcase your luxury fragrances.
                Available individually with full wishlist and cart support.
              </p>
            </div>

            {!boxesLoaded ? (
              <p className={`py-12 text-center text-sm ${MUTED}`}>Loading gift covers…</p>
            ) : boxes.length === 0 ? (
              <div className="mx-auto mt-8 max-w-md rounded-xl border border-dashed border-[#9C5A2B]/30 bg-white p-8 text-center">
                <p className="font-medium text-[#111111]">No gift covers are available at this moment.</p>
                <p className={`mt-1 text-xs ${MUTED}`}>
                  New presentation boxes will appear here once added by the store administrator.
                </p>
              </div>
            ) : (
              <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-6">
                {boxes.map((b) => (
                  <div
                    key={`showcase-${b.id}`}
                    className="flex w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] max-w-sm"
                  >
                    <GiftCoverCard
                      box={b}
                      isSelected={sel.box === b.id}
                      onSelect={() => {
                        setModalBox(b);
                        setModalOpen(true);
                        setSel((s) => ({ ...s, box: b.id }));
                        setError(null);
                      }}
                      onDeselect={() => setSel((s) => ({ ...s, box: null }))}
                      onNotify={(m) => showToast(m)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Phones / tablets: sticky bottom bar + bundle sheet */}
      <div className="lg:hidden">
        {summaryOpen && (
          <div className="fixed inset-0 z-40">
            <div onClick={() => setSummaryOpen(false)} className="absolute inset-0 bg-black/40" />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Your bundle"
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto bg-[#FCF8F0] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl rounded-t-2xl"
            >
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                aria-label="Close bundle"
                className="mb-2 ml-auto flex p-1 text-[#9C5A2B]"
              >
                <Icon d={ICONS.x} />
              </button>
              {summary}
            </div>
          </div>
        )}
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t bg-[#FCF8F0] px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] ${LINE}`}
        >
          {error && !summaryOpen && (
            <p role="alert" className="mb-2 rounded border-l-2 border-red-600 bg-red-50 px-3 py-1.5 text-xs text-red-700">
              {error}
            </p>
          )}
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              aria-expanded={summaryOpen}
              onClick={() => setSummaryOpen(true)}
              className={`${BTN_LINE} flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-lg px-2 text-xs leading-tight`}
            >
              <span className="font-semibold">Your Bundle ({bundleCount})</span>
              <span>{money(subtotal)}</span>
            </button>
            {step < 2 ? (
              <button
                type="button"
                onClick={next}
                className={`${BTN} ${CAPS} min-h-[48px] flex-1 rounded-lg text-xs`}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={addBundleToCart}
                className={`${BTN} ${CAPS} min-h-[48px] flex-1 rounded-lg text-xs`}
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>

      <GiftWrapConfirmModal
        open={modalOpen}
        box={
          modalBox
            ? {
                slug: modalBox.slug,
                name: modalBox.name,
                price: modalBox.price,
                image: modalBox.image,
              }
            : null
        }
        cartItems={cartLines}
        onConfirm={handleModalConfirm}
        onCancel={() => setModalOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-lg bg-[#9C5A2B] px-4 py-3 text-sm text-white shadow-xl lg:bottom-6"
        >
          <span>{toast.msg}</span>
          {toast.link && (
            <Link
              href={toast.link}
              className="shrink-0 rounded bg-white px-2.5 py-1 text-xs font-semibold text-[#9C5A2B] hover:bg-stone-100"
            >
              View Cart →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
