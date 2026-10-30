import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { guardRequest, readJson } from "@/lib/security";
import { shippingSchema } from "@/lib/validations/order";
import { Address } from "@/models/Address";

export const dynamic = "force-dynamic";

// GET: the saved address of the signed-in customer (or null)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in." }, { status: 401 });

  await connectDB();
  const a = await Address.findOne({ userId: user.id }).lean();
  if (!a) return NextResponse.json({ address: null });

  return NextResponse.json({
    address: {
      name: a.name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    },
  });
}

// PUT: save or replace the address. The user id always comes from the session.
export async function PUT(req: NextRequest) {
  const blocked = guardRequest(req, "address-save", 20);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in." }, { status: 401 });

  const body = await readJson(req);
  if (body === null) return NextResponse.json({ message: "Could not read the request." }, { status: 400 });

  const parsed = shippingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  }

  await connectDB();
  await Address.updateOne({ userId: user.id }, { $set: parsed.data }, { upsert: true });

  return NextResponse.json({ ok: true });
}