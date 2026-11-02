"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CartLine, WrappedItemRef } from "@/lib/shopStorage";

const COPPER = "#9C5A2B";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

interface GiftWrapConfirmModalProps {
  open: boolean;
  box: {
    slug: string;
    name: string;
    price: number;
    image: string;
  } | null;
  cartItems: CartLine[];
  initialSelected?: WrappedItemRef[];
  onConfirm: (selectedWrappedItems: WrappedItemRef[]) => void;
  onCancel: () => void;
}

export default function GiftWrapConfirmModal({
  open,
  box,
  cartItems,
  initialSelected,
  onConfirm,
  onCancel,
}: GiftWrapConfirmModalProps) {
  // Only perfumes / non-gift-cover items are eligible to be wrapped
  const eligibleItems = cartItems.filter((it) => !it.isGiftCover && it.ml > 0);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Initialize selection when opened
  useEffect(() => {
    if (!open) return;
    setSubmitting(false);

    if (initialSelected && initialSelected.length > 0) {
      const keys = new Set(initialSelected.map((i) => `${i.slug}__${i.ml}`));
      setSelectedKeys(keys);
    } else if (eligibleItems.length === 1) {
      // Auto-select if there's only 1 eligible perfume
      setSelectedKeys(new Set([`${eligibleItems[0].slug}__${eligibleItems[0].ml}`]));
    } else {
      setSelectedKeys(new Set());
    }
  }, [open, initialSelected, cartItems.length]);

  if (!open || !box) return null;

  const toggleItem = (slug: string, ml: number) => {
    const key = `${slug}__${ml}`;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedKeys.size === 0 || submitting) return;
    setSubmitting(true);

    const chosenRefs: WrappedItemRef[] = [];
    for (const it of eligibleItems) {
      const key = `${it.slug}__${it.ml}`;
      if (selectedKeys.has(key)) {
        chosenRefs.push({
          slug: it.slug,
          name: it.name,
          ml: it.ml,
        });
      }
    }

    onConfirm(chosenRefs);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-wrap-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ fontFamily: sans }}
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-[#FCF8F0] shadow-2xl border border-[#9C5A2B]/25">
        {/* Header */}
        <div className="border-b border-[#9C5A2B]/20 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9C5A2B]">
                Gift Presentation
              </span>
              <h3
                id="gift-wrap-title"
                className="mt-0.5 text-2xl font-medium text-[#111111]"
                style={{ fontFamily: serif }}
              >
                Who is this gift for?
              </h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close dialog"
              className="rounded-full p-1 text-stone-400 hover:text-stone-700"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-xs text-[#111111]/70">
            Choose which item or items you would like to gift-wrap with this gift cover.
          </p>
        </div>

        {/* Selected Gift Cover summary banner */}
        <div className="flex items-center gap-3 border-b border-[#9C5A2B]/15 bg-[#F6EEE0] px-5 py-3 sm:px-6">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#9C5A2B]/30 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={box.image} alt={box.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#111111]">{box.name}</p>
            <p className="text-[11px] text-[#9C5A2B] font-bold">
              Gift Wrap Price: ₹{box.price.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Body: eligible items checklist */}
        <div className="max-h-[50vh] overflow-y-auto px-5 py-4 sm:px-6">
          {eligibleItems.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#9C5A2B]/10 text-[#9C5A2B]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <h4 className="mt-3 text-sm font-semibold text-[#111111]">
                Your cart does not have any perfumes yet
              </h4>
              <p className="mx-auto mt-1 max-w-xs text-xs text-[#111111]/60">
                Please add a fragrance product first so we can assign this luxury gift cover to wrap it for you!
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href="/shopallperfume"
                  onClick={onCancel}
                  className="rounded-lg bg-[#9C5A2B] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#7d4720]"
                >
                  Explore Perfumes →
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-xs font-medium text-[#111111]/80">
                Select one or more items to wrap in this box:
              </p>
              <ul className="space-y-2.5">
                {eligibleItems.map((it) => {
                  const key = `${it.slug}__${it.ml}`;
                  const checked = selectedKeys.has(key);
                  return (
                    <li
                      key={key}
                      onClick={() => toggleItem(it.slug, it.ml)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                        checked
                          ? "border-[#9C5A2B] bg-white shadow-xs"
                          : "border-[#EADFCC] bg-white/70 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                          {it.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">
                              No pic
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#111111]">
                            {it.name}
                          </p>
                          <p className="text-xs text-[#111111]/60">
                            Bottle Size: <span className="font-medium text-[#9C5A2B]">{it.ml}ml</span> · Qty: {it.qty}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pr-1">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                            checked
                              ? "border-[#9C5A2B] bg-[#9C5A2B] text-white"
                              : "border-stone-300 bg-white"
                          }`}
                        >
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#9C5A2B]/20 bg-white px-5 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-50"
            style={{ borderColor: CARD_LINE }}
          >
            Cancel
          </button>

          {eligibleItems.length > 0 && (
            <button
              type="button"
              disabled={selectedKeys.size === 0 || submitting}
              onClick={handleConfirm}
              className="inline-flex items-center justify-center rounded-lg bg-[#9C5A2B] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:bg-[#7d4720] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Applying..." : `Confirm Gift Wrapping (${selectedKeys.size})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
