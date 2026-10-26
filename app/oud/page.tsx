"use client";

// app/oud-arabian/page.tsx  (Next.js App Router + Tailwind)
// Visit: http://localhost:3000/oud-arabian

import { useEffect, useState } from "react";
import Image from "next/image";

const GOLD = "#D4A017";
const COPPER = "#B87333";

// Paste your hero image URL here (https://... or /oud-arabian/hero.jpg).
// Leave it empty ("") to show the example placeholder.
const HERO_IMAGE = "https://images.pexels.com/photos/30618765/pexels-photo-30618765.jpeg";

// Paste your history section image URL here. Leave "" for the placeholder.
const HISTORY_IMAGE = "/images/history.jpg";

type Item = { name: string; size: string; price: string; image?: string; soldOut?: boolean };

// Put each product photo in /public/oud-arabian/ (or use a direct https image URL)
// Add `soldOut: true` to any product that is out of stock.
const collection: Item[] = [
  { name: "Nadeem", size: "100ML", price: "₹ 6,290.00", image: "/images/collection-one.jpg" },
  { name: "Oudh Al Ayal", size: "100ML", price: "₹ 2,490.00", image: "/images/collection-two.jpg" },
  { name: "A Poem", size: "100ML", price: "₹ 5,990.00", image: "/images/collection-three.jpg" },
  { name: "Rouge Vanilla", size: "100ML", price: "₹ 5,990.00", image: "/images/collection-four.jpg", soldOut: true },
  { name: "7 Moons", size: "100ML", price: "₹ 5,990.00", image: "/images/collection-nine.jpg" },
  { name: "Maliki", size: "100ML", price: "₹ 5,990.00", image: "/images/collection-seven.jpg" },
];

const history = [
  {
    year: "Origins",
    text: "Oud, the dark resinous heartwood of the Aquilaria tree, has been treasured in Arabia for centuries. Burned in homes and worn as oil, it became a sign of hospitality and honour.",
  },
  {
    year: "The Craft",
    text: "Master perfumers age oud for months, sometimes years, distilling it slowly to draw out its deep, smoky-sweet character. Every batch is blended by hand.",
  },
  {
    year: "Today",
    text: "Oud Arabian carries this heritage forward, pairing time-honoured attars with modern perfumes in bottles worthy of the tradition.",
  },
];

