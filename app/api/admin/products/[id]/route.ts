import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest, readJson } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { updateProductSchema, SALE_MESSAGE } from "@/lib/validations/product";
import { findProduct, toProduct, uniqueSlug } from "@/lib/services/products";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const product = await findProduct((await params).id, false);
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const blocked = guardRequest(req, "admin-products", 200);
  if (blocked) return blocked;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  const parsed = updateProductSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });

  await connectDB();
  const product = await Product.findById(id);
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  const data = parsed.data;
  const price = data.price ?? product.price;
  const salePrice = data.salePrice !== undefined ? data.salePrice : product.salePrice;
  if (salePrice != null && salePrice >= price)
    return NextResponse.json({ message: SALE_MESSAGE }, { status: 400 });

  if (data.name && data.name !== product.name) product.slug = await uniqueSlug(data.name, id);
  product.set(data);
  await product.save();
  return NextResponse.json({ product: toProduct(product.toObject()) });
}

// Deactivates instead of deleting, so old orders can still show the product.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const blocked = guardRequest(req, "admin-products", 200);
  if (blocked) return blocked;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  await connectDB();
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  return NextResponse.json({ message: "Product deactivated.", product: toProduct(product.toObject()) });
}