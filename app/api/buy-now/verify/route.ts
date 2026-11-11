import { NextRequest, NextResponse } from "next/server";
import { guardRequest, readJson } from "@/lib/security";
import { getCurrentUser } from "@/lib/auth/session";
import { buyNowVerifySchema } from "@/lib/validations/buy-now";
import { verifyBuyNowPayment } from "@/lib/services/buy-now";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "buy-now-verify", 30);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to verify payment." },
      { status: 401 }
    );
  }

  const body = await readJson(req);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = buyNowVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid payment verification payload." },
      { status: 400 }
    );
  }

  const res = await verifyBuyNowPayment(user.id, parsed.data);
  return NextResponse.json(res, { status: res.ok ? 200 : res.status });
}

