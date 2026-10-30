import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";

export async function listAdmins() {
  await connectDB();
  const rows = await User.find({ role: "admin" }).sort({ createdAt: 1 }).lean();
  return rows.map((u) => {
    const created = (u as unknown as { createdAt?: Date }).createdAt;
    return {
      id: String(u._id),
      name: u.name,
      email: u.email,
      isOwner: u.isOwner === true,
      canManageAdmins: u.canManageAdmins === true,
      createdAt: created ? new Date(created).toISOString() : "",
    };
  });
}

export type AddAdminResult = { ok: true } | { ok: false; message: string };

// Creates a NEW admin account. The role is set here on the server.
export async function addAdmin(input: { name: string; email: string; password: string }): Promise<AddAdminResult> {
  await connectDB();
  if (await User.exists({ email: input.email }))
    return { ok: false, message: "An account with this email already exists." };

  try {
    await User.create({
      name: input.name,
      email: input.email,
      phone: "",
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "admin",
      isOwner: false,
      canManageAdmins: false,
      isActive: true,
    });
  } catch (e) {
    if ((e as { code?: number }).code === 11000)
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
  if (!mongoose.isValidObjectId(targetId)) return { ok: false, code: "not-found" };
  if (targetId === actor.id) return { ok: false, code: "self" };

  await connectDB();
  const target = await User.findById(targetId).lean();
  if (!target || target.role !== "admin") return { ok: false, code: "not-found" };
  if (target.isOwner === true) return { ok: false, code: "owner" };
  if (!actor.isOwner && target.canManageAdmins === true) return { ok: false, code: "manager" };

  const res = await User.updateOne(
    {
      _id: target._id,
      role: "admin",
      isOwner: { $ne: true },
      ...(actor.isOwner ? {} : { canManageAdmins: { $ne: true } }),
    },
    { $set: { role: "customer", isOwner: false, canManageAdmins: false } }
  );
  if (res.modifiedCount !== 1) return { ok: false, code: "failed" };

  await Session.deleteMany({ userId: target._id });
  return { ok: true };
}

export type SetManageResult = { ok: true } | { ok: false; code: "not-found" };

// Owner only (the action checks this). Gives or takes away the permission to manage admins.
export async function setCanManage(targetId: string, allow: boolean): Promise<SetManageResult> {
  if (!mongoose.isValidObjectId(targetId)) return { ok: false, code: "not-found" };
  await connectDB();
  const res = await User.updateOne(
    { _id: targetId, role: "admin", isOwner: { $ne: true } },
    { $set: { canManageAdmins: allow } }
  );
  if (res.matchedCount !== 1) return { ok: false, code: "not-found" };
  return { ok: true };
}