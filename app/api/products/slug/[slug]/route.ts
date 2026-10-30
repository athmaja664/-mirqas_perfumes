import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { toProduct } from "@/lib/services/products";

export const dynamic = "force-dynamic";

// GET /api/products/slug/silky-oudh
// Public: returns ONE active product with all its images, found by its slug.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let clean = slug;
  try {
    clean = decodeURIComponent(slug);
  } catch {
    // keep the slug as it is
  }
  clean = clean.toLowerCase();

  // Only letters, numbers and dashes are allowed in a slug
  if (!/^[a-z0-9-]{1,100}$/.test(clean)) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 });
  }

  await connectDB();
  const doc = await Product.findOne({ slug: clean, isActive: true }).lean();
  if (!doc) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({
    product: toProduct(doc as unknown as Parameters<typeof toProduct>[0]),
  });
}