"use client";

import { useId, useState } from "react";

const CREAM = "#FFF9F3";
const CHARCOAL = "#242424";
const BURGUNDY = "#754747";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// ---------- EDIT HERE: questions and answers ----------
const faqs = [
  {
    q: "Are Mirqas perfumes alcohol-free?",
    a: "Yes. Every fragrance is made with premium, alcohol-free perfume oils, so it is gentle on your skin.",
  },
  {
    q: "How long does the fragrance last?",
    a: "Our perfumes are made to stay with you. On most people the scent stays noticeable for several hours, though it can vary with your skin type and how much you apply.",
  },
  {
    q: "Which bottle sizes can I choose from?",
    a: "You can pick a 6 ml travel size for carrying with you, or a 12 ml signature size for everyday use.",
  },
  {
    q: "Do these make a good gift?",
    a: "Absolutely. The refined scents and elegant packaging make them a thoughtful gift for any occasion.",
  },
  {
    q: "How should I store my perfume?",
    a: "Keep it in a cool, dry place away from direct sunlight. This protects the fragrance and keeps it smelling fresh for longer.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="w-full"
      style={{ background: CREAM, fontFamily: sans }}
    >
      <style>{`
        .faq-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 350ms ease; }
        .faq-panel[data-open="true"] { grid-template-rows: 1fr; }
        .faq-panel > div { overflow: hidden; }
        @media (prefers-reduced-motion: reduce) { .faq-panel { transition: none; } }
      `}</style>

      <div className="mx-auto max-w-[820px] px-4 py-14 md:px-8 md:py-20">
        <div className="text-center">
         <h2
  id={`${baseId}-heading`}
  className="m-0 font-normal uppercase tracking-[0.18em]"
  style={{
    fontFamily: serif,
    color: CHARCOAL,
    fontSize: "clamp(1.6rem, 3vw, 2.5rem)",
  }}
>
  Know Before You Scent
</h2>
          <p
            className="mx-auto mt-4 max-w-md text-[14px] md:text-[15px]"
            style={{ color: CHARCOAL, opacity: 0.7 }}
          >
          
          </p>
        </div>

        <ul className="m-0 mt-10 list-none p-0 md:mt-14">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-b" style={{ borderColor: "rgba(36,36,36,0.15)" }}>
                <h3 className="m-0">
                  <button
                    type="button"
                    id={`${baseId}-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`${baseId}-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754747]"
                  >
                    <span
                      className="text-[18px] leading-snug md:text-[21px]"
                      style={{ fontFamily: serif, color: isOpen ? BURGUNDY : CHARCOAL, fontWeight: 500 }}
                    >
                      {f.q}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      aria-hidden
                      className={`shrink-0 fill-none stroke-current transition-transform duration-300 motion-reduce:transition-none ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth="1.8"
                      style={{ color: BURGUNDY }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </h3>

                <div
                  id={`${baseId}-a-${i}`}
                  role="region"
                  aria-labelledby={`${baseId}-q-${i}`}
                  className="faq-panel"
                  data-open={isOpen}
                >
                  <div>
                    <p
                      className="m-0 pb-6 pr-8 text-[14px] leading-relaxed md:text-[15px]"
                      style={{ color: CHARCOAL, opacity: 0.8 }}
                    >
                      {f.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}