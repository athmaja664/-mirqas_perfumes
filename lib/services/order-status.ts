import { connectDB } from "@/lib/db";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/models/Order";
import { Product } from "@/models/Product";

// Which status can come next. Delivered and cancelled are final here.
// A cancelled order can only come back through restoreCancelledOrder (below).
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export type StatusResult = { ok: true } | { ok: false; message: string };

export async function changeOrderStatus(orderId: string, next: OrderStatus): Promise<StatusResult> {
  await connectDB();

  const current = await Order.findById(orderId).select("status").lean();
  if (!current) return { ok: false, message: "Order not found." };

  const from = current.status;
  if (!NEXT_STATUSES[from].includes(next)) {
    return { ok: false, message: `An order cannot move from ${from} to ${next}.` };
  }

  // The update only works if the status is still the same as a moment ago.
  // So a double click can never cancel an order twice or give the stock back twice.
  // The new status and its time are also saved in the tracking history.
  const before = await Order.findOneAndUpdate(
    { _id: orderId, status: from },
    { $set: { status: next }, $push: { statusHistory: { status: next, at: new Date() } } },
    { new: false }
  ).lean();
  if (!before) return { ok: false, message: "This order was just changed. Please refresh the page." };

  // Cancelled: give the bottles back to the stock
  if (next === "cancelled") {
    const back = new Map<string, number>();
    for (const i of before.items) {
      const key = String(i.productId);
      back.set(key, (back.get(key) ?? 0) + i.qty);
    }
    await Promise.all(
      [...back].map(([productId, qty]) => Product.updateOne({ _id: productId }, { $inc: { stock: qty } }))
    );
  }

  // Cash on delivery: the cash is collected when the order is delivered
  if (next === "delivered") {
    await Order.updateOne({ _id: orderId, "payment.method": "cod" }, { $set: { "payment.status": "paid" } });
  }

  return { ok: true };
}

// Un-cancel: a cancelled order goes back to "pending".
// The bottles are taken from the stock again. If there is not enough stock,
// nothing changes and the admin sees a clear message.
export async function restoreCancelledOrder(orderId: string): Promise<StatusResult> {
  await connectDB();

  const order = await Order.findById(orderId).select("status items").lean();
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status !== "cancelled") {
    return { ok: false, message: "Only a cancelled order can be restored." };
  }

  // Count the bottles per perfume
  const need = new Map<string, { qty: number; name: string }>();
  for (const i of order.items) {
    const key = String(i.productId);
    const row = need.get(key);
    if (row) row.qty += i.qty;
    else need.set(key, { qty: i.qty, name: i.name });
  }

  // Take the stock. Each update checks the stock again.
  const taken: { id: string; qty: number }[] = [];
  const giveBack = async () => {
    await Promise.all(taken.map((t) => Product.updateOne({ _id: t.id }, { $inc: { stock: t.qty } })));
  };

  for (const [id, { qty, name }] of need) {
    const r = await Product.updateOne({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
    if (r.modifiedCount !== 1) {
      await giveBack();
      return { ok: false, message: `Not enough stock for ${name}. Add stock first, then restore the order.` };
    }
    taken.push({ id, qty });
  }

  // Change the status only if it is still cancelled (a double click cannot take the stock twice)
  const flipped = await Order.findOneAndUpdate(
    { _id: orderId, status: "cancelled" },
    { $set: { status: "pending" }, $push: { statusHistory: { status: "pending", at: new Date() } } }
  ).lean();
  if (!flipped) {
    await giveBack();
    return { ok: false, message: "This order was just changed. Please refresh the page." };
  }

  return { ok: true };
}