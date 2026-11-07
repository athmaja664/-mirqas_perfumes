import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest, readJson } from "@/lib/security";
import { listAdminOffers, createOffer } from "@/lib/services/offers";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const data = await listAdminOffers(req.nextUrl.searchParams);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/admin/offers error:", err);
    return NextResponse.json({ message: "Could not load offers." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "admin-offers", 100);
  if (blocked) return blocked;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const rawBody = await readJson(req);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }
    const body = rawBody as Record<string, any>;

    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ message: "Offer title is required." }, { status: 400 });
    }

    const offerType = body.offerType;
    if (!["quantity", "percentage", "fixed"].includes(offerType)) {
      return NextResponse.json({ message: "Invalid offer type." }, { status: 400 });
    }

    const requiredQuantity = Number(body.requiredQuantity) || 1;
    if (requiredQuantity < 1) {
      return NextResponse.json({ message: "Required quantity must be at least 1." }, { status: 400 });
    }

    // Convert prices from Rupees to Paise if sent in rupees
    const offerPrice = body.offerPrice != null ? Math.round(Number(body.offerPrice) * 100) : null;
    const discountValue =
      offerType === "fixed" && body.discountValue != null
        ? Math.round(Number(body.discountValue) * 100)
        : body.discountValue != null
        ? Number(body.discountValue)
        : null;

    const offer = await createOffer({
      title,
      description: body.description,
      offerType,
      offerPrice,
      discountValue,
      requiredQuantity,
      eligibleSizes: Array.isArray(body.eligibleSizes) ? body.eligibleSizes : [],
      allowMixedVariants: body.allowMixedVariants !== false,
      applicableToAll: Boolean(body.applicableToAll),
      displayHomepage: body.displayHomepage !== false,
      displayListing: body.displayListing !== false,
      displayProductDetails: body.displayProductDetails !== false,
      bannerImage: body.bannerImage || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      status: body.status || "draft",
      productIds: Array.isArray(body.productIds) ? body.productIds : [],
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/admin/offers error:", err);
    return NextResponse.json({ message: "Could not create offer." }, { status: 500 });
  }
}
