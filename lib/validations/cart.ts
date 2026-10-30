import { z } from "zod";
import { isValidSize } from "@/lib/pricing";
import { MAX_QTY_PER_LINE } from "@/models/Cart";

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,100}$/, "Invalid product.");

const ml = z.number().int("Invalid size.").refine(isValidSize, "Invalid size.");

const qty = z
  .number()
  .int("Invalid quantity.")
  .min(1, "Quantity must be at least 1.")
  .max(MAX_QTY_PER_LINE, `You can add at most ${MAX_QTY_PER_LINE} of one item.`);

// Add to cart
export const cartAddSchema = z.object({ slug, ml, qty });

// Change quantity and/or size of one line
export const cartChangeSchema = z
  .object({ slug, ml, qty: qty.optional(), newMl: ml.optional() })
  .refine((v) => v.qty !== undefined || v.newMl !== undefined, "Nothing to change.");

// Remove one line
export const cartRemoveSchema = z.object({ slug, ml });