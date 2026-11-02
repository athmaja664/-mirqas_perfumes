import { randomInt, randomUUID } from "crypto";
import { connectDB, getSequelize, Op } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order, OrderItem, OrderStatusHistory } from "@/models/Order";
import { Cart, CartItem, MAX_QTY_PER_LINE } from "@/models/Cart";
import { unitPricePaise } from "@/lib/pricing";
import type { OrderCreateInput } from "@/lib/validations/order";

const SHIPPING_FEE_PAISE = 0;

export type PlacedOrder = {
  orderNumber: string;
  total: number; // rupees
  status: string;
  itemCount: number;
};

export type CreateOrderResult =
  | { ok: true; order: PlacedOrder; existing: boolean }
  | { ok: false; status: number; message: string };

const fail = (status: number, message: string): CreateOrderResult => ({ ok: false, status, message });

function newOrderNumber() {
  const d = new Date();
  const ymd =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 6; i++) tail += chars[randomInt(chars.length)];
  return `MQ-${ymd}-${tail}`;
}

function toPlaced(o: { orderNumber: string; total: number; status: string; items?: { qty: number }[] }): PlacedOrder {
  return {
    orderNumber: o.orderNumber,
    total: o.total / 100,
    status: o.status,
    itemCount: o.items ? o.items.reduce((n, i) => n + i.qty, 0) : 0,
  };
}

export async function createOrder(userId: string, input: OrderCreateInput): Promise<CreateOrderResult> {
  await connectDB();
  const sequelize = getSequelize();

  // 1. Check idempotency
  if (input.idempotencyKey) {
    const already = await Order.findOne({
      where: { userId, idempotencyKey: input.idempotencyKey },
      include: [{ model: OrderItem, as: "items" }],
    });
    if (already) return { ok: true, order: toPlaced(already), existing: true };
  }

  // 2. Merge lines with the same perfume and size
  const merged = new Map<string, { slug: string; ml: number; qty: number }>();
  for (const l of input.items) {
    const key = `${l.slug}|${l.ml}`;
    const cur = merged.get(key);
    if (cur) cur.qty += l.qty;
    else merged.set(key, { slug: l.slug, ml: l.ml, qty: l.qty });
  }
  const lines = [...merged.values()];
  if (lines.some((l) => l.qty > MAX_QTY_PER_LINE)) {
    return fail(409, `You can order at most ${MAX_QTY_PER_LINE} of one item.`);
  }

  try {
    return await sequelize.transaction(async (t) => {
      // 3. Read real products with row lock
      const uniqueSlugs = [...new Set(lines.map((l) => l.slug))];
      const products = await Product.findAll({
        where: { slug: { [Op.in]: uniqueSlugs }, isActive: true },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const bySlug = new Map(products.map((p) => [p.slug, p]));

      const items: {
        productId: string;
        slug: string;
        name: string;
        image: string;
        ml: number;
        qty: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      const need = new Map<string, { product: (typeof products)[number]; qty: number }>();

      for (const l of lines) {
        const p = bySlug.get(l.slug);
        if (!p) return fail(409, "One of the perfumes is no longer available. Please check your cart.");

        const unit = unitPricePaise(p, l.ml);
        if (unit === null) return fail(400, "Invalid size.");

        const images = Array.isArray(p.images) ? p.images : [];
        items.push({
          productId: p.id,
          slug: p.slug,
          name: p.name,
          image: images[0] ?? "",
          ml: l.ml,
          qty: l.qty,
          unitPrice: unit,
          lineTotal: unit * l.qty,
        });

        const row = need.get(p.slug);
        if (row) row.qty += l.qty;
        else need.set(p.slug, { product: p, qty: l.qty });
      }

      for (const { product, qty } of need.values()) {
        if (product.stock < qty) {
          return fail(
            409,
            product.stock < 1 ? `${product.name} is sold out.` : `Only ${product.stock} left of ${product.name}.`
          );
        }
      }

      // 4. Decrement stock
      for (const { product, qty } of need.values()) {
        product.stock -= qty;
        await product.save({ transaction: t });
      }

      // 5. Calculate total
      const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
      const total = subtotal + SHIPPING_FEE_PAISE;
      const orderId = randomUUID();

      const order = await Order.create(
        {
          id: orderId,
          orderNumber: newOrderNumber(),
          userId,
          subtotal,
          shippingFee: SHIPPING_FEE_PAISE,
          total,
          status: "pending",
          paymentMethod: "cod",
          paymentStatus: "pending",
          razorpayOrderId: "",
          razorpayPaymentId: "",
          shippingName: input.shipping.name,
          shippingPhone: input.shipping.phone,
          shippingLine1: input.shipping.line1,
          shippingLine2: input.shipping.line2 || "",
          shippingCity: input.shipping.city,
          shippingState: input.shipping.state,
          shippingPincode: input.shipping.pincode,
          note: input.note || "",
          idempotencyKey: input.idempotencyKey || null,
        },
        { transaction: t }
      );

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await OrderItem.create(
          {
            id: randomUUID(),
            orderId: order.id,
            productId: item.productId,
            slug: item.slug,
            name: item.name,
            image: item.image,
            ml: item.ml,
            qty: item.qty,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          },
          { transaction: t }
        );
      }

      await OrderStatusHistory.create(
        {
          id: randomUUID(),
          orderId: order.id,
          status: "pending",
          at: new Date(),
        },
        { transaction: t }
      );

      // Clear the cart
      const cart = await Cart.findOne({ where: { userId }, transaction: t });
      if (cart) {
        await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
      }

      return {
        ok: true,
        order: toPlaced({
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          items,
        }),
        existing: false,
      };
    });
  } catch (err: unknown) {
    const e = err as { name?: string; original?: { errno?: number } };
    if (e.name === "SequelizeUniqueConstraintError" || e.original?.errno === 1062) {
      const again = await Order.findOne({
        where: { userId, idempotencyKey: input.idempotencyKey },
        include: [{ model: OrderItem, as: "items" }],
      });
      if (again) return { ok: true, order: toPlaced(again), existing: true };
    }
    console.error("Order creation error:", err);
    return fail(500, "Could not place your order. Please try again.");
  }
}