import { connectDB, getSequelize, Op } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { Product } from "@/models/Product";
import { Order, OrderItem, OrderStatusHistory } from "@/models/Order";
import { Review } from "@/models/Review";
import { Cart, CartItem } from "@/models/Cart";
import { Wishlist, WishlistItem } from "@/models/Wishlist";
import { Address } from "@/models/Address";

const OPEN_STATUSES = ["pending", "confirmed", "shipped"] as const;

export type PurgeResult =
  | { ok: true }
  | { ok: false; status: 404 | 409 | 500; code: "not-found" | "open-orders" | "error"; message: string };

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

  const sequelize = getSequelize();

  try {
    await sequelize.transaction(async (t) => {
      // 1. Disable foreign key checks for this transaction so MySQL doesn't block
      // deleting products that have existing order item records
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;", { transaction: t });

      // 2. Remove from reviews, carts, and wishlists
      await Review.destroy({ where: { productId: product.id }, transaction: t });
      await CartItem.destroy({ where: { productId: product.id }, transaction: t });
      await WishlistItem.destroy({ where: { productId: product.id }, transaction: t });

      // 3. Delete the product itself
      await Product.destroy({ where: { id: product.id }, transaction: t });

      // 4. Re-enable foreign key checks
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;", { transaction: t });
    });

    return { ok: true };
  } catch (err) {
    console.error("deleteProduct error:", err);
    // Ensure foreign key checks are re-enabled even on failure
    try {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");
    } catch {
      // ignore
    }
    return {
      ok: false,
      status: 500,
      code: "error",
      message: err instanceof Error ? err.message : "Failed to delete product.",
    };
  }
}

export async function deleteOrder(id: string): Promise<PurgeResult> {
  if (!id || typeof id !== "string")
    return { ok: false, status: 404, code: "not-found", message: "Order not found." };

  await connectDB();
  const order = await Order.findByPk(id);
  if (!order) return { ok: false, status: 404, code: "not-found", message: "Order not found." };

  const sequelize = getSequelize();

  try {
    await sequelize.transaction(async (t) => {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;", { transaction: t });
      await OrderItem.destroy({ where: { orderId: order.id }, transaction: t });
      await OrderStatusHistory.destroy({ where: { orderId: order.id }, transaction: t });
      await Order.destroy({ where: { id: order.id }, transaction: t });
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;", { transaction: t });
    });

    return { ok: true };
  } catch (err) {
    console.error("deleteOrder error:", err);
    try {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");
    } catch {
      // ignore
    }
    return {
      ok: false,
      status: 500,
      code: "error",
      message: err instanceof Error ? err.message : "Failed to delete order.",
    };
  }
}
