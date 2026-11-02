import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Order, OrderItem, OrderStatusHistory, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/models/Order";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

type OrderRow = {
  orderNumber: string;
  items: { slug: string; name: string; image: string; ml: number; qty: number; unitPrice: number; lineTotal: number }[];
  shipping: { name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string };
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  statusHistory?: { status: OrderStatus; at: Date }[];
  payment: { method: PaymentMethod; status: PaymentStatus };
  note: string;
  createdAt: Date;
};

// The steps a normal order goes through
const FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;

const STEP_TEXT: Record<(typeof FLOW)[number], { title: string; note: string }> = {
  pending: { title: "Order placed", note: "We received your order." },
  confirmed: { title: "Confirmed", note: "Your order is confirmed and is being packed." },
  shipped: { title: "Shipped", note: "Your parcel is on its way." },
  delivered: { title: "Delivered", note: "Your parcel was delivered." },
};

const fmt = (d: Date | string) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { orderNumber: raw } = await params;
  const orderNumber = raw.toUpperCase();
  if (!/^MQ-\d{6}-[A-Z0-9]{6}$/.test(orderNumber)) notFound();

  await connectDB();
  // The order must belong to this customer. Otherwise it looks like it does not exist.
  const orderRecord = await Order.findOne({
    where: { orderNumber, userId: user.id },
    include: [
      { model: OrderItem, as: "items" },
      { model: OrderStatusHistory, as: "statusHistory" },
    ],
  });
  if (!orderRecord) notFound();

  const o = orderRecord as unknown as OrderRow;
  const history = o.statusHistory ?? [];
  const cancelled = o.status === "cancelled";

  // Time of the last history entry for a status (before a limit time, if given)
  const timeOf = (s: OrderStatus, until?: Date): Date | null => {
    const list = history.filter((h) => h.status === s && (!until || new Date(h.at) <= until));
    return list.length ? list[list.length - 1].at : null;
  };

  type Step = { key: string; title: string; note: string; done: boolean; at: Date | null; current: boolean; red?: boolean };
  let steps: Step[] = [];

  if (cancelled) {
    const cancelledAt = timeOf("cancelled") ?? new Date(o.createdAt);
    FLOW.forEach((s, i) => {
      const at = i === 0 ? new Date(o.createdAt) : timeOf(s, new Date(cancelledAt));
      if (i === 0 || at) steps.push({ key: s, ...STEP_TEXT[s], done: true, at, current: false });
    });
    steps.push({
      key: "cancelled",
      title: "Cancelled",
      note: "This order was cancelled.",
      done: true,
      at: cancelledAt,
      current: true,
      red: true,
    });
  } else {
    const idx = FLOW.indexOf(o.status as (typeof FLOW)[number]);
    steps = FLOW.map((s, i) => ({
      key: s,
      ...STEP_TEXT[s],
      done: i <= idx,
      at: i === 0 ? new Date(o.createdAt) : i <= idx ? timeOf(s) : null,
      current: i === idx && o.status !== "delivered",
    }));
  }

  const address = [o.shipping.line1, o.shipping.line2, `${o.shipping.city}, ${o.shipping.state} - ${o.shipping.pincode}`]
    .filter(Boolean)
    .join(", ");

  const payText =
    o.payment.method === "cod"
      ? o.payment.status === "paid"
        ? "Cash on delivery - paid"
        : "Cash on delivery - pay when the parcel arrives"
      : `Online payment - ${o.payment.status}`;

  const box = "border border-black/10 bg-white";
  const small = "text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50";

  return (
    <main className="px-5 py-12 md:px-10 md:py-16" style={{ background: IVORY, fontFamily: sans }}>
      <div className="mx-auto max-w-[760px]">
        {/* Top bar with back button & date */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/account/orders"
            className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-black/70 hover:text-[#9C5A2B]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to my orders
          </Link>
          <span className="text-[12px] text-black/50">Placed {fmt(o.createdAt)}</span>
        </div>

        {/* Cleanly aligned Header */}
        <div className="border-b border-black/10 pb-5">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50">
            Order Tracking & Details
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1
              className="m-0 break-all font-medium leading-tight lining-nums"
              style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
            >
              {o.orderNumber}
            </h1>
            <span
              className="inline-block border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{
                background: cancelled ? "#F8E3E0" : "#F3E7D5",
                color: cancelled ? "#A32A1F" : "#7d4720",
                borderColor: cancelled ? "#A32A1F33" : "#9C5A2B33",
              }}
            >
              {cancelled ? "Cancelled" : STEP_TEXT[o.status as (typeof FLOW)[number]]?.title || o.status}
            </span>
          </div>
        </div>

        {/* Tracking timeline */}
        <section className={`${box} mt-8 p-6`}>
          <p className={`m-0 ${small}`}>Order tracking</p>
          <ol className="m-0 mt-5 list-none p-0">
            {steps.map((s, i) => {
              const last = i === steps.length - 1;
              const dot = s.red ? "#A32A1F" : s.done ? COPPER : "rgba(17,17,17,0.15)";
              return (
                <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
                  {!last && (
                    <span
                      className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-[2px]"
                      style={{ background: steps[i + 1].done ? COPPER : "rgba(17,17,17,0.12)" }}
                    />
                  )}
                  <span
                    className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] text-white"
                    style={{ background: dot, boxShadow: s.current ? `0 0 0 4px ${dot}33` : undefined }}
                  >
                    {s.done ? (s.red ? "✕" : "✓") : ""}
                  </span>
                  <div>
                    <p
                      className="m-0 text-[15px] font-semibold"
                      style={{ color: s.red ? "#A32A1F" : s.done ? "#111" : "rgba(17,17,17,0.4)" }}
                    >
                      {s.title}
                    </p>
                    <p className="m-0 mt-0.5 text-[13px] text-black/55">
                      {s.done ? s.note : "Waiting"}
                      {s.done && s.at ? ` - ${fmt(s.at)}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Clickable Items to view product details & leave reviews */}
        <section className={`${box} mt-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-6 py-4">
            <p className={`m-0 ${small}`}>Ordered Items ({o.items?.length || 0})</p>
            <span className="text-[11px] text-black/50">Click any product to view details & write a review</span>
          </div>
          <ul className="m-0 divide-y divide-black/5 list-none p-0">
            {(o.items || []).map((i) => (
              <li key={`${i.slug}-${i.ml}`}>
                <Link
                  href={`/product/${i.slug}`}
                  className="group flex cursor-pointer flex-col justify-between gap-4 px-6 py-4 transition-colors hover:bg-black/[0.02] sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={i.image}
                        alt={i.name}
                        className="h-16 w-16 shrink-0 rounded-[8px] border border-black/10 bg-[#F6EEE0] object-cover transition-opacity group-hover:opacity-90"
                      />
                    ) : (
                      <span className="h-16 w-16 shrink-0 rounded-[8px] border border-black/10 bg-[#F6EEE0]" />
                    )}
                    <div className="min-w-0">
                      <p className="m-0 text-[15px] font-medium text-black/90 transition-colors group-hover:text-[#9C5A2B] group-hover:underline">
                        {i.name}
                      </p>
                      <p className="m-0 mt-0.5 text-[13px] text-black/55">
                        {i.ml > 0 ? <>Bottle size: <strong className="font-semibold text-black/80">{i.ml}ml</strong></> : <span className="font-semibold text-[#9C5A2B]">Gift Cover</span>} · Qty: {i.qty}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-[#9C5A2B]">
                        View product & write review →
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <span className="block text-[15px] font-semibold text-black/90">{formatPaise(i.lineTotal)}</span>
                    <span className="text-[12px] text-black/50">{formatPaise(i.unitPrice)} each</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Address & Payment summary */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className={`${box} p-6`}>
            <p className={`m-0 ${small}`}>Delivery address</p>
            <p className="m-0 mt-3 text-[15px] font-medium text-black/90">{o.shipping.name}</p>
            <p className="m-0 mt-1 text-[14px] text-black/60">Phone: {o.shipping.phone}</p>
            <p className="m-0 mt-1 text-[14px] leading-relaxed text-black/60">{address}</p>
          </section>

          <section className={`${box} p-6 text-[14px]`}>
            <p className={`m-0 ${small}`}>Payment</p>
            <p className="m-0 mt-3 text-[14px] font-medium text-black/80">{payText}</p>
            <div className="mt-4 flex justify-between text-black/60">
              <span>Subtotal</span>
              <span className="text-[#111]">{formatPaise(o.subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-black/60">
              <span>Shipping</span>
              <span className="text-[#111]">{o.shippingFee === 0 ? "Free" : formatPaise(o.shippingFee)}</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-black/10 pt-3">
              <span className={small}>Total</span>
              <span className="text-[22px] font-semibold" style={{ color: COPPER }}>
                {formatPaise(o.total)}
              </span>
            </div>
          </section>
        </div>

        {o.note && (
          <section className={`${box} mt-6 p-6`}>
            <p className={`m-0 ${small}`}>Your note</p>
            <p className="m-0 mt-2 whitespace-pre-line text-[14px] text-black/70">{o.note}</p>
          </section>
        )}
      </div>
    </main>
  );
}