// Placeholder shown when no real image is supplied
function ExampleImage({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-black to-neutral-900 ${className}`}
    >
      <svg viewBox="0 0 200 200" className="h-1/2 w-1/2 opacity-80" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor={COPPER} />
          </linearGradient>
        </defs>
        <rect x="70" y="80" width="60" height="90" rx="10" stroke="url(#g)" strokeWidth="3" />
        <rect x="88" y="55" width="24" height="25" rx="4" stroke="url(#g)" strokeWidth="3" />
        <path d="M80 120h40" stroke="url(#g)" strokeWidth="2" />
      </svg>
      <span
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em]"
        style={{ color: COPPER }}
      >
        {label}
      </span>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill={filled ? GOLD : "none"}
      stroke={filled ? GOLD : "currentColor"}
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20.5s-7.5-4.6-9-9.3C2 7.9 4 5 7 5c1.9 0 3.5 1 5 3 1.5-2 3.1-3 5-3 3 0 5 2.9 4 6.2-1.5 4.7-9 9.3-9 9.3z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 4h2l2.2 11h10.6L20 7H6.2" />
      <circle cx="9" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-[#D4A017] backdrop-blur-sm transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4A017]";

function ProductCard({
  p,
  wished,
  onToggleWish,
}: {
  p: Item;
  wished: boolean;
  onToggleWish: (name: string) => void;
}) {
  const [added, setAdded] = useState(false);

  // The check mark goes back to the cart icon after about 2 seconds
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  const addToCart = () => {
    if (p.soldOut) return;
    // TODO: connect your cart here, e.g. addItem({ name: p.name, price: p.price })
    setAdded(true);
  };

  return (
    <div className="group block text-center">
      <div className="relative overflow-hidden">
        {/* Image (links to the product page) */}
        <a href="#" className="block" aria-label={p.name}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image}
              alt={p.name}
              className="aspect-square w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <ExampleImage label={p.name} className="aspect-square w-full" />
          )}
        </a>

        {/* Wishlist: top right */}
        <button
          type="button"
          onClick={() => onToggleWish(p.name)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
          className={`${iconBtn} absolute right-2 top-2`}
        >
          <HeartIcon filled={wished} />
        </button>

        {/* Add to cart (or Sold out): bottom right */}
        {p.soldOut ? (
          <span
            className="pointer-events-none absolute bottom-2 right-2 bg-black/80 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: COPPER }}
          >
            Sold out
          </span>
        ) : (
          <button
            type="button"
            onClick={addToCart}
            aria-live="polite"
            aria-label={added ? `${p.name} added to cart` : `Add ${p.name} to cart`}
            className={`${iconBtn} absolute bottom-2 right-2`}
          >
            {added ? <CheckIcon /> : <CartIcon />}
          </button>
        )}
      </div>

      <a href="#" className="block">
        <h3 className="mt-5 text-sm uppercase tracking-[0.3em]">
          {p.name} ({p.size})
        </h3>
        <p className="mt-2 text-sm text-white">{p.price}</p>
      </a>
    </div>
  );
}

export default function OudArabianPage() {
  const [wishlist, setWishlist] = useState<string[]>([]);

  const toggleWish = (name: string) =>
    setWishlist((w) => (w.includes(name) ? w.filter((n) => n !== name) : [...w, name]));

  return (
    <main className="min-h-screen bg-black text-[#D4A017]">
      {/* HERO */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0">
          {HERO_IMAGE ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={HERO_IMAGE}
              alt="Oud Arabian"
              className="h-full w-full object-cover opacity-50"
            />
          ) : (
            <ExampleImage label="Hero image" className="h-full w-full opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
        </div>
        <div className="relative z-10">
          <p className="mb-4 text-sm uppercase tracking-[0.5em]" style={{ color: COPPER }}>
            Mirqas Presents
          </p>
          <h1 className="text-5xl font-light uppercase tracking-[0.25em] md:text-7xl">Oud Arabian</h1>
          <div className="mx-auto my-6 h-px w-24" style={{ background: COPPER }} />
          <p className="mx-auto max-w-xl text-lg" style={{ color: COPPER }}>
            A tribute to the ancient art of oud, crafted in gold and shadow.
          </p>
          <a
            href="#collection"
            className="mt-10 inline-block border px-8 py-3 text-sm uppercase tracking-[0.3em] transition hover:bg-[#D4A017] hover:text-black"
            style={{ borderColor: GOLD }}
          >
            Explore Collection
          </a>
        </div>
      </section>

      {/* HISTORY */}
      <section className="border-y py-20" style={{ borderColor: "#3a2a12" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          {HISTORY_IMAGE ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={HISTORY_IMAGE}
              alt="Oud Arabian history"
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <ExampleImage label="History image" className="aspect-[4/5] w-full" />
          )}
          <div>
            <h2 className="mb-10 text-3xl uppercase tracking-[0.3em]">Our History</h2>
            <div className="space-y-8">
              {history.map((h) => (
                <div key={h.year} className="border-l-2 pl-6" style={{ borderColor: COPPER }}>
                  <h3 className="mb-2 text-sm uppercase tracking-[0.3em]" style={{ color: COPPER }}>
                    {h.year}
                  </h3>
                  <p className="leading-relaxed text-[#C9A24B]">{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION  (3-column grid, full-size product photos like Oud Arabia) */}
      <section id="collection" className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="mb-14 text-center text-3xl uppercase tracking-[0.3em]">The Collection</h2>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {collection.map((p) => (
            <ProductCard
              key={p.name}
              p={p}
              wished={wishlist.includes(p.name)}
              onToggleWish={toggleWish}
            />
          ))}
        </div>
      </section>

      <footer className="py-10 text-center text-xs uppercase tracking-[0.4em]" style={{ color: COPPER }}>
        © Mirqas Perfumes · Oud Arabian
      </footer>
    </main>
  );
}