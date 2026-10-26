"use client";

import { useRef, useState } from "react";
import Link from "next/link";

// Brand (same as Choose Your Bottle)
const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const INK = "#111111";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// ---------- EDIT HERE ----------
// Banner image (a full link, or a file like "/images/new-arrivals.jpg").
// Use "" for a plain dark banner.
const BANNER_IMAGE =
  "https://images.pexels.com/photos/31707005/pexels-photo-31707005.jpeg?auto=compress&cs=tinysrgb&w=1920";

// Placeholder photos (shared by every product below, replace per product)
const IMG =
  "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";
const IMG_HOVER =
  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";

type Gender = "Women" | "Men" | "Unisex";

interface Perfume {
  slug: string; // must be unique: used for the /product/<slug> link
  name: string;
  price: number;
  mrp: number;
  gender: Gender;
  badge?: string;
  image?: string; // optional, default is /perfumes/main.jpg
  hoverImage?: string; // optional, default is /perfumes/hover.jpg
}

// Placeholder names and prices: replace with your real products
const perfumes: Perfume[] = [
  { slug: "midnight-rose", name: "Midnight Rose Eau De Parfum", price: 646, mrp: 795, gender: "Women", badge: "New", image: IMG, hoverImage: IMG_HOVER },
  { slug: "bloom", name: "Bloom Eau De Parfum", price: 556, mrp: 695, gender: "Women", badge: "New", image: IMG, hoverImage: IMG_HOVER },
  { slug: "amber-glow", name: "Amber Glow Eau De Parfum", price: 646, mrp: 795, gender: "Women", badge: "New", image: IMG, hoverImage: IMG_HOVER },
  { slug: "spice-route", name: "Spice Route Eau De Parfum", price: 596, mrp: 745, gender: "Men", badge: "New", image: IMG, hoverImage: IMG_HOVER },
  { slug: "black-amber", name: "Black Amber Eau De Parfum", price: 646, mrp: 795, gender: "Men", badge: "New", image: IMG, hoverImage: IMG_HOVER },
  { slug: "cedar-wood", name: "Cedar Wood Eau De Parfum", price: 556, mrp: 695, gender: "Men", badge: "New", image: IMG, hoverImage: IMG_HOVER },
  { slug: "velvet-smoke", name: "Velvet Smoke Eau De Parfum", price: 646, mrp: 795, gender: "Unisex", badge: "New", image: IMG, hoverImage: IMG_HOVER },
  { slug: "golden-iris", name: "Golden Iris Eau De Parfum", price: 596, mrp: 745, gender: "Unisex", badge: "New", image: IMG, hoverImage: IMG_HOVER },
  { slug: "white-sage", name: "White Sage Eau De Parfum", price: 556, mrp: 695, gender: "Unisex", badge: "New", image: IMG, hoverImage: IMG_HOVER },
];

const TABS = ["All", "Women", "Men", "Unisex"] as const;
type Tab = (typeof TABS)[number];

