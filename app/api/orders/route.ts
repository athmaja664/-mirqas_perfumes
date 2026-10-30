import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { guardRequest, readJson } from "@/lib/security";
import { orderCreateSchema } from "@/lib/validations/order";
import { createOrder } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

// POST: a signed-in customer places an order (Cash on Delivery)
export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "order-create", 10);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in to place your order." }, { status: 401 });

  const body = await readJson(req);
  if (body === null) return NextResponse.json({ message: "Could not read the request." }, { status: 400 });

  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  }

  const result = await createOrder(user.id, parsed.data);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });

  return NextResponse.json({ order: result.order }, { status: result.existing ? 200 : 201 });
}