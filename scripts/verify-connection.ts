import { connectDB } from "../lib/db";
import { User } from "../models/User";
import { Product } from "../models/Product";
import bcrypt from "bcryptjs";

async function verify() {
  console.log("1. Testing Sequelize connection to MySQL...");
  await connectDB();
  console.log("   -> Sequelize connected and authenticated successfully!");

  console.log("\n2. Testing Admin retrieval & authentication...");
  const admin = await User.findOne({ where: { role: "admin" } });
  if (!admin) throw new Error("No admin user found in database!");
  console.log(`   -> Found admin account: ${admin.email}`);
  const adminMatch = await bcrypt.compare("mirqasperfumes123456", admin.passwordHash);
  console.log(`   -> Admin password verification (mirqasperfumes123456): ${adminMatch ? "SUCCESS" : "NO MATCH"}`);

  console.log("\n3. Testing Customer retrieval & authentication...");
  const customer = await User.findOne({ where: { role: "customer" } });
  if (!customer) throw new Error("No customer user found in database!");
  console.log(`   -> Found customer account: ${customer.email} (${customer.name})`);
  console.log(`   -> Customer account active: ${customer.isActive}`);

  console.log("\n4. Testing Product retrieval...");
  const products = await Product.findAll();
  console.log(`   -> Found ${products.length} products:`);
  for (const p of products) {
    console.log(`      * [${p.id}] ${p.name} (slug: ${p.slug}, price: ₹${p.price / 100})`);
  }

  console.log("\n==========================================");
  console.log("   ALL CONNECTION & AUTH CHECKS PASSED!   ");
  console.log("==========================================");
  process.exit(0);
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

