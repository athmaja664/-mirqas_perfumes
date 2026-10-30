import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Order, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/models/Order";
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
  const o = (await Order.findOne({ orderNumber, userId: user.id }).lean()) as unknown as OrderRow | null;
  if (!o) notFound();

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
    // Show only the steps that were reached before the order was cancelled
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
  const small = "text-[11px] uppercase tracking-[0.25em] text-black/50";

  return (
    <main className="px-5 py-12 md:px-10 md:py-16" style={{ background: IVORY, fontFamily: sans }}>
      <div className="mx-auto max-w-[760px]">
        <Link href="/account/orders" className="text-[13px] underline underline-offset-4">
          Back to my orders
        </Link>

        <h1
          className="mb-1 mt-5 font-medium leading-tight lining-nums"
          style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}
        >
          {o.orderNumber}
        </h1>
        <p className="m-0 text-[14px] text-black/60">Placed {fmt(o.createdAt)}</p>

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
                    {s.done ? (s.red ? "x" : "\u2713") : ""}
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

        {/* Items */}
        <section className={`${box} mt-6`}>
          <p className={`m-0 px-6 pt-6 ${small}`}>Items</p>
          <ul className="m-0 list-none p-0">
            {o.items.map((i) => (
              <li key={`${i.slug}-${i.ml}`} className="flex items-center gap-4 border-b border-black/5 px-6 py-4 last:border-0">
                {i.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt={i.name} className="h-16 w-16 shrink-0 bg-[#F6EEE0] object-cover" />
                ) : (
                  <span className="h-16 w-16 shrink-0 bg-[#F6EEE0]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[15px] font-medium">{i.name}</p>
                  <p className="m-0 mt-0.5 text-[13px] text-black/55">
                    {i.ml}ml x {i.qty} at {formatPaise(i.unitPrice)}
                  </p>
                </div>
                <span className="shrink-0 text-[15px] font-medium">{formatPaise(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className={`${box} p-6`}>
            <p className={`m-0 ${small}`}>Delivery address</p>
            <p className="m-0 mt-3 text-[15px] font-medium">{o.shipping.name}</p>
            <p className="m-0 mt-1 text-[14px] text-black/60">{o.shipping.phone}</p>
            <p className="m-0 mt-1 text-[14px] text-black/60">{address}</p>
          </section>

          <section className={`${box} p-6 text-[14px]`}>
            <p className={`m-0 ${small}`}>Payment</p>
            <p className="m-0 mt-3 text-[14px] text-black/70">{payText}</p>
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