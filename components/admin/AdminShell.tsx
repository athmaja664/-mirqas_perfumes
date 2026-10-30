import { redirect } from "next/navigation";
import { destroySession, getCurrentUser } from "@/lib/auth/session";
import AdminChrome from "@/components/admin/AdminChrome";

async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

export default async function AdminShell({
  active,
  children,
}: {
  active: string;
  userName?: string; // accepted so pages can pass it; AdminChrome decides how the layout looks
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <AdminChrome active={active} logout={logout} canManageAdmins={user?.canManageAdmins === true}>
      {children}
    </AdminChrome>
  );
}