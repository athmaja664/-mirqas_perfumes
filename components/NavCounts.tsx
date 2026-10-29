"use client";

// components/NavCounts.tsx
// Wishlist (heart) and Cart (bag) icons with a count badge.
// Put <NavCounts /> inside your navbar. It reads the same localStorage keys as the
// wishlist page, cart page and product cards, and updates the moment anything is added or removed.

import Link from "next/link";
import { useEffect, useState } from "react";

const COPPER = "#9C5A2B";
const WISHLIST_KEY = "mirqas-wishlist";
const CART_KEY = "mirqas-cart";
const SYNC_EVENT = "mirqas-storage";

function readCounts() {
  try {
    const wish = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]") as unknown[];
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as { qty?: number }[];
    return {
      wishlist: Array.isArray(wish) ? wish.length : 0,
      cart: Array.isArray(cart) ? cart.reduce((n, i) => n + (i.qty ?? 1), 0) : 0,
    };
  } catch {
    return { wishlist: 0, cart: 0 };
  }
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white"
      style={{ background: COPPER }}
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function NavCounts({ className = "" }: { className?: string }) {
  const [counts, setCounts] = useState({ wishlist: 0, cart: 0 });

  useEffect(() => {
    const update = () => setCounts(readCounts());
    update();
    window.addEventListener("storage", update); // other tabs
    window.addEventListener(SYNC_EVENT, update); // this tab
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(SYNC_EVENT, update);
    };
  }, []);

  return (
    <div className={`flex items-center gap-5 ${className}`}>
      {/* Wishlist */}
      <Link
        href="/wishlist"
        aria-label={`Wishlist, ${counts.wishlist} ${counts.wishlist === 1 ? "item" : "items"}`}
        className="relative inline-flex transition-colors hover:text-[#9C5A2B]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        <Badge count={counts.wishlist} />
      </Link>

      {/* Cart */}
      <Link
        href="/cart"
        aria-label={`Cart, ${counts.cart} ${counts.cart === 1 ? "item" : "items"}`}
        className="relative inline-flex transition-colors hover:text-[#9C5A2B]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 7h12l-1 13H7L6 7z" />
          <path d="M9 7V6a3 3 0 0 1 6 0v1" />
        </svg>
        <Badge count={counts.cart} />
      </Link>
    </div>
  );
}