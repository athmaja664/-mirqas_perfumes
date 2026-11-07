import { connectDB, Op } from "@/lib/db";
import { Offer, OfferProduct, type IOffer, type OfferStatus, type OfferType } from "@/models/Offer";
import { Product } from "@/models/Product";
import { randomUUID } from "crypto";

export interface OfferLineItem {
  productId?: string;
  slug: string;
  name?: string;
  ml: number;
  qty: number;
  unitPrice: number; // in paise
}

export interface AppliedOfferResult {
  offerId: string;
  offerTitle: string;
  offerType: OfferType;
  discountTotal: number; // in paise
  savingsText: string;
}

export interface OfferMetrics {
  total: number;
  active: number;
  scheduled: number;
  expired: number;
}

export function toOffer(o: Offer) {
  const json = typeof o.toJSON === "function" ? o.toJSON() : o;
  return {
    id: json.id,
    title: json.title,
    description: json.description || "",
    offerType: json.offerType,
    offerPrice: json.offerPrice,
    discountValue: json.discountValue != null ? Number(json.discountValue) : null,
    requiredQuantity: json.requiredQuantity,
    eligibleSizes: Array.isArray(json.eligibleSizes) ? json.eligibleSizes : [],
    allowMixedVariants: Boolean(json.allowMixedVariants),
    applicableToAll: Boolean(json.applicableToAll),
    displayHomepage: Boolean(json.displayHomepage),
    displayListing: Boolean(json.displayListing),
    displayProductDetails: Boolean(json.displayProductDetails),
    bannerImage: json.bannerImage || null,
    startDate: json.startDate ? new Date(json.startDate).toISOString() : null,
    endDate: json.endDate ? new Date(json.endDate).toISOString() : null,
    status: json.status,
    products: Array.isArray(json.products)
      ? json.products.map((p: Product) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: Array.isArray(p.images) ? p.images[0] : "",
          price: p.price,
          salePrice: p.salePrice,
        }))
      : [],
    createdAt: json.createdAt ? new Date(json.createdAt).toISOString() : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt).toISOString() : undefined,
  };
}

export async function getOfferMetrics(): Promise<OfferMetrics> {
  await connectDB();
  const all = await Offer.findAll();
  const now = new Date();

  let total = all.length;
  let active = 0;
  let scheduled = 0;
  let expired = 0;

  for (const o of all) {
    if (o.status !== "published") continue;
    const start = o.startDate ? new Date(o.startDate) : null;
    const end = o.endDate ? new Date(o.endDate) : null;

    if (start && start > now) {
      scheduled++;
    } else if (end && end < now) {
      expired++;
    } else {
      active++;
    }
  }

  return { total, active, scheduled, expired };
}

export async function listAdminOffers(sp: URLSearchParams) {
  await connectDB();
  const search = (sp.get("search") || "").trim();
  const status = (sp.get("status") || "all").trim();

  const where: Record<string | symbol, unknown> = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (search) {
    where[Op.or as unknown as symbol] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const offers = await Offer.findAll({
    where,
    include: [{ model: Product, as: "products" }],
    order: [["createdAt", "DESC"]],
  });

  const metrics = await getOfferMetrics();
  return {
    offers: offers.map(toOffer),
    metrics,
  };
}

export async function getActivePublishedOffers(placement?: "homepage" | "listing" | "productDetails") {
  await connectDB();
  const now = new Date();

  const where: Record<string | symbol, unknown> = {
    status: "published",
    [Op.and as unknown as symbol]: [
      {
        [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: now } }],
      },
      {
        [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }],
      },
    ],
  };

  if (placement === "homepage") where.displayHomepage = true;
  if (placement === "listing") where.displayListing = true;
  if (placement === "productDetails") where.displayProductDetails = true;

  const offers = await Offer.findAll({
    where,
    include: [{ model: Product, as: "products" }],
    order: [["createdAt", "DESC"]],
  });

  return offers.map(toOffer);
}

