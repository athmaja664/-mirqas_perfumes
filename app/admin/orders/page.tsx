import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB, Op } from "@/lib/db";
import { Order, OrderItem, ORDER_STATUSES, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/models/Order";
import { isOrderStatus } from "@/lib/services/order-status";
import { formatPaise } from "@/lib/money";
import { deleteOrder } from "@/lib/services/purge";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, label, paymentText } from "@/components/admin/OrderBadges";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

export const dynamic = "force-dynamic";

async function deleteOrderAction(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const result = await deleteOrder(id);
  revalidatePath("/admin/orders");
  redirect(result.ok ? "/admin/orders?done=deleted" : "/admin/orders?error=failed");
}

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

  const where: Record<string | symbol, unknown> = {};
  if (isOrderStatus(sp.status)) where.status = sp.status;
  const search = (sp.search ?? "").trim().slice(0, 80);
  if (search) {
    where[Op.or as unknown as symbol] = [
      { orderNumber: { [Op.like]: `%${search}%` } },
      { shippingName: { [Op.like]: `%${search}%` } },
      { shippingPhone: { [Op.like]: `%${search}%` } },
    ];
  }

  await connectDB();
  const [{ rows, count: total }, pendingCount] = await Promise.all([
    Order.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      include: [{ model: OrderItem, as: "items" }],
    }),
    Order.count({ where: { status: "pending" } }),
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
        className="mb-2 mt-0 break-words font-medium leading-tight"
        style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
      >
        Orders
      </h1>
      <p className="mb-6 mt-0 text-[14px] text-black/55 md:mb-8">Pending orders: {pendingCount}</p>

      {sp.done === "deleted" && (
        <p role="status" className="mb-4 px-3 py-2 text-[13px]" style={{ background: "#E3F2E6", color: "#1F7A3A" }}>
          Order deleted successfully.
        </p>
      )}
      {sp.error === "failed" && (
        <p role="alert" className="mb-4 px-3 py-2 text-[13px]" style={{ background: "#F8E3E0", color: "#A32A1F" }}>
          Could not delete order. Please try again.
        </p>
      )}

      {/* Filter: search takes the full row on phones, then the dropdown and button share the next row */}
      <form method="get" className="mb-5 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by order number, name or phone"
          className="h-11 w-full border border-black/20 bg-white px-4 text-[16px] outline-none focus:border-[#111] sm:w-auto sm:min-w-[220px] sm:flex-1 sm:text-[14px]"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-11 min-w-0 flex-1 border border-black/20 bg-white px-3 text-[16px] sm:flex-none sm:text-[14px]"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 flex-1 border border-black/20 bg-white px-6 text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-black/[0.03] sm:flex-none"
        >
          Filter
        </button>
      </form>

      <div className="border border-black/10 bg-white">
        {orders.length === 0 ? (
          <p className="m-0 p-5 text-[15px] text-black/55 sm:p-6">No orders found.</p>
        ) : (
          <>
            {/* Phone: one card per order */}
            <ul className="m-0 list-none p-0 lg:hidden">
              {orders.map((o) => (
                <li key={String(o._id)} className="border-b border-black/5 p-4 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="m-0 min-w-0 break-all text-[15px] font-medium lining-nums">{o.orderNumber}</p>
                    <div className="shrink-0">
                      <StatusBadge status={o.status} />
                    </div>
                  </div>

                  <p className="m-0 mt-2 break-words text-[14px]">{o.shipping.name}</p>
                  <p className="m-0 mt-0.5 text-[13px] text-black/50 lining-nums">{o.shipping.phone}</p>

                  <div className="mt-3 flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-[15px] font-medium lining-nums">{formatPaise(o.total)}</span>
                    <span className="text-black/55 lining-nums">
                      {o.items.reduce((n, i) => n + i.qty, 0)} items
                    </span>
                  </div>

                  <p className="m-0 mt-1 text-[12px] text-black/55">
                    {paymentText(o.payment.method, o.payment.status)}
                  </p>
                  <p className="m-0 mt-1 text-[12px] text-black/45 lining-nums">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <Link
                      href={`/admin/orders/${String(o._id)}`}
                      className="py-1 text-[13px] underline underline-offset-4"
                      style={{ color: COPPER }}
                    >
                      View order
                    </Link>
                    <form action={deleteOrderAction} className="m-0 flex items-center">
                      <input type="hidden" name="id" value={String(o._id)} />
                      <ConfirmDeleteButton
                        label={`Delete order ${o.orderNumber}`}
                        title="Delete order?"
                        message={`Delete order ${o.orderNumber} for good?\n\nThis cannot be undone.`}
                      />
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            {/* Large screens: table */}
            <div className="hidden overflow-x-auto lg:block">
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
                        <div className="flex h-8 items-center gap-3">
                          <Link href={`/admin/orders/${String(o._id)}`} className="underline underline-offset-4">
                            View
                          </Link>
                          <form action={deleteOrderAction} className="m-0 flex h-8 items-center">
                            <input type="hidden" name="id" value={String(o._id)} />
                            <ConfirmDeleteButton
                              label={`Delete order ${o.orderNumber}`}
                              title="Delete order?"
                              message={`Delete order ${o.orderNumber} for good?\n\nThis cannot be undone.`}
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 text-[13px] text-black/60 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {total} orders · page {Math.min(page, pages)} of {pages}
        </span>
        <div className="flex gap-5">
          {page > 1 && (
            <Link href={link(page - 1)} className="py-2 underline underline-offset-4">
              Previous
            </Link>
          )}
          {page < pages && (
            <Link href={link(page + 1)} className="py-2 underline underline-offset-4">
              Next
            </Link>
          )}
        </div>
      </div>
    </AdminShell>
  );
}