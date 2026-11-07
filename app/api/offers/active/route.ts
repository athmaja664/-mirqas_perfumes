import { NextRequest, NextResponse } from "next/server";
import { getActivePublishedOffers } from "@/lib/services/offers";

export async function GET(req: NextRequest) {
  try {
    const placement = req.nextUrl.searchParams.get("placement") as
      | "homepage"
      | "listing"
      | "productDetails"
      | null;

    const offers = await getActivePublishedOffers(placement || undefined);
    return NextResponse.json({ offers });
  } catch (err: unknown) {
    console.error("GET /api/offers/active error:", err);
    return NextResponse.json({ offers: [] }, { status: 500 });
  }
}

