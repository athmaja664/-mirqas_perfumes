import { connectDB } from "@/lib/db";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/models/Order";
import { Product } from "@/models/Product";

// Which status can come next. Delivered and cancelled are final.
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
  const before = await Order.findOneAndUpdate(
    { _id: orderId, status: from },
    { $set: { status: next } },
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