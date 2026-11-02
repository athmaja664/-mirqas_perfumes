"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatPaise } from "@/lib/money";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

export type AdminOrderItemData = {
  id?: string;
  productId: string;
  slug: string;
  name: string;
  image?: string;
  ml: number;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  currentStock?: number;
  isActive?: boolean;
};

// ── Item Details Modal ───────────────────────────────────────────────────────
function ItemDetailModal({
  item,
  onClose,
}: {
  item: AdminOrderItemData;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const stock = item.currentStock;
  const isOutOfStock = stock !== undefined && stock <= 0;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 5;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-xl flex-col border border-black/10 bg-[#FCF8F0] shadow-2xl"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center bg-white/80 text-black/60 transition-colors hover:text-black"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Product Image */}
          <div className="relative w-full shrink-0 bg-[#F3E7D5] sm:w-56">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-[13px] text-black/40">
                No image
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50">
                Ordered Item Details
              </p>
              <h3 className="m-0 mt-1 text-2xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
                {item.name}
              </h3>
              <p className="m-0 text-[13px] text-black/60">Variant: {item.ml > 0 ? `${item.ml} ml Bottle` : "Gift Cover (Presentation Box)"}</p>
            </div>

            {/* Current Warehouse Stock Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-black/55">Current Stock:</span>
              {stock === undefined ? (
                <span className="text-[12px] text-black/50">Unknown</span>
              ) : isOutOfStock ? (
                <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                  ● Out of Stock (0 units)
                </span>
              ) : isLowStock ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  ● Low Stock ({stock} left)
                </span>
              ) : (
                <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                  ● In Stock ({stock} available)
                </span>
              )}
            </div>

            {/* Order breakdown */}
            <div className="mt-1 grid grid-cols-2 gap-2 border-t border-black/10 pt-3 text-[13px]">
              <div className="text-black/55">Bottle Size</div>
              <div className="font-semibold text-black/90">{item.ml > 0 ? `${item.ml} ml` : "Gift Cover"}</div>

              <div className="text-black/55">Ordered Quantity</div>
              <div className="font-semibold text-black/90">{item.qty} units</div>

              <div className="text-black/55">Unit Price</div>
              <div className="text-black/90">{formatPaise(item.unitPrice)}</div>

              <div className="text-black/55">Item Subtotal</div>
              <div className="font-bold text-[#9C5A2B]">{formatPaise(item.lineTotal)}</div>

              <div className="text-black/55">Product ID</div>
              <div className="truncate font-mono text-[11px] text-black/75">{item.productId}</div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-wrap gap-2 pt-3">
              {item.productId && (
                <Link
                  href={`/admin/products/${item.productId}`}
                  className="cursor-pointer bg-[#9C5A2B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#7d4720]"
                >
                  Edit Product
                </Link>
              )}
              {item.slug && (
                <Link
                  href={`/product/${item.slug}`}
                  target="_blank"
                  className="cursor-pointer border border-[#9C5A2B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white"
                >
                  View in Store ↗
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer border border-black/20 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/70 hover:bg-black/[0.04]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Admin Order Items List with Clickable Details ────────────────────────────
export default function AdminOrderItemsList({ items }: { items: AdminOrderItemData[] }) {
  const [selectedItem, setSelectedItem] = useState<AdminOrderItemData | null>(null);

  return (
    <>
      {selectedItem && (
        <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* Desktop / Tablet Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.18em] text-black/50">
              <th className="py-3 pr-4 font-medium">Product (Click for details)</th>
              <th className="px-4 py-3 font-medium">Product ID</th>
              <th className="px-4 py-3 font-medium">Bottle Size</th>
              <th className="px-4 py-3 font-medium">Unit Price</th>
              <th className="px-4 py-3 font-medium text-center">Qty</th>
              <th className="py-3 pl-4 text-right font-medium">Item Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {items.map((item, index) => {
              const stock = item.currentStock;
              const isOutOfStock = stock !== undefined && stock <= 0;

              return (
                <tr
                  key={item.id || `${item.slug}-${item.ml}-${index}`}
                  onClick={() => setSelectedItem(item)}
                  className="group cursor-pointer transition-colors hover:bg-black/[0.02]"
                >
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 border border-black/10 bg-[#F3E7D5] object-cover transition-opacity group-hover:opacity-85"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-black/10 bg-[#F3E7D5] text-[11px] text-black/40">
                          Perfume
                        </div>
                      )}
                      <div>
                        <p className="m-0 font-medium text-black/90 group-hover:text-[#9C5A2B] group-hover:underline">
                          {item.name}
                        </p>
                        <p className="m-0 text-[11px] text-black/50">Variant: {item.ml > 0 ? `${item.ml} ml Bottle` : "Gift Cover"}</p>
                        {item.ml === 0 && (
                          <span className="mt-1 inline-block rounded bg-[#9C5A2B]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#9C5A2B]">
                            🎁 Gift Wrap
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-semibold text-red-700">
                            Currently Out of Stock
                          </span>
                        )}
                        <span className="mt-0.5 block text-[11px] font-medium text-[#9C5A2B] opacity-0 transition-opacity group-hover:opacity-100">
                          Click to view details & stock ↗
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <code className="rounded bg-black/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-black/75">
                      {item.productId || item.slug || "—"}
                    </code>
                  </td>

                  <td className="px-4 py-3.5 font-medium">
                    <span className="inline-block border border-black/15 bg-black/[0.02] px-2.5 py-1 text-[12px]">
                      {item.ml > 0 ? `${item.ml} ml` : "Gift Cover"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-black/80">{formatPaise(item.unitPrice)}</td>

                  <td className="px-4 py-3.5 text-center font-medium text-black/90">{item.qty}</td>

                  <td className="py-3.5 pl-4 text-right font-semibold text-black/90">
                    {formatPaise(item.lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Clickable cards */}
      <div className="divide-y divide-black/10 md:hidden">
        {items.map((item, index) => (
          <div
            key={item.id || `${item.slug}-${item.ml}-${index}`}
            onClick={() => setSelectedItem(item)}
            className="cursor-pointer py-4 transition-colors hover:bg-black/[0.02] first:pt-0 last:pb-0"
          >
            <div className="flex gap-3">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-20 w-20 shrink-0 border border-black/10 bg-[#F3E7D5] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-black/10 bg-[#F3E7D5] text-[11px] text-black/40">
                  Perfume
                </div>
              )}

              <div className="min-w-0 flex-1 text-[13px]">
                <p className="m-0 font-medium text-black/95">{item.name}</p>
                <p className="m-0 mt-0.5 text-[12px] text-black/55">
                  Bottle Size: <strong>{item.ml} ml</strong>
                </p>
                <p className="m-0 mt-0.5 text-[11px] text-black/45">
                  Product ID: <code className="font-mono">{item.productId || item.slug}</code>
                </p>

                <div className="mt-2 flex items-center justify-between text-[13px]">
                  <span className="text-black/60">
                    {item.qty} × {formatPaise(item.unitPrice)}
                  </span>
                  <span className="font-semibold text-black/95">{formatPaise(item.lineTotal)}</span>
                </div>

                <p className="m-0 mt-1.5 text-[11px] font-medium text-[#9C5A2B]">
                  Click to inspect item & warehouse stock →
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

