import bcrypt from "bcryptjs";
import { connectDB, getSequelize } from "../lib/db";
import { User } from "../models/User";

async function main() {
  const name = process.env.ADMIN_NAME ?? "Admin";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");

  await connectDB();
  const existing = await User.count({ where: { email } });
  if (existing > 0) {
    console.log("An account with this email already exists. Nothing changed.");
  } else {
    // The first admin made by this script is the owner (main admin).
    await User.create({
      name,
      email,
      phone: "",
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin",
      isOwner: true,
      canManageAdmins: true,
      isActive: true,
    });
    console.log("Owner admin created:", email);
  }
  await getSequelize().close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});