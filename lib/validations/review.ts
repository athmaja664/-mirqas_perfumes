import { z } from "zod";

// Only files uploaded through /api/reviews/uploads can be used.
// They live in our Vercel Blob store, in the "reviews" folder, with random 32-letter names.
// This stops anyone from putting an outside link into a review.
const BLOB_HOST = "https:\\/\\/[a-z0-9-]+\\.public\\.blob\\.vercel-storage\\.com\\/reviews\\/";

const imageUrl = z
  .string()
  .regex(new RegExp("^" + BLOB_HOST + "[a-f0-9]{32}\\.(jpg|png|webp)$"), "One of the images is not valid.");
const videoUrl = z
  .string()
  .regex(new RegExp("^" + BLOB_HOST + "[a-f0-9]{32}\\.(mp4|webm)$"), "The video is not valid.");

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
  video: z.union([videoUrl, z.literal("")]).default(""),
});

export type ReviewInput = z.infer<typeof reviewSchema>;