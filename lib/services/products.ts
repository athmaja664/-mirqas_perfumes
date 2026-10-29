import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { SECTION_VALUES, COLLECTION_VALUES } from "@/lib/sections";

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "product";

export async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; await Product.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

type Lean = {
  _id: unknown; name: string; slug: string; brand: string; description: string;
  price: number; salePrice?: number | null; category: string; images: string[];
  video?: string; stock: number; isActive: boolean; isBestSeller: boolean;
  gender?: string; occasion?: string[]; family?: string; notes?: string[];
  badge?: string; isFeatured?: boolean; sales?: number;
  sections?: string[]; collections?: string[];
  createdAt?: Date; updatedAt?: Date;
};

// The shape the browser receives. Prices are in paise.
export function toProduct(p: Lean) {
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    description: p.description,
    price: p.price,
    salePrice: p.salePrice ?? null,
    category: p.category,
    images: p.images,
    video: p.video || "",
    stock: p.stock,
    inStock: p.stock > 0,
    isActive: p.isActive,
    isBestSeller: p.isBestSeller,
    gender: p.gender ?? "Unisex",
    occasion: p.occasion ?? [],
    family: p.family ?? "",
    notes: p.notes ?? [],
    badge: p.badge ?? "",
    isFeatured: p.isFeatured ?? false,
    sales: p.sales ?? 0,
    sections: p.sections ?? ["shop-all"],
    collections: p.collections ?? [],
    createdAt: p.createdAt,
  };
}

const num = (v: string | null, fallback: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
};

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  name: { name: 1 },
};

// activeOnly = true for the public store, false for the admin list.
export async function listProducts(sp: URLSearchParams, activeOnly: boolean) {
  await connectDB();
  const page = num(sp.get("page"), 1, 1, 10000);
  const limit = num(sp.get("limit"), 12, 1, 48);

  const filter: Record<string, unknown> = {};
  if (activeOnly) filter.isActive = true;
  else if (sp.get("status") === "active") filter.isActive = true;
  else if (sp.get("status") === "inactive") filter.isActive = false;

  const category = sp.get("category");
  if (category) filter.category = String(category);

  if (sp.get("bestseller") === "true") filter.isBestSeller = true;

  const gender = sp.get("gender");
  if (gender) filter.gender = String(gender);

  // NEW: website section, e.g. ?section=men  (shop-all means no filter)
  const section = sp.get("section");
  if (section && section !== "shop-all" && SECTION_VALUES.includes(section)) {
    filter.sections = section;
  }

  // NEW: Collections menu family, e.g. ?collection=floral
  const collection = sp.get("collection");
  if (collection && COLLECTION_VALUES.includes(collection)) {
    filter.collections = collection;
  }

  const search = (sp.get("search") ?? "").trim().slice(0, 80);
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: { $regex: safe, $options: "i" } }, { brand: { $regex: safe, $options: "i" } }];
  }

  // minPrice / maxPrice are in rupees in the URL
  const min = Number(sp.get("minPrice"));
  const max = Number(sp.get("maxPrice"));
  const price: Record<string, number> = {};
  if (Number.isFinite(min) && sp.get("minPrice")) price.$gte = Math.round(min * 100);
  if (Number.isFinite(max) && sp.get("maxPrice")) price.$lte = Math.round(max * 100);
  if (Object.keys(price).length) filter.price = price;

  const sort = SORTS[sp.get("sort") ?? "newest"] ?? SORTS.newest;

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: (items as unknown as Lean[]).map(toProduct),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findProduct(id: string, activeOnly: boolean) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const p = await Product.findOne({ _id: id, ...(activeOnly ? { isActive: true } : {}) }).lean();
  return p ? toProduct(p as unknown as Lean) : null;
}