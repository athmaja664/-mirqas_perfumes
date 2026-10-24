"use client";

// components/VideoShowcase.tsx
// Three portrait videos with a "Buy now" button under each.
//
// 1. Put your own videos in  public/videos/  (showcase-1.mp4, showcase-2.mp4, showcase-3.mp4)
//    and optional preview pictures in  public/images/  (shown until the video loads).
// 2. Change `href` to send each button to the right product page.
//
// Videos play silently on a loop while they are on screen and pause when you scroll away.
// Each video has a small pause/play button (and stays paused if the visitor prefers reduced motion).

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const sans = "Inter, system-ui, sans-serif";

type Item = { src: string; poster?: string; href: string; alt: string };

const ITEMS: Item[] = [
  { src: "/videos/hemesection1.mp4", poster: "/images/showcase-1.jpg", href: "/shopallperfume", alt: "Applying perfume to the wrist" },
  { src: "/videos/homesection2.mp4", poster: "/images/showcase-2.jpg", href: "/shopallperfume", alt: "Holding a crystal perfume bottle" },
  { src: "/videos/homesection3.mp4", poster: "/images/showcase-3.jpg", href: "/shopallperfume", alt: "Opening a perfume gift box" },
];

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className="fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 4h2l2.2 11h10.6L20 7H6.2" />
      <circle cx="9" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </svg>
  );
}

function VideoCard({ item }: { item: Item }) {
  const ref = useRef<HTMLVideoElement>(null);
  const pausedByUser = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // play only while the card is on screen (saves data and battery)
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (reduced) {
      v.pause();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pausedByUser.current) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduced]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      pausedByUser.current = false;
      v.play().catch(() => {});
    } else {
      pausedByUser.current = true;
      v.pause();
    }
  };

  return (
    <li className="min-w-[78%] snap-center sm:min-w-[46%] md:min-w-0">
      <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "rgba(156,90,43,0.28)" }}>
        <div className="relative aspect-[4/5] bg-black">
          <video
            ref={ref}
            src={item.src}
            poster={item.poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={item.alt}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause video" : "Play video"}
            className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 ${FOCUS} focus-visible:outline-white`}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M7 4.5v15l12-7.5z" />
              </svg>
            )}
          </button>
        </div>

        <div className="p-3 md:p-4">
          <Link
            href={item.href}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg border text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#9C5A2B] hover:text-white ${FOCUS}`}
            style={{ borderColor: COPPER, color: COPPER, background: "#fff" }}
          >
            <CartIcon />
            Buy now
          </Link>
        </div>
      </div>
    </li>
  );
}

export default function VideoShowcase() {
  return (
    <section aria-label="Perfume videos" className="py-12 md:py-20" style={{ background: IVORY, fontFamily: sans }}>
      {/* phones: swipe sideways, one card and a peek of the next. tablets and desktop: three in a row */}
      <ul className="mx-auto flex max-w-[1400px] scroll-px-4 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-10 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((item) => (
          <VideoCard key={item.src} item={item} />
        ))}
      </ul>
    </section>
  );
}