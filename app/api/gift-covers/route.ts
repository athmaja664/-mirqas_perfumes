import { NextResponse } from "next/server";
import { connectDB, Op, literal } from "@/lib/db";
import { Product } from "@/models/Product";
import { toProduct } from "@/lib/services/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const products = await Product.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { category: { [Op.in]: ["Gift Cover", "Gift Covers", "Gift Box", "Gift Boxes"] } },
          { category: { [Op.like]: "%Gift Cover%" } },
          { category: { [Op.like]: "%Gift Box%" } },
          { family: "Gift Cover" },
          literal(`JSON_CONTAINS(sections, '"gift-covers"')`),
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    const items = products.map((p) => {
      const prod = toProduct(p);
      const priceRupees = Math.round((prod.salePrice ?? prod.price) / 100);
      return {
        id: prod.id,
        slug: prod.slug,
        name: prod.name,
        description: prod.description,
        price: priceRupees,
        pricePaise: prod.salePrice ?? prod.price,
        salePrice: prod.salePrice ? Math.round(prod.salePrice / 100) : null,
        image: prod.images[0] || "",
        images: prod.images,
        color: "#9C5A2B",
        category: prod.category || "Gift Cover",
        inStock: prod.inStock,
        isActive: prod.isActive,
      };
    });

    return NextResponse.json(
      { giftCovers: items, total: items.length },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/gift-covers error:", error);
    return NextResponse.json(
      { giftCovers: [], error: "Failed to load gift covers" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
