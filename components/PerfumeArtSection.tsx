"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { REVEAL_CSS, useReveal } from "./useReveal";

const CREAM = "#FFF9F3";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// ---------- EDIT HERE: image ----------
const perfumeArtConfig = {
  image: "https://images.pexels.com/photos/14490634/pexels-photo-14490634.jpeg", // save the file in public/images/story/
  imagePosition: "center",
  alt: "Woman holding a perfume bottle",
};

// ---------- EDIT HERE: slides (text, button label, link) ----------
const perfumeStories = [
  {
    id: "signature",
    eyebrow: "THE ART OF PERFUMES",
    title: "THE POWER OF A SIGNATURE SCENT",
    description:
      "A fragrance is more than the way you smell. It is an expression of your personality, a reflection of your mood, and a memory that stays long after you leave.",
    ctaLabel: "EXPLORE OUR FRAGRANCES",
    href: "/shop",
  },
  {
    id: "notes",
    eyebrow: "DISCOVER YOUR NOTES",
    title: "EVERY FRAGRANCE TELLS A STORY",
    description:
      "From bright citrus and delicate florals to warm woods and sensual amber, every fragrance unfolds in layers. Explore the notes that make a scent unforgettable.",
    ctaLabel: "DISCOVER FRAGRANCES",
    href: "/shop",
  },
  {
    id: "essence",
    eyebrow: "FIND YOUR ESSENCE",
    title: "A SCENT THAT FEELS LIKE YOU",
    description:
      "Your signature fragrance should feel natural, distinctive, and unforgettable. Discover the scent that reflects your character and accompanies every meaningful moment.",
    ctaLabel: "FIND YOUR SCENT",
    href: "/shop",
  },
];

const delay = (ms: number, y = 20) =>
  ({ "--d": `${ms}ms`, "--y": `${y}px` }) as CSSProperties;

const isValidSrc = (s: string) =>
  s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://");

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="fill-none stroke-current" strokeWidth="1.6">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

export default function PerfumeArtSection() {
  const { ref, hidden } = useReveal<HTMLElement>();
  const [index, setIndex] = useState(0);
  const total = perfumeStories.length;
  const hide = hidden ? "rv-hide" : "";

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  return (
    <section
      ref={ref}
      aria-label="The art of perfumes"
      className="grid w-full grid-cols-1 overflow-hidden md:grid-cols-2"
      style={{ background: "#1A1A1A", fontFamily: sans }}
    >
      <style>{`
        ${REVEAL_CSS}
        .pa-slide {
          opacity: 0; transform: translateY(10px); visibility: hidden;
          transition: opacity 450ms ease, transform 450ms ease, visibility 0s linear 450ms;
        }
        .pa-slide[data-active="true"] {
          opacity: 1; transform: none; visibility: visible;
          transition: opacity 500ms ease 150ms, transform 500ms ease 150ms, visibility 0s;
        }
        @media (prefers-reduced-motion: reduce) {
          .pa-slide, .pa-slide[data-active="true"] { transition: none; transform: none; }
        }
      `}</style>

      {/* Image panel */}
      <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[4/3] md:aspect-auto md:min-h-[600px]">
        <div className={`rv-img absolute inset-0 ${hide}`}>
          {isValidSrc(perfumeArtConfig.image) && (
            <Image
              src={perfumeArtConfig.image}
              alt={perfumeArtConfig.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              style={{ objectPosition: perfumeArtConfig.imagePosition }}
            />
          )}
        </div>
      </div>

      {/* Dark text panel */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Perfume stories"
        onKeyDown={onKeyDown}
        className={`rv relative flex items-center justify-center px-5 py-14 text-center md:min-h-[600px] md:px-8 ${hide}`}
        style={{ color: CREAM, ...delay(150, 0) }}
      >
        <div className="flex w-full max-w-[640px] items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous story"
            className={`rv flex h-11 w-11 shrink-0 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFF9F3] ${hide}`}
            style={delay(900, 0)}
          >
            <Arrow dir="left" />
          </button>

          {/* All slides share one grid cell, so the height never jumps */}
          <div className="grid min-w-0 flex-1" aria-live="polite">
            {perfumeStories.map((s, i) => {
              const active = i === index;
              return (
                <div
                  key={s.id}
                  className="pa-slide col-start-1 row-start-1 flex flex-col items-center"
                  data-active={active}
                  aria-hidden={!active}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${total}`}
                >
                  <p
                    className={`rv m-0 text-[11px] uppercase tracking-[0.3em] opacity-70 ${hide}`}
                    style={delay(300, 12)}
                  >
                    {s.eyebrow}
                  </p>
                  <h2
                    className={`rv m-0 mt-4 font-medium leading-[1.2] ${hide}`}
                    style={{
                      ...delay(450, 20),
                      fontFamily: serif,
                      fontSize: "clamp(1.6rem, 2.6vw, 2.5rem)",
                    }}
                  >
                    {s.title}
                  </h2>
                  <p
                    className={`rv mt-5 max-w-[420px] text-[14px] leading-relaxed opacity-85 ${hide}`}
                    style={delay(600, 16)}
                  >
                    {s.description}
                  </p>
                  <Link
                    href={s.href}
                    className={`rv mt-8 inline-block border border-current px-7 py-3.5 text-[12px] uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-[#FFF9F3] hover:text-[#1A1A1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFF9F3] ${hide}`}
                    style={delay(750, 12)}
                  >
                    {s.ctaLabel}
                  </Link>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next story"
            className={`rv flex h-11 w-11 shrink-0 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFF9F3] ${hide}`}
            style={delay(900, 0)}
          >
            <Arrow dir="right" />
          </button>
        </div>

        {/* Dots */}
        <div
          className={`rv absolute bottom-6 left-0 right-0 flex justify-center gap-1 ${hide}`}
          style={delay(950, 0)}
        >
          {perfumeStories.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to story ${i + 1}`}
              aria-current={i === index}
              className="flex h-8 w-6 items-center justify-center"
            >
              <span
                className="block h-1.5 w-1.5 rounded-full transition-opacity duration-300"
                style={{ background: CREAM, opacity: i === index ? 1 : 0.35 }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}