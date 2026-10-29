import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import AdminShell from "@/components/admin/AdminShell";
import ProfileForm from "@/components/admin/ProfileForm";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <AdminShell active="Profile" userName={user.name}>
      <h1 className="mb-8 mt-3 font-medium leading-tight" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: "#9C5A2B", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
        Profile
      </h1>
      <ProfileForm user={{ name: user.name, email: user.email, phone: user.phone }} />
    </AdminShell>
  );
}