export async function getOfferById(id: string) {
  await connectDB();
  const offer = await Offer.findByPk(id, {
    include: [{ model: Product, as: "products" }],
  });
  return offer ? toOffer(offer) : null;
}

export async function createOffer(data: {
  title: string;
  description?: string;
  offerType: OfferType;
  offerPrice?: number | null; // in paise
  discountValue?: number | null;
  requiredQuantity: number;
  eligibleSizes: string[];
  allowMixedVariants?: boolean;
  applicableToAll?: boolean;
  displayHomepage?: boolean;
  displayListing?: boolean;
  displayProductDetails?: boolean;
  bannerImage?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: OfferStatus;
  productIds?: string[];
}) {
  await connectDB();
  const offerId = randomUUID();

  const offer = await Offer.create({
    id: offerId,
    title: data.title.trim(),
    description: (data.description || "").trim(),
    offerType: data.offerType,
    offerPrice: data.offerPrice ?? null,
    discountValue: data.discountValue ?? null,
    requiredQuantity: Math.max(1, data.requiredQuantity || 1),
    eligibleSizes: data.eligibleSizes || [],
    allowMixedVariants: data.allowMixedVariants !== false,
    applicableToAll: Boolean(data.applicableToAll),
    displayHomepage: data.displayHomepage !== false,
    displayListing: data.displayListing !== false,
    displayProductDetails: data.displayProductDetails !== false,
    bannerImage: data.bannerImage || null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    status: data.status || "draft",
  });

  if (Array.isArray(data.productIds) && data.productIds.length > 0 && !data.applicableToAll) {
    const pairs = data.productIds.map((pId) => ({
      id: randomUUID(),
      offerId,
      productId: pId,
    }));
    await OfferProduct.bulkCreate(pairs);
  }

  return getOfferById(offerId);
}

export async function updateOffer(
  id: string,
  data: {
    title?: string;
    description?: string;
    offerType?: OfferType;
    offerPrice?: number | null;
    discountValue?: number | null;
    requiredQuantity?: number;
    eligibleSizes?: string[];
    allowMixedVariants?: boolean;
    applicableToAll?: boolean;
    displayHomepage?: boolean;
    displayListing?: boolean;
    displayProductDetails?: boolean;
    bannerImage?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    status?: OfferStatus;
    productIds?: string[];
  }
) {
  await connectDB();
  const offer = await Offer.findByPk(id);
  if (!offer) return null;

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title.trim();
  if (data.description !== undefined) updates.description = data.description.trim();
  if (data.offerType !== undefined) updates.offerType = data.offerType;
  if (data.offerPrice !== undefined) updates.offerPrice = data.offerPrice;
  if (data.discountValue !== undefined) updates.discountValue = data.discountValue;
  if (data.requiredQuantity !== undefined) updates.requiredQuantity = Math.max(1, data.requiredQuantity);
  if (data.eligibleSizes !== undefined) updates.eligibleSizes = data.eligibleSizes;
  if (data.allowMixedVariants !== undefined) updates.allowMixedVariants = data.allowMixedVariants;
  if (data.applicableToAll !== undefined) updates.applicableToAll = data.applicableToAll;
  if (data.displayHomepage !== undefined) updates.displayHomepage = data.displayHomepage;
  if (data.displayListing !== undefined) updates.displayListing = data.displayListing;
  if (data.displayProductDetails !== undefined) updates.displayProductDetails = data.displayProductDetails;
  if (data.bannerImage !== undefined) updates.bannerImage = data.bannerImage;
  if (data.startDate !== undefined) updates.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updates.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.status !== undefined) updates.status = data.status;

  await offer.update(updates);

  if (Array.isArray(data.productIds)) {
    await OfferProduct.destroy({ where: { offerId: id } });
    if (data.productIds.length > 0 && !data.applicableToAll) {
      const pairs = data.productIds.map((pId) => ({
        id: randomUUID(),
        offerId: id,
        productId: pId,
      }));
      await OfferProduct.bulkCreate(pairs);
    }
  }

  return getOfferById(id);
}

