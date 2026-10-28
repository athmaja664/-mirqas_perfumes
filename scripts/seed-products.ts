import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { Product } from "../models/Product";
import { products } from "../data/products";

const PLACEHOLDER_STOCK = 25;

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function main() {
  await connectDB();
  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const slug = slugify(`${p.name} ${p.category}`);
    if (await Product.exists({ slug })) {
      skipped++;
      continue;
    }

    // Your old originalPrice is the full price; your old price is the discounted one.
    const hasDiscount = p.originalPrice != null && p.originalPrice > p.price;
    const price = Math.round((hasDiscount ? p.originalPrice! : p.price) * 100);
    const salePrice = hasDiscount ? Math.round(p.price * 100) : null;

    await Product.create({
      name: p.name,
      slug,
      brand: p.brand ?? "Mirqas",
      description: "",
      price,
      salePrice,
      category: p.category,
      images: p.image && !p.image.startsWith("data:") ? [p.image] : [],
      video: p.video ?? "",
      stock: PLACEHOLDER_STOCK,
      isActive: true,
      isBestSeller: p.isBestSeller === true,
    });
    created++;
  }

  console.log(`Products created: ${created}, already existed: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});