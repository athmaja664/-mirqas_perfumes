export type ClientOfferLine = {
  productId?: string;
  slug: string;
  name?: string;
  ml: number;
  qty: number;
  unitPrice: number; // in paise
};

export type ClientActiveOffer = {
  id: string;
  title: string;
  description: string;
  offerType: "quantity" | "percentage" | "fixed";
  offerPrice: number | null; // in paise
  discountValue: number | null;
  percentageIncrease?: number | null;
  requiredQuantity: number;
  eligibleSizes: string[];
  allowMixedVariants: boolean;
  applicableToAll: boolean;
  products?: { id: string; slug: string; name: string }[];
};

export type ClientAppliedOffer = {
  offerId: string;
  offerTitle: string;
  offerType: "quantity" | "percentage" | "fixed";
  discountTotal: number; // in paise
  savingsText: string;
};

export function getUnitOfferPrice(base10mlPrice: number, ml: number, pct: number | null | undefined): number {
  if (!pct || pct <= 0 || ml <= 10) return base10mlPrice;
  const r = pct / 100;
  const p10 = base10mlPrice;
  const p15 = Math.round(p10 * (1 + r));
  if (ml <= 15) return p15;
  const p30 = Math.round(p15 * (1 + r));
  if (ml <= 30) return p30;
  const p50 = Math.round(p30 * (1 + r));
  if (ml <= 50) return p50;
  const p100 = Math.round(p50 * (1 + r));
  return p100;
}

export function evaluateOffersClient(
  items: ClientOfferLine[],
  activeOffers: ClientActiveOffer[]
): ClientAppliedOffer | null {
  if (!items.length || !activeOffers.length) return null;

  let bestResult: ClientAppliedOffer | null = null;

  for (const offer of activeOffers) {
    const eligibleSizesSet = new Set(
      (offer.eligibleSizes || []).map((s) => s.toLowerCase().replace(/\s+/g, ""))
    );
    const hasSizeRestrictions = eligibleSizesSet.size > 0;

    const offerProductIds = new Set((offer.products || []).map((p) => p.id));
    const offerProductSlugs = new Set((offer.products || []).map((p) => p.slug));

    const eligibleLines: { unitPrice: number; ml: number; count: number; slug: string }[] = [];

    for (const it of items) {
      const productMatches =
        offer.applicableToAll ||
        (it.productId && offerProductIds.has(it.productId)) ||
        offerProductSlugs.has(it.slug);

      if (!productMatches) continue;

      const sizeKey = `${it.ml}ml`.toLowerCase();
      const numKey = `${it.ml}`.toLowerCase();
      const sizeMatches =
        !hasSizeRestrictions ||
        eligibleSizesSet.has(sizeKey) ||
        eligibleSizesSet.has(numKey);

      if (!sizeMatches) continue;

      eligibleLines.push({
        unitPrice: it.unitPrice,
        ml: it.ml,
        count: it.qty,
        slug: it.slug,
      });
    }

    if (!eligibleLines.length) continue;

    const totalEligibleQty = eligibleLines.reduce((acc, l) => acc + l.count, 0);
    const reqQty = Math.max(1, offer.requiredQuantity);

    if (totalEligibleQty < reqQty) continue;

    const allowMixed = offer.allowMixedVariants !== false;
    let discountTotal = 0;

    type UnitItem = { unitPrice: number; ml: number };
    const unitGroups: UnitItem[][] = [];
    if (allowMixed) {
      const units: UnitItem[] = [];
      for (const l of eligibleLines) {
        for (let i = 0; i < l.count; i++) {
          units.push({ unitPrice: l.unitPrice, ml: l.ml });
        }
      }
      units.sort((a, b) => b.unitPrice - a.unitPrice);
      unitGroups.push(units);
    } else {
      const bySlug = new Map<string, UnitItem[]>();
      for (const l of eligibleLines) {
        if (!bySlug.has(l.slug)) bySlug.set(l.slug, []);
        for (let i = 0; i < l.count; i++) {
          bySlug.get(l.slug)!.push({ unitPrice: l.unitPrice, ml: l.ml });
        }
      }
      for (const [, units] of bySlug.entries()) {
        units.sort((a, b) => b.unitPrice - a.unitPrice);
        unitGroups.push(units);
      }
    }

    for (const units of unitGroups) {
      const bundleCount = Math.floor(units.length / reqQty);
      if (bundleCount < 1) continue;

      if (offer.offerType === "quantity" && offer.offerPrice != null) {
        const baseUnitOfferPrice = Math.round(offer.offerPrice / reqQty);
        for (let b = 0; b < bundleCount; b++) {
          const bundleUnits = units.slice(b * reqQty, (b + 1) * reqQty);
          const regularTotal = bundleUnits.reduce((acc, p) => acc + p.unitPrice, 0);
          const bundleOfferPrice = bundleUnits.reduce(
            (acc, p) => acc + getUnitOfferPrice(baseUnitOfferPrice, p.ml, offer.percentageIncrease),
            0
          );
          if (regularTotal > bundleOfferPrice) {
            discountTotal += regularTotal - bundleOfferPrice;
          }
        }
      } else if (offer.offerType === "percentage" && offer.discountValue != null) {
        const discountedUnits = units.slice(0, bundleCount * reqQty);
        const sum = discountedUnits.reduce((acc, p) => acc + p.unitPrice, 0);
        discountTotal += Math.round(sum * (offer.discountValue / 100));
      } else if (offer.offerType === "fixed" && offer.discountValue != null) {
        discountTotal += Math.round(offer.discountValue * bundleCount);
      }
    }

    if (discountTotal > 0) {
      if (!bestResult || discountTotal > bestResult.discountTotal) {
        bestResult = {
          offerId: offer.id,
          offerTitle: offer.title,
          offerType: offer.offerType,
          discountTotal,
          savingsText: `Save ₹${(discountTotal / 100).toLocaleString("en-IN")}`,
        };
      }
    }
  }

  return bestResult;
}