export async function deleteOffer(id: string) {
  await connectDB();
  await OfferProduct.destroy({ where: { offerId: id } });
  const count = await Offer.destroy({ where: { id } });
  return count > 0;
}

export async function toggleOfferStatus(id: string, status: OfferStatus) {
  await connectDB();
  const offer = await Offer.findByPk(id);
  if (!offer) return null;
  await offer.update({ status });
  return getOfferById(id);
}

/**
 * Calculates the best offer discount for the given items in cart or order.
 * Items contain { productId, slug, ml, qty, unitPrice (in paise) }.
 */
export function evaluateOffers(
  items: OfferLineItem[],
  activeOffers: ReturnType<typeof toOffer>[]
): AppliedOfferResult | null {
  if (!items.length || !activeOffers.length) return null;

  let bestResult: AppliedOfferResult | null = null;

  for (const offer of activeOffers) {
    // 1. Identify which items qualify for this offer
    const eligibleSizesSet = new Set(
      (offer.eligibleSizes || []).map((s) => s.toLowerCase().replace(/\s+/g, ""))
    );
    const hasSizeRestrictions = eligibleSizesSet.size > 0;

    const offerProductIds = new Set((offer.products || []).map((p) => p.id));
    const offerProductSlugs = new Set((offer.products || []).map((p) => p.slug));

    const eligibleLines: { unitPrice: number; count: number }[] = [];

    for (const it of items) {
      // Check product match
      const productMatches =
        offer.applicableToAll ||
        (it.productId && offerProductIds.has(it.productId)) ||
        offerProductSlugs.has(it.slug);

      if (!productMatches) continue;

      // Check size match
      const sizeKey = `${it.ml}ml`.toLowerCase();
      const numKey = `${it.ml}`.toLowerCase();
      const sizeMatches =
        !hasSizeRestrictions ||
        eligibleSizesSet.has(sizeKey) ||
        eligibleSizesSet.has(numKey);

      if (!sizeMatches) continue;

      eligibleLines.push({
        unitPrice: it.unitPrice,
        count: it.qty,
      });
    }

    if (!eligibleLines.length) continue;

    // Check quantity requirement
    const totalEligibleQty = eligibleLines.reduce((acc, l) => acc + l.count, 0);
    const reqQty = Math.max(1, offer.requiredQuantity);

    if (totalEligibleQty < reqQty) continue;

    // Expand into individual unit prices for exact bundle calculations
    const units: number[] = [];
    for (const l of eligibleLines) {
      for (let i = 0; i < l.count; i++) {
        units.push(l.unitPrice);
      }
    }
    // Sort units ascending or descending to apply bundle predictably
    units.sort((a, b) => b - a);

    const bundleCount = Math.floor(units.length / reqQty);
    if (bundleCount < 1) continue;

    let discountTotal = 0;

    if (offer.offerType === "quantity" && offer.offerPrice != null) {
      // "Buy X bottles for special price ₹Y"
      // For each bundle of reqQty bottles, sum their prices and subtract offerPrice
      for (let b = 0; b < bundleCount; b++) {
        const bundleUnits = units.slice(b * reqQty, (b + 1) * reqQty);
        const regularTotal = bundleUnits.reduce((acc, p) => acc + p, 0);
        if (regularTotal > offer.offerPrice) {
          discountTotal += regularTotal - offer.offerPrice;
        }
      }
    } else if (offer.offerType === "percentage" && offer.discountValue != null) {
      // "X% off on purchase of Y bottles"
      const discountedUnits = units.slice(0, bundleCount * reqQty);
      const sum = discountedUnits.reduce((acc, p) => acc + p, 0);
      discountTotal = Math.round(sum * (offer.discountValue / 100));
    } else if (offer.offerType === "fixed" && offer.discountValue != null) {
      // "₹X off on purchase of Y bottles"
      // offer.discountValue is in paise
      discountTotal = Math.round(offer.discountValue * bundleCount);
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

