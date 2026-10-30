import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { getCurrentUser } from "@/lib/auth/session";
import { guardRequest } from "@/lib/security";
import { reviewSchema } from "@/lib/validations/review";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 5;

function cleanSlug(raw: string): string | null {
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    // keep as it is
  }
  s = s.toLowerCase();
  return /^[a-z0-9-]{1,100}$/.test(s) ? s : null;
}

// "Anita Sharma" -> "Anita S."  (we never show a full name or an email)
function maskName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// Reads the signed-in customer from the server session. Nothing comes from the browser.
function whoIs(user: unknown): { id: string; name: string } | null {
  if (!user || typeof user !== "object") return null;
  const u = user as { id?: unknown; _id?: unknown; name?: unknown };
  const raw = u.id ?? u._id;
  if (!raw) return null;
  return { id: String(raw), name: typeof u.name === "string" ? u.name : "" };
}

type Row = {
  _id: unknown;
  user: unknown;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  video: string;
  createdAt: Date;
};

// GET: reviews of one product + the rating summary (public)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clean = cleanSlug(slug);
  if (!clean) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  await connectDB();
  const product = await Product.findOne({ slug: clean, isActive: true }).select("_id").lean();
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  const page = Math.max(1, Math.floor(Number(req.nextUrl.searchParams.get("page"))) || 1);
  const me = whoIs(await getCurrentUser());
  const match = { product: product._id, status: "published" as const };

  const [rows, groups, total, mine] = await Promise.all([
    Review.find(match)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_LIMIT)
      .limit(PAGE_LIMIT)
      .lean(),
    Review.aggregate([{ $match: match }, { $group: { _id: "$rating", n: { $sum: 1 } } }]),
    Review.countDocuments(match),
    me ? Review.exists({ product: product._id, user: me.id }) : Promise.resolve(null),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const g of groups as { _id: number; n: number }[]) {
    distribution[g._id] = g.n;
    sum += g._id * g.n;
  }
  const average = total ? Math.round((sum / total) * 10) / 10 : 0;

  return NextResponse.json({
    summary: { average, count: total, distribution },
    reviews: (rows as unknown as Row[]).map((r) => ({
      id: String(r._id),
      name: maskName(r.userName),
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: r.images,
      video: r.video,
      createdAt: r.createdAt,
      mine: !!me && String(r.user) === me.id,
    })),
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_LIMIT)),
    signedIn: !!me,
    hasReviewed: !!mine,
  });
}

// POST: a signed-in customer writes a review (one per product)
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const blocked = guardRequest(req, "review-create", 10);
  if (blocked) return blocked;

  const me = whoIs(await getCurrentUser());
  if (!me) return NextResponse.json({ message: "Please log in to write a review." }, { status: 401 });

  const { slug } = await params;
  const clean = cleanSlug(slug);
  if (!clean) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Could not read your review." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Please check your review." },
      { status: 400 }
    );
  }

  await connectDB();
  const product = await Product.findOne({ slug: clean, isActive: true }).select("_id").lean();
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  try {
    await Review.create({
      product: product._id,
      user: me.id,
      userName: me.name || "Customer",
      ...parsed.data,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ message: "You have already reviewed this product." }, { status: 409 });
    }
    return NextResponse.json({ message: "Could not save your review. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

// DELETE: a customer removes their OWN review of this product
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const blocked = guardRequest(req, "review-delete", 20);
  if (blocked) return blocked;

  const me = whoIs(await getCurrentUser());
  if (!me) return NextResponse.json({ message: "Please log in." }, { status: 401 });

  const { slug } = await params;
  const clean = cleanSlug(slug);
  if (!clean) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  await connectDB();
  const product = await Product.findOne({ slug: clean }).select("_id").lean();
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  await Review.deleteOne({ product: product._id, user: me.id });
  return NextResponse.json({ ok: true });
}