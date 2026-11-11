"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPaise } from "@/lib/money";

const serif = 'var(--font-serif), "Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = 'var(--font-sans), Inter, system-ui, sans-serif';

type SuccessOrder = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  subtotal: number;
  discountTotal: number;
  offerTitle: string | null;
  total: number;
  currency: string;
  createdAt: string;
  shipping: {
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    productId: string;
    slug: string;
    name: string;
    image: string;
    ml: number;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  isDemo: boolean;
  isDemoVerified: boolean;
  isPaid: boolean;
  isVerified: boolean;
  isTestMode: boolean;
};

function SuccessContent() {
  const sp = useSearchParams();
  const orderNumber = (sp.get("order") || "").trim().toUpperCase();

  const [loading, setLoading] = useState(Boolean(orderNumber));
  const [error, setError] = useState(orderNumber ? "" : "No order reference was provided.");
  const [order, setOrder] = useState<SuccessOrder | null>(null);

  useEffect(() => {
    if (!orderNumber) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/buy-now/order/${encodeURIComponent(orderNumber)}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok || !data?.order) {
          setError(data?.error || "Could not load your order details.");
        } else {
          setError("");
          setOrder(data.order as SuccessOrder);
        }
      } catch {
        if (!cancelled) setError("Network error while loading your order summary.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <div style={{ background: "#FFF9F3", minHeight: "75vh", fontFamily: sans }} className="text-[#111111]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        {loading ? (
          <div className="rounded-[14px] border border-[#EADFCC] bg-white p-12 text-center text-sm text-[#111111]/60">
            Loading your order confirmation...
          </div>
        ) : error || !order ? (
          <div className="rounded-[14px] border border-[#EADFCC] bg-white p-8 text-center sm:p-10">
            <h1 style={{ fontFamily: serif, color: "#9C5A2B" }} className="m-0 text-4xl font-medium">
              Order Details Unavailable
            </h1>
            <p className="mt-3 text-sm text-[#111111]/60">
              {error || "Please sign in to inspect your order confirmation."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/account/orders"
                className="rounded-[6px] bg-[#9C5A2B] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
              >
                My Orders
              </Link>
              <Link
                href="/shopallperfume"
                className="rounded-[6px] border border-[#9C5A2B] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : !order.isVerified ? (
          <div className="rounded-[14px] border border-[#EADFCC] bg-white p-8 text-center sm:p-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#9C5A2B]">
              Payment Not Verified Yet
            </p>
            <h1 style={{ fontFamily: serif, color: "#9C5A2B" }} className="m-0 mt-2 text-3xl font-medium">
              Order {order.orderNumber} is {order.paymentStatus}
            </h1>
            <p className="mt-2 text-sm text-[#111111]/65">
              This order has not received a verified Razorpay confirmation yet.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                className="rounded-[6px] bg-[#9C5A2B] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
              >
                View Order Status
              </Link>
              <Link
                href="/shopallperfume"
                className="rounded-[6px] border border-[#9C5A2B] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[#EADFCC] bg-white">
            {/* Hero Confirmation Header */}
            <div className="border-b border-[#EADFCC] bg-[#FFF9F3] px-6 py-8 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                <svg
                  className="h-8 w-8 animate-[pulse_2s_ease-in-out_1]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>

              {order.isDemo ? (
                <span className="mt-4 inline-block rounded-[6px] border border-[#EADFCC] bg-white px-3 py-1 text-[11px] font-medium text-[#7d4720]">
                  Demo Mode Simulation &middot; Pending Test Order (No Real Charge)
                </span>
              ) : order.isTestMode ? (
                <span className="mt-4 inline-block rounded-[6px] border border-[#EADFCC] bg-white px-3 py-1 text-[11px] font-medium text-[#9C5A2B]">
                  Razorpay Test Mode &middot; Verified
                </span>
              ) : null}

              <h1
                style={{ fontFamily: serif, color: "#9C5A2B" }}
                className="m-0 mt-3 text-4xl font-medium tracking-tight sm:text-5xl"
              >
                Payment Successful
              </h1>
              <p className="mt-2 text-sm text-[#111111]/65">
                Thank you for your purchase! Your direct order has been recorded cleanly.
              </p>
            </div>

            {/* Reference Grid */}
            <div className="grid gap-4 border-b border-[#EADFCC] bg-white px-6 py-5 text-sm sm:grid-cols-2 sm:px-8">
              <div>
                <p className="text-xs text-[#111111]/60">Order ID</p>
                <p className="mt-0.5 text-base font-semibold text-[#111111]">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-[#111111]/60">Razorpay Payment ID</p>
                <p className="mt-0.5 font-mono text-xs font-medium text-[#111111]">
                  {order.razorpayPaymentId || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#111111]/60">Payment Method</p>
                <p className="mt-0.5 font-medium text-[#111111]">UPI via Razorpay</p>
              </div>
              <div>
                <p className="text-xs text-[#111111]/60">
                  Amount {order.isDemo ? "(Simulated)" : "Paid"}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-[#9C5A2B]">
                  {formatPaise(order.total)}
                </p>
              </div>
            </div>

            {/* Purchased Product(s) & Delivery Info */}
            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <h2
                  style={{ fontFamily: serif, color: "#9C5A2B" }}
                  className="m-0 mb-3 text-xl font-medium"
                >
                  Purchased product
                </h2>
                <div className="space-y-3">
                  {order.items.map((it) => (
                    <div
                      key={`${it.productId}-${it.ml}`}
                      className="flex items-center gap-3 rounded-[10px] border border-[#EADFCC] bg-[#FFF9F3] p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[8px] border border-[#EADFCC] bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-medium text-[#111111]">{it.name}</p>
                        <p className="mt-0.5 text-xs text-[#111111]/60">
                          {it.ml}ml &middot; Qty {it.qty}
                        </p>
                        <p className="mt-1 font-semibold text-[#9C5A2B]">{formatPaise(it.lineTotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2
                  style={{ fontFamily: serif, color: "#9C5A2B" }}
                  className="m-0 mb-3 text-xl font-medium"
                >
                  Delivery information
                </h2>
                <div className="rounded-[10px] border border-[#EADFCC] bg-[#FFF9F3] p-4 text-sm leading-relaxed text-[#111111]/85">
                  <p className="font-semibold text-[#111111]">{order.shipping.name}</p>
                  <p className="mt-0.5 text-xs text-[#111111]/70">+91 {order.shipping.phone}</p>
                  <p className="mt-2 text-sm">
                    {order.shipping.line1}
                    {order.shipping.line2 ? `, ${order.shipping.line2}` : ""}
                    <br />
                    {order.shipping.city}, {order.shipping.state} &ndash; {order.shipping.pincode}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 border-t border-[#EADFCC] bg-[#FFF9F3] px-6 py-5 sm:flex-row sm:justify-center sm:px-8">
              <Link
                href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                className="inline-flex items-center justify-center rounded-[6px] bg-[#9C5A2B] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
              >
                View Order
              </Link>
              <Link
                href="/shopallperfume"
                className="inline-flex items-center justify-center rounded-[6px] border border-[#9C5A2B] bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyNowSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ background: "#FFF9F3", minHeight: "70vh" }}
          className="flex items-center justify-center text-sm text-[#111111]/60"
        >
          Loading confirmation...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
