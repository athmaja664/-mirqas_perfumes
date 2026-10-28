"use client";

// components/ChooseYourBottle.tsx
// "Choose Your Bottle": a small carousel with 2 slides.
//   Slide 1 = 10 ml and 30 ml,  Slide 2 = 50 ml and 100 ml.
// The heading and the button stay fixed. Only the bottles change (swipe, dots or arrows).
//
// 1. Put your photos in public/images/ or change the `image` paths in SLIDES below.
//    A square picture works best. Until a photo loads, a bottle sketch shows.
// 2. The 10 ml and 30 ml photos and labels are PLACEHOLDERS. Replace them with your real ones.
// 3. SHOP_HREF is the page the button opens.

import Link from "next/link";
import { useState, useRef } from "react";

const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const IVORY = "#FCF8F0";
const INK = "#111111";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const SHOP_HREF = "/shopallperfume";

type Bottle = { ml: string; label: string; image: string; alt: string };

const SLIDES: Bottle[][] = [
  // Slide 1 (placeholder photos: put your own files in public/images/)
  [
    { ml: "10 ml", label: "Pocket size", image: "/images/choose1.png", alt: "Mirqas perfume in the 10 ml bottle" },
    { ml: "30 ml", label: "Everyday size", image: "/images/choose2.png", alt: "Mirqas perfume in the 30 ml bottle" },
  ],
  // Slide 2
  [
    { ml: "50 ml", label: "Travel size", image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D", alt: "Mirqas perfume in the travel size bottle" },
    { ml: "100 ml", label: "Signature size", image: "https://images.unsplash.com/photo-1763986665850-6e66549aa8e0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D", alt: "Mirqas perfume in the signature size bottle" },
  ],
];

function BottleSketch() {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg,#F6EEE0,#FCF8F0)" }}>
      <svg viewBox="0 0 120 160" className="h-1/2 w-1/2" fill="none" stroke={COPPER} strokeWidth="2" aria-hidden>
        <rect x="38" y="62" width="44" height="78" rx="8" />
        <rect x="50" y="38" width="20" height="24" rx="3" />
        <path d="M44 100h32" />
      </svg>
    </div>
  );
}

function BottlePhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="aspect-square w-full overflow-hidden bg-[#F6EEE0]">
      {failed ? (
        <BottleSketch />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function Size({ ml, label }: { ml: string; label: string }) {
  return (
    <div className="text-center">
      <p
        className="m-0 text-4xl font-medium leading-none md:text-5xl"
        style={{
          fontFamily: serif,
          color: COPPER,
          fontVariantNumeric: "lining-nums",
          fontFeatureSettings: '"lnum" 1',
        }}
      >
        {ml}
      </p>
      <p className="mt-3 text-sm tracking-[0.12em] md:text-base" style={{ color: INK, fontFamily: sans }}>
        {label}
      </p>
    </div>
  );
}

function ArrowButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous sizes" : "Next sizes"}
      className={`absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-transparent transition-colors hover:bg-[#9C5A2B] hover:text-white md:flex ${
        dir === "prev" ? "left-0" : "right-0"
      }`}
      style={{ borderColor: COPPER_SOFT, color: COPPER }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

function BottlePair({ pair }: { pair: Bottle[] }) {
  return (
    // phones: the two photos side by side, sizes underneath.  desktop: photo | sizes | photo
    <div className="mx-auto grid max-w-[1100px] grid-cols-2 items-center gap-x-4 gap-y-8 md:grid-cols-[minmax(0,310px)_1fr_minmax(0,310px)] md:gap-x-8">
      <div className="order-1">
        <BottlePhoto src={pair[0].image} alt={pair[0].alt} />
      </div>

      <div className="order-3 col-span-2 flex items-center justify-center gap-5 sm:gap-8 md:order-2 md:col-span-1 md:gap-5 lg:gap-8">
        <Size ml={pair[0].ml} label={pair[0].label} />

        {/* "or" divider */}
        <div className="flex flex-col items-center" aria-hidden>
          <span className="hidden h-12 w-px md:block" style={{ background: COPPER_SOFT }} />
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border text-sm md:my-2"
            style={{ borderColor: COPPER_SOFT, color: COPPER, fontFamily: sans }}
          >
            or
          </span>
          <span className="hidden h-12 w-px md:block" style={{ background: COPPER_SOFT }} />
        </div>

        <Size ml={pair[1].ml} label={pair[1].label} />
      </div>

      <div className="order-2 md:order-3">
        <BottlePhoto src={pair[1].image} alt={pair[1].alt} />
      </div>
    </div>
  );
}

export default function ChooseYourBottle() {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const total = SLIDES.length;

  const go = (i: number) => setIndex(((i % total) + total) % total);

  return (
    <section aria-labelledby="choose-bottle-title" className="px-4 py-14 md:px-10 md:py-20" style={{ background: IVORY }}>
      <h2
        id="choose-bottle-title"
        className="m-0 text-center font-medium leading-tight"
        style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        Choose Your Bottle
      </h2>

      {/* Carousel: only this part moves. The heading and the button stay fixed. */}
      <div
        className="relative mx-auto mt-10 max-w-[1180px] md:mt-12 md:px-14"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <ArrowButton dir="prev" onClick={() => go(index - 1)} />
        <ArrowButton dir="next" onClick={() => go(index + 1)} />

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((pair, i) => (
              <div key={i} className="w-full shrink-0" aria-hidden={index !== i}>
                <BottlePair pair={pair} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="mt-6 flex justify-center gap-2 md:mt-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            onClick={() => go(i)}
            className="h-2 rounded-full border-0 p-0 transition-all duration-300"
            style={{ width: index === i ? 22 : 8, background: index === i ? COPPER : COPPER_SOFT }}
          />
        ))}
      </div>

      {/* Button: stays in the same place */}
      <div className="mt-6 text-center md:mt-8">
        <Link
          href={SHOP_HREF}
          className="inline-block px-8 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#7d4720] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
          style={{ background: COPPER, fontFamily: sans }}
        >
          Choose your fragrance
        </Link>
      </div>
    </section>
  );
}