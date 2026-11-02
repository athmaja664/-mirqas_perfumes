import { connectDB, getSequelize, Op } from "@/lib/db";
import {
  Order,
  OrderItem,
  OrderStatusHistory,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/models/Order";
import { Product } from "@/models/Product";

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
  const sequelize = getSequelize();

  return sequelize.transaction(async (t) => {
    const current = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: "items" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!current) return { ok: false, message: "Order not found." };

    const from = current.status;
    if (!NEXT_STATUSES[from].includes(next)) {
      return { ok: false, message: `An order cannot move from ${from} to ${next}.` };
    }

    current.status = next;
    if (next === "delivered" && current.paymentMethod === "cod") {
      current.paymentStatus = "paid";
    }
    await current.save({ transaction: t });

    await OrderStatusHistory.create(
      {
        orderId: current.id,
        status: next,
        at: new Date(),
      },
      { transaction: t }
    );

    // Cancelled: give the bottles back to the stock
    if (next === "cancelled" && current.items) {
      const back = new Map<string, number>();
      for (const i of current.items) {
        const key = String(i.productId);
        back.set(key, (back.get(key) ?? 0) + i.qty);
      }
      for (const [productId, qty] of back) {
        await Product.increment("stock", {
          by: qty,
          where: { id: productId },
          transaction: t,
        });
      }
    }

    return { ok: true };
  });
}

export async function restoreCancelledOrder(orderId: string): Promise<StatusResult> {
  await connectDB();
  const sequelize = getSequelize();

  return sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: "items" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) return { ok: false, message: "Order not found." };
    if (order.status !== "cancelled") {
      return { ok: false, message: "Only a cancelled order can be restored." };
    }

    const items = order.items ?? [];
    const need = new Map<string, { qty: number; name: string }>();
    for (const i of items) {
      const key = String(i.productId);
      const row = need.get(key);
      if (row) row.qty += i.qty;
      else need.set(key, { qty: i.qty, name: i.name });
    }

    for (const [id, { qty, name }] of need) {
      const product = await Product.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product || product.stock < qty) {
        return { ok: false, message: `Not enough stock for ${name}. Add stock first, then restore the order.` };
      }
      product.stock -= qty;
      await product.save({ transaction: t });
    }

    order.status = "pending";
    await order.save({ transaction: t });

    await OrderStatusHistory.create(
      {
        orderId: order.id,
        status: "pending",
        at: new Date(),
      },
      { transaction: t }
    );

    return { ok: true };
  });
}