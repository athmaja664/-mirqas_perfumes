import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/services/products";

export async function GET(req: NextRequest) {
  const data = await listProducts(req.nextUrl.searchParams, true);
  return NextResponse.json(data);
}