import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { connectDB, Op } from "@/lib/db";
import { Session } from "@/models/Session";
import { User } from "@/models/User";

const COOKIE = "mirqas_session";
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

// Permanent session lifetimes: 10 years in database, 400 days in browser cookies (maximum browser spec)
const PERMANENT_COOKIE_SECONDS = 400 * 24 * 60 * 60; // 400 days (~1.1 years max browser cookie)
const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in database
const ONE_DAY_SECONDS = 1 * 24 * 60 * 60;           // 1 day for non-remembered admins

export async function createSession(userId: string, remember: boolean = true) {
  await connectDB();
  const token = randomBytes(32).toString("hex");

  // Retrieve user to ensure separate customer vs admin session lifetimes
  const u = await User.findByPk(userId);
  const isCustomer = u ? u.role === "customer" : true;

  // Customers are permanently logged in (10 years / rolling renewal).
  // Admins get 30 days if remember is true, else 1 day.
  const maxAge = isCustomer ? PERMANENT_COOKIE_SECONDS : (remember ? 30 * 24 * 60 * 60 : ONE_DAY_SECONDS);
  const expiresAt = isCustomer
    ? new Date(Date.now() + TEN_YEARS_MS)
    : new Date(Date.now() + maxAge * 1000);

  await Session.create({
    userId,
    tokenHash: hash(token),
    expiresAt,
  });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    expires: expiresAt,
  });
  jar.set("mirqas_user_id", userId, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  await connectDB();
  const session = await Session.findOne({
    where: {
      tokenHash: hash(token),
      expiresAt: { [Op.gt]: new Date() },
    },
  });
  if (!session) {
    // If the token is expired, invalid, or revoked, clear the cookie
    try {
      jar.delete(COOKIE);
      jar.delete("mirqas_user_id");
      jar.set(COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
      jar.set("mirqas_user_id", "", {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    } catch {
      // In read-only Server Component contexts, ignore modification error
    }
    return null;
  }
  const u = await User.findByPk(session.userId);
  if (!u || !u.isActive) {
    try {
      await Session.destroy({ where: { tokenHash: hash(token) } });
      jar.delete(COOKIE);
      jar.delete("mirqas_user_id");
    } catch {}
    return null;
  }
  const isAdmin = u.role === "admin";

  // Auto-renew permanent cookie for customers on active visit
  if (!isAdmin) {
    try {
      const renewExpires = new Date(Date.now() + TEN_YEARS_MS);
      jar.set(COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: PERMANENT_COOKIE_SECONDS,
        expires: renewExpires,
      });
      jar.set("mirqas_user_id", String(u.id), {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: PERMANENT_COOKIE_SECONDS,
        expires: renewExpires,
      });
    } catch {
      // In read-only Server Component contexts, ignore modification error
    }
  }

  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    // Old accounts have no isOwner field, so only a real true counts
    isOwner: isAdmin && u.isOwner === true,
    // The owner can always manage admins. Another admin can only if the owner allowed it.
    canManageAdmins: isAdmin && (u.isOwner === true || u.canManageAdmins === true),
  };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await connectDB();
    await Session.destroy({ where: { tokenHash: hash(token) } }).catch(() => {});
  }
  try {
    jar.delete(COOKIE);
    jar.delete("mirqas_user_id");
    jar.set(COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    jar.set("mirqas_user_id", "", {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  } catch {}
}

export async function destroyOtherSessions(userId: string) {
  const token = (await cookies()).get(COOKIE)?.value;
  await connectDB();
  await Session.destroy({
    where: {
      userId,
      ...(token ? { tokenHash: { [Op.ne]: hash(token) } } : {}),
    },
  });
}