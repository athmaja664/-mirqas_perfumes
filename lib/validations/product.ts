import { z } from "zod";

export const FRAGRANCE_FAMILIES = [
  "Oud & Woody",
  "Fresh & Aquatic",
  "Floral",
  "Citrus & Fruity",
  "Amber & Spicy",
  "Musk & Powdery",
  "Sweet & Gourmand",
] as const;

// Only site paths (/images/x.jpg) or https links. This blocks things like javascript: URLs.
const mediaUrl = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^(\/|https:\/\/)/, "Use a /images/... path or an https:// link.");

const shape = {
  name: z.string().trim().min(2, "Name is too short.").max(120),
  brand: z.string().trim().max(80).optional(),
  description: z.string().trim().max(3000).optional(),
  price: z.number().int("Price must be a whole number of paise.").min(1).max(100_000_000),
  salePrice: z.number().int().min(1).nullable().optional(),
  category: z.enum(FRAGRANCE_FAMILIES),
  images: z.array(mediaUrl).max(10).optional(),
  video: mediaUrl.or(z.literal("")).optional(),
  stock: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
};

export const SALE_MESSAGE = "Sale price must be lower than the price.";

export const createProductSchema = z
  .object(shape)
  .refine((d) => d.salePrice == null || d.salePrice < d.price, {
    message: SALE_MESSAGE,
    path: ["salePrice"],
  });

// For PATCH: every field is optional. The sale-price rule is checked in the route
// against the saved product, because only one of the two prices may be sent.
export const updateProductSchema = z.object(shape).partial();