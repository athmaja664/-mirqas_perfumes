import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { Product } from "../models/Product";

// Prices below are in rupees (as on your shop page). They are saved as paise.
const CATEGORY: Record<string, string> = {
  Oud: "Oud & Woody", Woody: "Oud & Woody", Amber: "Amber & Spicy",
  Floral: "Floral", Gourmand: "Sweet & Gourmand", Musk: "Musk & Powdery",
};

type Seed = {
  slug: string; name: string; price: number; image: string; hover: string;
  badge?: string; featured?: boolean; sales: number; soldOut?: boolean;
  gender: "Men" | "Women" | "Unisex"; occasion: string[]; family: string;
};

const items: Seed[] = [
  { slug: "nadeem", name: "Nadeem", price: 6290, image: "/images/cedar-study.jpg", hover: "/images/forher1.png", badge: "#1 Best Seller", featured: true, sales: 980, gender: "Unisex", occasion: ["Evening", "Gifting"], family: "Oud" },
  { slug: "oudh-al-ayal", name: "Oudh Al Ayal", price: 2490, image: "/images/shop1.png", hover: "/images/shop2.png", badge: "Best Seller", sales: 860, gender: "Men", occasion: ["Everyday", "Office"], family: "Oud" },
  { slug: "a-poem", name: "A Poem", price: 5990, image: "/images/forhim.png", hover: "/images/shop4.png", featured: true, sales: 540, gender: "Women", occasion: ["Date Night", "Party"], family: "Floral" },
  { slug: "rouge-vanilla", name: "Rouge Vanilla", price: 5990, image: "/images/shop6.png", hover: "/images/shop5.png", badge: "Best Seller", sales: 720, gender: "Women", occasion: ["Date Night", "Evening"], family: "Gourmand" },
  { slug: "7-moons", name: "7 Moons", price: 5990, image: "/images/choose1.png", hover: "/images/citrus-dawn.jpg", sales: 610, gender: "Unisex", occasion: ["Evening", "Party"], family: "Amber" },
  { slug: "maliki", name: "Maliki", price: 5990, image: "/images/forher3.png", hover: "/images/forhim.png", featured: true, sales: 450, gender: "Men", occasion: ["Casual", "Gifting"], family: "Woody" },
  { slug: "amber-noir", name: "Amber Noir", price: 3799, image: "/images/shop7.png", hover: "/images/shop8.png", badge: "New", sales: 300, gender: "Men", occasion: ["Office", "Everyday"], family: "Amber" },
  { slug: "oud-royale", name: "Oud Royale", price: 4999, image: "/images/collection-one.jpg", hover: "/images/collection-two.jpg", soldOut: true, sales: 690, gender: "Unisex", occasion: ["Gifting", "Party"], family: "Oud" },
  { slug: "golden-musk", name: "Golden Musk", price: 3299, image: "/images/forher1.png", hover: "/images/shop9.png", sales: 270, gender: "Women", occasion: ["Casual", "Everyday"], family: "Musk" },
  { slug: "desert-rose", name: "Desert Rose", price: 4290, image: "/images/choose2.png", hover: "/images/shop2.png", sales: 380, gender: "Women", occasion: ["Date Night", "Gifting"], family: "Floral" },
];

async function main() {
  await connectDB();
  if (process.argv.includes("--reset")) {
    const r = await Product.deleteMany({});
    console.log(`Deleted ${r.deletedCount} existing products.`);
  }
  let created = 0, skipped = 0;
  for (const p of items) {
    if (await Product.exists({ slug: p.slug })) { skipped++; continue; }
    await Product.create({
      name: p.name, slug: p.slug, brand: "Mirqas", description: "",
      price: p.price * 100, salePrice: null,
      category: CATEGORY[p.family], family: p.family,
      images: [p.image, p.hover], stock: p.soldOut ? 0 : 25,
      isActive: true, isBestSeller: !!p.badge?.includes("Best Seller"),
      gender: p.gender, occasion: p.occasion, badge: p.badge ?? "",
      isFeatured: !!p.featured, sales: p.sales,
    });
    created++;
  }
  console.log(`Created: ${created}, already existed: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e.message); process.exit(1); });