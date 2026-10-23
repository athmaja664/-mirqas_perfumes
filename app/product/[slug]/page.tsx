"use client";

// Save as: app/product/[slug]/page.tsx
// Images go in: public/perfumes/<slug>/1.jpg ... 4.jpg

import { useState } from "react";
import { useParams } from "next/navigation";

const ACCENT = "#b1e549"; // lime accent (used for buttons / highlights)

type Perfume = {
  slug: string;
  name: string;
  sku: string;
  rating: number;
  reviews: number;
  price20: number;
  mrp20: number;
  notes: string;
  description: string;
};

const perfumes: Perfume[] = [
  { slug: "celeste", name: "Celeste 20 ML Perfume for Women EDP", sku: "FCLW01PD", rating: 4.6, reviews: 272, price20: 556, mrp20: 695, notes: "Top: Mandarin, Grapefruit, Green Pear | Heart: Jasmine Sambac, Orange Flower, Tuberose | Base: Apricot Nectar, Sandalwood, Patchouli, White Musk", description: "Celeste evokes the liveliness of a spring garden, with white floral notes and a touch of zing from peaches and pears. A modern, joyful and feminine fragrance with a creamy dry down of apricot nectar, sandalwood and white musks." },
  { slug: "pristine", name: "Pristine 20 ML Perfume for Women EDP", sku: "FCLW02PD", rating: 4.5, reviews: 198, price20: 556, mrp20: 695, notes: "Top: Bergamot, Lemon | Heart: Lily of the Valley, Peony | Base: Cedarwood, White Musk", description: "Pristine is a crisp, airy fragrance with sparkling citrus, soft white florals and a clean musky trail." },
  { slug: "tales-vanilla", name: "Tales Vanilla 20 ML Perfume for Women EDP", sku: "FCLW03PD", rating: 4.7, reviews: 341, price20: 596, mrp20: 745, notes: "Top: Pear, Bergamot | Heart: Vanilla Orchid, Caramel | Base: Tonka Bean, Amber, Musk", description: "Tales Vanilla wraps you in soft creamy vanilla with a touch of caramel sweetness." },
  { slug: "sheer", name: "Sheer 20 ML Perfume for Women EDP", sku: "FCLW04PD", rating: 4.4, reviews: 156, price20: 556, mrp20: 695, notes: "Top: Peach, Raspberry | Heart: Rose, Freesia | Base: Sandalwood, Vanilla", description: "Sheer blends juicy fruits and delicate roses into a light, radiant, feminine trail." },
  { slug: "nude", name: "Nude 20 ML Perfume for Women EDP", sku: "FCLW05PD", rating: 4.5, reviews: 210, price20: 556, mrp20: 695, notes: "Top: Mandarin, Pink Pepper | Heart: Iris, Jasmine | Base: Musk, Amber, Cashmere Wood", description: "Nude smells like your skin, only better. Soft musks and powdery iris make an intimate, long-lasting signature." },
  { slug: "verve", name: "Verve 20 ML Perfume for Women EDP", sku: "FCLW06PD", rating: 4.3, reviews: 124, price20: 596, mrp20: 745, notes: "Top: Blackcurrant, Lychee | Heart: Magnolia, Rose | Base: Praline, Vanilla, Cedar", description: "Verve is for the confident and spontaneous: juicy fruits, a bright floral heart and a sweet woody base." },
  { slug: "aura", name: "Aura 20 ML Perfume for Women EDP", sku: "FCLW07PD", rating: 4.6, reviews: 188, price20: 596, mrp20: 745, notes: "Top: Aldehydes, Neroli | Heart: Violet, Rose, Ylang Ylang | Base: Sandalwood, Benzoin, Musk", description: "Aura is an elegant, powdery floral with a timeless feel." },
  { slug: "amber-glow", name: "Amber Glow 20 ML Perfume for Women EDP", sku: "FCLW08PD", rating: 4.5, reviews: 96, price20: 646, mrp20: 795, notes: "Top: Cardamom, Orange | Heart: Orchid, Cinnamon | Base: Amber, Labdanum, Vanilla", description: "Amber Glow is a warm, enveloping evening fragrance with soft spice and a glowing amber base." },
  { slug: "bloom", name: "Bloom 20 ML Perfume for Women EDP", sku: "FCLW09PD", rating: 4.4, reviews: 143, price20: 556, mrp20: 695, notes: "Top: Green Apple, Lemon Blossom | Heart: Peony, Gardenia | Base: Musk, Cedarwood", description: "Bloom is a freshly cut bouquet in a bottle, softened by clean musk." },
  { slug: "midnight-rose", name: "Midnight Rose 20 ML Perfume for Women EDP", sku: "FCLW10PD", rating: 4.7, reviews: 67, price20: 646, mrp20: 795, notes: "Top: Black Pepper, Raspberry | Heart: Damask Rose, Plum | Base: Oud Accord, Patchouli, Amber", description: "Midnight Rose is a deep, romantic floral with velvety rose, dark fruit and a smoky woody base." },
];

const sizes = [
  { label: "100 ml", mult: 3.2 },
  { label: "50 ml", mult: 1.8 },
  { label: "20 ml", mult: 1 },
];

const steps = [
  { n: "01", t: "Get The Fragrance", s: "Hold the bottle upright 10-15 cm away from your body" },
  { n: "02", t: "Spray The Fragrance", s: "Gently spray on your pulse points like neck & wrists" },
  { n: "03", t: "Leave The Fragrance", s: "Do not spray on your face or eyes or other sensitive areas" },
];

