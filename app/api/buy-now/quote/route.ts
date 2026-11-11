import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/security";
import { buyNowItemSchema } from "@/lib/validations/buy-now";
import { calculateBuyNowQuote } from "@/lib/services/buy-now";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = {
    slug: sp.get("slug") || "",
    ml: Number(sp.get("ml") || 0),
    qty: Number(sp.get("qty") || 1),
  };

  const parsed = buyNowItemSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid product selection." },
      { status: 400 }
    );
  }

  const res = await calculateBuyNowQuote(parsed.data);
  if (!res.ok) {
    return NextResponse.json({ error: res.message }, { status: res.status });
  }

  return NextResponse.json({ quote: res.quote });
}

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = buyNowItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid product selection." },
      { status: 400 }
    );
  }

  const res = await calculateBuyNowQuote(parsed.data);
  if (!res.ok) {
    return NextResponse.json({ error: res.message }, { status: res.status });
  }

  return NextResponse.json({ quote: res.quote });
}

