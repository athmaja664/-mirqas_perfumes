import { z } from "zod";

// Only files uploaded through /api/reviews/uploads can be used (random 32-letter names).
// This stops anyone from putting an outside link into a review.
const imageUrl = z
  .string()
  .regex(/^\/api\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/, "One of the images is not valid.");
const videoUrl = z
  .string()
  .regex(/^\/api\/uploads\/[a-f0-9]{32}\.(mp4|webm)$/, "The video is not valid.");

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