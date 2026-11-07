import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminShell from "@/components/admin/AdminShell";
import OfferForm from "@/components/admin/OfferForm";
import { getOfferById } from "@/lib/services/offers";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditOfferPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const { id } = await params;
  const offer = await getOfferById(id);
  if (!offer) notFound();

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

  const initialOffer = {
    ...offer,
    productIds: offer.products.map((p) => p.id),
  };

  return (
    <AdminShell active="/admin/offers">
      <OfferForm initialOffer={initialOffer} productsList={productsList} />
    </AdminShell>
  );
}

