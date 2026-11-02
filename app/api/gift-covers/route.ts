import { NextResponse } from "next/server";
import { connectDB, Op, literal } from "@/lib/db";
import { Product } from "@/models/Product";
import { toProduct } from "@/lib/services/products";

export const dynamic = "force-dynamic";

export const DEFAULT_GIFT_COVERS = [
  {
    id: "midnight-blue",
    slug: "midnight-blue-gift-box",
    name: "Midnight Blue Gift Box",
    description: "Deep nocturnal blue finish with gold debossed Mirqas signature. Fits your custom fragrance selection.",
    price: 399, // rupees
    pricePaise: 39900,
    salePrice: null,
    image: "/images/gift/boxes/midnight-blue.jpg",
    images: ["/images/gift/boxes/midnight-blue.jpg"],
    color: "#1d2a44",
    category: "Gift Cover",
    inStock: true,
    isActive: true,
  },
  {
    id: "ivory",
    slug: "ivory-gift-box",
    name: "Ivory Gift Box",
    description: "Classic textured ivory finish with warm copper accents. Elegance redefined for special occasions.",
    price: 399,
    pricePaise: 39900,
    salePrice: null,
    image: "/images/gift/boxes/ivory.jpg",
    images: ["/images/gift/boxes/ivory.jpg"],
    color: "#efe9dc",
    category: "Gift Cover",
    inStock: true,
    isActive: true,
  },
  {
    id: "sage-green",
    slug: "sage-green-gift-box",
    name: "Sage Green Gift Box",
    description: "Serene botanical sage green hue with refined minimalist styling. Perfect keepsake box.",
    price: 399,
    pricePaise: 39900,
    salePrice: null,
    image: "/images/gift/boxes/sage-green.jpg",
    images: ["/images/gift/boxes/sage-green.jpg"],
    color: "#8fa58f",
    category: "Gift Cover",
    inStock: true,
    isActive: true,
  },
];

export async function GET() {
  try {
    await connectDB();
    const products = await Product.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { category: { [Op.in]: ["Gift Cover", "Gift Covers", "Gift Box", "Gift Boxes"] } },
          literal(`JSON_CONTAINS(sections, '"gift-covers"')`),
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    if (products.length === 0) {
      return NextResponse.json({
        giftCovers: DEFAULT_GIFT_COVERS,
        isDefault: true,
      });
    }

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
        image: prod.images[0] || "/images/gift/boxes/midnight-blue.jpg",
        images: prod.images.length > 0 ? prod.images : ["/images/gift/boxes/midnight-blue.jpg"],
        color: "#9C5A2B",
        category: prod.category || "Gift Cover",
        inStock: prod.inStock,
        isActive: prod.isActive,
      };
    });

    return NextResponse.json({ giftCovers: items, isDefault: false });
  } catch (error) {
    console.error("GET /api/gift-covers error:", error);
    // Graceful fallback so customer store never crashes
    return NextResponse.json({ giftCovers: DEFAULT_GIFT_COVERS, isDefault: true });
  }
}

