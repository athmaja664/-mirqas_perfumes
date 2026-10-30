import { Schema, model, models, type Model, type Types } from "mongoose";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_METHODS = ["cod", "razorpay"] as const;
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// All money is in PAISE. These are copies taken at the time of the order,
// so a later price change never changes an old order.
export interface IOrderItem {
  productId: Types.ObjectId;
  slug: string;
  name: string;
  image: string;
  ml: number;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IOrderShipping {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder {
  orderNumber: string;
  userId: Types.ObjectId;
  items: IOrderItem[];
  shipping: IOrderShipping;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    razorpayOrderId: string;
    razorpayPaymentId: string;
  };
  note: string;
  idempotencyKey?: string;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    ml: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1, validate: Number.isInteger },
    unitPrice: { type: Number, required: true, min: 0, validate: Number.isInteger },
    lineTotal: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { _id: false }
);

const ShippingSchema = new Schema<IOrderShipping>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, default: "", trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    pincode: { type: String, required: true, trim: true, maxlength: 10 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    shipping: { type: ShippingSchema, required: true },
    subtotal: { type: Number, required: true, min: 0, validate: Number.isInteger },
    shippingFee: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    total: { type: Number, required: true, min: 0, validate: Number.isInteger },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    payment: {
      method: { type: String, enum: PAYMENT_METHODS, default: "cod" },
      status: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
    },
    note: { type: String, default: "", trim: true, maxlength: 500 },
    idempotencyKey: { type: String },
  },
  { timestamps: true }
);

// The same customer cannot create the same order twice (double click, refresh)
OrderSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

export const Order: Model<IOrder> =
  (models.Order as Model<IOrder>) || model<IOrder>("Order", OrderSchema);