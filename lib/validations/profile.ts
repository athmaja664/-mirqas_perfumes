import { z } from "zod";

// Same rules as registration (lib/validations/auth.ts), kept here so this file stands alone.
const email = z.string().trim().toLowerCase().email("Please enter a valid email address.");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100)
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/[0-9]/, "Password must include a number.");

// Phone may be empty (the first admin was created without one), but if given it must look valid.
const phone = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\+?[0-9\s-]{7,15}$/.test(v), "Please enter a valid mobile number.");

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email,
  phone,
  // Only needed when the email is being changed.
  currentPassword: z.string().max(100).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Please enter your current password.").max(100),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "The new password must be different from the current one.",
    path: ["newPassword"],
  });