import { connectDB, Op, fn, col, literal } from "@/lib/db";
import { Product, type IProduct } from "@/models/Product";
import { SECTION_VALUES, COLLECTION_VALUES } from "@/lib/sections";

// A product stays in New Arrivals for this many days
const NEW_ARRIVAL_DAYS = 30;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "product";

export async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name);
  let slug = base;
  for (
    let i = 2;
    (await Product.count({ where: { slug, ...(ignoreId ? { id: { [Op.ne]: ignoreId } } : {}) } })) > 0;
    i++
  ) {
    slug = `${base}-${i}`;
  }
  return slug;
}

function ensureArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return val ? [val] : [];
    }
  }
  return [];
}

export function normalizeMediaUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/api/uploads/") || trimmed.startsWith("/images/") || trimmed.startsWith("/uploads/")) {
    return trimmed;
  }
  if (/^[a-f0-9]{32}\.(jpg|png|webp|mp4|webm)$/i.test(trimmed)) {
    return `/api/uploads/${trimmed}`;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

// The shape the browser receives. Prices are in paise.
export function toProduct(p: Record<string, unknown> | IProduct | Product) {
  const data = (typeof (p as Product).toJSON === "function" ? (p as Product).toJSON() : p) as Record<string, unknown>;
  const id = String(data.id ?? data._id);
  const images = ensureArray(data.images).map(normalizeMediaUrl);
  const video = normalizeMediaUrl(String(data.video || ""));
  const occasion = ensureArray(data.occasion);
  const notes = ensureArray(data.notes);
  const sections = ensureArray(data.sections);
  const collections = ensureArray(data.collections);
  const stock = Number(data.stock) || 0;

  return {
    id,
    name: String(data.name || ""),
    slug: String(data.slug || ""),
    brand: String(data.brand || "Mirqas"),
    description: String(data.description || ""),
    price: Number(data.price) || 0,
    salePrice: data.salePrice != null ? Number(data.salePrice) : null,
    category: String(data.category || ""),
    images,
    video,
    stock,
    inStock: stock > 0,
    isActive: Boolean(data.isActive),
    isBestSeller: Boolean(data.isBestSeller),
    gender: (data.gender as string) ?? "Unisex",
    occasion,
    family: String(data.family || ""),
    notes,
    badge: String(data.badge || ""),
    isFeatured: Boolean(data.isFeatured),
    sales: Number(data.sales) || 0,
    sections: sections.length ? sections : ["shop-all"],
    collections,
    showInNewArrivals: data.showInNewArrivals !== false,
    createdAt: data.createdAt ? new Date(data.createdAt as string | number | Date) : undefined,
  };
}

const num = (v: string | null, fallback: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
};

const SORTS: Record<string, [string, "ASC" | "DESC"][]> = {
  newest: [["createdAt", "DESC"]],
  "price-asc": [["price", "ASC"]],
  "price-desc": [["price", "DESC"]],
  name: [["name", "ASC"]],
};

// activeOnly = true for the public store, false for the admin list.
export async function listProducts(sp: URLSearchParams, activeOnly: boolean) {
  await connectDB();
  const page = num(sp.get("page"), 1, 1, 10000);
  const limit = num(sp.get("limit"), 12, 1, 48);

  const where: Record<string | symbol, unknown> = {};
  if (activeOnly) {
    where.isActive = true;
    const existingAnd = (where[Op.and as unknown as symbol] as unknown[]) || [];
    where[Op.and as unknown as symbol] = [
      ...existingAnd,
      {
        [Op.or]: [
          { category: null },
          {
            [Op.and]: [
              { category: { [Op.notIn]: ["Gift Cover", "Gift Covers", "Gift Box", "Gift Boxes"] } },
              { category: { [Op.notLike]: "%Gift Cover%" } },
              { category: { [Op.notLike]: "%Gift Box%" } },
            ],
          },
        ],
      },
      {
        [Op.or]: [
          { family: null },
          { family: { [Op.ne]: "Gift Cover" } },
        ],
      },
    ];
  }
  else if (sp.get("status") === "active") where.isActive = true;
  else if (sp.get("status") === "inactive") where.isActive = false;

  const category = sp.get("category");
  if (category) where.category = String(category);

  if (sp.get("bestseller") === "true") where.isBestSeller = true;

  const gender = sp.get("gender");
  if (gender) where.gender = String(gender);

  // Website section, e.g. ?section=men  (shop-all means no filter)
  const section = sp.get("section");
  if (section && section !== "shop-all" && section !== "new-arrivals" && SECTION_VALUES.includes(section)) {
    const existingAnd = (where[Op.and as unknown as symbol] as unknown[]) || [];
    where[Op.and as unknown as symbol] = [
      ...existingAnd,
      literal(`JSON_CONTAINS(sections, ${JSON.stringify(JSON.stringify(section))})`),
      ...(section === "gift-sets" ? [{ category: { [Op.notIn]: ["Gift Cover", "Gift Covers", "Gift Box", "Gift Boxes"] } }] : []),
    ];
  }

  // Collections menu family, e.g. ?collection=floral
  const collection = sp.get("collection");
  if (collection && COLLECTION_VALUES.includes(collection)) {
    const existingAnd = (where[Op.and as unknown as symbol] as unknown[]) || [];
    where[Op.and as unknown as symbol] = [
      ...existingAnd,
      literal(`JSON_CONTAINS(collections, ${JSON.stringify(JSON.stringify(collection))})`),
    ];
  }

  // New arrivals = made in the last 30 days AND not hidden by the admin.
  if (sp.get("newArrival") === "true" || section === "new-arrivals") {
    const since = new Date(Date.now() - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000);
    where.createdAt = { [Op.gte]: since };
    where.showInNewArrivals = true;
  }

  const search = (sp.get("search") ?? "").trim().slice(0, 80);
  if (search) {
    where[Op.or as unknown as symbol] = [
      { name: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } },
    ];
  }

  // Stock status filter (in_stock, out_of_stock, low_stock)
  const stockParam = sp.get("stock");
  if (stockParam === "out_of_stock") {
    where.stock = { [Op.lte]: 0 };
  } else if (stockParam === "in_stock") {
    where.stock = { [Op.gt]: 0 };
  } else if (stockParam === "low_stock") {
    where.stock = { [Op.lte]: 5 };
  }

  // minPrice / maxPrice are in rupees in the URL
  const min = Number(sp.get("minPrice"));
  const max = Number(sp.get("maxPrice"));
  const priceFilter: Record<symbol, number> = {};
  if (Number.isFinite(min) && sp.get("minPrice")) priceFilter[Op.gte] = Math.round(min * 100);
  if (Number.isFinite(max) && sp.get("maxPrice")) priceFilter[Op.lte] = Math.round(max * 100);
  if (Object.getOwnPropertySymbols(priceFilter).length) where.price = priceFilter;

  const order = SORTS[sp.get("sort") ?? "newest"] ?? SORTS.newest;

  const { rows: items, count: total } = await Product.findAndCountAll({
    where,
    order,
    offset: (page - 1) * limit,
    limit,
  });

  return {
    items: items.map((p) => toProduct(p)),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findProduct(id: string, activeOnly: boolean) {
  if (!id || typeof id !== "string") return null;
  await connectDB();
  const p = await Product.findOne({ where: { id, ...(activeOnly ? { isActive: true } : {}) } });
  return p ? toProduct(p) : null;
}