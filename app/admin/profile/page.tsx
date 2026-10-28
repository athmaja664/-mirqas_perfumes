import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminShell from "@/components/admin/AdminShell";
import ProfileForms from "@/components/account/ProfileForms";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

export default async function AdminProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <AdminShell active="Profile">
      <h1 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
        Profile
      </h1>
      <p className="mb-8 mt-2 text-[14px] text-black/55">Update your details and password.</p>

      <ProfileForms user={{ name: user.name, email: user.email, phone: user.phone ?? "", role: user.role }} />
    </AdminShell>
  );
}