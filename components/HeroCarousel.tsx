"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

type Slide = {
  src: string;
  alt: string;
  // Which part of the photo stays visible on phones: "0% 50%" = far left, "50% 50%" = center, "100% 50%" = far right.
  mobilePos?: string;
  // Which part of the photo stays visible on tablet / desktop.
  // The second number is vertical: "50% 0%" = show the very top (image moves down), "50% 50%" = centre, "50% 100%" = show the bottom (image moves up).
  desktopPos?: string;
};

// ---- Add your hero photos here. Save each file in public/images first. ----
const SLIDES: Slide[] = [
  { src: "/images/hero1.png", alt: "Mirqas perfume bottle with lilac flowers", mobilePos: "40% 50%" },
  { src: "/images/hero2.png", alt: "Mirqas perfume bottle with figs", mobilePos: "50% 50%", desktopPos: "50% 10%" },
//   { src: "/images/hero3.png", alt: "Describe the photo", mobilePos: "50% 50%" },
];

const AUTOPLAY_MS = 5000; // time each slide stays on screen
const SHOW_TEXT = true; // false = hide the logo, quote and button (for banners that already contain text)
const TEXT_FADE = true; // soft dark fade behind the text on the left (makes the white text easy to read)

export default function HeroCarousel() {
  const count = SLIDES.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (n: number) => setIndex(((n % count) + count) % count);

  // Respect "reduce motion" settings: no automatic sliding for those visitors.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Move to the next slide after a pause. Using the arrows or dots restarts the timer.
  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, count, paused, reduceMotion]);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 50) return; // a tap, not a swipe
    go(dx < 0 ? index + 1 : index - 1);
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured perfumes"
      className="relative h-[65svh] min-h-[460px] w-full overflow-hidden md:h-auto md:min-h-[calc(100svh-7rem)] lg:min-h-[calc(100svh-10.75rem)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes heroRise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
        .hero-rise { animation: heroRise 1.1s ease-out .5s both }
        .hero-rise-late { animation: heroRise 1.1s ease-out .8s both }
        .hero-cta { color: #FFFFFF; border-color: ${COPPER}; background: ${COPPER}; }
        @media (prefers-reduced-motion: reduce) {
          .hero-rise, .hero-rise-late { animation: none }
        }
      `}</style>

      {/* The photos. They sit on top of each other, and only the current one is visible. */}
      {SLIDES.map((s, i) => (
        <div
          key={s.src}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          {/* Phone image */}
          <Image
            src={s.src}
            alt={s.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover md:hidden"
            style={{ objectPosition: s.mobilePos ?? "50% 50%" }}
          />
          {/* Tablet / desktop image */}
          <Image
            src={s.src}
            alt={s.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="hidden object-cover md:block"
            style={{ objectPosition: s.desktopPos ?? "50% 50%" }}
          />
        </div>
      ))}

      {/* Dark fade on the left behind the text (same idea as the men's banner). It fades out before the bottle. */}
      {SHOW_TEXT && TEXT_FADE && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent md:from-black/65 md:via-black/30 md:via-45% md:to-transparent md:to-70%"
        />
      )}

      {/* Logo + quote + button on the left. The same text shows on every slide.
          (No z-index on purpose: the logo's blend mode needs to see the photo behind it.) */}
      {SHOW_TEXT && (
        <div className="absolute inset-0 flex items-center justify-start px-4 md:relative md:inset-auto md:mx-auto md:min-h-[calc(100svh-7rem)] md:max-w-[1400px] md:px-10 md:py-10 lg:min-h-[calc(100svh-10.75rem)]">
          <div className="flex max-w-[58%] flex-col items-center md:max-w-[50%]">
            {/* The logo image has empty space around it, so the box below crops it to the visible part. */}
        <div className="relative top-11 flex max-w-[58%] flex-col items-center md:top-[4.25rem] md:max-w-[50%]">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src="/images/logoo.png"
    alt="Mirqas Perfumes"
    className="block h-[200px] w-auto max-w-none shrink-0 mix-blend-screen grayscale invert md:h-[370px] lg:h-[460px]"
  />
</div>

            {/* The quote is white with a dark shadow. Use font-bold for even bolder, font-medium for lighter. */}
            <h1
  className="hero-rise m-0 text-center font-semibold leading-[1.2] tracking-[0.01em]"
  style={{
    fontFamily: serif,
    color: "#FFFFFF",
    fontSize: "clamp(1.2rem, 3.1vw, 3.3rem)",
    textShadow: "0 2px 14px rgba(0,0,0,0.7)",
  }}
>
  <span className="block md:whitespace-nowrap">“Your Presence. Your Essence.</span>
  <span className="block">Your Signature.”</span>
</h1>

            <Link
              href="/shop"
              className="hero-rise-late hero-cta mt-4 inline-block self-center border px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] md:mt-8 md:px-8 md:py-3.5 md:text-[12px] md:tracking-[0.2em]"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      )}

      {/* Arrows and dots only appear when there is more than one slide. */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#111] shadow transition-colors hover:bg-white md:flex"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#111] shadow transition-colors hover:bg-white md:flex"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center md:bottom-5">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className="p-2"
              >
                <span
                  className={`block h-2.5 rounded-full border border-[#9C5A2B] transition-all duration-300 ${
                    i === index ? "w-7 bg-[#9C5A2B]" : "w-2.5 bg-white/80"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}