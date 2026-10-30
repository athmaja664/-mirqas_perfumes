import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { guardRequest, readJson } from "@/lib/security";
import { cartAddSchema, cartChangeSchema, cartRemoveSchema } from "@/lib/validations/cart";
import { addToCart, changeLine, getCartView, removeLine, type CartResult } from "@/lib/services/cart";

export const dynamic = "force-dynamic";

const badBody = () => NextResponse.json({ message: "Could not read the request." }, { status: 400 });

// After every change we send back the fresh cart
async function respond(result: CartResult, userId: string) {
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
  return NextResponse.json(await getCartView(userId));
}

// POST: add to cart  { slug, ml, qty }
export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "cart-write", 200);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in." }, { status: 401 });

  const body = await readJson(req);
  if (body === null) return badBody();
  const parsed = cartAddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { slug, ml, qty } = parsed.data;
  return respond(await addToCart(user.id, slug, ml, qty), user.id);
}

// PATCH: change quantity and/or size  { slug, ml, qty?, newMl? }
export async function PATCH(req: NextRequest) {
  const blocked = guardRequest(req, "cart-write", 200);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in." }, { status: 401 });

  const body = await readJson(req);
  if (body === null) return badBody();
  const parsed = cartChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { slug, ml, qty, newMl } = parsed.data;
  return respond(await changeLine(user.id, slug, ml, qty, newMl), user.id);
}

// DELETE: remove one line  { slug, ml }
export async function DELETE(req: NextRequest) {
  const blocked = guardRequest(req, "cart-write", 200);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in." }, { status: 401 });

  const body = await readJson(req);
  if (body === null) return badBody();
  const parsed = cartRemoveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { slug, ml } = parsed.data;
  return respond(await removeLine(user.id, slug, ml), user.id);
}