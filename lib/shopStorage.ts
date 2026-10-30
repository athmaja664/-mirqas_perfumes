// Browser wishlist + cart helpers (localStorage). Same keys and item shape as
// app/wishlist/page.tsx, app/cart/page.tsx and the product cards.
// After every change it fires "mirqas-storage" so the navbar counts update at once.

import { useEffect, useState } from "react";

export const WISHLIST_KEY = "mirqas-wishlist";
export const CART_KEY = "mirqas-cart";
export const SYNC_EVENT = "mirqas-storage";

export type SizeOption = {
  ml: number;
  price: number; // rupees
  originalPrice?: number; // rupees
  soldOut?: boolean;
};

export type WishItem = {
  slug: string;
  name: string;
  image?: string;
  hoverImage?: string;
  notes?: string[];
  sizes: SizeOption[];
  soldOut?: boolean;
};

export type CartLine = {
  slug: string;
  name: string;
  image?: string;
  notes?: string[];
  sizes: SizeOption[];
  ml: number;
  qty: number;
};

// The normal price is the 10ml price. The other sizes are worked out from it.
// (Same numbers as the shop cards, so the price is the same everywhere.)
const DEFAULT_STEPS = [
  { ml: 10, mult: 1 },
  { ml: 30, mult: 2.25 },
  { ml: 50, mult: 3.4 },
  { ml: 100, mult: 5.6 },
];

export function sizesFor(basePrice: number, mrpBase?: number): SizeOption[] {
  return DEFAULT_STEPS.map(({ ml, mult }) => ({
    ml,
    price: Math.round(basePrice * mult),
    originalPrice: mrpBase ? Math.round(mrpBase * mult) : undefined,
  }));
}

// Prices show like Rs. 799.00
export const formatPrice = (n: number) =>
  "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function writeList<T>(key: string, list: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch {
    // storage full or blocked: ignore
  }
}

export function addLineToCart(item: WishItem, ml: number, qty = 1) {
  const cart = readList<CartLine>(CART_KEY);
  const i = cart.findIndex((c) => c.slug === item.slug && c.ml === ml);
  if (i >= 0) {
    cart[i] = { ...cart[i], qty: cart[i].qty + qty };
  } else {
    cart.push({
      slug: item.slug,
      name: item.name,
      image: item.image,
      notes: item.notes,
      sizes: item.sizes,
      ml,
      qty,
    });
  }
  writeList(CART_KEY, cart);
}

export function toggleWishlist(item: WishItem) {
  const list = readList<WishItem>(WISHLIST_KEY);
  const next = list.some((i) => i.slug === item.slug)
    ? list.filter((i) => i.slug !== item.slug)
    : [...list, item];
  writeList(WISHLIST_KEY, next);
}

// true while the product is in the saved wishlist (also updates when changed elsewhere)
export function useWished(slug: string) {
  const [wished, setWished] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const sync = () => setWished(readList<WishItem>(WISHLIST_KEY).some((i) => i.slug === slug));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SYNC_EVENT, sync);
    };
  }, [slug]);

  return wished;
}