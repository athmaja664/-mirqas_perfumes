"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Product = {
  slug: string;
  name: string;
  family: string;
  notes: string;
  basePrice: number; // 10ml price
  mrpBase?: number; // 10ml MRP (optional)
  description: string;
  images: string[]; // 4 pictures
};

// Replace these with real product photos later
const PLACEHOLDER_IMAGES = [
  "/images/mirqas2.png",
  "/images/mirqas1.png",
  "/images/newlauchhero.png",
  "/images/login4.jpg",
];

const SIZES = [
  { label: "10ml", multiplier: 1 },
  { label: "30ml", multiplier: 2.25 },
  { label: "50ml", multiplier: 3.4 },
  { label: "100ml", multiplier: 5.6 },
];

const DEFAULT_DESCRIPTION =
  "A smooth and warm fragrance with a silky finish. Made for evenings and special occasions, it stays close to the skin and lasts for hours.";

// Demo products. Any other slug falls back to a generated demo product.
const DEMO_PRODUCTS: Product[] = [
  {
    slug: "silky-oudh",
    name: "Silky Oudh",
    family: "Woody · Oud · Unisex",
    notes: "Top: Saffron, Bergamot · Heart: Rose, Oud · Base: Amber, Musk",
    basePrice: 399,
    mrpBase: 499,
    description: DEFAULT_DESCRIPTION,
    images: PLACEHOLDER_IMAGES,
  },
];

// Turns "royal-amber" into "Royal Amber"
function slugToName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getProduct(rawSlug: string): Product {
  // Decode %5Bslug%5D and remove brackets or other unsafe characters
  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    // keep rawSlug if decoding fails
  }
  const cleanSlug = decoded.toLowerCase().replace(/[^a-z0-9-]/g, "");

  const found = DEMO_PRODUCTS.find((p) => p.slug === cleanSlug);
  if (found) return found;

  // Empty slug or the literal "[slug]" typed in the URL: show the main demo product
  if (!cleanSlug || cleanSlug === "slug") return DEMO_PRODUCTS[0];

  return {
    slug: cleanSlug,
    name: slugToName(cleanSlug) || "Demo Perfume",
    family: "Woody · Floral · Unisex",
    notes: "Top: Bergamot · Heart: Rose, Jasmine · Base: Amber, Musk",
    basePrice: 399,
    mrpBase: 499,
    description: DEFAULT_DESCRIPTION,
    images: PLACEHOLDER_IMAGES,
  };
}

const formatPrice = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

const ACCORDIONS = [
  {
    title: "How to use",
    body: "Spray on pulse points such as the wrists and neck from about 15 cm away. Do not rub the wrists together.",
  },
  {
    title: "Shipping and returns",
    body: "Orders ship within 2 to 4 working days. Unopened products can be returned within 7 days of delivery.",
  },
  {
    title: "Ingredients",
    body: "Alcohol denat., Parfum (Fragrance), Aqua, and fragrance allergens as per regulations.",
  },
];

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug ?? "";

  const product = useMemo(() => getProduct(slug), [slug]);

  const [activeImage, setActiveImage] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(3); // starts on 100ml
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [openAcc, setOpenAcc] = useState<number | null>(0);

  const size = SIZES[sizeIndex];
  const price = product.basePrice * size.multiplier;
  const mrp = product.mrpBase ? product.mrpBase * size.multiplier : undefined;
  const discount =
    mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <main
      className="min-h-screen bg-[#FFF9F3] text-[#111111]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-[rgba(17,17,17,0.6)]">
          <Link href="/" className="hover:text-[#9C5A2B]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-[#9C5A2B]">
            Shop All Perfumes
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#111111]">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ---------- GALLERY ---------- */}
          {/* self-start stops the grid from stretching this box to the height of the details column */}
          <div className="self-start lg:sticky lg:top-6">
            <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-start">
              {/* Thumbnails: row on mobile, column on laptop */}
              <div className="flex gap-3 lg:w-20 lg:flex-col">
                {product.images.slice(0, 4).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show picture ${i + 1}`}
                    className={`aspect-square w-16 overflow-hidden rounded-[10px] border bg-[#F6EEE0] lg:w-20 ${
                      activeImage === i
                        ? "border-[#9C5A2B]"
                        : "border-[#EADFCC] hover:border-[rgba(156,90,43,0.45)]"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Main image: the box itself has the 4:5 ratio, so there is no empty space */}
              <div className="relative aspect-[4/5] w-full flex-1 overflow-hidden rounded-[14px] border border-[#EADFCC] bg-[#F6EEE0]">
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => setWished((w) => !w)}
                  aria-label="Add to wishlist"
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill={wished ? "#9C5A2B" : "none"}
                    stroke="#9C5A2B"
                    strokeWidth="1.8"
                  >
                    <path d="M12 21s-7-4.6-9.3-9.1C1.1 8.7 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4h.4C12 6.1 13.4 5 15.4 5 19 5 20.9 8.7 21.3 11.9 19 16.4 12 21 12 21z" />
                  </svg>
                </button>

                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-[6px] bg-[#9C5A2B] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white">
                    {discount}% off
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ---------- DETAILS ---------- */}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[rgba(17,17,17,0.6)]">
              {product.family}
            </p>

            <h1
              className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {product.name}
            </h1>

            <p className="mt-3 text-sm text-[rgba(17,17,17,0.6)]">
              {product.notes}
            </p>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">
                {formatPrice(price)}
              </span>
              {mrp && mrp > price && (
                <span className="text-base text-[rgba(17,17,17,0.6)] line-through">
                  {formatPrice(mrp)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[rgba(17,17,17,0.6)]">
              Inclusive of all taxes
            </p>

            <p className="mt-5 text-sm leading-relaxed text-[rgba(17,17,17,0.8)]">
              {product.description}
            </p>

            {/* Size */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em]">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSizeIndex(i)}
                    className={`rounded-[6px] border px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] transition ${
                      sizeIndex === i
                        ? "border-[#9C5A2B] bg-[#9C5A2B] text-white"
                        : "border-[#EADFCC] bg-white hover:border-[#9C5A2B]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em]">
                Quantity
              </p>
              <div className="inline-flex items-center rounded-[6px] border border-[#EADFCC] bg-white">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="h-10 w-10 text-lg hover:text-[#9C5A2B]"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="h-10 w-10 text-lg hover:text-[#9C5A2B]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-[6px] border border-[#9C5A2B] px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[#9C5A2B] transition hover:bg-[#9C5A2B] hover:text-white"
              >
                {added ? "Added ✓" : "Add to cart"}
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-[6px] bg-[#9C5A2B] px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[#7d4720]"
              >
                Buy now
              </button>
            </div>

            {/* Accordions */}
            <div className="mt-8 border-t border-[rgba(156,90,43,0.25)]">
              {ACCORDIONS.map((a, i) => (
                <div
                  key={a.title}
                  className="border-b border-[rgba(156,90,43,0.25)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenAcc(openAcc === i ? null : i)}
                    className="flex w-full items-center justify-between py-4 text-left text-xs font-medium uppercase tracking-[0.14em]"
                  >
                    {a.title}
                    <span className="text-lg text-[#9C5A2B]">
                      {openAcc === i ? "−" : "+"}
                    </span>
                  </button>
                  {openAcc === i && (
                    <p className="pb-4 text-sm leading-relaxed text-[rgba(17,17,17,0.7)]">
                      {a.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}