import bcrypt from "bcryptjs";
import { connectDB, Op } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";

export async function listAdmins() {
  await connectDB();
  const rows = await User.findAll({
    where: { role: "admin" },
    order: [["createdAt", "ASC"]],
  });
  return rows.map((u) => {
    return {
      id: String(u.id),
      name: u.name,
      email: u.email,
      isOwner: u.isOwner === true,
      canManageAdmins: u.canManageAdmins === true,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : "",
    };
  });
}

export type AddAdminResult = { ok: true } | { ok: false; message: string };

// Creates a NEW admin account. The role is set here on the server.
export async function addAdmin(input: { name: string; email: string; password: string }): Promise<AddAdminResult> {
  await connectDB();
  const existing = await User.count({ where: { email: input.email.toLowerCase().trim() } });
  if (existing > 0) return { ok: false, message: "An account with this email already exists." };

  try {
    await User.create({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      phone: "",
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "admin",
      isOwner: false,
      canManageAdmins: false,
      isActive: true,
    });
  } catch (e: unknown) {
    const err = e as { name?: string; original?: { code?: string; errno?: number } };
    if (err.name === "SequelizeUniqueConstraintError" || err.original?.errno === 1062)
      return { ok: false, message: "An account with this email already exists." };
    console.error(e);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  return { ok: true };
}

export type RemoveAdminResult =
  | { ok: true }
  | { ok: false; code: "not-found" | "owner" | "self" | "manager" | "failed" };

// Turns an admin back into a customer and deletes all of their sessions.
// The owner can remove any admin except themselves. An allowed admin can only remove ordinary admins.
export async function removeAdmin(
  targetId: string,
  actor: { id: string; isOwner: boolean }
): Promise<RemoveAdminResult> {
  if (!targetId || typeof targetId !== "string") return { ok: false, code: "not-found" };
  if (targetId === actor.id) return { ok: false, code: "self" };

  await connectDB();
  const target = await User.findByPk(targetId);
  if (!target || target.role !== "admin") return { ok: false, code: "not-found" };
  if (target.isOwner === true) return { ok: false, code: "owner" };
  if (!actor.isOwner && target.canManageAdmins === true) return { ok: false, code: "manager" };

  const [count] = await User.update(
    { role: "customer", isOwner: false, canManageAdmins: false },
    {
      where: {
        id: target.id,
        role: "admin",
        isOwner: false,
        ...(actor.isOwner ? {} : { canManageAdmins: false }),
      },
    }
  );
  if (count !== 1) return { ok: false, code: "failed" };

  await Session.destroy({ where: { userId: target.id } });
  return { ok: true };
}

export type SetManageResult = { ok: true } | { ok: false; code: "not-found" };

// Owner only (the action checks this). Gives or takes away the permission to manage admins.
export async function setCanManage(targetId: string, allow: boolean): Promise<SetManageResult> {
  if (!targetId || typeof targetId !== "string") return { ok: false, code: "not-found" };
  await connectDB();
  const [count] = await User.update(
    { canManageAdmins: allow },
    { where: { id: targetId, role: "admin", isOwner: false } }
  );
  if (count !== 1) return { ok: false, code: "not-found" };
  return { ok: true };
}