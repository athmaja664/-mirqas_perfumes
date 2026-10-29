import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  phone: z.union([z.literal(""), z.string().trim().regex(/^\+?[0-9\s-]{7,15}$/, "Please enter a valid mobile number.")]),
  currentPassword: z.string().max(100).optional(),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(100),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(100)
      .regex(/[A-Za-z]/, "Password must include a letter.")
      .regex(/[0-9]/, "Password must include a number."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });