"use client";

import { useEffect, useState } from "react";
import { BULK_OFFER, formatRupees } from "@/lib/offers";

const CART_KEY = "mirqas-cart";
const SYNC_EVENT = "mirqas-storage";

// Total quantity of all lines in the browser cart
function readCartCount(): number {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return 0;
    return list.reduce((n: number, line: { qty?: number }) => n + (Number(line?.qty) || 0), 0);
  } catch {
    return 0;
  }
}

export default function BundleOffer({
  price,
  mrp,
  qty,
}: {
  price: number;
  mrp?: number;
  qty: number;
}) {
  const [inCart, setInCart] = useState(0);

  useEffect(() => {
    const load = () => setInCart(readCartCount());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(SYNC_EVENT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(SYNC_EVENT, load);
    };
  }, []);

  // Offer progress (cart + the quantity chosen on this page)
  const count = inCart + qty;
  const unlocked = count >= BULK_OFFER.minQty;
  const remaining = Math.max(0, BULK_OFFER.minQty - count);
  const progress = Math.min(100, (count / BULK_OFFER.minQty) * 100);

  // Savings: sale price (set by admin) and the bundle offer
  const saleSaving = mrp && mrp > price ? (mrp - price) * qty : 0;
  const bundleSaving = unlocked ? BULK_OFFER.amountOff : 0;
  const totalSaving = saleSaving + bundleSaving;

  return (
    <div className="mt-5 overflow-hidden rounded-[14px] border border-[#EADFCC] bg-[#FFF9F3]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EADFCC] bg-[#F3E7D5] px-4 py-3">
        <span className="rounded-[6px] bg-[#9C5A2B] px-2.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
          Bundle offer
        </span>
        <span className="font-sans text-[13px] font-medium text-[#111111]">
          Buy any {BULK_OFFER.minQty} perfumes and save {formatRupees(BULK_OFFER.amountOff)}
        </span>
      </div>

      <div className="px-4 pt-4 font-sans">
        <p
          className="m-0 text-[13px] font-medium"
          style={{ color: unlocked ? "#1F7A3A" : "#9C5A2B" }}
        >
          {unlocked
            ? "Offer unlocked."
            : `Add ${remaining} more ${remaining === 1 ? "perfume" : "perfumes"} to save ${formatRupees(BULK_OFFER.amountOff)}.`}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EADFCC]">
          <div
            className="h-full rounded-full bg-[#9C5A2B] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {inCart > 0 && (
          <p className="m-0 mt-2 text-[12px] text-[rgba(17,17,17,0.6)]">In your cart now: {inCart}</p>
        )}
      </div>

      {totalSaving > 0 && (
        <div className="mx-4 my-4 space-y-1.5 border-t border-[#EADFCC] pt-3 font-sans text-[13px] text-[rgba(17,17,17,0.6)]">
          {saleSaving > 0 && (
            <div className="flex justify-between">
              <span>Sale discount</span>
              <span className="text-[#111111]">- {formatRupees(saleSaving)}</span>
            </div>
          )}
          {bundleSaving > 0 && (
            <div className="flex justify-between">
              <span>Bundle offer</span>
              <span className="text-[#111111]">- {formatRupees(bundleSaving)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9C5A2B]">
              Your savings
            </span>
            <span
              className="text-[22px] font-semibold leading-none text-[#9C5A2B]"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {formatRupees(totalSaving)}
            </span>
          </div>
        </div>
      )}
      {totalSaving === 0 && <div className="h-4" />}
    </div>
  );
}