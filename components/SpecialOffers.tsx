"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const PASTEL = "#F3E7D5";
const INK = "#111111";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

export type PublicOffer = {
  id: string;
  title: string;
  description: string;
  offerType: "quantity" | "percentage" | "fixed";
  offerPrice: number | null; // paise
  discountValue: number | null;
  requiredQuantity: number;
  eligibleSizes: string[];
  allowMixedVariants: boolean;
  bannerImage: string | null;
  products: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number; // paise
    salePrice: number | null;
  }[];
};

export default function SpecialOffers() {
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/offers/active?placement=homepage")
      .then((res) => (res.ok ? res.json() : { offers: [] }))
      .then((data) => {
        if (!cancelled) {
          setOffers(data.offers || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || offers.length === 0) {
    return null; // Do not render if no active homepage offers
  }

  return (
    <section className="relative overflow-hidden py-16 sm:py-24" style={{ background: IVORY, fontFamily: sans }}>
      {/* Decorative background border */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9C5A2B]">
            Limited Time Promotions
          </span>
          <h2
            className="mt-2 text-3xl font-medium tracking-tight sm:text-5xl"
            style={{ fontFamily: serif, color: INK }}
          >
            Special Offers & Deals
          </h2>
          <div className="mx-auto mt-4 h-px w-16 bg-[#9C5A2B]/40" />
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => {
            const firstProduct = offer.products[0];
            const regularTotalPaise =
              firstProduct && offer.requiredQuantity
                ? (firstProduct.salePrice ?? firstProduct.price) * offer.requiredQuantity
                : null;

            const savingsPaise =
              offer.offerType === "quantity" && offer.offerPrice && regularTotalPaise
                ? Math.max(0, regularTotalPaise - offer.offerPrice)
                : offer.offerType === "fixed" && offer.discountValue
                ? offer.discountValue * 100
                : null;

            const targetHref = firstProduct ? `/product/${firstProduct.slug}` : "/shopallperfume";

            return (
              <div
                key={offer.id}
                className="group relative flex flex-col justify-between border border-black/10 bg-white p-6 shadow-sm transition-all hover:border-[#9C5A2B]/40 hover:shadow-md"
              >
                {/* Banner or Product Image */}
                <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden bg-[#F6EEE0]">
                  {offer.bannerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={offer.bannerImage}
                      alt={offer.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : firstProduct?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={firstProduct.image}
                      alt={firstProduct.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-black/40">
                      Mirqas Special Deal
                    </div>
                  )}

                  <div className="absolute left-3 top-3 bg-[#9C5A2B] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    Special Offer
                  </div>
                </div>

                {/* Offer Details */}
                <div className="flex-1">
                  <h3
                    className="text-xl font-medium text-black group-hover:text-[#9C5A2B] transition-colors"
                    style={{ fontFamily: serif }}
                  >
                    {offer.title}
                  </h3>

                  {offer.description && (
                    <p className="mt-2 text-xs leading-relaxed text-black/60 line-clamp-2">
                      {offer.description}
                    </p>
                  )}

                  {/* Pricing Box */}
                  <div className="mt-4 border-t border-black/5 pt-4">
                    {offer.offerType === "quantity" && offer.offerPrice != null && (
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-semibold text-[#9C5A2B]">
                          ₹{(offer.offerPrice / 100).toLocaleString("en-IN")}
                        </span>
                        {regularTotalPaise && regularTotalPaise > offer.offerPrice && (
                          <span className="text-sm text-black/40 line-through">
                            ₹{(regularTotalPaise / 100).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    )}

                    {offer.offerType === "percentage" && offer.discountValue != null && (
                      <div className="text-2xl font-semibold text-[#9C5A2B]">
                        {offer.discountValue}% Flat Discount
                      </div>
                    )}

                    {offer.offerType === "fixed" && offer.discountValue != null && (
                      <div className="text-2xl font-semibold text-[#9C5A2B]">
                        Flat ₹{(offer.discountValue / 100).toLocaleString("en-IN")} OFF
                      </div>
                    )}

                    {/* Savings tag */}
                    {savingsPaise && savingsPaise > 0 && (
                      <div className="mt-1.5 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Save ₹{(savingsPaise / 100).toLocaleString("en-IN")}
                      </div>
                    )}

                    <div className="mt-2 text-[11px] text-black/50">
                      Requirement: Buy {offer.requiredQuantity} bottle{offer.requiredQuantity > 1 ? "s" : ""}
                      {offer.eligibleSizes.length > 0 && ` (${offer.eligibleSizes.join(", ")})`}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="mt-6 pt-2">
                  <Link
                    href={targetHref}
                    className="flex w-full items-center justify-center bg-[#9C5A2B] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFF9F3] transition-colors hover:bg-[#834920]"
                  >
                    View Offer & Shop
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

