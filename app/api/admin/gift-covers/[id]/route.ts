import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest, readJson } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { toProduct, uniqueSlug } from "@/lib/services/products";
import { updateGiftCoverSchema } from "@/lib/validations/gift-cover";
import { deleteProduct } from "@/lib/services/purge";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) return NextResponse.json({ message: "Gift cover not found." }, { status: 404 });

  await connectDB();
  const product = await Product.findByPk(id);
  if (!product) return NextResponse.json({ message: "Gift cover not found." }, { status: 404 });

  const prod = toProduct(product);
  return NextResponse.json({
    giftCover: {
      id: prod.id,
      slug: prod.slug,
      name: prod.name,
      description: prod.description,
      price: Math.round(prod.price / 100),
      pricePaise: prod.price,
      salePrice: prod.salePrice ? Math.round(prod.salePrice / 100) : null,
      salePricePaise: prod.salePrice,
      images: prod.images,
      image: prod.images[0] || "",
      stock: prod.stock,
      inStock: prod.inStock,
      isActive: prod.isActive,
      category: prod.category || "Gift Cover",
    },
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const blocked = guardRequest(req, "admin-gift-covers", 200);
  if (blocked) return blocked;

  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) return NextResponse.json({ message: "Gift cover not found." }, { status: 404 });

  const body = await readJson(req);
  const parsed = updateGiftCoverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message || "Invalid updates." },
      { status: 400 }
    );
  }

  await connectDB();
  const product = await Product.findByPk(id);
  if (!product) return NextResponse.json({ message: "Gift cover not found." }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (parsed.data.name && parsed.data.name !== product.name) {
    updates.name = parsed.data.name;
    updates.slug = await uniqueSlug(parsed.data.name, id);
  }
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.price !== undefined) updates.price = parsed.data.price;
  if (parsed.data.salePrice !== undefined) updates.salePrice = parsed.data.salePrice;
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.images !== undefined) updates.images = parsed.data.images;
  if (parsed.data.stock !== undefined) updates.stock = parsed.data.stock;
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

  // Make sure sections contains gift-covers
  const curSections = Array.isArray(product.sections) ? product.sections : [];
  if (!curSections.includes("gift-covers")) {
    updates.sections = [...curSections, "gift-covers"];
  }

  await product.update(updates);
  const prod = toProduct(product);

  return NextResponse.json({
    message: "Gift cover updated successfully.",
    giftCover: {
      id: prod.id,
      slug: prod.slug,
      name: prod.name,
      description: prod.description,
      price: Math.round(prod.price / 100),
      pricePaise: prod.price,
      salePrice: prod.salePrice ? Math.round(prod.salePrice / 100) : null,
      images: prod.images,
      stock: prod.stock,
      isActive: prod.isActive,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const blocked = guardRequest(req, "admin-gift-covers", 200);
  if (blocked) return blocked;

  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!id) return NextResponse.json({ message: "Gift cover not found." }, { status: 404 });

  const permanent = req.nextUrl.searchParams.get("permanent") === "true";
  if (permanent) {
    const result = await deleteProduct(id);
    if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
    return NextResponse.json({ message: "Gift cover deleted permanently." });
  }

  await connectDB();
  const product = await Product.findByPk(id);
  if (!product) return NextResponse.json({ message: "Gift cover not found." }, { status: 404 });

  await product.update({ isActive: false });
  return NextResponse.json({ message: "Gift cover disabled." });
}