/* ---------- icons ---------- */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 0 0 0-7.4z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export default function NewArrivalsPage() {
  const [tab, setTab] = useState<Tab>("All");
  const [wish, setWish] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Record<string, number>>({}); // slug -> quantity
  const [toast, setToast] = useState("");
  const timer = useRef<number | undefined>(undefined);

  const visible =
    tab === "All" ? perfumes : perfumes.filter((p) => p.gender === tab);

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(""), 1800);
  };

  const toggleWish = (p: Perfume) => {
    const next = new Set(wish);
    const saved = next.has(p.slug);
    if (saved) next.delete(p.slug);
    else next.add(p.slug);
    setWish(next);
    say(saved ? "Removed from wishlist" : "Saved to wishlist");
  };

  // Connect this to your real cart (context, store or API) when you have one.
  const addToCart = (p: Perfume) => {
    setCart((c) => ({ ...c, [p.slug]: (c[p.slug] ?? 0) + 1 }));
    say(`${p.name} added to cart`);
  };

  return (
    <main className="min-h-screen px-6 py-12 lg:px-16" style={{ background: IVORY, color: INK, fontFamily: sans }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600&family=Inter:wght@400;500;600&display=swap");
        .mq-serif { font-family: ${serif}; }
      `}</style>
      <div className="mx-auto max-w-[1400px]">
        {/* Banner */}
        <section className="relative mb-8 h-[300px] w-full overflow-hidden bg-[#111111] sm:h-[360px] lg:h-[420px]">
          {BANNER_IMAGE && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={BANNER_IMAGE}
              alt="New arrivals perfume campaign"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          )}

          {/* Darker on the left, where the text is */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

          {/* Text: centered on phones, on the left from tablet up */}
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center sm:justify-start sm:pl-[8%] sm:text-left lg:pl-[10%]">
            <div className="max-w-xl text-white drop-shadow-md">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] sm:text-sm">
                Just landed
              </p>
              <h1 className="mq-serif text-4xl font-medium leading-tight sm:text-5xl lg:text-7xl">
                New
                <span className="block text-5xl sm:text-6xl lg:text-8xl">
                  Arrivals
                </span>
              </h1>
              <a
                href="#new-perfumes"
                className="mt-6 inline-flex border border-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-white hover:text-[#9C5A2B] sm:mt-8"
              >
                Shop Now
              </a>
            </div>
          </div>
        </section>

        {/* Filter tabs */}
        <div
          className="mb-4 flex flex-wrap gap-3"
          role="tablist"
          aria-label="Filter new arrivals"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`border px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                tab === t
                  ? "border-[#9C5A2B] bg-[#9C5A2B] text-white"
                  : "border-[#9C5A2B]/40 text-[#9C5A2B] hover:border-[#9C5A2B]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="mb-10 text-sm text-[#111111]/60">
          NEW ARRIVALS &nbsp;|&nbsp; {visible.length} Products
        </p>

        {visible.length === 0 ? (
          <p className="py-10 text-center text-[#111111]/60">
            No new arrivals here yet.
          </p>
        ) : (
          <div
            id="new-perfumes"
            className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4"
          >
            {visible.map((p) => {
              const saved = wish.has(p.slug);
              const inCart = cart[p.slug] ?? 0;
              return (
                /* The buttons sit beside the Link (not inside it) so clicking them never opens the product page */
                <div key={p.slug} className="group relative">
                  <Link href={`/product/${p.slug}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image ?? "/perfumes/main.jpg"}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500 group-hover:opacity-0"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.hoverImage ?? "/perfumes/hover.jpg"}
                        alt={`${p.name} alternate view`}
                        className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      />
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#111111]/50">
                        {p.gender}
                      </p>
                      <h3 className="mq-serif mt-1 text-xl font-medium leading-snug text-[#9C5A2B]">{p.name}</h3>
                      <p className="mt-2 text-sm font-semibold">
                        ₹ {p.price}
                        <span className="ml-2 text-xs font-normal text-[#111111]/45 line-through">
                          ₹ {p.mrp}
                        </span>
                      </p>
                    </div>
                  </Link>

                  {/* Badge (top left of the image) */}
                  {p.badge && (
                    <span className="pointer-events-none absolute left-0 top-0 z-10 max-w-[140px] bg-[#9C5A2B] px-3 py-2 text-xs font-semibold leading-tight text-white">
                      {p.badge}
                    </span>
                  )}

                  {/* Wishlist heart: top right of the image */}
                  <button
                    type="button"
                    aria-pressed={saved}
                    aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
                    onClick={() => toggleWish(p)}
                    className={`absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-colors duration-300 ${
                      saved
                        ? "border-[#9C5A2B] bg-[#9C5A2B] text-white"
                        : "border-[#9C5A2B]/30 bg-white text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white"
                    }`}
                  >
                    <HeartIcon filled={saved} />
                  </button>

                  {/* Add to cart: bottom right of the image */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4]">
                    <button
                      type="button"
                      aria-label={`Add ${p.name} to cart`}
                      onClick={() => addToCart(p)}
                      className="pointer-events-auto absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#9C5A2B] bg-[#9C5A2B] text-white shadow-md transition-colors duration-300 hover:bg-[#7d4720]"
                    >
                      <BagIcon />
                      {inCart > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[10px] font-semibold leading-none text-white">
                          {inCart}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      <div
        role="status"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 bg-[#9C5A2B] px-5 py-3 text-center text-sm text-white shadow-lg transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        {toast}
      </div>
    </main>
  );
}