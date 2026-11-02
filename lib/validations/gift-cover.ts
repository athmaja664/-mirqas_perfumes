import { z } from "zod";

const mediaUrl = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^(\/|https:\/\/)/, "Use a /images/... or /api/uploads/... path or an https:// link.");

export const giftCoverSchema = z.object({
  name: z.string().trim().min(2, "Gift cover name must be at least 2 characters.").max(120),
  description: z.string().trim().max(3000).default("").optional(),
  price: z.number().int("Price must be a whole number of paise.").min(1, "Price must be at least 1 paise.").max(100_000_000),
  salePrice: z.number().int().min(1).nullable().optional(),
  category: z.string().trim().max(80).default("Gift Cover"),
  images: z.array(mediaUrl).min(1, "Please upload at least one image of the gift cover.").max(10),
  stock: z.number().int().min(0).default(100),
  isActive: z.boolean().default(true),
  additionalDescription: z.string().trim().max(3000).optional(),
});

export const updateGiftCoverSchema = giftCoverSchema.partial();

export type GiftCoverInput = z.infer<typeof giftCoverSchema>;
