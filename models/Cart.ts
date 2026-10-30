import { Schema, model, models, type Model, type Types } from "mongoose";
import { isValidSize } from "@/lib/pricing";

export const MAX_QTY_PER_LINE = 10;

export interface ICartItem {
  productId: Types.ObjectId;
  ml: number;
  qty: number;
}

export interface ICart {
  userId: Types.ObjectId;
  items: ICartItem[];
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    ml: { type: Number, required: true, validate: (v: number) => isValidSize(v) },
    qty: { type: Number, required: true, min: 1, max: MAX_QTY_PER_LINE, validate: Number.isInteger },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Cart: Model<ICart> = (models.Cart as Model<ICart>) || model<ICart>("Cart", CartSchema);