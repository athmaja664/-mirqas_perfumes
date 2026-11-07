import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { readJson } from "@/lib/security";
import { toggleOfferStatus } from "@/lib/services/offers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const rawBody = await readJson(req);
  const body = rawBody as Record<string, any> | null;
  const status = body?.status;
  if (!["draft", "published", "unpublished"].includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  const offer = await toggleOfferStatus(id, status);
  if (!offer) return NextResponse.json({ message: "Offer not found." }, { status: 404 });
  return NextResponse.json({ offer });
}
