import { connectDB, getSequelize, Op } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { Product } from "@/models/Product";
import { Order, OrderItem } from "@/models/Order";
import { Review } from "@/models/Review";
import { Cart, CartItem } from "@/models/Cart";
import { Wishlist, WishlistItem } from "@/models/Wishlist";
import { Address } from "@/models/Address";

const OPEN_STATUSES = ["pending", "confirmed", "shipped"] as const;

export type PurgeResult =
  | { ok: true }
  | { ok: false; status: 404 | 409; code: "not-found" | "open-orders"; message: string };

export async function deleteCustomer(id: string): Promise<PurgeResult> {
  if (!id || typeof id !== "string")
    return { ok: false, status: 404, code: "not-found", message: "Customer not found." };

  await connectDB();
  const user = await User.findOne({ where: { id, role: "customer" } });
  if (!user) return { ok: false, status: 404, code: "not-found", message: "Customer not found." };

  const open = await Order.count({
    where: {
      userId: user.id,
      status: { [Op.in]: [...OPEN_STATUSES] },
    },
  });
  if (open > 0)
    return {
      ok: false,
      status: 409,
      code: "open-orders",
      message: "This customer has " + open + " open order(s). Cancel or finish them first.",
    };

  const sequelize = getSequelize();
  await sequelize.transaction(async (t) => {
    await Order.destroy({ where: { userId: user.id }, transaction: t });
    await Review.destroy({ where: { userId: user.id }, transaction: t });
    await Cart.destroy({ where: { userId: user.id }, transaction: t });
    await Wishlist.destroy({ where: { userId: user.id }, transaction: t });
    await Address.destroy({ where: { userId: user.id }, transaction: t });
    await Session.destroy({ where: { userId: user.id }, transaction: t });
    await User.destroy({ where: { id: user.id, role: "customer" }, transaction: t });
  });

  return { ok: true };
}

export async function deleteProduct(id: string): Promise<PurgeResult> {
  if (!id || typeof id !== "string")
    return { ok: false, status: 404, code: "not-found", message: "Product not found." };

  await connectDB();
  const product = await Product.findByPk(id);
  if (!product) return { ok: false, status: 404, code: "not-found", message: "Product not found." };

  const openOrdersWithProduct = await OrderItem.count({
    where: { productId: product.id },
    include: [
      {
        model: Order,
        where: { status: { [Op.in]: [...OPEN_STATUSES] } },
        required: true,
      },
    ],
  });

  if (openOrdersWithProduct > 0)
    return {
      ok: false,
      status: 409,
      code: "open-orders",
      message: "This product is in " + openOrdersWithProduct + " open order(s). Cancel or finish them first.",
    };

  const sequelize = getSequelize();
  await sequelize.transaction(async (t) => {
    await Review.destroy({ where: { productId: product.id }, transaction: t });
    await CartItem.destroy({ where: { productId: product.id }, transaction: t });
    await WishlistItem.destroy({ where: { productId: product.id }, transaction: t });
    await Product.destroy({ where: { id: product.id }, transaction: t });
  });

  return { ok: true };
}