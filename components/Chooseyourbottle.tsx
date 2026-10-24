"use client";

// components/ChooseYourBottle.tsx
// "Choose Your Bottle": two bottle photos with the size between them, and a button that opens
// the shop-all-perfumes page.
//
// 1. Put your two photos in public/images/ (bottle-small.jpg, bottle-large.jpg), or change the
//    `image` paths below. A square picture works best. Until a photo loads, a bottle sketch shows.
// 2. Change the sizes and labels in SIZES to match what you actually sell.
// 3. SHOP_HREF is the page the button opens.

import Link from "next/link";
import { useState } from "react";

const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const INK = "#111111";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const SHOP_HREF = "/shopallperfume";

const SIZES = [
  { ml: "50 ml", label: "Travel size", image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D", alt: "Mirqas perfume in the travel size bottle" },
  { ml: "100 ml", label: "Signature size", image: "https://images.unsplash.com/photo-1763986665850-6e66549aa8e0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D", alt: "Mirqas perfume in the signature size bottle" },
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
      <p className="m-0 text-4xl font-medium leading-none md:text-5xl" style={{ fontFamily: serif, color: COPPER }}>
        {ml}
      </p>
      <p className="mt-3 text-sm tracking-[0.12em] md:text-base" style={{ color: INK, fontFamily: sans }}>
        {label}
      </p>
    </div>
  );
}

export default function ChooseYourBottle() {
  return (
    <section aria-labelledby="choose-bottle-title" className="px-4 py-14 md:px-10 md:py-20" style={{ background: IVORY }}>
      <h2
        id="choose-bottle-title"
        className="m-0 text-center font-medium leading-tight"
        style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        Choose Your Bottle
      </h2>

      {/* phones: the two photos side by side, sizes underneath.  desktop: photo | sizes | photo */}
      <div className="mx-auto mt-10 grid max-w-[1100px] grid-cols-2 items-center gap-x-4 gap-y-8 md:mt-12 md:grid-cols-[minmax(0,310px)_1fr_minmax(0,310px)] md:gap-x-8">
        <div className="order-1">
          <BottlePhoto src={SIZES[0].image} alt={SIZES[0].alt} />
        </div>

        <div className="order-3 col-span-2 flex items-center justify-center gap-5 sm:gap-8 md:order-2 md:col-span-1 md:gap-5 lg:gap-8">
          <Size ml={SIZES[0].ml} label={SIZES[0].label} />

          {/* "or" divider */}
          <div className="flex flex-col items-center" aria-hidden>
            <span className="hidden h-12 w-px md:block" style={{ background: "rgba(156,90,43,0.45)" }} />
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border text-sm md:my-2"
              style={{ borderColor: "rgba(156,90,43,0.45)", color: COPPER, fontFamily: sans }}
            >
              or
            </span>
            <span className="hidden h-12 w-px md:block" style={{ background: "rgba(156,90,43,0.45)" }} />
          </div>

          <Size ml={SIZES[1].ml} label={SIZES[1].label} />
        </div>

        <div className="order-2 md:order-3">
          <BottlePhoto src={SIZES[1].image} alt={SIZES[1].alt} />
        </div>
      </div>

      <div className="mt-10 text-center md:mt-12">
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