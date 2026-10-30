"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminManager, requireOwner } from "@/lib/auth/require-admin";
import { adminCreateSchema } from "@/lib/validations/admin";
import { addAdmin, removeAdmin, setCanManage } from "@/lib/services/admins";

export type AddState = { ok: boolean; message: string };

// A form post can be sent by anyone, so every action checks the permission again on the server.
export async function addAdminAction(formData: FormData): Promise<AddState> {
  const auth = await requireAdminManager();
  if ("error" in auth) return { ok: false, message: "You are not allowed to add admins." };

  const parsed = adminCreateSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const result = await addAdmin({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/admins");
  return { ok: true, message: "Admin added: " + parsed.data.email };
}

export async function removeAdminAction(formData: FormData): Promise<void> {
  const auth = await requireAdminManager();
  if ("error" in auth) redirect("/admin/admins?error=forbidden");

  const id = String(formData.get("id") ?? "");
  const result = await removeAdmin(id, { id: auth.admin.id, isOwner: auth.admin.isOwner });

  revalidatePath("/admin/admins");
  redirect(result.ok ? "/admin/admins?done=removed" : "/admin/admins?error=" + result.code);
}

// Only the owner can give or take away the permission.
export async function setManagerAction(formData: FormData): Promise<void> {
  const auth = await requireOwner();
  if ("error" in auth) redirect("/admin/admins?error=forbidden");

  const id = String(formData.get("id") ?? "");
  const allow = formData.get("allow") === "true";
  const result = await setCanManage(id, allow);

  revalidatePath("/admin/admins");
  redirect(
    result.ok ? "/admin/admins?done=" + (allow ? "allowed" : "revoked") : "/admin/admins?error=" + result.code
  );
}