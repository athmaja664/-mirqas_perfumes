"use client";

import Image from "next/image";
import Link from "next/link";

// ---- Fonts and colours: same as the "Choose Your Bottle" section ----
const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const INK = "#111111";
const PASTEL = "#F3E7D5";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// Box shape. Use your image's real width / height here so the picture fits with no crop.
// Example: an image of 1200 x 675 px is 16 / 9.
const CARD_RATIO = "16 / 9";

// Only two collections: For Her and For Him
// href = the page that opens when the card is clicked
const collections = [
  {
    id: "women",
    title: "For Her",
    tagline: "Grace. Elegance. Essence.",
    button: "Explore for her",
    image: "/images/forhim2.png",
    alt: "Woman's signature Mirqas fragrance bottle with flowers",
    position: "right center",
    shift: 12, // % to move the picture to the right. Raise to move the bottle more, 0 = no move.
    href: "/women",
  },
  {
    id: "men",
    title: "For Him",
    tagline: "Grace. Elegance. Essence.",
    button: "Explore for him",
    image: "/images/forher3.png",
    alt: "Men's signature Mirqas fragrance bottle with flowers",
    position: "right center",
    shift: 0,
    href: "/men",
  },
];

const isValidSrc = (src: string) =>
  src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://");

export default function CollectionShowcase() {
  return (
    <section
      aria-labelledby="collection-showcase-heading"
      className="w-full overflow-hidden"
      style={{ background: IVORY, fontFamily: sans }}
    >
      <style>{`
        .cs-img { transition: transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1); }
        .cs-btn { transition: background-color 200ms ease, color 200ms ease; }
        .cs-card:focus-visible { outline: 2px solid ${COPPER}; outline-offset: 4px; }
        .cs-card:hover .cs-btn,
        .cs-card:focus-visible .cs-btn { background: ${COPPER}; color: #fff; }
        @media (hover: hover) {
          .cs-card:hover .cs-img,
          .cs-card:focus-visible .cs-img { transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-img, .cs-btn { transition: none; }
          .cs-card:hover .cs-img { transform: none; }
        }
      `}</style>

      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-12 lg:px-10 lg:py-14">
        <div className="text-center">
          <h2
            id="collection-showcase-heading"
            className="m-0 font-medium leading-tight"
            style={{
              fontFamily: serif,
              color: COPPER,
              fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)",
            }}
          >
            Discover Your Signature
          </h2>
          <p
            className="mx-auto mt-2 max-w-md text-[13px] tracking-[0.08em] md:mt-3 md:text-[15px]"
            style={{ color: INK }}
          >
            Two worlds of fragrance. One expression of you.
          </p>
        </div>

        {/* Phones: one card under the other. md+: two cards side by side. */}
        <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-3 p-0 md:mt-8 md:grid-cols-2 md:gap-5 lg:gap-6">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={c.href}
                aria-label={c.button}
                className="cs-card relative block w-full overflow-hidden rounded-[6px]"
                style={{ background: PASTEL, aspectRatio: CARD_RATIO }}
              >
                {isValidSrc(c.image) && (
                  <div
                    className="absolute inset-y-0 w-full"
                    style={{ left: `${c.shift}%` }}
                  >
                    <Image
                      src={c.image}
                      alt={c.alt}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="cs-img object-cover"
                      style={{ objectPosition: c.position }}
                    />
                  </div>
                )}

                {/* Very light ivory fade behind the text only (the old one was too white).
                    Lower 0.45 for a clearer photo, raise it for easier reading. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(252,248,240,0.45) 0%, rgba(252,248,240,0.2) 35%, rgba(252,248,240,0) 58%)",
                  }}
                />

                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-[60%] flex-col items-start justify-center pl-5 pr-2 md:pl-8 lg:pl-10">
                  <h3
                    className="m-0 font-medium leading-tight"
                    style={{
                      fontFamily: serif,
                      color: COPPER,
                      fontSize: "clamp(1.7rem, 3.2vw, 2.6rem)",
                    }}
                  >
                    {c.title}
                  </h3>
                  <p
                    className="m-0 mt-1.5 text-[12px] tracking-[0.06em] md:mt-2 md:text-[15px]"
                    style={{ color: INK }}
                  >
                    {c.tagline}
                  </p>
                  <span
                    className="cs-btn mt-3 inline-flex items-center gap-2 rounded-[6px] border px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] md:mt-5 md:px-5 md:py-3 md:text-[12px]"
                    style={{ borderColor: COPPER, color: COPPER, background: "transparent" }}
                  >
                    {c.button}
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 md:h-4 md:w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}