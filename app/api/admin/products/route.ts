import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest, readJson } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { createProductSchema } from "@/lib/validations/product";
import { listProducts, toProduct, uniqueSlug } from "@/lib/services/products";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json(await listProducts(req.nextUrl.searchParams, false));
}

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "admin-products", 200);
  if (blocked) return blocked;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const parsed = createProductSchema.safeParse(await readJson(req));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });

  await connectDB();
  try {
    const created = await Product.create({ ...parsed.data, slug: await uniqueSlug(parsed.data.name) });
    return NextResponse.json({ product: toProduct(created.toObject()) }, { status: 201 });
  } catch (e) {
    if ((e as { code?: number }).code === 11000)
      return NextResponse.json({ message: "A product with this name already exists." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ message: "Could not save the product." }, { status: 500 });
  }
}