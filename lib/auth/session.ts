import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { connectDB } from "@/lib/db";
import { Session } from "@/models/Session";
import { User } from "@/models/User";

const COOKIE = "mirqas_session";
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: string, remember: boolean) {
  await connectDB();
  const token = randomBytes(32).toString("hex");
  const maxAge = (remember ? 30 : 1) * 24 * 60 * 60;
  await Session.create({
    userId,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + maxAge * 1000),
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  await connectDB();
  const session = await Session.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } }).lean();
  if (!session) return null;
  const u = await User.findById(session.userId).lean();
  if (!u || !u.isActive) return null;
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    // Old accounts have no isOwner field, so only a real true counts
    isOwner: u.role === "admin" && u.isOwner === true,
  };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await connectDB();
    await Session.deleteOne({ tokenHash: hash(token) });
  }
  jar.delete(COOKIE);
}

export async function destroyOtherSessions(userId: string) {
  const token = (await cookies()).get(COOKIE)?.value;
  await connectDB();
  await Session.deleteMany({
    userId,
    ...(token ? { tokenHash: { $ne: hash(token) } } : {}),
  });
}