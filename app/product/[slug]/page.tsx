"use client";

// app/product/[slug]/page.tsx
// Product detail page. The product, ALL its images, the reviews and the related
// products come from the database. The heart and Add to cart save to the
// wishlist and cart pages (and update the navbar counts).

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  addLineToCart,
  formatPrice,
  sizesFor,
  toggleWishlist,
  useWished,
  type WishItem,
} from "@/lib/shopStorage";
import ProductReviews, { RatingSummary } from "@/components/product/Reviews";
import RelatedProducts from "@/components/product/RelatedProducts";
// import BundleOffer from "@/components/product/BundleOffer";

type ApiProduct = {
  slug: string;
  name: string;
  description: string;
  price: number; // paise
  salePrice: number | null; // paise
  category: string;
  images: string[];
  inStock: boolean;
  gender: string;
  family: string;
  notes: string[];
  sizePrices?: Record<string, number> | null;
  pricingMethod?: string;
};

type Product = {
  slug: string;
  name: string;
  category: string;
  family: string;
  notes: string[];
  basePrice: number; // 10ml price, rupees (the sale price when there is one)
  mrpBase?: number; // 10ml MRP, rupees (only when the product is on sale)
  description: string;
  images: string[];
  inStock: boolean;
  sizePrices?: Record<string, number> | null;
  pricingMethod?: string;
};

type ActiveOffer = {
  id: string;
  title: string;
  description: string;
  offerType: "quantity" | "percentage" | "fixed";
  offerPrice: number | null; // paise
  discountValue: number | null;
  requiredQuantity: number;
  eligibleSizes: string[];
  allowMixedVariants: boolean;
  applicableToAll: boolean;
  products: { id: string; slug: string; name: string }[];
};

const SIZE_LABELS = ["5ml", "10ml", "15ml", "30ml", "50ml", "100ml"];

const DEFAULT_DESCRIPTION =
  "A smooth and warm fragrance with a silky finish. Made for evenings and special occasions, it stays close to the skin and lasts for hours.";

// Turns the database product into what this page shows
function toPageProduct(a: ApiProduct): Product {
  const onSale = a.salePrice != null;
  return {
    slug: a.slug,
    name: a.name,
    category: a.category,
    family: [a.family || a.category, a.gender].filter(Boolean).join(" · "),
    notes: a.notes,
    basePrice: (onSale ? a.salePrice! : a.price) / 100,
    mrpBase: onSale ? a.price / 100 : undefined,
    description: a.description || DEFAULT_DESCRIPTION,
    images: a.images,
    inStock: a.inStock,
    sizePrices: a.sizePrices,
    pricingMethod: a.pricingMethod,
  };
}

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

