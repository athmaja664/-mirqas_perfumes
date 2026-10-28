import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { findProduct } from "@/lib/services/products";
import AdminShell from "@/components/admin/AdminShell";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const { id } = await params;
  const p = await findProduct(id, false);
  if (!p) notFound();

  return (
    <AdminShell active="Products">
      <ProductForm
        product={{
          id: p.id,
          name: p.name,
          brand: p.brand ?? "",
          description: p.description ?? "",
          price: p.price,
          salePrice: p.salePrice,
          category: p.category,
          images: p.images ?? [],
          video: p.video,
          stock: p.stock,
          isActive: p.isActive,
          isBestSeller: p.isBestSeller,
        }}
      />
    </AdminShell>
  );
}