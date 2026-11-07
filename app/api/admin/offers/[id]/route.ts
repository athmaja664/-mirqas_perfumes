import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest, readJson } from "@/lib/security";
import { getOfferById, updateOffer, deleteOffer } from "@/lib/services/offers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const offer = await getOfferById(id);
  if (!offer) return NextResponse.json({ message: "Offer not found." }, { status: 404 });
  return NextResponse.json({ offer });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const blocked = guardRequest(req, "admin-offers", 100);
  if (blocked) return blocked;
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const rawBody = await readJson(req);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }
    const body = rawBody as Record<string, any>;

    const offerType = body.offerType;
    const offerPrice =
      body.offerPrice !== undefined
        ? body.offerPrice != null
          ? Math.round(Number(body.offerPrice) * 100)
          : null
        : undefined;

    const discountValue =
      body.discountValue !== undefined
        ? offerType === "fixed" && body.discountValue != null
          ? Math.round(Number(body.discountValue) * 100)
          : body.discountValue != null
          ? Number(body.discountValue)
          : null
        : undefined;

    const offer = await updateOffer(id, {
      title: body.title,
      description: body.description,
      offerType: body.offerType,
      offerPrice,
      discountValue,
      requiredQuantity: body.requiredQuantity != null ? Number(body.requiredQuantity) : undefined,
      eligibleSizes: body.eligibleSizes,
      allowMixedVariants: body.allowMixedVariants,
      applicableToAll: body.applicableToAll,
      displayHomepage: body.displayHomepage,
      displayListing: body.displayListing,
      displayProductDetails: body.displayProductDetails,
      bannerImage: body.bannerImage,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
      productIds: body.productIds,
    });

    if (!offer) return NextResponse.json({ message: "Offer not found." }, { status: 404 });
    return NextResponse.json({ offer });
  } catch (err: unknown) {
    console.error("PATCH /api/admin/offers/[id] error:", err);
    return NextResponse.json({ message: "Could not update offer." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const ok = await deleteOffer(id);
  if (!ok) return NextResponse.json({ message: "Offer not found." }, { status: 404 });
  return NextResponse.json({ message: "Offer deleted." });
}
