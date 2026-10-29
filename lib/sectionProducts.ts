"use client";

import { useEffect, useState } from "react";

export type SizeOption = { ml: number; price: number; originalPrice?: number; soldOut?: boolean };

export type ShopProduct = {
  slug: string;
  name: string;
  description: string;
  category: string;
  gender: string;
  price: number; // rupees, the 10ml price (the sale price if the product is on sale)
  originalPrice?: number; // rupees, only when on sale
  inStock: boolean;
  badge?: string;
  notes: string[];
  image?: string;
  hoverImage?: string;
  video?: string;
  createdAt: string;
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

// What /api/products sends (prices are in paise)
type ApiProduct = {
  slug: string;
  name: string;
  description?: string;
  category: string;
  gender?: string;
  price: number;
  salePrice: number | null;
  images?: string[];
  video?: string;
  badge?: string;
  inStock: boolean;
  notes?: string[];
  createdAt?: string;
};

export const WISHLIST_KEY = "mirqas-wishlist";
export const CART_KEY = "mirqas-cart";
const SYNC_EVENT = "mirqas-storage";

// Price of each size = the 10ml price x mult (same as the Shop All page)
export const SIZE_STEPS = [
  { ml: 10, mult: 1 },
  { ml: 30, mult: 2.25 },
  { ml: 50, mult: 3.4 },
  { ml: 100, mult: 5.6 },
];

export function sizesOf(p: { price: number; originalPrice?: number }): SizeOption[] {
  return SIZE_STEPS.map(({ ml, mult }) => ({
    ml,
    price: Math.round(p.price * mult),
    originalPrice: p.originalPrice ? Math.round(p.originalPrice * mult) : undefined,
  }));
}

export function toShopProduct(a: ApiProduct): ShopProduct {
  const onSale = a.salePrice != null;
  return {
    slug: a.slug,
    name: a.name,
    description: a.description ?? "",
    category: a.category,
    gender: a.gender ?? "Unisex",
    price: (onSale ? a.salePrice! : a.price) / 100,
    originalPrice: onSale ? a.price / 100 : undefined,
    inStock: a.inStock,
    badge: a.badge || undefined,
    notes: a.notes ?? [],
    image: a.images?.[0],
    hoverImage: a.images?.[1],
    video: a.video || undefined,
    createdAt: a.createdAt ?? "",
  };
}

// Loads every product of one section, e.g. "luxury", "gift-sets", "oud-arabian", "new-arrivals"
export function useSectionProducts(section: string) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const all: ApiProduct[] = [];
        let page = 1;
        let pages = 1;
        do {
          const res = await fetch(`/api/products?section=${encodeURIComponent(section)}&limit=48&page=${page}`);
          if (!res.ok) throw new Error("Could not load products");
          const data = (await res.json()) as { items: ApiProduct[]; pages: number };
          all.push(...data.items);
          pages = data.pages;
          page++;
        } while (page <= pages && page <= 10);

        if (!cancelled) setProducts(all.map(toShopProduct));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [section]);

  return { products, loaded, error };
}

// ---------------------------------------------------------------------------
// Cart + wishlist saved in the browser (same keys as the navbar, cart page and wishlist page)
// ---------------------------------------------------------------------------
export function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeList<T>(key: string, list: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch (error) {
    console.error(`Unable to save ${key}`, error);
  }
}

export function addToCart(p: ShopProduct, ml: number) {
  const cart = readList<CartLine>(CART_KEY);
  const i = cart.findIndex((l) => l.slug === p.slug && l.ml === ml);
  if (i >= 0) {
    cart[i] = { ...cart[i], qty: (Number(cart[i].qty) || 0) + 1 };
  } else {
    cart.push({
      slug: p.slug,
      name: p.name,
      image: p.image,
      notes: p.notes.length ? p.notes : undefined,
      sizes: sizesOf(p),
      ml,
      qty: 1,
    });
  }
  writeList(CART_KEY, cart);
}

// Returns true when the product is now in the wishlist
export function toggleWishlist(p: ShopProduct): boolean {
  const saved = readList<WishItem>(WISHLIST_KEY);
  const exists = saved.some((i) => i.slug === p.slug);
  const next = exists
    ? saved.filter((i) => i.slug !== p.slug)
    : [
        ...saved,
        {
          slug: p.slug,
          name: p.name,
          image: p.image,
          hoverImage: p.hoverImage,
          notes: p.notes.length ? p.notes : undefined,
          sizes: sizesOf(p),
          soldOut: !p.inStock,
        },
      ];
  writeList(WISHLIST_KEY, next);
  return !exists;
}

function useStored<T>(key: string): T[] {
  const [list, setList] = useState<T[]>([]);
  useEffect(() => {
    const sync = () => setList(readList<T>(key));
    sync();
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);
  return list;
}

export const useWishlistSlugs = () => useStored<WishItem>(WISHLIST_KEY).map((i) => i.slug);
export const useStoredCart = () => useStored<CartLine>(CART_KEY);