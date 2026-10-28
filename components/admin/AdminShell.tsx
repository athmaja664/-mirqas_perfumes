import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth/session";
import AdminChrome from "@/components/admin/AdminChrome";

async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

export default function AdminShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <AdminChrome active={active} logout={logout}>
      {children}
    </AdminChrome>
  );
}