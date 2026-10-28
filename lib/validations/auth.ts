import { z } from "zod";
export const email = z.string().trim().toLowerCase().email("Please enter a valid email address.");
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100)
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name.").max(80),
    email,
    phone: z.string().trim().regex(/^\+?[0-9\s-]{7,15}$/, "Please enter a valid mobile number."),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Please enter your password.").max(100),
  remember: z.boolean().optional().default(false),
});