/**
 * Phone number and identifier normalizer
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/[\s\-()]/g, "");
  // If it's a 10 digit Indian number without country code, add +91
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (!cleaned.startsWith("+") && /^\d{10,15}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return cleaned;
}

export function isEmail(identifier: string): boolean {
  if (!identifier) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
}

export function isPhone(identifier: string): boolean {
  if (!identifier) return false;
  const cleaned = identifier.trim().replace(/[\s\-()]/g, "");
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

