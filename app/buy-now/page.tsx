"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPaise } from "@/lib/money";
import { loginRequest } from "@/lib/authApi";
import { setActiveUserId } from "@/lib/shopStorage";
import type { BuyNowQuote } from "@/lib/services/buy-now";
import RazorpayDemoModal, { type DemoOutcomeAction } from "@/components/buy-now/RazorpayDemoModal";

const serif = 'var(--font-serif), "Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = 'var(--font-sans), Inter, system-ui, sans-serif';

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  note: string;
};

const EMPTY_FORM: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  note: "",
};

type PaymentAlert = {
  kind: "failed" | "cancelled" | "pending" | "error";
  title: string;
  message: string;
};

type ActiveDemoSession = {
  orderNumber: string;
  razorpayOrderId: string;
  demoToken: string;
  amountPaise: number;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (res: RazorpayFailureResponse) => void) => void;
    };
  }
}

function makeSessionKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `bn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function isValidEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function isProfileComplete(f: CustomerForm) {
  return (
    f.name.trim().length >= 2 &&
    isValidEmail(f.email) &&
    /^[6-9]\d{9}$/.test(f.phone.trim()) &&
    f.line1.trim().length >= 4 &&
    f.city.trim().length >= 2 &&
    f.state.trim().length >= 2 &&
    /^\d{6}$/.test(f.pincode.trim())
  );
}

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

function BuyNowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = (searchParams.get("slug") || "").trim().toLowerCase();
  const mlParam = Number(searchParams.get("ml") || 50);
  const qtyParam = Math.max(1, Number(searchParams.get("qty") || 1));

  const [qtyOverride, setQtyOverride] = useState<number | null>(null);
  const qty = qtyOverride ?? qtyParam;
  const [quote, setQuote] = useState<BuyNowQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState("");

  const [authLoading, setAuthLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [prefilledComplete, setPrefilledComplete] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(true);
  const [saveAddress, setSaveAddress] = useState(true);

  // Inline Quick Sign-In state for guest visitors arriving from Product Page
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Checkout / Payment flow state
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [formError, setFormError] = useState("");
  const [paymentAlert, setPaymentAlert] = useState<PaymentAlert | null>(null);
  const [demoSession, setDemoSession] = useState<ActiveDemoSession | null>(null);

  const idempotencyKeyRef = useRef<string>(makeSessionKey());
  const handledPaymentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError("No product selected for Buy Now.");
          setQuoteLoading(false);
        }
        return;
      }
      try {
        const qs = new URLSearchParams({
          slug,
          ml: String(mlParam),
          qty: String(qty),
        });
        const res = await fetch(`/api/buy-now/quote?${qs.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data?.quote) {
          setQuote(null);
          setQuoteError(data?.error || "Unable to load selected product.");
        } else {
          setQuoteError("");
          setQuote(data.quote as BuyNowQuote);
        }
      } catch {
        if (!cancelled) setQuoteError("Network error while calculating product total.");
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, mlParam, qty]);

  const applyProfileFromApi = useCallback(async () => {
    try {
      const [meRes, addrRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/account/address", { cache: "no-store" }),
      ]);

      const meData = meRes.ok ? await meRes.json().catch(() => ({})) : {};
      const addrData = addrRes.ok ? await addrRes.json().catch(() => ({})) : {};

      const user = meData?.user;
      if (!user) {
        setSignedIn(false);
        setEditingCustomer(true);
        setPrefilledComplete(false);
        return;
      }

      setSignedIn(true);
      const saved = addrData?.address || null;
      const cleanEmail =
        typeof user.email === "string" && !user.email.endsWith("@phone.mirqas.local")
          ? user.email
          : "";

      const nextForm: CustomerForm = {
        name: saved?.name || user.name || "",
        email: cleanEmail,
        phone: saved?.phone || user.phone || "",
        line1: saved?.line1 || "",
        line2: saved?.line2 || "",
        city: saved?.city || "",
        state: saved?.state || "",
        pincode: saved?.pincode || "",
        note: "",
      };

      setForm((prev) => ({
        ...nextForm,
        note: prev.note,
      }));
      const complete = isProfileComplete(nextForm);
      setPrefilledComplete(complete);
      setEditingCustomer(!complete);
    } catch {
      setSignedIn(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, addrRes] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/account/address", { cache: "no-store" }),
        ]);
        const meData = meRes.ok ? await meRes.json().catch(() => ({})) : {};
        const addrData = addrRes.ok ? await addrRes.json().catch(() => ({})) : {};
        if (cancelled) return;

        const user = meData?.user;
        if (!user) {
          setSignedIn(false);
          setEditingCustomer(true);
          setPrefilledComplete(false);
          return;
        }

        setSignedIn(true);
        const saved = addrData?.address || null;
        const cleanEmail =
          typeof user.email === "string" && !user.email.endsWith("@phone.mirqas.local")
            ? user.email
            : "";

        const nextForm: CustomerForm = {
          name: saved?.name || user.name || "",
          email: cleanEmail,
          phone: saved?.phone || user.phone || "",
          line1: saved?.line1 || "",
          line2: saved?.line2 || "",
          city: saved?.city || "",
          state: saved?.state || "",
          pincode: saved?.pincode || "",
          note: "",
        };

        setForm((prev) => ({ ...nextForm, note: prev.note }));
        const complete = isProfileComplete(nextForm);
        setPrefilledComplete(complete);
        setEditingCustomer(!complete);
      } catch {
        if (!cancelled) setSignedIn(false);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError("Please enter your email or phone number and password.");
      return;
    }
    setLoginBusy(true);
    setLoginError("");
    const res = await loginRequest(loginIdentifier.trim(), loginPassword, true);
    setLoginBusy(false);

    if (!res.ok) {
      setLoginError(res.error || "Sign in failed. Please check your credentials.");
      return;
    }

    if (res.user?.id) {
      setActiveUserId(res.user.id);
    }
    setAuthLoading(true);
    await applyProfileFromApi();
  };

  const updateField = (key: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formError) setFormError("");
  };

  const validateForm = (): string | null => {
    if (form.name.trim().length < 2) return "Please enter your full name.";
    if (!isValidEmail(form.email)) return "Please enter a valid email address for order updates.";
    if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      return "Please enter a valid 10-digit Indian mobile number.";
    if (form.line1.trim().length < 4) return "Please enter your delivery street address / house no.";
    if (form.city.trim().length < 2) return "Please enter your city.";
    if (form.state.trim().length < 2) return "Please enter your state.";
    if (!/^\d{6}$/.test(form.pincode.trim())) return "Please enter a valid 6-digit PIN code.";
    return null;
  };

  const handleVerifyRequest = async (payload: {
    orderNumber: string;
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    statusAction: "success" | "failed" | "pending" | "cancelled";
    demoToken?: string;
    failureReason?: string;
  }) => {
    setVerifying(true);
    try {
      const res = await fetch("/api/buy-now/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        setDemoSession(null);
        router.replace(`/buy-now/success?order=${encodeURIComponent(data.orderNumber)}`);
        return;
      }

      setDemoSession(null);
      const state = data?.paymentState || payload.statusAction;
      if (state === "cancelled") {
        setPaymentAlert({
          kind: "cancelled",
          title: "Payment cancelled",
          message:
            data?.message ||
            "You closed the UPI payment window. Your delivery details are preserved so you can try again.",
        });
      } else if (state === "pending") {
        setPaymentAlert({
          kind: "pending",
          title: "Payment pending confirmation",
          message:
            data?.message ||
            "Your UPI payment is awaiting bank confirmation. You can retry payment or check My Orders shortly.",
        });
      } else {
        setPaymentAlert({
          kind: "failed",
          title: "Payment could not be completed",
          message:
            data?.message ||
            "The UPI payment failed or was declined. No amount was confirmed. Please retry below.",
        });
      }
    } catch {
      setDemoSession(null);
      setPaymentAlert({
        kind: "error",
        title: "Verification interrupted",
        message: "Could not confirm payment status right now. Please check your connection and retry.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handlePayNow = async () => {
    if (busy || verifying || !quote) return;
    if (!signedIn) {
      setFormError("Please sign in above to continue with Buy Now.");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setEditingCustomer(true);
      setFormError(validationError);
      return;
    }

    setBusy(true);
    setFormError("");
    setPaymentAlert(null);
    handledPaymentRef.current = false;

    try {
      if (saveAddress) {
        fetch("/api/account/address", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
          }),
        }).catch(() => {});
      }

      const orderRes = await fetch("/api/buy-now/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: {
            slug: quote.product.slug,
            ml: quote.product.ml,
            qty: quote.product.qty,
          },
          email: form.email.trim(),
          shipping: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
          },
          note: form.note.trim(),
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });

      const orderData = await orderRes.json().catch(() => ({}));

      if (orderRes.status === 401) {
        setSignedIn(false);
        setFormError("Your session expired. Please sign in to continue.");
        return;
      }

      if (orderData?.alreadyPaid && orderData?.orderNumber) {
        router.replace(`/buy-now/success?order=${encodeURIComponent(orderData.orderNumber)}`);
        return;
      }

      if (!orderRes.ok || !orderData?.ok) {
        setFormError(orderData?.error || "Unable to initiate UPI checkout. Please try again.");
        return;
      }

      // Demo simulation mode when Razorpay keys are not set yet
      if (orderData.mode === "demo") {
        setDemoSession({
          orderNumber: orderData.orderNumber,
          razorpayOrderId: orderData.razorpayOrderId,
          demoToken: orderData.demoToken,
          amountPaise: orderData.amountPaise,
        });
        return;
      }

      // Official Razorpay Standard Checkout with UPI prioritized
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setPaymentAlert({
          kind: "error",
          title: "Payment gateway unavailable",
          message: "Could not load Razorpay Checkout script. Please check your network and retry.",
        });
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency || "INR",
        name: "MIRQAS Perfumes",
        description: `${quote.product.name} (${quote.product.ml}ml × ${quote.product.qty})`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.phone.trim(),
        },
        notes: {
          orderNumber: orderData.orderNumber,
          flow: "buy_now_direct",
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay using UPI",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.upi"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: "#9C5A2B",
        },
        modal: {
          ondismiss: () => {
            if (handledPaymentRef.current) return;
            handledPaymentRef.current = true;
            void handleVerifyRequest({
              orderNumber: orderData.orderNumber,
              razorpay_order_id: orderData.razorpayOrderId,
              statusAction: "cancelled",
            });
          },
        },
        handler: (response: RazorpaySuccessResponse) => {
          handledPaymentRef.current = true;
          void handleVerifyRequest({
            orderNumber: orderData.orderNumber,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            statusAction: "success",
          });
        },
      });

      rzp.on("payment.failed", (resp: RazorpayFailureResponse) => {
        if (handledPaymentRef.current) return;
        handledPaymentRef.current = true;
        const reason =
          resp?.error?.description ||
          resp?.error?.reason ||
          "UPI payment was declined by the payment provider.";
        void handleVerifyRequest({
          orderNumber: orderData.orderNumber,
          razorpay_order_id: orderData.razorpayOrderId,
          razorpay_payment_id: resp?.error?.metadata?.payment_id || "",
          statusAction: "failed",
          failureReason: reason,
        });
      });

      rzp.open();
    } catch {
      setFormError("Something went wrong while creating the payment order. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDemoAction = (action: DemoOutcomeAction, reason?: string) => {
    if (!demoSession) return;
    void handleVerifyRequest({
      orderNumber: demoSession.orderNumber,
      razorpay_order_id: demoSession.razorpayOrderId,
      demoToken: demoSession.demoToken,
      statusAction: action,
      failureReason: reason,
    });
  };

  const currentLoginUrl = useMemo(() => {
    const returnTo = `/buy-now?slug=${encodeURIComponent(slug)}&ml=${mlParam}&qty=${qty}`;
    return `/login?tab=register&next=${encodeURIComponent(returnTo)}`;
  }, [slug, mlParam, qty]);

  return (
    <div style={{ background: "#FFF9F3", minHeight: "75vh", fontFamily: sans }} className="text-[#111111]">
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-12 lg:px-16">
        {/* Top Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-[#EADFCC] pb-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9C5A2B]">
              Express Direct Checkout
            </p>
            <h1
              style={{ fontFamily: serif, color: "#9C5A2B" }}
              className="m-0 mt-1 text-4xl font-medium tracking-tight sm:text-5xl"
            >
              Buy Now
            </h1>
          </div>
          {slug && (
            <Link
              href={`/product/${encodeURIComponent(slug)}`}
              className="text-sm text-[#111111] underline underline-offset-4 transition-colors hover:text-[#9C5A2B]"
            >
              &larr; Back to product
            </Link>
          )}
        </div>

        {/* Loading / Invalid Product State */}
        {quoteLoading && !quote ? (
          <div className="flex items-center justify-center gap-3 rounded-[14px] border border-[#EADFCC] bg-white py-16 text-sm text-[#111111]/60">
            <Spinner /> Loading your direct checkout details...
          </div>
        ) : quoteError || !quote ? (
          <div className="mx-auto max-w-lg rounded-[14px] border border-[#EADFCC] bg-white p-8 text-center sm:p-10">
            <h2 style={{ fontFamily: serif, color: "#9C5A2B" }} className="m-0 text-3xl font-medium">
              Product Unavailable
            </h2>
            <p className="mt-3 text-sm text-[#111111]/60">
              {quoteError || "The selected fragrance could not be loaded."}
            </p>
            <Link
              href="/shopallperfume"
              className="mt-6 inline-block rounded-[6px] bg-[#9C5A2B] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720]"
            >
              Browse Perfumes
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-10">
            {/* LEFT COLUMN: Product Summary + Customer Information */}
            <div className="space-y-6">
              {/* A. Product Summary */}
              <section className="rounded-[14px] border border-[#EADFCC] bg-white p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EADFCC]/70 pb-3">
                  <h2 style={{ fontFamily: serif, color: "#9C5A2B" }} className="m-0 text-2xl font-medium">
                    1. Product summary
                  </h2>
                  <span className="rounded-[6px] border border-[#EADFCC] bg-[#FFF9F3] px-2.5 py-1 text-[11px] font-medium text-[#9C5A2B]">
                    Direct Purchase (Cart Unchanged)
                  </span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[10px] border border-[#EADFCC] bg-[#FCF8F0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={quote.product.image}
                      alt={quote.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9C5A2B]">
                      {quote.product.category}
                    </p>
                    <h3 style={{ fontFamily: serif }} className="mt-0.5 text-2xl font-medium text-[#111111]">
                      {quote.product.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#111111]/65">
                      <span>
                        Size: <strong className="font-medium text-[#111111]">{quote.product.ml}ml</strong>
                      </span>
                      <span>
                        Unit Price:{" "}
                        <strong className="font-medium text-[#111111]">
                          {formatPaise(quote.unitPricePaise)}
                        </strong>
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-[6px] border border-[#EADFCC] bg-[#FFF9F3]">
                        <button
                          type="button"
                          disabled={busy || verifying || qty <= 1}
                          onClick={() => setQtyOverride(Math.max(1, qty - 1))}
                          aria-label="Decrease quantity"
                          className="px-3 py-1 text-sm font-medium text-[#111111] hover:text-[#9C5A2B] disabled:opacity-35"
                        >
                          &minus;
                        </button>
                        <span className="min-w-[2.2rem] text-center text-sm font-medium">{qty}</span>
                        <button
                          type="button"
                          disabled={busy || verifying || qty >= Math.min(10, quote.product.stock)}
                          onClick={() =>
                            setQtyOverride(Math.min(10, quote.product.stock, qty + 1))
                          }
                          aria-label="Increase quantity"
                          className="px-3 py-1 text-sm font-medium text-[#111111] hover:text-[#9C5A2B] disabled:opacity-35"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-[#111111]/60">Item total</p>
                        <p className="text-base font-semibold text-[#9C5A2B]">
                          {formatPaise(quote.subtotalPaise)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* B. Customer Information */}
              <section className="rounded-[14px] border border-[#EADFCC] bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between border-b border-[#EADFCC]/70 pb-3">
                  <h2 style={{ fontFamily: serif, color: "#9C5A2B" }} className="m-0 text-2xl font-medium">
                    2. Customer &amp; delivery details
                  </h2>
                  {signedIn && prefilledComplete && (
                    <button
                      type="button"
                      onClick={() => setEditingCustomer((v) => !v)}
                      className="text-sm font-medium text-[#9C5A2B] underline underline-offset-4 hover:text-[#7d4720]"
                    >
                      {editingCustomer ? "Done editing" : "Edit details"}
                    </button>
                  )}
                </div>

                {authLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-[#111111]/60">
                    <Spinner /> Checking your account details...
                  </div>
                ) : !signedIn ? (
                  <form onSubmit={handleInlineLogin} className="space-y-4">
                    <div className="rounded-[10px] border border-[#EADFCC] bg-[#FFF9F3] p-4 text-sm leading-relaxed text-[#111111]/80">
                      Sign in to prefill your saved address and track this Buy Now order in{" "}
                      <strong>My Orders</strong>.
                    </div>

                    {loginError && (
                      <div className="rounded-[10px] border border-[#E8B7B0] bg-[#F8E3E0] px-3.5 py-2.5 text-sm text-[#A32A1F]">
                        {loginError}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          Email or Mobile Number
                        </label>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="you@example.com or 9876543210"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          Password
                        </label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Your password"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={loginBusy}
                        className="inline-flex items-center gap-2 rounded-[6px] bg-[#9C5A2B] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#7d4720] disabled:opacity-50"
                      >
                        {loginBusy ? (
                          <>
                            <Spinner /> Signing in...
                          </>
                        ) : (
                          "Sign In & Continue"
                        )}
                      </button>

                      <Link
                        href={currentLoginUrl}
                        className="text-sm font-medium text-[#9C5A2B] underline underline-offset-4 hover:text-[#7d4720]"
                      >
                        New customer? Create an account
                      </Link>
                    </div>
                  </form>
                ) : prefilledComplete && !editingCustomer ? (
                  /* Saved profile summary shown cleanly without forcing re-entry */
                  <div className="space-y-2.5 rounded-[10px] border border-[#EADFCC] bg-[#FFF9F3] p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[#111111]">{form.name}</p>
                      <span className="rounded-[6px] border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                        Prefilled from Profile
                      </span>
                    </div>
                    <p className="text-sm text-[#111111]/70">
                      {form.email} &middot; +91 {form.phone}
                    </p>
                    <p className="text-sm leading-relaxed text-[#111111]/85">
                      {form.line1}
                      {form.line2 ? `, ${form.line2}` : ""}
                      <br />
                      {form.city}, {form.state} &ndash; {form.pincode}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          Full name *
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          placeholder="Your full name"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          Email address *
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          placeholder="you@example.com"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          Mobile number *
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, ""))}
                          placeholder="10-digit mobile number"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={form.pincode}
                          onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, ""))}
                          placeholder="6-digit PIN"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#111111]">
                        Delivery address *
                      </label>
                      <input
                        type="text"
                        value={form.line1}
                        onChange={(e) => updateField("line1", e.target.value)}
                        placeholder="House no., building, street name"
                        className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          Landmark <span className="font-normal text-[#111111]/60">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={form.line2}
                          onChange={(e) => updateField("line2", e.target.value)}
                          placeholder="Optional"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          City *
                        </label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => updateField("city", e.target.value)}
                          placeholder="City"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          State *
                        </label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => updateField("state", e.target.value)}
                          placeholder="State"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
                      <div>
                        <label className="block text-sm font-medium text-[#111111]">
                          Order note <span className="font-normal text-[#111111]/60">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={form.note}
                          onChange={(e) => updateField("note", e.target.value)}
                          placeholder="Any delivery preference"
                          className="mt-1.5 w-full rounded-[10px] border border-[#EADFCC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9C5A2B]"
                        />
                      </div>

                      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-[#111111]/85 sm:mt-6">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                          className="h-4 w-4 accent-[#9C5A2B]"
                        />
                        Save this address for my next order
                      </label>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="mt-4 rounded-[10px] border border-[#E8B7B0] bg-[#F8E3E0] px-3.5 py-2.5 text-sm text-[#A32A1F]">
                    {formError}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT COLUMN: Order Summary & Pay using UPI */}
            <div className="space-y-6 lg:sticky lg:top-28">
              {/* C. Order Summary */}
              <section className="rounded-[14px] border border-[#EADFCC] bg-white p-5 sm:p-6">
                <h2 style={{ fontFamily: serif, color: "#9C5A2B" }} className="m-0 text-2xl font-medium">
                  3. Order summary
                </h2>

                <dl className="mt-4 space-y-2.5 border-t border-[#EADFCC] pt-4 text-sm">
                  <div className="flex justify-between text-[#111111]/65">
                    <dt>Product Price ({quote.product.ml}ml)</dt>
                    <dd className="text-[#111111]">{formatPaise(quote.unitPricePaise)}</dd>
                  </div>
                  <div className="flex justify-between text-[#111111]/65">
                    <dt>Quantity</dt>
                    <dd className="text-[#111111]">&times; {quote.product.qty}</dd>
                  </div>
                  <div className="flex justify-between text-[#111111]/65">
                    <dt>Subtotal</dt>
                    <dd className="text-[#111111]">{formatPaise(quote.subtotalPaise)}</dd>
                  </div>

                  {quote.discountTotalPaise > 0 && (
                    <div className="flex justify-between font-medium text-emerald-800">
                      <dt>{quote.offerTitle || "Offer Discount"}</dt>
                      <dd>&minus; {formatPaise(quote.discountTotalPaise)}</dd>
                    </div>
                  )}

                  <div className="flex justify-between text-[#111111]/65">
                    <dt>Shipping</dt>
                    <dd className="font-medium text-emerald-800">
                      {quote.shippingFeePaise === 0 ? "Free" : formatPaise(quote.shippingFeePaise)}
                    </dd>
                  </div>

                  <div className="flex justify-between text-[#111111]/65">
                    <dt>Applicable taxes</dt>
                    <dd className="text-xs text-[#111111]">
                      {quote.taxPaise === 0 ? "Inclusive of all taxes" : formatPaise(quote.taxPaise)}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-[#EADFCC] pt-4">
                    <dt style={{ fontFamily: serif }} className="text-xl text-[#111111]">
                      Final Total
                    </dt>
                    <dd className="text-2xl font-semibold text-[#9C5A2B]">
                      {formatPaise(quote.totalPaise)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* D. Pay using UPI */}
              <section className="rounded-[14px] border border-[#EADFCC] bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#9C5A2B]">
                      Instant &amp; Verified
                    </p>
                    <h2
                      style={{ fontFamily: serif, color: "#9C5A2B" }}
                      className="m-0 mt-0.5 text-2xl font-medium"
                    >
                      Pay using UPI
                    </h2>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-[6px] border border-[#EADFCC] bg-[#FFF9F3] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9C5A2B]">
                    Razorpay
                    {quote.gatewayMode === "demo"
                      ? " · Demo"
                      : quote.isTestMode
                      ? " · Test"
                      : ""}
                  </span>
                </div>

                {quote.gatewayMode === "demo" && (
                  <div className="mt-3 rounded-[10px] border border-[#EADFCC] bg-[#FCF8F0] px-3.5 py-2.5 text-xs leading-relaxed text-[#7d4720]">
                    <strong className="font-semibold">Demo Mode Active:</strong> Razorpay keys are not set yet.
                    Clicking <em>Pay Now</em> opens the interactive UPI demo modal.
                  </div>
                )}

                <div className="mt-4 rounded-[10px] border border-[#EADFCC] bg-[#FFF9F3] p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#9C5A2B]/30 bg-[#9C5A2B] text-[10px] font-bold tracking-wider text-white">
                      UPI
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">
                        Google Pay, PhonePe, Paytm, BHIM &amp; UPI ID
                      </p>
                      <p className="text-xs text-[#111111]/60">
                        Pay securely via Razorpay UPI Checkout
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#EADFCC] pt-2.5 text-sm">
                    <span className="text-[#111111]/65">Amount payable</span>
                    <span className="font-semibold text-[#9C5A2B]">
                      {formatPaise(quote.totalPaise)}
                    </span>
                  </div>
                </div>

                {/* Failure / Cancelled / Pending Feedback */}
                {paymentAlert && (
                  <div
                    role="alert"
                    className={`mt-4 rounded-[10px] border px-3.5 py-3 text-sm leading-relaxed ${
                      paymentAlert.kind === "pending"
                        ? "border-[#EADFCC] bg-[#FCF8F0] text-[#7d4720]"
                        : "border-[#E8B7B0] bg-[#F8E3E0] text-[#A32A1F]"
                    }`}
                  >
                    <p className="font-semibold">{paymentAlert.title}</p>
                    <p className="mt-1 text-xs">{paymentAlert.message}</p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={busy || verifying || quote.product.stock < quote.product.qty}
                  onClick={handlePayNow}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#9C5A2B] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy ? (
                    <>
                      <Spinner /> Preparing UPI Payment...
                    </>
                  ) : verifying ? (
                    <>
                      <Spinner /> Verifying Payment...
                    </>
                  ) : paymentAlert ? (
                    `Retry UPI Payment · ${formatPaise(quote.totalPaise)}`
                  ) : (
                    `Pay Now · ${formatPaise(quote.totalPaise)}`
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-[#111111]/60">
                  &#128274; Server-verified order total &middot; UPI PIN is never stored
                </p>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Demo Mode Modal when Razorpay keys are blank */}
      <RazorpayDemoModal
        open={Boolean(demoSession)}
        orderNumber={demoSession?.orderNumber || ""}
        razorpayOrderId={demoSession?.razorpayOrderId || ""}
        amountPaise={demoSession?.amountPaise || 0}
        customerName={form.name}
        customerPhone={form.phone}
        busy={verifying}
        onAction={handleDemoAction}
      />
    </div>
  );
}

export default function BuyNowPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ background: "#FFF9F3", minHeight: "70vh" }}
          className="flex items-center justify-center text-sm text-[#111111]/70"
        >
          Loading direct checkout...
        </div>
      }
    >
      <BuyNowContent />
    </Suspense>
  );
}

