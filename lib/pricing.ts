// Size prices. Supports standard perfume sizes, custom sizes (5ml, 10ml, 15ml, 30ml, 50ml, 100ml, etc.),
// and single-size products like Gift Covers (ml: 0).

export const SIZE_STEPS = [
  { ml: 5, mult: 0.65 },
  { ml: 10, mult: 1 },
  { ml: 15, mult: 1.35 },
  { ml: 30, mult: 2.25 },
  { ml: 50, mult: 3.4 },
  { ml: 100, mult: 5.6 },
] as const;

export const VALID_SIZES: number[] = [0, 5, 10, 15, 30, 50, 100];

export function isValidSize(ml: number): boolean {
  return typeof ml === "number" && !isNaN(ml) && ml >= 0;
}

/**
 * Method B: Percentage-based formula
 * Price(S) = P * (1 + R/100)^((S - B)/I)
 *
 * @param basePrice - Base price in Rupees or Paise
 * @param baseSize - Base size (e.g. 5 or 10 ml)
 * @param targetSize - Target size in ml
 * @param sizeIncrement - Step increment in ml (e.g. 5 or 10 ml)
 * @param percentageIncrease - Percentage increase per step (e.g. 15 for 15%)
 */
export function calculatePercentagePrice(
  basePrice: number,
  baseSize: number,
  targetSize: number,
  sizeIncrement: number,
  percentageIncrease: number
): number {
  if (targetSize === baseSize) return Math.round(basePrice);
  if (sizeIncrement <= 0) return Math.round(basePrice);
  const steps = (targetSize - baseSize) / sizeIncrement;
  const multiplier = Math.pow(1 + percentageIncrease / 100, steps);
  return Math.round(basePrice * multiplier);
}

// Input and output are in PAISE. The result is rounded to a whole rupee.
export function sizePricePaise(basePaise: number, ml: number): number | null {
  if (ml === 0) return basePaise;
  const step = SIZE_STEPS.find((s) => s.ml === ml);
  if (step) {
    return Math.round((basePaise / 100) * step.mult) * 100;
  }
  // Rough proportional fallback if not in SIZE_STEPS
  return Math.round((basePaise / 100) * (ml / 10)) * 100;
}

export type ProductPricingInfo = {
  price: number;
  salePrice?: number | null;
  category?: string;
  sections?: string[];
  sizePrices?: Record<string, number> | null;
  pricingMethod?: "manual" | "percentage" | string | null;
  baseSize?: number | null;
  basePrice?: number | null;
  sizeIncrement?: number | null;
  percentageIncrease?: number | null;
  priceOverrides?: Record<string, number> | null;
};

// Look up price in a sizePrices or priceOverrides dictionary (supporting "10ml", "10", etc.)
export function findInSizeMap(
  map: Record<string, number> | null | undefined,
  ml: number
): number | null {
  if (!map || typeof map !== "object") return null;
  const keyWithMl = `${ml}ml`;
  const keyWithoutMl = String(ml);
  const keyWithSpace = `${ml} ml`;

  for (const [k, v] of Object.entries(map)) {
    const trimmed = k.toLowerCase().trim();
    if (
      trimmed === keyWithMl ||
      trimmed === keyWithoutMl ||
      trimmed === keyWithSpace ||
      trimmed === `${ml}m`
    ) {
      if (typeof v === "number" && !isNaN(v) && v > 0) {
        return v;
      }
    }
  }
  return null;
}

// The price the customer pays: checks real database sizePrices first, then percentage formula, then fallback.
export function unitPricePaise(product: ProductPricingInfo, ml: number): number | null {
  const base = product.salePrice ?? product.price;
  if (
    ml === 0 ||
    product.category === "Gift Cover" ||
    product.category === "Gift Covers" ||
    (Array.isArray(product.sections) && product.sections.includes("gift-covers"))
  ) {
    return base;
  }

  // 1. Direct match in product.sizePrices
  const fromSizePrices = findInSizeMap(product.sizePrices, ml);
  if (fromSizePrices !== null) {
    return fromSizePrices;
  }

  // 2. Percentage calculation if configured
  if (
    product.pricingMethod === "percentage" &&
    product.baseSize &&
    product.basePrice &&
    product.sizeIncrement &&
    product.percentageIncrease != null
  ) {
    // Check manual override first
    const override = findInSizeMap(product.priceOverrides, ml);
    if (override !== null) {
      return override;
    }
    return calculatePercentagePrice(
      product.basePrice,
      product.baseSize,
      ml,
      product.sizeIncrement,
      product.percentageIncrease
    );
  }

  // 3. Fallback to default multiplier
  return sizePricePaise(base, ml);
}
