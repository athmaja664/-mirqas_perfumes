import { connectDB } from "@/lib/db";
import { Cart, MAX_QTY_PER_LINE } from "@/models/Cart";
import { Product } from "@/models/Product";
import { SIZE_STEPS, sizePricePaise, unitPricePaise } from "@/lib/pricing";

export type CartResult = { ok: true } | { ok: false; status: number; message: string };

const fail = (status: number, message: string): CartResult => ({ ok: false, status, message });

// Same shape as the browser cart line (prices in RUPEES), so the cart page can use it directly.
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
  count: number; // bottles that can be bought now
  subtotal: number; // rupees
};

const limitFor = (stock: number) => Math.min(MAX_QTY_PER_LINE, stock);

async function loadCart(userId: string) {
  const cart = await Cart.findOne({ userId });
  return cart ?? new Cart({ userId, items: [] });
}

// ---------------------------------------------------------------------------
// Read the cart. Prices and stock always come from the database.
// Lines whose product was removed or deactivated are not shown.
// ---------------------------------------------------------------------------
export async function getCartView(userId: string): Promise<CartView> {
  await connectDB();
  const cart = await Cart.findOne({ userId }).lean();
  const lines = cart?.items ?? [];
  if (lines.length === 0) return { items: [], count: 0, subtotal: 0 };

  const products = await Product.find({
    _id: { $in: lines.map((l) => l.productId) },
    isActive: true,
  })
    .select("name slug price salePrice images notes stock")
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

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

    items.push({
      slug: p.slug,
      name: p.name,
      image: p.images[0],
      notes: p.notes.length ? p.notes : undefined,
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

// ---------------------------------------------------------------------------
// Add (or add more of) one perfume in one size
// ---------------------------------------------------------------------------
export async function addToCart(userId: string, slug: string, ml: number, qty: number): Promise<CartResult> {
  await connectDB();
  const product = await Product.findOne({ slug, isActive: true }).select("_id stock").lean();
  if (!product) return fail(404, "Product not found.");
  if (product.stock < 1) return fail(409, "This perfume is sold out.");

  const cart = await loadCart(userId);
  const line = cart.items.find((i) => String(i.productId) === String(product._id) && i.ml === ml);

  const limit = limitFor(product.stock);
  const nextQty = (line?.qty ?? 0) + qty;
  if (nextQty > limit) return fail(409, `You can add at most ${limit} of this perfume.`);

  if (line) line.qty = nextQty;
  else cart.items.push({ productId: product._id, ml, qty: nextQty });

  await cart.save();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Change the quantity and/or the size of one line
// ---------------------------------------------------------------------------
export async function changeLine(
  userId: string,
  slug: string,
  ml: number,
  qty: number | undefined,
  newMl: number | undefined
): Promise<CartResult> {
  await connectDB();
  const product = await Product.findOne({ slug, isActive: true }).select("_id stock").lean();
  if (!product) return fail(404, "Product not found.");

  const cart = await Cart.findOne({ userId });
  const line = cart?.items.find((i) => String(i.productId) === String(product._id) && i.ml === ml);
  if (!cart || !line) return fail(404, "This item is not in your cart.");

  const limit = limitFor(product.stock);
  const wantedQty = qty ?? line.qty;
  if (wantedQty > limit) return fail(409, `You can add at most ${limit} of this perfume.`);

  if (newMl !== undefined && newMl !== ml) {
    const twin = cart.items.find((i) => String(i.productId) === String(product._id) && i.ml === newMl);
    if (twin) {
      // same perfume + new size already in the cart: merge the two lines
      const merged = twin.qty + wantedQty;
      if (merged > limit) return fail(409, `You can add at most ${limit} of this perfume.`);
      twin.qty = merged;
    //   cart.items.pull({ productId: product._id, ml });
    cart.items = cart.items.filter(
  (i) => !(String(i.productId) === String(product._id) && i.ml === ml)
);
    } else {
      line.ml = newMl;
      line.qty = wantedQty;
    }
  } else {
    line.qty = wantedQty;
  }

  await cart.save();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Remove one line
// ---------------------------------------------------------------------------
export async function removeLine(userId: string, slug: string, ml: number): Promise<CartResult> {
  await connectDB();
  const product = await Product.findOne({ slug }).select("_id").lean();
  if (!product) return { ok: true };

  const cart = await Cart.findOne({ userId });
  if (!cart) return { ok: true };

//   cart.items.pull({ productId: product._id, ml });
//   await cart.save();
//   return { ok: true };
  cart.items = cart.items.filter(
    (i) => !(String(i.productId) === String(product._id) && i.ml === ml)
  );
  await cart.save();
  return { ok: true };
}