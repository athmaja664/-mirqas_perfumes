import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB, Op } from "@/lib/db";
import { User } from "@/models/User";
import { Address } from "@/models/Address";
import { Product } from "@/models/Product";
import {
  Order,
  OrderItem,
  OrderStatusHistory,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/models/Order";
import {
  NEXT_STATUSES,
  changeOrderStatus,
  isOrderStatus,
  restoreCancelledOrder,
} from "@/lib/services/order-status";
import { formatPaise } from "@/lib/money";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, label } from "@/components/admin/OrderBadges";
import AdminOrderItemsList from "@/components/admin/AdminOrderItemsList";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

type OrderRow = {
  id: string;
  _id: unknown;
  orderNumber: string;
  userId: string;
  items: {
    id?: string;
    productId: string;
    slug: string;
    name: string;
    image?: string;
    ml: number;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  shipping: {
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  note: string;
  statusHistory?: { status: OrderStatus; at: Date }[];
  createdAt: Date;
  updatedAt: Date;
};

type AccountRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  role: string;
  createdAt: Date;
};

type AddressRow = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

// Server action: update order status with admin permission check
async function updateStatus(formData: FormData) {
  "use server";
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") redirect("/login");

  const id = String(formData.get("id"));
  const next = formData.get("status");
  if (!id || !isOrderStatus(next)) redirect("/admin/orders");

  const result = await changeOrderStatus(id, next);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?${result.ok ? "updated=1" : `error=${encodeURIComponent(result.message)}`}`);
}

// Server action: restore cancelled order
async function restoreOrder(formData: FormData) {
  "use server";
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") redirect("/login");

  const id = String(formData.get("id"));
  if (!id) redirect("/admin/orders");

  const result = await restoreCancelledOrder(id);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?${result.ok ? "updated=1" : `error=${encodeURIComponent(result.message)}`}`);
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    paid: "bg-[#E3F2E6] text-[#1F7A3A] border-[#1F7A3A]/30",
    pending: "bg-[#F3E7D5] text-[#7d4720] border-[#9C5A2B]/30",
    failed: "bg-[#F8E3E0] text-[#A32A1F] border-[#A32A1F]/30",
    refunded: "bg-[#EDE7F6] text-[#4A2C7A] border-[#4A2C7A]/30",
  };
  return (
    <span
      className={`inline-block border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
        styles[status] || styles.pending
      }`}
    >
      {label(status)}
    </span>
  );
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
  if (!id) notFound();

  await connectDB();

  // 1. Fetch Order with items and status history
  const orderRecord = await Order.findByPk(id, {
    include: [
      { model: OrderItem, as: "items" },
      { model: OrderStatusHistory, as: "statusHistory" },
    ],
  });
  if (!orderRecord) notFound();

  const o = orderRecord as unknown as OrderRow;

  // 2. Fetch associated Customer User details
  let account: AccountRow | null = null;
  if (orderRecord.userId) {
    account = (await User.findByPk(String(orderRecord.userId), {
      attributes: ["id", "name", "email", "phone", "isActive", "role", "createdAt"],
    })) as unknown as AccountRow | null;
  }

  // 3. Fetch saved Billing Address (if customer has saved an address profile)
  let savedBillingAddress: AddressRow | null = null;
  if (orderRecord.userId) {
    savedBillingAddress = (await Address.findOne({
      where: { userId: String(orderRecord.userId) },
      attributes: ["name", "phone", "line1", "line2", "city", "state", "pincode"],
    })) as unknown as AddressRow | null;
  }

  // 4. Lookup product details and live warehouse stock
  const itemProductIds = (o.items || []).map((it) => it.productId).filter(Boolean);
  const products =
    itemProductIds.length > 0
      ? await Product.findAll({
          where: { id: { [Op.in]: itemProductIds } },
          attributes: ["id", "name", "images", "stock", "isActive"],
        })
      : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Build items list with live warehouse stock
  const itemsWithLiveStock = (o.items || []).map((it) => {
    const live = productMap.get(it.productId);
    return {
      id: it.id,
      productId: it.productId,
      slug: it.slug,
      name: it.name,
      image: it.image || live?.images?.[0] || "",
      ml: it.ml,
      qty: it.qty,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      currentStock: live?.stock,
      isActive: live?.isActive,
    };
  });

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
    });

  const nextList = NEXT_STATUSES[o.status] || [];

  // Calculate discount if subtotal + shippingFee exceeds total
  const calculatedDiff = o.subtotal + (o.shippingFee || 0) - o.total;
  const discountPaise = calculatedDiff > 0 ? calculatedDiff : 0;

  const box = "border border-black/10 bg-white p-5 sm:p-6";
  const small = "text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50";

  return (
    <AdminShell active="Orders">
      {/* Top Breadcrumb & Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-black/70 hover:text-[#9C5A2B]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to all orders
        </Link>
        <span className="text-[12px] text-black/50">
          Last updated: {new Date(o.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>

      {/* Main Order Header - Clean, balanced alignment */}
      <div className="mb-6 border-b border-black/10 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="m-0 break-all text-2xl font-medium sm:text-3xl lg:text-4xl"
                style={{ fontFamily: serif, color: COPPER }}
              >
                {o.orderNumber}
              </h1>
              <StatusBadge status={o.status} />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-black/60">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-black/75">Order ID:</span>
                <code className="rounded bg-black/[0.05] px-2 py-0.5 font-mono text-[12px] font-medium text-black/90">
                  {orderRecord.id}
                </code>
              </div>
              <span className="hidden sm:inline text-black/30">•</span>
              <span>Placed {formatDate(o.createdAt)}</span>
            </div>
          </div>

          <div className="rounded-[8px] border border-black/10 bg-white p-3 lg:border-0 lg:bg-transparent lg:p-0 lg:text-right">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/50">Final Order Total</p>
            <p className="m-0 text-2xl font-bold sm:text-3xl" style={{ color: COPPER }}>
              {formatPaise(o.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback alerts */}
      {sp.updated && (
        <div className="mb-6 border border-[#1F7A3A]/30 bg-[#E3F2E6] px-4 py-3 text-[14px] text-[#1F7A3A]">
          ✓ Order status successfully updated.
        </div>
      )}
      {sp.error && (
        <div className="mb-6 border border-[#A32A1F]/30 bg-[#F8E3E0] px-4 py-3 text-[14px] text-[#A32A1F]">
          ✕ {sp.error}
        </div>
      )}

      {/* Status Management Actions */}
      <section className={`${box} mb-6`}>
        <p className={`m-0 ${small}`}>Manage Order Status</p>

        {o.status === "cancelled" ? (
          <div className="mt-4">
            <form action={restoreOrder}>
              <input type="hidden" name="id" value={orderRecord.id} />
              <button
                type="submit"
                className="cursor-pointer px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#7d4720]"
                style={{ background: COPPER }}
              >
                Restore order
              </button>
            </form>
            <p className="m-0 mt-3 text-[12px] text-black/50">
              This order is currently cancelled. Restoring it returns items from stock back into the order and moves status to Pending.
            </p>
          </div>
        ) : nextList.length === 0 ? (
          <p className="m-0 mt-3 text-[14px] text-black/60">
            This order is marked as <strong>{label(o.status)}</strong>. No further status changes are required.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            {nextList.map((s) => (
              <form key={s} action={updateStatus}>
                <input type="hidden" name="id" value={orderRecord.id} />
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  className={
                    s === "cancelled"
                      ? "cursor-pointer border border-[#A32A1F] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#A32A1F] hover:bg-[#A32A1F] hover:text-white"
                      : "cursor-pointer px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#7d4720]"
                  }
                  style={s === "cancelled" ? undefined : { background: COPPER }}
                >
                  {s === "cancelled" ? "Cancel Order" : `Mark as ${label(s)}`}
                </button>
              </form>
            ))}
          </div>
        )}
      </section>

      {/* 2-Column Grid: Section 1 (Order Information) & Section 2 (Customer Details) */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* SECTION 1: ORDER INFORMATION */}
        <section className={box}>
          <h2 className="m-0 mb-4 text-xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
            Order Information
          </h2>

          <div className="divide-y divide-black/10 text-[13px]">
            <div className="flex flex-col justify-between py-2.5 sm:flex-row">
              <span className="text-black/55">Order Number</span>
              <span className="font-semibold text-black/90">{o.orderNumber}</span>
            </div>

            <div className="flex flex-col justify-between py-2.5 sm:flex-row">
              <span className="text-black/55">Database Order ID</span>
              <span className="font-mono text-[12px] text-black/90">{orderRecord.id}</span>
            </div>

            <div className="flex flex-col justify-between py-2.5 sm:flex-row">
              <span className="text-black/55">Order Date</span>
              <span className="text-black/90">{formatDate(o.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-black/55">Order Status</span>
              <div>
                <StatusBadge status={o.status} />
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-black/55">Payment Status</span>
              <div>
                <PaymentBadge status={o.payment.status} />
              </div>
            </div>

            <div className="flex flex-col justify-between py-2.5 sm:flex-row">
              <span className="text-black/55">Payment Method</span>
              <span className="font-medium text-black/90">
                {o.payment.method === "cod" ? "Cash on Delivery (COD)" : "Online Payment (Razorpay)"}
              </span>
            </div>

            {o.payment.razorpayOrderId && (
              <div className="flex flex-col justify-between py-2.5 sm:flex-row">
                <span className="text-black/55">Razorpay Order ID</span>
                <span className="font-mono text-[12px] text-black/85">{o.payment.razorpayOrderId}</span>
              </div>
            )}

            {o.payment.razorpayPaymentId && (
              <div className="flex flex-col justify-between py-2.5 sm:flex-row">
                <span className="text-black/55">Razorpay Payment ID</span>
                <span className="font-mono text-[12px] text-black/85">{o.payment.razorpayPaymentId}</span>
              </div>
            )}

            <div className="flex justify-between py-2.5">
              <span className="text-black/55">Subtotal</span>
              <span className="font-medium text-black/90">{formatPaise(o.subtotal)}</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-black/55">Shipping Charge</span>
              <span className="text-black/90">{o.shippingFee === 0 ? "Free (₹0)" : formatPaise(o.shippingFee)}</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-black/55">Discount</span>
              <span className="text-black/90">{discountPaise > 0 ? `-${formatPaise(discountPaise)}` : "None (₹0)"}</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-black/55">Coupon Code</span>
              <span className="text-black/60">None</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="font-semibold text-black/85">Final Total Amount</span>
              <span className="text-lg font-bold" style={{ color: COPPER }}>
                {formatPaise(o.total)}
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2: CUSTOMER DETAILS */}
        <section className={box}>
          <h2 className="m-0 mb-4 text-xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
            Customer Details
          </h2>

          {/* Account Profile Details */}
          <div className="mb-4 border-b border-black/10 pb-4">
            <p className={`m-0 mb-2 ${small}`}>Customer Account</p>
            <div className="grid gap-2 text-[13px]">
              <div className="flex flex-col justify-between sm:flex-row">
                <span className="text-black/55">Full Name</span>
                <span className="font-medium text-black/90">
                  {account?.name || o.shipping.name || "Not available"}
                </span>
              </div>
              <div className="flex flex-col justify-between sm:flex-row">
                <span className="text-black/55">Email Address</span>
                <span className="text-black/90">{account?.email || "Not available"}</span>
              </div>
              <div className="flex flex-col justify-between sm:flex-row">
                <span className="text-black/55">Phone Number</span>
                <span className="text-black/90">{account?.phone || o.shipping.phone || "Not available"}</span>
              </div>
              <div className="flex flex-col justify-between sm:flex-row">
                <span className="text-black/55">Account Status</span>
                <span className="text-black/90">
                  {account ? (account.isActive ? "Active Registered User" : "Inactive Account") : "Guest / Deleted Account"}
                </span>
              </div>
            </div>

            {account && (
              <div className="mt-3">
                <Link
                  href={`/admin/customers/${String(orderRecord.userId)}`}
                  className="inline-block cursor-pointer text-[12px] font-medium underline underline-offset-4"
                  style={{ color: COPPER }}
                >
                  View full customer account →
                </Link>
              </div>
            )}
          </div>

          {/* Delivery & Shipping Address */}
          <div className="mb-4 border-b border-black/10 pb-4">
            <p className={`m-0 mb-2 ${small}`}>Shipping Address</p>
            <div className="text-[13px] leading-relaxed text-black/85">
              <p className="m-0 font-medium text-black/95">{o.shipping.name || "Not available"}</p>
              <p className="m-0 text-black/60">Phone: {o.shipping.phone || "Not available"}</p>
              <p className="m-0 mt-1">{o.shipping.line1 || "Not available"}</p>
              {o.shipping.line2 && <p className="m-0">{o.shipping.line2}</p>}
              <p className="m-0">
                {[o.shipping.city, o.shipping.state].filter(Boolean).join(", ")}
                {o.shipping.pincode ? ` - ${o.shipping.pincode}` : ""}
              </p>
              <p className="m-0 font-medium text-black/60">Country: India</p>
            </div>
          </div>

          {/* Billing Address */}
          <div className="mb-4 border-b border-black/10 pb-4">
            <p className={`m-0 mb-2 ${small}`}>Billing Address</p>
            {savedBillingAddress ? (
              <div className="text-[13px] leading-relaxed text-black/85">
                <p className="m-0 font-medium text-black/95">{savedBillingAddress.name}</p>
                <p className="m-0 text-black/60">Phone: {savedBillingAddress.phone}</p>
                <p className="m-0 mt-1">{savedBillingAddress.line1}</p>
                {savedBillingAddress.line2 && <p className="m-0">{savedBillingAddress.line2}</p>}
                <p className="m-0">
                  {[savedBillingAddress.city, savedBillingAddress.state].filter(Boolean).join(", ")}
                  {savedBillingAddress.pincode ? ` - ${savedBillingAddress.pincode}` : ""}
                </p>
                <p className="m-0 font-medium text-black/60">Country: India</p>
              </div>
            ) : (
              <p className="m-0 text-[13px] text-black/60">
                Same as shipping address (no separate billing address on file)
              </p>
            )}
          </div>

          {/* Customer Note (if any) */}
          {o.note ? (
            <div>
              <p className={`m-0 mb-1 ${small}`}>Customer Note</p>
              <p className="m-0 rounded border border-black/10 bg-black/[0.02] p-3 text-[13px] text-black/75">
                {o.note}
              </p>
            </div>
          ) : (
            <div>
              <p className={`m-0 mb-1 ${small}`}>Customer Note</p>
              <p className="m-0 text-[13px] italic text-black/45">None provided by customer.</p>
            </div>
          )}
        </section>
      </div>

      {/* SECTION 3: ORDERED ITEMS (Clickable for rich details modal) */}
      <section className={`${box} mb-6`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
          <div>
            <h2 className="m-0 text-xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
              Ordered Items
            </h2>
            <p className="m-0 mt-0.5 text-[12px] text-black/55">
              Click any item row to view product details and live warehouse stock.
            </p>
          </div>
          <span className="text-[12px] font-medium text-black/60">
            {itemsWithLiveStock.length} {itemsWithLiveStock.length === 1 ? "product" : "products"} included
          </span>
        </div>

        <AdminOrderItemsList items={itemsWithLiveStock} />
      </section>

      {/* SECTION 4: ORDER SUMMARY */}
      <section className={`${box} mb-8`}>
        <h2 className="m-0 mb-4 text-xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
          Order Summary
        </h2>

        <div className="max-w-md divide-y divide-black/10 text-[14px]">
          <div className="flex justify-between py-2 text-black/70">
            <span>Subtotal</span>
            <span className="font-medium text-black/90">{formatPaise(o.subtotal)}</span>
          </div>

          <div className="flex justify-between py-2 text-black/70">
            <span>Shipping</span>
            <span className="text-black/90">{o.shippingFee === 0 ? "Free" : formatPaise(o.shippingFee)}</span>
          </div>

          <div className="flex justify-between py-2 text-black/70">
            <span>Discount</span>
            <span className="text-black/90">{discountPaise > 0 ? `-${formatPaise(discountPaise)}` : "₹0"}</span>
          </div>

          <div className="flex items-baseline justify-between pt-4">
            <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-black/60">Final Total</span>
            <span className="text-3xl font-bold" style={{ color: COPPER }}>
              {formatPaise(o.total)}
            </span>
          </div>
        </div>
      </section>

      {/* Back button */}
      <div className="pt-2">
        <Link
          href="/admin/orders"
          className="inline-block cursor-pointer border border-black/20 bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-black/80 hover:bg-black/[0.03]"
        >
          ← Back to orders
        </Link>
      </div>
    </AdminShell>
  );
}
