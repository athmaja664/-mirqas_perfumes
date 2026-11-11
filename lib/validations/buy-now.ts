import { z } from "zod";
import { isValidSize } from "@/lib/pricing";
import { MAX_QTY_PER_LINE } from "@/models/Cart";
import { shippingSchema } from "@/lib/validations/order";

export const buyNowItemSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{1,100}$/, "Invalid product."),
  ml: z.number().int("Invalid size.").refine(isValidSize, "Invalid size."),
  qty: z
    .number()
    .int("Invalid quantity.")
    .min(1, "Quantity must be at least 1.")
    .max(MAX_QTY_PER_LINE, `You can order at most ${MAX_QTY_PER_LINE} of one item.`),
});

export const buyNowCreateOrderSchema = z.object({
  item: buyNowItemSchema,
  email: z.string().trim().email("Please enter a valid email address.").max(120),
  shipping: shippingSchema,
  note: z.string().trim().max(1000).default(""),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, "Invalid checkout session key."),
});

export const buyNowVerifySchema = z.object({
  orderNumber: z.string().trim().regex(/^MQ-\d{6}-[A-Z0-9]{6}$/, "Invalid order number."),
  razorpay_order_id: z.string().trim().min(1, "Missing payment order ID.").max(100),
  razorpay_payment_id: z.string().trim().max(100).optional().default(""),
  razorpay_signature: z.string().trim().max(256).optional().default(""),
  statusAction: z.enum(["success", "failed", "pending", "cancelled"]).optional().default("success"),
  demoToken: z.string().trim().max(256).optional().default(""),
  failureReason: z.string().trim().max(300).optional().default(""),
});

export type BuyNowItemInput = z.infer<typeof buyNowItemSchema>;
export type BuyNowCreateOrderInput = z.infer<typeof buyNowCreateOrderSchema>;
export type BuyNowVerifyInput = z.infer<typeof buyNowVerifySchema>;

