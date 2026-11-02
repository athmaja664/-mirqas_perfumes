import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest, readJson } from "@/lib/security";
import { connectDB, Op, literal } from "@/lib/db";
import { Product } from "@/models/Product";
import { toProduct, uniqueSlug } from "@/lib/services/products";
import { giftCoverSchema } from "@/lib/validations/gift-cover";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await connectDB();
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const search = (sp.get("search") || "").trim();

  const where: Record<string | symbol, unknown> = {
    [Op.or]: [
      { category: { [Op.in]: ["Gift Cover", "Gift Covers", "Gift Box", "Gift Boxes"] } },
      literal(`JSON_CONTAINS(sections, '"gift-covers"')`),
    ],
  };

  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  if (search) {
    where[Op.and as unknown as symbol] = [
      {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
      },
    ];
  }

  const products = await Product.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  const items = products.map((p) => {
    const prod = toProduct(p);
    return {
      id: prod.id,
      slug: prod.slug,
      name: prod.name,
      description: prod.description,
      price: Math.round((prod.salePrice ?? prod.price) / 100),
      pricePaise: prod.price,
      salePrice: prod.salePrice ? Math.round(prod.salePrice / 100) : null,
      salePricePaise: prod.salePrice,
      images: prod.images,
      image: prod.images[0] || "",
      stock: prod.stock,
      inStock: prod.inStock,
      isActive: prod.isActive,
      category: prod.category || "Gift Cover",
      createdAt: prod.createdAt,
    };
  });

  return NextResponse.json({ giftCovers: items, total: items.length });
}

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "admin-gift-covers", 200);
  if (blocked) return blocked;

  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await readJson(req);
  const parsed = giftCoverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Invalid gift cover details." },
      { status: 400 }
    );
  }

  await connectDB();
  try {
    const slug = await uniqueSlug(parsed.data.name);
    const category = parsed.data.category || "Gift Cover";

    const created = await Product.create({
      name: parsed.data.name,
      slug,
      brand: "Mirqas",
      description: parsed.data.description,
      price: parsed.data.price,
      salePrice: parsed.data.salePrice ?? null,
      category,
      images: parsed.data.images,
      stock: parsed.data.stock ?? 100,
      isActive: parsed.data.isActive ?? true,
      isBestSeller: false,
      gender: "Unisex",
      occasion: ["Gifting"],
      family: "Gift Cover",
      notes: [],
      badge: "",
      isFeatured: false,
      sales: 0,
      sections: ["gift-covers", "gift-sets"],
      collections: [],
      showInNewArrivals: false,
    });

    const prod = toProduct(created);
    return NextResponse.json(
      {
        message: "Gift cover added successfully.",
        giftCover: {
          id: prod.id,
          slug: prod.slug,
          name: prod.name,
          description: prod.description,
          price: Math.round(prod.price / 100),
          pricePaise: prod.price,
          images: prod.images,
          stock: prod.stock,
          isActive: prod.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/admin/gift-covers error:", error);
    const err = error as { name?: string; original?: { errno?: number } };
    if (err.name === "SequelizeUniqueConstraintError" || err.original?.errno === 1062) {
      return NextResponse.json(
        { message: "A gift cover with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: "Could not save the gift cover." }, { status: 500 });
  }
}
