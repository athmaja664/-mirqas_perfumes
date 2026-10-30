import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listAdmins } from "@/lib/services/admins";
import AdminShell from "@/components/admin/AdminShell";
import AddAdminForm from "@/components/admin/AddAdminForm";
import RemoveAdminButton from "@/components/admin/RemoveAdminButton";
import { removeAdminAction, setManagerAction } from "./actions";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

const ERRORS: Record<string, string> = {
  forbidden: "You are not allowed to do this.",
  "not-found": "That admin was not found.",
  owner: "The main admin cannot be removed.",
  self: "You cannot remove yourself.",
  manager: "Only the main admin can remove an admin who can manage admins.",
  failed: "Could not remove the admin. Please try again.",
};

const DONE: Record<string, string> = {
  removed: "Admin removed. The account is now a customer.",
  allowed: "Done. This admin can now manage admins.",
  revoked: "Done. This admin can no longer manage admins.",
};

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");
  // Admins without the permission cannot open this page at all.
  if (!user.canManageAdmins) redirect("/admin/dashboard");

  const { done, error } = await searchParams;
  const has = (o: Record<string, string>, k: unknown) =>
    typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
  const doneText = has(DONE, done) ? DONE[done as string] : "";
  const errorText = has(ERRORS, error) ? ERRORS[error as string] : "";
  const admins = await listAdmins();

  const btn =
    "h-8 w-full px-3 text-center text-[11px] font-semibold uppercase leading-none tracking-[0.15em] transition-colors";

  return (
    <AdminShell active="Admins">
      <h1 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
        Admins
      </h1>
      <p className="mb-6 mt-2 text-[14px] text-black/55">
        {user.isOwner
          ? "You are the main admin. You can add and remove admins, and choose which admins can manage other admins."
          : "The main admin has allowed you to add and remove admins. Only the main admin can change this permission."}
      </p>

      {doneText && (
        <p role="status" className="mb-4 px-3 py-2 text-[13px]" style={{ background: "#E3F2E6", color: "#1F7A3A" }}>
          {doneText}
        </p>
      )}
      {errorText && (
        <p role="alert" className="mb-4 px-3 py-2 text-[13px]" style={{ background: "#F8E3E0", color: "#A32A1F" }}>
          {errorText}
        </p>
      )}

      <div className="mb-8">
        <AddAdminForm />
      </div>

      <div className="overflow-x-auto border border-black/10 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.15em] text-black/60">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const canRemove = !a.isOwner && a.id !== user.id && (user.isOwner || !a.canManageAdmins);
              return (
                <tr key={a.id} className="border-b border-black/10 last:border-b-0">
                  <td className="px-4 py-3">
                    {a.name}
                    {a.isOwner && (
                      <span
                        className="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white"
                        style={{ background: COPPER }}
                      >
                        Owner
                      </span>
                    )}
                    {!a.isOwner && a.canManageAdmins && (
                      <span
                        className="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]"
                        style={{ background: "#F3E7D5", color: COPPER }}
                      >
                        Can manage admins
                      </span>
                    )}
                    {a.id === user.id && <span className="ml-2 text-[12px] text-black/50">(you)</span>}
                  </td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3 lining-nums">
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-GB") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex h-8 items-center justify-end gap-3">
                      {/* Slot 1: permission button (fixed width, so every row lines up) */}
                      <div className="flex h-8 w-[210px] items-center">
                        {user.isOwner && !a.isOwner && (
                          <form action={setManagerAction} className="m-0 w-full">
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="allow" value={a.canManageAdmins ? "false" : "true"} />
                            <button
                              type="submit"
                              className={btn + " border border-[#9C5A2B] text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white"}
                            >
                              {a.canManageAdmins ? "Remove permission" : "Allow to manage admins"}
                            </button>
                          </form>
                        )}
                      </div>
                      {/* Slot 2: bin icon (always the same place, at the right) */}
                      <div className="flex h-8 w-8 items-center justify-center">
                        {canRemove && (
                          <form action={removeAdminAction} className="m-0 flex h-8 items-center">
                            <input type="hidden" name="id" value={a.id} />
                            <RemoveAdminButton name={a.name} />
                          </form>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}