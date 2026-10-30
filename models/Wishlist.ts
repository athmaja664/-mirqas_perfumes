import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IWishlist {
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    productIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
  },
  { timestamps: true }
);

export const Wishlist: Model<IWishlist> =
  (models.Wishlist as Model<IWishlist>) || model<IWishlist>("Wishlist", WishlistSchema);