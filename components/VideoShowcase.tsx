"use client";

// components/VideoShowcase.tsx
// Three portrait videos with a "Buy now" button under each.
//
// 1. Put your own videos in  public/videos/  and optional preview pictures in  public/images/.
// 2. Change `href` to send each button to the right product page.
//
// Phones: horizontal swipe row. The centered video is zoomed in and plays,
//         the side videos are smaller and paused, and the next one peeks in.
// Tablet/desktop: three in a row, all play while on screen.
// Each video has a small pause/play button (and stays paused if the visitor prefers reduced motion).

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

function VideoCard({ item, centered }: { item: Item; centered: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const pausedByUser = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // track whether the card is on screen
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  // Phones: only the centered video plays. Desktop: every video on screen plays.
  const shouldPlay = !reduced && onScreen && (isDesktop || centered);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (shouldPlay && !pausedByUser.current) v.play().catch(() => {});
    else v.pause();
  }, [shouldPlay]);

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
    <li
      className={`w-[78vw] shrink-0 snap-center transition-all duration-500 ease-out motion-reduce:transition-none md:w-auto md:shrink md:scale-100 md:opacity-100 ${
        centered ? "scale-100 opacity-100" : "scale-90 opacity-70"
      }`}
    >
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
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  // find which card is closest to the center of the scroll row
  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const center = list.scrollLeft + list.clientWidth / 2;
    let closest = 0;
    let min = Infinity;
    Array.from(list.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
      if (dist < min) {
        min = dist;
        closest = i;
      }
    });
    setActive(closest);
  }, []);

  const goTo = (i: number) => {
    const list = listRef.current;
    const el = list?.children[i] as HTMLElement | undefined;
    if (!list || !el) return;
    list.scrollTo({
      left: el.offsetLeft + el.offsetWidth / 2 - list.clientWidth / 2,
      behavior: "smooth",
    });
  };

  return (
    <section
      aria-label="Perfume videos"
      className="overflow-hidden py-12 md:py-20"
      style={{ background: IVORY, fontFamily: sans }}
    >
      {/* phones: swipe row, centered card zoomed in, next one peeks. md+: three in a row */}
      <ul
        ref={listRef}
        onScroll={handleScroll}
        className="mx-auto flex max-w-[1400px] list-none snap-x snap-mandatory gap-3 overflow-x-auto px-[11vw] py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-10 md:py-0"
      >
        {ITEMS.map((item, i) => (
          <VideoCard key={item.src} item={item} centered={active === i} />
        ))}
      </ul>

      {/* dots: phones only */}
      <div className="mt-5 flex justify-center gap-2 md:hidden">
        {ITEMS.map((item, i) => (
          <button
            key={item.src}
            type="button"
            aria-label={`Show video ${i + 1}`}
            onClick={() => goTo(i)}
            className="h-2 rounded-full border-0 p-0 transition-all duration-300"
            style={{
              width: active === i ? 22 : 8,
              background: active === i ? COPPER : "#E3D2BF",
            }}
          />
        ))}
      </div>
    </section>
  );
}