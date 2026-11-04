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
    registrationMethod: z.enum(["email", "phone"]).optional(),
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password,
    confirmPassword: z.string(),
    otp: z.string().trim().optional(),
  })
  .refine(
    (d) => {
      const val = d.identifier || (d.registrationMethod === "phone" ? d.phone : d.email);
      if (!val) return false;
      const isEmail = /^\S+@\S+\.\S+$/.test(val);
      const isPhone = /^\+?[0-9\s-]{7,15}$/.test(val);
      return isEmail || isPhone;
    },
    {
      message: "Please provide a valid email address or phone number for registration.",
      path: ["identifier"],
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
    remember: z.boolean().optional().default(false),
  })
  .refine((d) => Boolean(d.identifier || d.email), {
    message: "Please enter your email address or phone number.",
    path: ["identifier"],
  });
