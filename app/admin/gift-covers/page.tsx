import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminShell from "@/components/admin/AdminShell";
import GiftCoversTable from "@/components/admin/GiftCoversTable";

export const dynamic = "force-dynamic";

export default async function AdminGiftCoversPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <AdminShell active="Gift Covers">
      <GiftCoversTable />
    </AdminShell>
  );
}
