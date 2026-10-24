"use client";

import Image from "next/image";
import Link from "next/link";
import TrustBenefits from "@/components/TrustBenefits";
import PerfumeCategorySection from "@/components/PerfumeCategorySection";
import CollectionShowcase from "@/components/CollectionShowcase";
import BrandStorySection from "@/components/BrandStorySection"; // NEW
import PerfumeArtSection from "@/components/PerfumeArtSection"; // NEW

const PASTEL = "#F3E7D5";
const HERO_IMG = "/images/hero_section.jpg";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// Navbar heights: 76px (mobile) / 88px (tablet) / 144px (desktop, two rows)
const HERO_H =
  "min-h-[calc(100svh-4.75rem)] md:min-h-[calc(100svh-5.5rem)] lg:min-h-[calc(100svh-9rem)]";

export default function Home() {
  return (
    <main style={{ fontFamily: sans }}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap");
        html, body { margin: 0; overflow-x: hidden; }
        @keyframes heroRise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
        .hero-rise { animation: heroRise 1.1s ease-out .5s both }
        .hero-rise-late { animation: heroRise 1.1s ease-out .8s both }
        .hero-cta:hover { background: ${PASTEL}; color: #111 }
        @media (prefers-reduced-motion: reduce) {
          .hero-rise, .hero-rise-late { animation: none }
        }
      `}</style>

      <section className={`relative w-full overflow-hidden ${HERO_H}`}>
        <Image
          src={HERO_IMG}
          alt="Mirqas perfume bottle"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[35%_center] md:object-center"
        />

        {/* Light overlay so the pastel text stays readable */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/35"
        />

        {/* Quote + CTA on the right */}
        <div className={`relative z-10 mx-auto flex max-w-[1400px] items-center justify-end px-5 py-10 md:px-10 ${HERO_H}`}>
          <div className="flex max-w-[92%] flex-col items-end md:max-w-[75%] xl:max-w-none">
            <h1
              className="hero-rise m-0 text-center font-medium leading-[1.2] tracking-[0.01em]"
              style={{
                fontFamily: serif,
                color: PASTEL,
                fontSize: "clamp(1.8rem, 3vw, 3.2rem)",
                textShadow: "0 2px 24px rgba(0,0,0,0.4)",
              }}
            >
              <span className="block md:whitespace-nowrap">
                “Your Presence. Your Essence.
              </span>
              <span className="block">Your Signature.”</span>
            </h1>
          <Link
  href="/shop"
  className="hero-rise-late hero-cta mt-8 inline-block self-center border px-8 py-3.5 text-[12px] uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-white hover:!text-black"
  style={{ borderColor: PASTEL, color: PASTEL }}
>
  Explore Collection
</Link>
          </div>
        </div>
      </section>

      {/* Trust benefits strip, directly below the hero */}
      <TrustBenefits />
      <PerfumeCategorySection />
      <CollectionShowcase />
      <BrandStorySection /> {/* NEW */}
      <PerfumeArtSection /> {/* NEW */}
    </main>
  );
}