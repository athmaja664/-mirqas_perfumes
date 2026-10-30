import { z } from "zod";
import { isValidSize } from "@/lib/pricing";
import { MAX_QTY_PER_LINE } from "@/models/Cart";

const line = z.object({
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

// Used by the order form and by the saved address
export const shippingSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number."),
  line1: z.string().trim().min(5, "Please enter your address.").max(200),
  line2: z.string().trim().max(200).default(""),
  city: z.string().trim().min(2, "Please enter your city.").max(80),
  state: z.string().trim().min(2, "Please enter your state.").max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Please enter a valid 6-digit pincode."),
});

export const orderCreateSchema = z.object({
  items: z.array(line).min(1, "Your cart is empty.").max(20, "Too many items in one order."),
  shipping: shippingSchema,
  note: z.string().trim().max(500).default(""),
  paymentMethod: z.literal("cod"),
  // The checkout page makes one key per order. Double clicks cannot make two orders.
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, "Invalid request."),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;