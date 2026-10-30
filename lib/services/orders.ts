import { randomInt } from "crypto";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Cart, MAX_QTY_PER_LINE } from "@/models/Cart";
import { unitPricePaise } from "@/lib/pricing";
import type { OrderCreateInput } from "@/lib/validations/order";

// Free shipping for now (paise). Change this one number to add a shipping fee.
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

// Example: MQ-261030-K7P2QA
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

function toPlaced(o: { orderNumber: string; total: number; status: string; items: { qty: number }[] }): PlacedOrder {
  return {
    orderNumber: o.orderNumber,
    total: o.total / 100,
    status: o.status,
    itemCount: o.items.reduce((n, i) => n + i.qty, 0),
  };
}

export async function createOrder(userId: string, input: OrderCreateInput): Promise<CreateOrderResult> {
  await connectDB();

  // 1. The same request sent twice (double click, refresh): return the first order
  const already = await Order.findOne({ userId, idempotencyKey: input.idempotencyKey }).lean();
  if (already) return { ok: true, order: toPlaced(already), existing: true };

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

  // 3. Read the real products. Name, image and price come from the database only.
  const products = await Product.find({
    slug: { $in: [...new Set(lines.map((l) => l.slug))] },
    isActive: true,
  }).lean();
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const items: {
    productId: Types.ObjectId;
    slug: string;
    name: string;
    image: string;
    ml: number;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }[] = [];

  // Stock is one number per perfume (all sizes share it), so we count bottles per perfume
  const need = new Map<string, { product: (typeof products)[number]; qty: number }>();

  for (const l of lines) {
    const p = bySlug.get(l.slug);
    if (!p) return fail(409, "One of the perfumes is no longer available. Please check your cart.");

    const unit = unitPricePaise(p, l.ml);
    if (unit === null) return fail(400, "Invalid size.");

    items.push({
      productId: p._id,
      slug: p.slug,
      name: p.name,
      image: p.images[0] ?? "",
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

  // 4. Take the stock. Each update checks the stock again, so two customers
  //    can never buy the last bottle together. If one fails, give back the rest.
  const taken: { id: Types.ObjectId; qty: number }[] = [];
  const giveBack = async () => {
    await Promise.all(taken.map((t) => Product.updateOne({ _id: t.id }, { $inc: { stock: t.qty } })));
  };

  for (const { product, qty } of need.values()) {
    const r = await Product.updateOne(
      { _id: product._id, isActive: true, stock: { $gte: qty } },
      { $inc: { stock: -qty } }
    );
    if (r.modifiedCount !== 1) {
      await giveBack();
      return fail(409, `${product.name} just sold out. Please check your cart.`);
    }
    taken.push({ id: product._id, qty });
  }

  // 5. Save the order. The total is worked out here, never taken from the browser.
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
  const total = subtotal + SHIPPING_FEE_PAISE;

  try {
    const doc = await Order.create({
      orderNumber: newOrderNumber(),
      userId,
      items,
      shipping: input.shipping,
      subtotal,
      shippingFee: SHIPPING_FEE_PAISE,
      total,
      status: "pending",
      statusHistory: [{ status: "pending", at: new Date() }],
      payment: { method: "cod", status: "pending", razorpayOrderId: "", razorpayPaymentId: "" },
      note: input.note,
      idempotencyKey: input.idempotencyKey,
    });

    // Clear the saved (database) cart only after the order is saved
    await Cart.updateOne({ userId }, { $set: { items: [] } });

    return { ok: true, order: toPlaced(doc), existing: false };
  } catch (err) {
    await giveBack();

    // Two identical requests at the same moment: return the order that won
    if ((err as { code?: number }).code === 11000) {
      const again = await Order.findOne({ userId, idempotencyKey: input.idempotencyKey }).lean();
      if (again) return { ok: true, order: toPlaced(again), existing: true };
    }
    return fail(500, "Could not place your order. Please try again.");
  }
}