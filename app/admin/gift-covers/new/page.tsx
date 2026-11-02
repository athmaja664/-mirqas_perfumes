import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminShell from "@/components/admin/AdminShell";
import GiftCoverForm from "@/components/admin/GiftCoverForm";

export const dynamic = "force-dynamic";

export default async function NewGiftCoverPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <AdminShell active="Gift Covers">
      <GiftCoverForm />
    </AdminShell>
  );
}