// Each gallery tile has its own size so the images feel like a magazine layout.
// Phone / tablet: swipeable row. Desktop (lg+): 2-column mosaic.
const tiles = [
  "aspect-[4/5] lg:col-span-2 lg:aspect-[5/4]", // 1 - large hero
  "aspect-[3/4]",                               // 2 - tall, half width
  "aspect-[3/4]",                               // 3 - same size as image 2
  "aspect-[4/5] lg:col-span-2 lg:aspect-[16/9]", // 4 - wide banner
];

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const perfume = perfumes.find((p) => p.slug === slug);

  const [sizeIdx, setSizeIdx] = useState(2);
  const [added, setAdded] = useState(false);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  if (!perfume) return <main className="p-16 text-center">Perfume not found.</main>;

  const mult = sizes[sizeIdx].mult;
  const price = Math.round(perfume.price20 * mult);
  const mrp = Math.round(perfume.mrp20 * mult);
  const off = Math.round(((mrp - price) / mrp) * 100);
  const gallery = [1, 2, 3, 4].map((n) => `/perfumes/${perfume.slug}/${n}.jpg`);

  return (
    <main className="min-h-screen bg-[#fafaf7] text-neutral-900">
      <section className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:px-12 lg:py-10">
        {/* ---------- GALLERY ---------- */}
        <div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {gallery.map((src, i) => (
              <div
                key={src}
                className={`group relative w-[82%] shrink-0 snap-center overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-200 sm:w-[60%] lg:w-auto ${tiles[i]}`}
              >
                <img
                  src={src}
                  alt={`${perfume.name} ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium backdrop-blur">
                  {i + 1} / {gallery.length}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-neutral-500">*The packaging of the received product might vary</p>
        </div>

        {/* ---------- INFO PANEL ---------- */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-[11px] tracking-widest text-neutral-400">{perfume.sku}</p>
            <h1 className="mt-1 text-xl font-semibold leading-snug sm:text-2xl">{perfume.name}</h1>

            <p className="mt-3 flex items-center gap-2 text-sm">
              <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-white">
                {perfume.rating} ★
              </span>
              <span className="text-neutral-600">{perfume.reviews} Reviews</span>
            </p>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-semibold">₹ {price}</span>
              <span className="text-sm text-neutral-400 line-through">₹ {mrp}</span>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-neutral-900" style={{ background: ACCENT }}>
                {off}% OFF
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">Inclusive of all taxes</p>

            <p className="mb-2 mt-6 text-sm font-medium">Choose Size</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {sizes.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setSizeIdx(i)}
                  style={i === sizeIdx ? { background: ACCENT } : undefined}
                  className={`rounded-full border px-3 py-2.5 text-xs font-medium transition ${
                    i === sizeIdx ? "border-neutral-900" : "border-neutral-300 hover:border-neutral-900"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setAdded(true);
                setTimeout(() => setAdded(false), 1800);
              }}
              style={{ background: ACCENT }}
              className="mt-6 w-full rounded-full py-4 text-sm font-semibold tracking-wide text-neutral-900 transition hover:brightness-95 active:scale-[0.99]"
            >
              {added ? "ADDED TO CART ✓" : "ADD TO CART"}
            </button>

            <div className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
              <details className="group py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  Product Details <span className="transition group-open:rotate-90">›</span>
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-neutral-600">{perfume.description}</p>
              </details>
              <details className="group py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  Fragrance Notes <span className="transition group-open:rotate-90">›</span>
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-neutral-600">{perfume.notes}</p>
              </details>
            </div>

            <p className="mb-2 mt-6 text-sm font-medium">Delivery Availability</p>
            <div className="flex overflow-hidden rounded-full border border-neutral-300 focus-within:border-neutral-900">
              <span className="flex items-center bg-neutral-50 px-4 text-xs text-neutral-600">IND</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter Pincode"
                inputMode="numeric"
                className="min-w-0 flex-1 px-3 text-sm outline-none"
              />
              <button
                onClick={() =>
                  setPinMsg(/^\d{6}$/.test(pin) ? "Delivery available. Usually dispatched in 1 to 2 days." : "Please enter a valid 6 digit pincode.")
                }
                className="bg-neutral-900 px-5 py-3 text-xs font-semibold text-white"
              >
                CHECK
              </button>
            </div>
            {pinMsg && <p className="mt-2 text-xs text-neutral-600">{pinMsg}</p>}
          </div>
        </div>
      </section>

      {/* ---------- TRUST STRIP ---------- */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="grid gap-4 rounded-3xl bg-white p-6 text-xs shadow-sm sm:grid-cols-3">
          <p><b className="block text-sm">100% Original</b>All products are original and go through strict quality check.</p>
          <p><b className="block text-sm">7 Day Return</b>Use our hassle free method to return.</p>
          <p><b className="block text-sm">Free Shipping</b>Free shipping &amp; returns all across India</p>
        </div>
      </div>

      {/* ---------- HOW TO USE ---------- */}
      <section className="mx-auto mt-16 max-w-[1100px] px-4 text-center sm:px-6 lg:mt-24">
        <h2 className="text-2xl font-semibold sm:text-3xl">How To Use</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl bg-white p-6 shadow-sm">
              <span
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: ACCENT }}
              >
                {s.n}
              </span>
              <p className="mt-4 text-sm font-semibold">{s.t}</p>
              <p className="mx-auto mt-1 max-w-[220px] text-xs text-neutral-600">{s.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- DESCRIPTION ---------- */}
      <section className="mx-auto my-16 max-w-[900px] px-4 sm:px-6 lg:my-24">
        <p className="text-center text-sm leading-7 text-neutral-700 sm:text-base sm:leading-8">{perfume.description}</p>
      </section>
    </main>
  );
}