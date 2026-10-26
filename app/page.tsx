"use client";

import Image from "next/image";
import Link from "next/link";
import TrustBenefits from "@/components/TrustBenefits";
import PerfumeCategorySection from "@/components/PerfumeCategorySection";
import CollectionShowcase from "@/components/CollectionShowcase";
import BrandStorySection from "@/components/BrandStorySection";
import PerfumeArtSection from "@/components/PerfumeArtSection";
import VideoShowcase from "@/components/VideoShowcase";
import ChooseYourBottle from "@/components/Chooseyourbottle";
import FaqSection from "@/components/FaqSection"
const PASTEL = "#F3E7D5";
const HERO_IMG = "/images/hero_section.jpg";

// Which part of the photo stays visible on phones (horizontal vertical):
// "0% 50%" = far left, "30% 50%" = left-ish, "50% 50%" = center, "100% 50%" = far right
const MOBILE_POS = "25% 50%";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

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

      {/* Phones: height = 65% of the screen (min 460px). Change h-[65svh] to make it taller or shorter.
          Tablet/desktop: full-screen hero, same as before. */}
      <section className="relative h-[65svh] min-h-[460px] w-full overflow-hidden md:h-auto md:min-h-[calc(100svh-7rem)] lg:min-h-[calc(100svh-10.75rem)]">
        {/* Phone image */}
        <Image
          src={HERO_IMG}
          alt="Mirqas perfume bottle"
          fill
          priority
          sizes="100vw"
          className="object-cover md:hidden"
          style={{ objectPosition: MOBILE_POS }}
        />

        {/* Tablet / desktop image */}
        <Image
          src={HERO_IMG}
          alt="Mirqas perfume bottle"
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center md:block"
        />

        {/* Light overlay so the pastel text stays readable */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/35"
        />

        {/* Logo + quote + CTA on the right, same as the web view.
            (No z-index on purpose: the logo's blend mode needs to see the photo behind it.) */}
        <div className="absolute inset-0 flex items-center justify-end px-4 md:relative md:inset-auto md:mx-auto md:min-h-[calc(100svh-7rem)] md:max-w-[1400px] md:px-10 md:py-10 lg:min-h-[calc(100svh-10.75rem)]">
          <div className="flex max-w-[62%] flex-col items-end md:max-w-[75%] xl:max-w-none">
            <div className="mb-2 flex h-[60px] w-full items-center justify-center overflow-hidden md:mb-5 md:h-[110px] lg:h-[125px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logoo.png"
                alt="Mirqas Perfumes"
                className="block h-[115px] w-auto max-w-none shrink-0 invert mix-blend-screen md:h-[210px] lg:h-[240px]"
              />
            </div>

            <h1
              className="hero-rise m-0 text-center font-medium leading-[1.2] tracking-[0.01em]"
              style={{
                fontFamily: serif,
                color: PASTEL,
                fontSize: "clamp(1rem, 3vw, 3.2rem)",
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
              className="hero-rise-late hero-cta mt-4 inline-block self-center border px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 hover:bg-white hover:!text-black md:mt-8 md:px-8 md:py-3.5 md:text-[12px] md:tracking-[0.2em]"
              style={{ borderColor: PASTEL, color: PASTEL }}
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      <TrustBenefits />
      <PerfumeCategorySection />
      <CollectionShowcase />
      <ChooseYourBottle />
      <BrandStorySection />
      <PerfumeArtSection />
      <VideoShowcase />
     <FaqSection />
    </main>
  );
}