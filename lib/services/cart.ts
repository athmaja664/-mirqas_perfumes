import { connectDB, Op } from "@/lib/db";
import { Cart, CartItem, MAX_QTY_PER_LINE } from "@/models/Cart";
import { Product } from "@/models/Product";
import { SIZE_STEPS, sizePricePaise, unitPricePaise } from "@/lib/pricing";

export type CartResult = { ok: true } | { ok: false; status: number; message: string };

const fail = (status: number, message: string): CartResult => ({ ok: false, status, message });

export type CartLineView = {
  slug: string;
  name: string;
  image?: string;
  notes?: string[];
  sizes: { ml: number; price: number; originalPrice?: number; soldOut?: boolean }[];
  ml: number;
  qty: number;
  soldOut: boolean;
};

export type CartView = {
  items: CartLineView[];
  count: number;
  subtotal: number;
};

const limitFor = (stock: number) => Math.min(MAX_QTY_PER_LINE, stock);

async function loadCart(userId: string) {
  const [cart] = await Cart.findOrCreate({
    where: { userId },
    defaults: { userId },
  });
  return cart;
}

export async function getCartView(userId: string): Promise<CartView> {
  await connectDB();
  const cart = await Cart.findOne({
    where: { userId },
    include: [{ model: CartItem, as: "items" }],
  });

  const lines = cart?.items ?? [];
  if (lines.length === 0) return { items: [], count: 0, subtotal: 0 };

  const productIds = lines.map((l) => l.productId);
  const products = await Product.findAll({
    where: {
      id: { [Op.in]: productIds },
      isActive: true,
    },
  });

  const byId = new Map(products.map((p) => [String(p.id), p]));

  const items: CartLineView[] = [];
  let subtotalPaise = 0;
  let count = 0;

  for (const line of lines) {
    const p = byId.get(String(line.productId));
    if (!p) continue;

    const soldOut = p.stock < 1;
    if (!soldOut) {
      subtotalPaise += (unitPricePaise(p, line.ml) ?? 0) * line.qty;
      count += line.qty;
    }

    const images = Array.isArray(p.images) ? p.images : [];
    const notes = Array.isArray(p.notes) ? p.notes : [];

    items.push({
      slug: p.slug,
      name: p.name,
      image: images[0],
      notes: notes.length ? notes : undefined,
      sizes: SIZE_STEPS.map(({ ml }) => ({
        ml,
        price: (sizePricePaise(p.salePrice ?? p.price, ml) ?? 0) / 100,
        originalPrice: p.salePrice != null ? (sizePricePaise(p.price, ml) ?? 0) / 100 : undefined,
        soldOut,
      })),
      ml: line.ml,
      qty: line.qty,
      soldOut,
    });
  }

  return { items, count, subtotal: subtotalPaise / 100 };
}

export async function addToCart(userId: string, slug: string, ml: number, qty: number): Promise<CartResult> {
  await connectDB();
  const product = await Product.findOne({ where: { slug, isActive: true } });
  if (!product) return fail(404, "Product not found.");
  if (product.stock < 1) return fail(409, "This perfume is sold out.");

  const cart = await loadCart(userId);
  const line = await CartItem.findOne({
    where: { cartId: cart.id, productId: product.id, ml },
  });

  const limit = limitFor(product.stock);
  const nextQty = (line?.qty ?? 0) + qty;
  if (nextQty > limit) return fail(409, `You can add at most ${limit} of this perfume.`);

  if (line) {
    line.qty = nextQty;
    await line.save();
  } else {
    await CartItem.create({
      cartId: cart.id,
      productId: product.id,
      ml,
      qty: nextQty,
    });
  }

  return { ok: true };
}

export async function changeLine(
  userId: string,
  slug: string,
  ml: number,
  qty: number | undefined,
  newMl: number | undefined
): Promise<CartResult> {
  await connectDB();
  const product = await Product.findOne({ where: { slug, isActive: true } });
  if (!product) return fail(404, "Product not found.");

  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) return fail(404, "This item is not in your cart.");

  const line = await CartItem.findOne({
    where: { cartId: cart.id, productId: product.id, ml },
  });
  if (!line) return fail(404, "This item is not in your cart.");

  const limit = limitFor(product.stock);
  const wantedQty = qty ?? line.qty;
  if (wantedQty > limit) return fail(409, `You can add at most ${limit} of this perfume.`);

  if (newMl !== undefined && newMl !== ml) {
    const twin = await CartItem.findOne({
      where: { cartId: cart.id, productId: product.id, ml: newMl },
    });
    if (twin) {
      const merged = twin.qty + wantedQty;
      if (merged > limit) return fail(409, `You can add at most ${limit} of this perfume.`);
      twin.qty = merged;
      await twin.save();
      await line.destroy();
    } else {
      line.ml = newMl;
      line.qty = wantedQty;
      await line.save();
    }
  } else {
    line.qty = wantedQty;
    await line.save();
  }

  return { ok: true };
}

export async function removeLine(userId: string, slug: string, ml: number): Promise<CartResult> {
  await connectDB();
  const product = await Product.findOne({ where: { slug } });
  if (!product) return { ok: true };

  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) return { ok: true };

  await CartItem.destroy({
    where: { cartId: cart.id, productId: product.id, ml },
  });

  return { ok: true };
}