import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { requireAdmin, requireOwner } from "@/lib/auth/require-admin";
import { guardRequest, readJson } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { updateProductSchema, SALE_MESSAGE } from "@/lib/validations/product";
import { findProduct, toProduct, uniqueSlug } from "@/lib/services/products";
import { deleteProduct } from "@/lib/services/purge";

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

// Without ?permanent=true this deactivates (any admin).
// With ?permanent=true it deletes the product for good (main admin only).
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const blocked = guardRequest(req, "admin-products", 200);
  if (blocked) return blocked;

  const { id } = await params;
  const permanent = req.nextUrl.searchParams.get("permanent") === "true";

  if (permanent) {
    const owner = await requireOwner();
    if ("error" in owner && owner.error) return owner.error;
    const result = await deleteProduct(id);
    if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
    return NextResponse.json({ message: "Product deleted." });
  }

  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  if (!isValidObjectId(id)) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  await connectDB();
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  return NextResponse.json({ message: "Product deactivated.", product: toProduct(product.toObject()) });
}