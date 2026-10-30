import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { Cart } from "@/models/Cart";
import { Wishlist } from "@/models/Wishlist";
import { Address } from "@/models/Address";

// Orders in these states still hold stock or are on the way, so nothing linked to them can be deleted.
const OPEN_STATUSES = ["pending", "confirmed", "shipped"] as const;

export type PurgeResult =
  | { ok: true }
  | { ok: false; status: 404 | 409; code: "not-found" | "open-orders"; message: string };

// Permanent delete of a CUSTOMER account and everything that belongs to it.
// Admin accounts are never deleted here (role must be customer).
export async function deleteCustomer(id: string): Promise<PurgeResult> {
  if (!mongoose.isValidObjectId(id))
    return { ok: false, status: 404, code: "not-found", message: "Customer not found." };

  await connectDB();
  const user = await User.findOne({ _id: id, role: "customer" }).select("_id").lean();
  if (!user) return { ok: false, status: 404, code: "not-found", message: "Customer not found." };

  const open = await Order.countDocuments({ userId: user._id, status: { $in: [...OPEN_STATUSES] } });
  if (open > 0)
    return {
      ok: false,
      status: 409,
      code: "open-orders",
      message: "This customer has " + open + " open order(s). Cancel or finish them first.",
    };

  // The account is deleted last, so a failure in the middle can simply be tried again.
  await Promise.all([
    Order.deleteMany({ userId: user._id }),
    Review.deleteMany({ user: user._id }),
    Cart.deleteMany({ userId: user._id }),
    Wishlist.deleteMany({ userId: user._id }),
    Address.deleteMany({ userId: user._id }),
    Session.deleteMany({ userId: user._id }),
  ]);
  await User.deleteOne({ _id: user._id, role: "customer" });
  return { ok: true };
}

// Permanent delete of a PRODUCT. Old orders keep their own copy of the name, price and image.
// Image files are not deleted, because old orders still show them.
export async function deleteProduct(id: string): Promise<PurgeResult> {
  if (!mongoose.isValidObjectId(id))
    return { ok: false, status: 404, code: "not-found", message: "Product not found." };

  await connectDB();
  const product = await Product.findById(id).select("_id").lean();
  if (!product) return { ok: false, status: 404, code: "not-found", message: "Product not found." };

  const open = await Order.countDocuments({
    status: { $in: [...OPEN_STATUSES] },
    "items.productId": product._id,
  });
  if (open > 0)
    return {
      ok: false,
      status: 409,
      code: "open-orders",
      message: "This product is in " + open + " open order(s). Cancel or finish them first.",
    };

  await Promise.all([
    Review.deleteMany({ product: product._id }),
    Cart.updateMany({ "items.productId": product._id }, { $pull: { items: { productId: product._id } } }),
    Wishlist.updateMany({ productIds: product._id }, { $pull: { productIds: product._id } }),
  ]);
  await Product.deleteOne({ _id: product._id });
  return { ok: true };
}