function Message({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-[60vh] items-center justify-center bg-[#FFF9F3] px-4 text-center text-[#111111]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div>{children}</div>
    </main>
  );
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function ProductDetail() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug ?? "";

  // The shop cards send ?size=50ml, so the price here matches the card
  const sizeParam = useSearchParams().get("size");

  const [product, setProduct] = useState<Product | null>(null);
  const [activeOffer, setActiveOffer] = useState<ActiveOffer | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");

  const [activeImage, setActiveImage] = useState(0);
  const [sizeIndex, setSizeIndex] = useState(() => {
    const i = SIZE_LABELS.indexOf(sizeParam ?? "");
    return i >= 0 ? i : 0; // starts on 10ml, the same size the cards start on
  });

  useEffect(() => {
    if (!sizeParam) return;
    const i = SIZE_LABELS.indexOf(sizeParam);
    if (i >= 0) setSizeIndex(i);
  }, [sizeParam]);
  const [qty, setQty] = useState(1);
  const [cartStatus, setCartStatus] = useState<"idle" | "adding" | "added" | "going">("idle");
  const [openAcc, setOpenAcc] = useState<number | null>(0);

  const wished = useWished(product?.slug ?? "");

  // Load the product from the database
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setStatus("loading");

    fetch(`/api/products/slug/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error("failed");
        return (await r.json()) as { product: ApiProduct };
      })
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setStatus("missing");
          return;
        }
        setProduct(toPageProduct(d.product));
        setActiveImage(0);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    // Also fetch active offers that display on product details
    fetch("/api/offers/active?placement=productDetails")
      .then((r) => (r.ok ? r.json() : { offers: [] }))
      .then((d) => {
        if (cancelled) return;
        const match = (d.offers || []).find((o: ActiveOffer) =>
          o.applicableToAll || (o.products && o.products.some((p) => p.slug === slug))
        );
        setActiveOffer(match || null);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "loading") return <Message>Loading perfume…</Message>;

  if (status === "missing") {
    return (
      <Message>
        <h1 className="m-0 text-3xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif', color: "#9C5A2B" }}>
          Perfume not found
        </h1>
        <p className="mt-3 text-sm text-[rgba(17,17,17,0.6)]">This perfume is not available right now.</p>
        <Link
          href="/shopallperfume"
          className="mt-6 inline-block rounded-[6px] bg-[#9C5A2B] px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[#7d4720]"
        >
          Shop all perfumes
        </Link>
      </Message>
    );
  }

  if (status === "error" || !product) {
    return <Message>Could not load this perfume. Please refresh the page.</Message>;
  }

  const images = product.images;

  // Prices are worked out the same way as on the shop cards
  const isGiftCover =
    product.category === "Gift Cover" ||
    product.category === "Gift Covers" ||
    product.family === "Gift Cover";

  const sizes = isGiftCover
    ? [{ ml: 0, price: product.basePrice, originalPrice: product.mrpBase, soldOut: !product.inStock }]
    : product.sizePrices && Object.keys(product.sizePrices).length > 0
    ? Object.entries(product.sizePrices)
        .map(([k, paise]) => {
          const mlNum = parseInt(k.replace(/[^0-9]/g, ""), 10) || 10;
          return {
            ml: mlNum,
            price: Number(paise) / 100,
            originalPrice:
              product.mrpBase && product.basePrice
                ? Math.round(product.mrpBase * (Number(paise) / 100 / product.basePrice))
                : undefined,
            soldOut: !product.inStock,
          };
        })
        .sort((a, b) => a.ml - b.ml)
    : sizesFor(product.basePrice, product.mrpBase);
  const current = sizes[sizeIndex] ?? sizes[0];
  const price = current.price;
  const mrp = current.originalPrice;
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  // What is saved into the wishlist / cart
  const item: WishItem = {
    slug: product.slug,
    name: product.name,
    image: images[0],
    hoverImage: images[1],
    notes: product.notes.length ? product.notes : undefined,
    sizes,
    soldOut: !product.inStock,
  };

  const goPrev = () => setActiveImage((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveImage((i) => (i + 1) % images.length);

  const handleAdd = () => {
    if (!product.inStock || cartStatus !== "idle") return;
    setCartStatus("adding");
    setTimeout(() => {
      addLineToCart(item, current.ml, qty);
      setCartStatus("added");
      setTimeout(() => setCartStatus("idle"), 1500);
    }, 700);
  };

  const handleBuyNow = () => {
    if (!product.inStock || cartStatus !== "idle") return;
    setCartStatus("going");
    setTimeout(() => {
      addLineToCart(item, current.ml, qty);
      router.push("/cart");
    }, 700);
  };

  const busy = cartStatus === "adding" || cartStatus === "going";

  return (
    <main className="min-h-screen bg-[#FFF9F3] text-[#111111]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-[rgba(17,17,17,0.6)]">
          <Link href="/" className="hover:text-[#9C5A2B]">
            Home
          </Link>
          <span className="mx-2">/</span>
          {isGiftCover ? (
            <Link href="/gifts" className="hover:text-[#9C5A2B]">
              Gifts & Covers
            </Link>
          ) : (
            <Link href="/shopallperfume" className="hover:text-[#9C5A2B]">
              Shop All Perfumes
            </Link>
          )}
          <span className="mx-2">/</span>
          <span className="text-[#111111]">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ---------- GALLERY (shows ALL the uploaded images) ---------- */}
          <div className="min-w-0 self-start lg:sticky lg:top-6">
            <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-start">
              {/* Thumbnails: scroll sideways on mobile, scroll down on laptop */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1 lg:max-h-[560px] lg:w-20 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`Show picture ${i + 1}`}
                      aria-current={activeImage === i}
                      className={`aspect-square w-16 shrink-0 overflow-hidden rounded-[10px] border bg-[#F6EEE0] lg:w-20 ${
                        activeImage === i
                          ? "border-[#9C5A2B]"
                          : "border-[#EADFCC] hover:border-[rgba(156,90,43,0.45)]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${product.name} thumbnail ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="relative aspect-[4/5] w-full flex-1 overflow-hidden rounded-[14px] border border-[#EADFCC] bg-[#F6EEE0]">
                {images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[activeImage]}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-[rgba(17,17,17,0.5)]">
                    No image yet
                  </div>
                )}

                {/* Previous / next arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Previous picture"
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-105"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#9C5A2B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 5l-7 7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Next picture"
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-105"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#9C5A2B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[11px] tracking-[0.1em] text-[#111111]">
                      {activeImage + 1} / {images.length}
                    </span>
                  </>
                )}

                {/* Wishlist heart: saves to the wishlist page and updates the navbar count */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(item)}
                  aria-pressed={wished}
                  aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-105"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill={wished ? "#C0392B" : "none"}
                    stroke={wished ? "#C0392B" : "#9C5A2B"}
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
                {!product.inStock && (
                  <span className="absolute left-3 bottom-3 z-10 rounded-[6px] bg-red-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow backdrop-blur-sm">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ---------- DETAILS ---------- */}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-[rgba(17,17,17,0.6)]">{product.family}</p>

            <h1
              className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {product.name}
            </h1>

            {product.notes.length > 0 && (
              <p className="mt-3 text-sm text-[rgba(17,17,17,0.6)]">{product.notes.join(" · ")}</p>
            )}

                       {/* Price (same number as on the card for the same size) */}
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {discount > 0 && (
                <span className="text-xl font-semibold text-[#9C5A2B]">↓ {discount}%</span>
              )}
              {mrp && mrp > price && (
                <span className="text-base text-[rgba(17,17,17,0.6)] line-through">{formatPrice(mrp)}</span>
              )}
              <span className="text-3xl font-semibold">{formatPrice(price)}</span>
              {!product.inStock && (
                <span className="rounded bg-red-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-red-800">
                  Out of Stock
                </span>
              )}
            </div>
            {mrp && mrp > price && (
              <p className="mt-1 text-sm font-medium text-[#9C5A2B]">
                You save {formatPrice(mrp - price)}
              </p>
            )}
            <p className="mt-1 text-xs text-[rgba(17,17,17,0.6)]">Inclusive of all taxes</p>

            {/* Bundle offer: changes when the size changes */}
            {/* <BundleOffer price={price} mrp={mrp} qty={qty} /> */}

            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[rgba(17,17,17,0.8)]">
              {product.description}
            </p>

            {/* Overall rating (from the customer reviews) */}
            <RatingSummary slug={product.slug} />

            {/* Special Offer Banner on Product Page */}
            {activeOffer && (
              <div className="mt-6 border border-[#9C5A2B]/40 bg-[#FCF8F0] p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block rounded bg-[#9C5A2B] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Special Offer
                  </span>
                  <span className="font-semibold text-sm text-[#9C5A2B]">
                    {activeOffer.title}
                  </span>
                </div>
                {activeOffer.description && (
                  <p className="mt-1 text-xs text-black/70">{activeOffer.description}</p>
                )}
                <div className="mt-2 text-xs font-medium text-black/85">
                  {activeOffer.offerType === "quantity" && activeOffer.offerPrice != null
                    ? `Buy ${activeOffer.requiredQuantity} bottle${activeOffer.requiredQuantity > 1 ? "s" : ""} for just ₹${(activeOffer.offerPrice / 100).toLocaleString("en-IN")}!`
                    : activeOffer.offerType === "percentage" && activeOffer.discountValue != null
                    ? `Get ${activeOffer.discountValue}% OFF on purchase of ${activeOffer.requiredQuantity} bottle${activeOffer.requiredQuantity > 1 ? "s" : ""}!`
                    : `Flat ₹${((activeOffer.discountValue || 0) / 100).toLocaleString("en-IN")} OFF on ${activeOffer.requiredQuantity} bottle${activeOffer.requiredQuantity > 1 ? "s" : ""}!`}
                </div>

                {/* Dynamic eligibility for selected size */}
                <div className="mt-3 pt-2.5 border-t border-[#9C5A2B]/15">
                  {(() => {
                    const reqSizes = activeOffer.eligibleSizes || [];
                    const curSizeStr = `${current.ml}ml`.toLowerCase();
                    const isEligible =
                      reqSizes.length === 0 ||
                      reqSizes.map((s) => s.toLowerCase()).includes(curSizeStr) ||
                      reqSizes.map((s) => s.toLowerCase()).includes(String(current.ml));

                    if (isEligible) {
                      return (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          <span>This {current.ml}ml bottle qualifies for the offer!</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-900">
                          <span className="h-2 w-2 rounded-full bg-amber-600" />
                          <span>Offer applies only to sizes: {reqSizes.join(", ")}</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Size */}
            {!isGiftCover ? (
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em]">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s, i) => (
                    <button
                      key={s.ml}
                      type="button"
                      onClick={() => setSizeIndex(i)}
                      aria-pressed={sizeIndex === i}
                      className={`rounded-[6px] border px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] transition ${
                        sizeIndex === i
                          ? "border-[#9C5A2B] bg-[#9C5A2B] text-white"
                          : "border-[#EADFCC] bg-white hover:border-[#9C5A2B]"
                      }`}
                    >
                      {s.ml}ml
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em]">Size</p>
                <span className="inline-block rounded-[6px] border border-[#9C5A2B] bg-[#9C5A2B] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white">
                  Standard Size
                </span>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em]">Quantity</p>
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
                disabled={!product.inStock || busy}
                aria-live="polite"
                className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-[#9C5A2B] px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[#9C5A2B] transition hover:bg-[#9C5A2B] hover:text-white disabled:cursor-not-allowed disabled:border-[#D9CDBA] disabled:text-[#B9AD9A] disabled:hover:bg-transparent"
              >
                {!product.inStock ? (
                  "Sold out"
                ) : cartStatus === "adding" ? (
                  <>
                    <Spinner /> Adding
                  </>
                ) : cartStatus === "added" ? (
                  "Added ✓"
                ) : (
                  "Add to cart"
                )}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.inStock || busy}
                className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#9C5A2B] px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white transition hover:bg-[#7d4720] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {cartStatus === "going" ? (
                  <>
                    <Spinner /> Please wait
                  </>
                ) : (
                  "Buy now"
                )}
              </button>
            </div>

            {/* Accordions */}
            <div className="mt-8 border-t border-[rgba(156,90,43,0.25)]">
              {ACCORDIONS.map((a, i) => (
                <div key={a.title} className="border-b border-[rgba(156,90,43,0.25)]">
                  <button
                    type="button"
                    onClick={() => setOpenAcc(openAcc === i ? null : i)}
                    className="flex w-full items-center justify-between py-4 text-left text-xs font-medium uppercase tracking-[0.14em]"
                  >
                    {a.title}
                    <span className="text-lg text-[#9C5A2B]">{openAcc === i ? "−" : "+"}</span>
                  </button>
                  {openAcc === i && (
                    <p className="pb-4 text-sm leading-relaxed text-[rgba(17,17,17,0.7)]">{a.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- REVIEWS ---------- */}
        <div className="mt-14">
          <ProductReviews slug={product.slug} />
        </div>

        {/* ---------- RELATED PRODUCTS ---------- */}
        <div className="mt-14">
          <RelatedProducts slug={product.slug} category={product.category} />
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetail />
    </Suspense>
  );
}