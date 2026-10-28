import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { User } from "../models/User";

async function main() {
  const name = process.env.ADMIN_NAME ?? "Admin";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");

  await connectDB();
  if (await User.exists({ email })) {
    console.log("An account with this email already exists. Nothing changed.");
  } else {
    await User.create({ name, email, phone: "", passwordHash: await bcrypt.hash(password, 12), role: "admin" });
    console.log("Admin created:", email);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});