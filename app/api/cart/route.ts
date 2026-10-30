import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartView } from "@/lib/services/cart";

export const dynamic = "force-dynamic";

// GET: the signed-in customer's cart
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in." }, { status: 401 });
  return NextResponse.json(await getCartView(user.id));
}