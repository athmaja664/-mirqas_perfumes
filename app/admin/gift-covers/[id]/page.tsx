import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { findProduct } from "@/lib/services/products";
import AdminShell from "@/components/admin/AdminShell";
import GiftCoverForm from "@/components/admin/GiftCoverForm";

export const dynamic = "force-dynamic";

export default async function EditGiftCoverPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const { id } = await params;
  const p = await findProduct(id, false);
  if (!p) notFound();

  return (
    <AdminShell active="Gift Covers">
      <GiftCoverForm
        giftCover={{
          id: p.id,
          name: p.name,
          description: p.description,
          price: Math.round(p.price / 100),
          salePrice: p.salePrice ? Math.round(p.salePrice / 100) : null,
          category: p.category,
          images: p.images,
          stock: p.stock,
          isActive: p.isActive,
        }}
      />
    </AdminShell>
  );
}
