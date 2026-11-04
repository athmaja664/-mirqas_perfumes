import bcrypt from "bcryptjs";
import { connectDB, Op } from "@/lib/db";
import { User, ensureUserAuthColumns } from "@/models/User";
import { isEmail, isPhone, normalizePhone } from "@/lib/auth/normalize";

// Used when the account doesn't exist, so response time doesn't reveal which identifiers are registered
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

export async function verifyCredentials(identifier: string, password: string) {
  await connectDB();
  await ensureUserAuthColumns();

  const trimmed = identifier.trim();
  let where: Record<string | symbol, unknown>;

  if (isEmail(trimmed)) {
    where = { email: trimmed.toLowerCase() };
  } else if (isPhone(trimmed)) {
    const normalized = normalizePhone(trimmed);
    where = {
      [Op.or]: [
        { phone: normalized },
        { phone: trimmed },
      ],
    };
  } else {
    // Fallback: search email or phone
    where = { email: trimmed.toLowerCase() };
  }

  const user = await User.findOne({ where });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.isActive) return null;
  return user;
}
