import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Order, ORDER_STATUSES, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/models/Order";
import { isOrderStatus } from "@/lib/services/order-status";
import { formatPaise } from "@/lib/money";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, label, paymentText } from "@/components/admin/OrderBadges";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const PAGE_SIZE = 10;

type Row = {
  _id: unknown;
  orderNumber: string;
  shipping: { name: string; phone: string };
  items: { qty: number }[];
  total: number;
  status: OrderStatus;
  payment: { method: PaymentMethod; status: PaymentStatus };
  createdAt: Date;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);

  const filter: Record<string, unknown> = {};
  if (isOrderStatus(sp.status)) filter.status = sp.status;
  const search = (sp.search ?? "").trim().slice(0, 80);
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["orderNumber", "shipping.name", "shipping.phone"].map((f) => ({
      [f]: { $regex: safe, $options: "i" },
    }));
  }

  await connectDB();
  const [rows, total, pendingCount] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select("orderNumber shipping.name shipping.phone items.qty total status payment createdAt")
      .lean(),
    Order.countDocuments(filter),
    Order.countDocuments({ status: "pending" }),
  ]);
  const orders = rows as unknown as Row[];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (p: number) => {
    const n = new URLSearchParams();
    if (search) n.set("search", search);
    if (sp.status) n.set("status", sp.status);
    n.set("page", String(p));
    return `/admin/orders?${n.toString()}`;
  };

  return (
    <AdminShell active="Orders">
      <h1
        className="mb-2 mt-0 font-medium leading-tight"
        style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        Orders
      </h1>
      <p className="mb-8 mt-0 text-[14px] text-black/55">Pending orders: {pendingCount}</p>

      <form method="get" className="mb-5 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by order number, name or phone"
          className="h-11 min-w-[220px] flex-1 border border-black/20 bg-white px-4 text-[14px] outline-none focus:border-[#111]"
        />
        <select name="status" defaultValue={sp.status ?? ""} className="h-11 border border-black/20 bg-white px-3 text-[14px]">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 border border-black/20 bg-white px-6 text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-black/[0.03]"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto border border-black/10 bg-white">
        {orders.length === 0 ? (
          <p className="m-0 p-6 text-[15px] text-black/55">No orders found.</p>
        ) : (
          <table className="w-full min-w-[900px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.2em] text-black/50">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={String(o._id)} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    {o.shipping.name}
                    <span className="block text-[12px] text-black/50">{o.shipping.phone}</span>
                  </td>
                  <td className="px-4 py-3">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td className="px-4 py-3">{formatPaise(o.total)}</td>
                  <td className="px-4 py-3 text-[13px]">{paymentText(o.payment.method, o.payment.status)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${String(o._id)}`} className="underline underline-offset-4">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between text-[13px] text-black/60">
        <span>
          {total} orders · page {Math.min(page, pages)} of {pages}
        </span>
        <div className="flex gap-4">
          {page > 1 && (
            <Link href={link(page - 1)} className="underline underline-offset-4">
              Previous
            </Link>
          )}
          {page < pages && (
            <Link href={link(page + 1)} className="underline underline-offset-4">
              Next
            </Link>
          )}
        </div>
      </div>
    </AdminShell>
  );
}