import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Order, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/models/Order";
import { NEXT_STATUSES, changeOrderStatus, isOrderStatus } from "@/lib/services/order-status";
import { formatPaise } from "@/lib/money";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, label, paymentText } from "@/components/admin/OrderBadges";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

type OrderRow = {
  _id: unknown;
  orderNumber: string;
  userId: unknown;
  items: { slug: string; name: string; ml: number; qty: number; unitPrice: number; lineTotal: number }[];
  shipping: { name: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string };
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  payment: { method: PaymentMethod; status: PaymentStatus; razorpayOrderId: string; razorpayPaymentId: string };
  note: string;
  createdAt: Date;
  updatedAt: Date;
};

type AccountRow = { name: string; email: string; phone: string };

// Runs on the server. It checks the admin again, because a form can be sent by anyone.
async function updateStatus(formData: FormData) {
  "use server";
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") redirect("/login");

  const id = String(formData.get("id"));
  const next = formData.get("status");
  if (!isValidObjectId(id) || !isOrderStatus(next)) redirect("/admin/orders");

  const result = await changeOrderStatus(id, next);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?${result.ok ? "updated=1" : `error=${encodeURIComponent(result.message)}`}`);
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const o = (await Order.findById(id).lean()) as unknown as OrderRow | null;
  if (!o) notFound();
  const account = (await User.findById(o.userId).select("name email phone").lean()) as unknown as AccountRow | null;

  const date = (d: Date) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const nextList = NEXT_STATUSES[o.status];
  const address = [o.shipping.line1, o.shipping.line2, `${o.shipping.city}, ${o.shipping.state} - ${o.shipping.pincode}`]
    .filter(Boolean)
    .join(", ");

  const box = "border border-black/10 bg-white";
  const small = "text-[11px] uppercase tracking-[0.25em] text-black/50";

  return (
    <AdminShell active="Orders">
      <h1 className="mb-3 mt-0 text-4xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
        {o.orderNumber}
      </h1>
      <div className="mb-8 flex flex-wrap items-center gap-3 text-[14px] text-black/60">
        <StatusBadge status={o.status} />
        <span>Placed {date(o.createdAt)}</span>
      </div>

      {sp.updated && (
        <p className="mb-5 mt-0 border border-[#1F7A3A]/30 bg-[#E3F2E6] px-4 py-3 text-[14px] text-[#1F7A3A]">
          Status updated.
        </p>
      )}
      {sp.error && (
        <p className="mb-5 mt-0 border border-[#A32A1F]/30 bg-[#F8E3E0] px-4 py-3 text-[14px] text-[#A32A1F]">
          {sp.error}
        </p>
      )}

      {/* Status buttons */}
      <section className={`${box} mb-6 p-6`}>
        <p className={`m-0 ${small}`}>Update status</p>
        {nextList.length === 0 ? (
          <p className="m-0 mt-3 text-[14px] text-black/55">This order is {o.status}. No more changes are possible.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {nextList.map((s) => (
              <form key={s} action={updateStatus}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  className={
                    s === "cancelled"
                      ? "border border-[#A32A1F] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#A32A1F] hover:bg-[#A32A1F] hover:text-white"
                      : "px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#7d4720]"
                  }
                  style={s === "cancelled" ? undefined : { background: COPPER }}
                >
                  {s === "cancelled" ? "Cancel order" : `Mark as ${label(s)}`}
                </button>
              </form>
            ))}
          </div>
        )}
        {nextList.includes("cancelled") && (
          <p className="m-0 mt-3 text-[12px] text-black/50">Cancelling an order gives the bottles back to the stock.</p>
        )}
      </section>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <section className={`${box} p-6`}>
          <p className={`m-0 ${small}`}>Customer account</p>
          <p className="m-0 mt-3 text-[16px]">{account?.name ?? "Deleted account"}</p>
          {account && (
            <>
              <p className="m-0 mt-1 text-[14px] text-black/60">{account.email}</p>
              <Link href={`/admin/customers/${String(o.userId)}`} className="mt-3 inline-block text-[13px] underline underline-offset-4">
                View customer
              </Link>
            </>
          )}
        </section>

        <section className={`${box} p-6`}>
          <p className={`m-0 ${small}`}>Delivery address</p>
          <p className="m-0 mt-3 text-[16px]">{o.shipping.name}</p>
          <p className="m-0 mt-1 text-[14px] text-black/60">{o.shipping.phone}</p>
          <p className="m-0 mt-1 text-[14px] text-black/60">{address}</p>
        </section>
      </div>

      {/* Items */}
      <section className={`${box} mb-6 overflow-x-auto`}>
        <table className="w-full min-w-[620px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.2em] text-black/50">
              <th className="px-4 py-3 font-medium">Perfume</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={`${i.slug}-${i.ml}`} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3">{i.name}</td>
                <td className="px-4 py-3">{i.ml}ml</td>
                <td className="px-4 py-3">{i.qty}</td>
                <td className="px-4 py-3">{formatPaise(i.unitPrice)}</td>
                <td className="px-4 py-3">{formatPaise(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <section className={`${box} p-6`}>
          <p className={`m-0 ${small}`}>Payment</p>
          <p className="m-0 mt-3 text-[15px]">{paymentText(o.payment.method, o.payment.status)}</p>
          {o.note && (
            <>
              <p className={`m-0 mt-5 ${small}`}>Customer note</p>
              <p className="m-0 mt-2 whitespace-pre-line text-[14px] text-black/70">{o.note}</p>
            </>
          )}
        </section>

        <section className={`${box} p-6 text-[14px]`}>
          <div className="flex justify-between text-black/60">
            <span>Subtotal</span>
            <span className="text-[#111]">{formatPaise(o.subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-black/60">
            <span>Shipping</span>
            <span className="text-[#111]">{o.shippingFee === 0 ? "Free" : formatPaise(o.shippingFee)}</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-black/10 pt-4">
            <span className={small}>Total</span>
            <span className="text-[24px] font-semibold" style={{ color: COPPER }}>
              {formatPaise(o.total)}
            </span>
          </div>
        </section>
      </div>

      <p className="m-0 text-[12px] text-black/45">Last updated {date(o.updatedAt)}</p>
      <Link href="/admin/orders" className="mt-4 inline-block text-[13px] underline underline-offset-4">
        Back to orders
      </Link>
    </AdminShell>
  );
}