// Shared offer and discount logic. Prices are in RUPEES here.

export const BULK_OFFER = {
  minQty: 2,
  amountOff: 150,
};

// Example: original 1000, price 720 -> 28
export function discountPercent(original?: number, price?: number): number {
  if (!original || !price) return 0;
  if (original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export function formatRupees(n: number): string {
  return (
    "Rs. " +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Price for buying the minimum quantity with the offer.
export function bulkOfferTotal(price: number) {
  const gross = price * BULK_OFFER.minQty;
  const total = Math.max(gross - BULK_OFFER.amountOff, 0);
  return { gross, total, each: total / BULK_OFFER.minQty };
}