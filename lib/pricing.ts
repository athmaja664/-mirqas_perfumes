// Size prices. Same rule as lib/shopStorage.ts, so cart prices match the cards.
// Supports both standard perfume sizes (10, 30, 50, 100ml) and single-size products like Gift Covers (ml: 0).

export const SIZE_STEPS = [
  { ml: 10, mult: 1 },
  { ml: 30, mult: 2.25 },
  { ml: 50, mult: 3.4 },
  { ml: 100, mult: 5.6 },
] as const;

export const VALID_SIZES: number[] = [0, ...SIZE_STEPS.map((s) => s.ml)];

export function isValidSize(ml: number): boolean {
  return VALID_SIZES.includes(ml);
}

// Input and output are in PAISE. The result is rounded to a whole rupee,
// because the shop cards round to a whole rupee too.
export function sizePricePaise(basePaise: number, ml: number): number | null {
  if (ml === 0) return basePaise;
  const step = SIZE_STEPS.find((s) => s.ml === ml);
  if (!step) return null;
  return Math.round((basePaise / 100) * step.mult) * 100;
}

// The price the customer pays: sale price if there is one.
export function unitPricePaise(
  product: { price: number; salePrice?: number | null; category?: string; sections?: string[] },
  ml: number
): number | null {
  const base = product.salePrice ?? product.price;
  if (
    ml === 0 ||
    product.category === "Gift Cover" ||
    product.category === "Gift Covers" ||
    (Array.isArray(product.sections) && product.sections.includes("gift-covers"))
  ) {
    return base;
  }
  return sizePricePaise(base, ml);
}
