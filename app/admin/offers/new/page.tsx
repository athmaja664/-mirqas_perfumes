import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminShell from "@/components/admin/AdminShell";
import OfferForm from "@/components/admin/OfferForm";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  await connectDB();
  const products = await Product.findAll({
    where: { isActive: true },
    order: [["name", "ASC"]],
    attributes: ["id", "name", "slug", "images", "price"],
  });

  const productsList = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: Array.isArray(p.images) ? p.images[0] : "",
    price: p.price,
  }));

  return (
    <AdminShell active="/admin/offers">
      <OfferForm productsList={productsList} />
    </AdminShell>
  );
}

