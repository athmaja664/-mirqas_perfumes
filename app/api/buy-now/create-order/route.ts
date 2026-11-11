import { NextRequest, NextResponse } from "next/server";
import { guardRequest, readJson } from "@/lib/security";
import { getCurrentUser } from "@/lib/auth/session";
import { buyNowCreateOrderSchema } from "@/lib/validations/buy-now";
import { createBuyNowOrder } from "@/lib/services/buy-now";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "buy-now-create", 20);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to complete your purchase." },
      { status: 401 }
    );
  }

  const body = await readJson(req);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = buyNowCreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Please check your delivery details." },
      { status: 400 }
    );
  }

  const res = await createBuyNowOrder(user.id, parsed.data);
  if (!res.ok) {
    return NextResponse.json(
      {
        error: res.message,
        alreadyPaid: res.alreadyPaid || false,
        orderNumber: res.orderNumber || null,
      },
      { status: res.status }
    );
  }

  return NextResponse.json(res, { status: 201 });
}

