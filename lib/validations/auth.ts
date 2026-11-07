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
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password,
    confirmPassword: z.string(),
  })
  .refine(
    (d) => {
      const hasEmail = Boolean(d.email && d.email.trim());
      const hasPhone = Boolean(d.phone && d.phone.trim());
      return hasEmail || hasPhone;
    },
    {
      message: "Please enter either an email address or a phone number.",
      path: ["email"],
    }
  )
  .refine(
    (d) => {
      if (!d.email || !d.email.trim()) return true;
      return /^\S+@\S+\.\S+$/.test(d.email.trim());
    },
    {
      message: "Please enter a valid email address.",
      path: ["email"],
    }
  )
  .refine(
    (d) => {
      if (!d.phone || !d.phone.trim()) return true;
      return /^\+?[0-9\s-]{7,15}$/.test(d.phone.trim());
    },
    {
      message: "Please enter a valid phone number.",
      path: ["phone"],
    }
  )
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z
  .object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    password: z.string().min(1, "Please enter your password.").max(100),
    remember: z.boolean().optional().default(true),
  })
  .refine((d) => Boolean(d.identifier || d.email), {
    message: "Please enter your email address or phone number.",
    path: ["identifier"],
  });
