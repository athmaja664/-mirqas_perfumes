"use client";

import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";

export type DemoOutcomeAction = "success" | "failed" | "pending" | "cancelled";

type Props = {
  open: boolean;
  orderNumber: string;
  razorpayOrderId: string;
  amountPaise: number;
  customerName: string;
  customerPhone: string;
  busy: boolean;
  onAction: (action: DemoOutcomeAction, reason?: string) => void;
};

const UPI_APPS = [
  { id: "gpay", label: "Google Pay", tag: "UPI App" },
  { id: "phonepe", label: "PhonePe", tag: "UPI App" },
  { id: "paytm", label: "Paytm UPI", tag: "UPI App" },
  { id: "bhim", label: "BHIM / Other UPI", tag: "UPI ID" },
];

const serifFont = 'var(--font-serif), "Cormorant Garamond", "Playfair Display", Georgia, serif';
const sansFont = 'var(--font-sans), Inter, system-ui, sans-serif';

export default function RazorpayDemoModal({
  open,
  orderNumber,
  razorpayOrderId,
  amountPaise,
  customerName,
  customerPhone,
  busy,
  onAction,
}: Props) {
  const [selectedApp, setSelectedApp] = useState("gpay");
  const [upiId, setUpiId] = useState("success@razorpay");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onAction("cancelled");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onAction]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[2px]"
      style={{ fontFamily: sansFont }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-rzp-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-[14px] border border-[#EADFCC] bg-white text-[#111111] shadow-xl">
        {/* Top Merchant Header matching Mirqas Ivory & Copper palette */}
        <div className="border-b border-[#EADFCC] bg-[#FFF9F3] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#9C5A2B]">
                Razorpay UPI Checkout · Demo
              </p>
              <h3
                id="demo-rzp-title"
                className="mt-1 text-2xl font-medium tracking-tight text-[#9C5A2B] sm:text-3xl"
                style={{ fontFamily: serifFont }}
              >
                Mirqas Perfumes
              </h3>
              <p className="mt-1 text-xs text-[#111111]/60">
                Order {orderNumber} &middot; {razorpayOrderId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#111111]/60">Payable</p>
              <p className="mt-0.5 text-xl font-semibold text-[#9C5A2B]">
                {formatPaise(amountPaise)}
              </p>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice Banner */}
        <div className="border-b border-[#EADFCC] bg-[#FCF8F0] px-6 py-2.5 text-xs leading-relaxed text-[#7d4720]">
          <strong className="font-semibold">Demo Simulation:</strong> Razorpay API keys are not set yet.
          Test UPI outcomes below without charging real money or creating a paid order.
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          <div className="rounded-[10px] border border-[#EADFCC] bg-[#FFF9F3] px-4 py-3 text-sm">
            <p className="text-xs text-[#111111]/60">Customer</p>
            <p className="mt-0.5 font-medium text-[#111111]">
              {customerName || "Customer"} {customerPhone ? `· +91 ${customerPhone}` : ""}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[#111111]">Choose UPI app</p>
            <div className="grid grid-cols-2 gap-2.5">
              {UPI_APPS.map((app) => {
                const active = selectedApp === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setSelectedApp(app.id)}
                    className={`flex items-center justify-between rounded-[10px] border px-3.5 py-2.5 text-left text-sm transition ${
                      active
                        ? "border-[#9C5A2B] bg-[#FFF9F3] font-medium text-[#9C5A2B]"
                        : "border-[#EADFCC] bg-white text-[#111111]/80 hover:border-[#9C5A2B]/60"
                    }`}
                  >
                    <span>{app.label}</span>
                    <span className="text-[11px] text-[#111111]/55">{app.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111111]">
              Demo UPI ID / VPA{" "}
              <span className="font-normal text-[#111111]/60">(No PIN needed)</span>
            </label>
            <input
              type="text"
              value={upiId}
              disabled={busy}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="success@razorpay"
              className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm text-[#111111] outline-none transition-colors focus:border-[#9C5A2B]"
            />
          </div>

          {/* Outcome Controls */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => onAction("success")}
              className="w-full rounded-[6px] bg-[#9C5A2B] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? "Verifying Demo Payment..."
                : `Simulate Pay ${formatPaise(amountPaise)} (Success)`}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction(
                    "failed",
                    `Simulated UPI decline for ${upiId.trim() || "demo VPA"} (${selectedApp.toUpperCase()}).`
                  )
                }
                className="rounded-[6px] border border-[#E8B7B0] bg-[#F8E3E0] px-3 py-2.5 text-xs font-semibold text-[#A32A1F] transition hover:bg-[#f4d4cf] disabled:opacity-50"
              >
                Simulate Failed
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => onAction("pending")}
                className="rounded-[6px] border border-[#EADFCC] bg-[#FFF9F3] px-3 py-2.5 text-xs font-semibold text-[#9C5A2B] transition hover:bg-[#F7EEE3] disabled:opacity-50"
              >
                Simulate Pending
              </button>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => onAction("cancelled")}
              className="w-full rounded-[6px] border border-[#9C5A2B] bg-white px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white disabled:opacity-50"
            >
              Cancel &amp; Return to Checkout
            </button>
          </div>

          <p className="text-center text-xs text-[#111111]/55">
            Secured by Razorpay &middot; UPI Demo Flow
          </p>
        </div>
      </div>
    </div>
  );
}
