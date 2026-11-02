import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/services/products";

export async function GET(req: NextRequest) {
  try {
    const data = await listProducts(req.nextUrl.searchParams, true);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/products error:", err);
    const message = err instanceof Error ? err.message : "Failed to load products.";
    return NextResponse.json({ products: [], total: 0, message }, { status: 500 });
  }
}
