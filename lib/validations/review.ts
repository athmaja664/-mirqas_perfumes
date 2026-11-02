import { z } from "zod";

// Accept either Vercel Blob store URLs or internal /api/uploads/ paths
const BLOB_PATTERN = "https:\\/\\/[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com\\/reviews\\/[a-f0-9]{32}\\.(jpg|png|webp)";
const LOCAL_PATTERN = "\\/api\\/uploads\\/[a-f0-9]{32}\\.(jpg|png|webp)";

const imageUrl = z
  .string()
  .regex(new RegExp(`^(${BLOB_PATTERN}|${LOCAL_PATTERN})$`), "One of the images is not valid.");

export const reviewSchema = z.object({
  rating: z
    .number()
    .int("Please choose a star rating.")
    .min(1, "Please choose a star rating.")
    .max(5, "Please choose a star rating."),
  title: z.string().trim().max(100, "The title can have at most 100 characters.").default(""),
  comment: z
    .string()
    .trim()
    .min(5, "Please write at least 5 characters in your review.")
    .max(2000, "The review can have at most 2000 characters."),
  images: z.array(imageUrl).max(4, "You can add up to 4 photos.").default([]),
  video: z.string().default(""),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
