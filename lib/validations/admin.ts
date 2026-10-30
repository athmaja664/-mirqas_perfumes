import { z } from "zod";
import { email, password } from "./auth";

// Rules for a new admin. Same email and password rules as customers, but the password is longer.
export const adminCreateSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter the full name.").max(80),
    email,
    password: password.min(10, "Password must be at least 10 characters."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });