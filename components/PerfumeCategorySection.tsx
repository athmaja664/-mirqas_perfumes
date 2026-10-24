"use client";

import Link from "next/link";
import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CATEGORIES, Category, Product, products as allProducts } from "@/data/products";

const CREAM = "#FFF9F3";
const CHARCOAL = "#242424";
const BURGUNDY = "#754747";
const MAX_ITEMS = 5;

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const money = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);

// "Musk & Powdery" -> "musk-powdery" (matches the slugs used in the navbar)
const slugOf = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function ProductMedia({
  src,
  video,
  alt,
  active,
}: {
  src: string;
  video?: string;
  alt: string;
  active: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playing, setPlaying] = useState(false);

  const hasVideo = !!video && !videoFailed;

  // Play on hover/focus, pause + reset when not active
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (active) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      v.currentTime = 0;
      v.play().catch(() => {
        // Interrupted by a quick mouse-leave or blocked: image stays visible
      });
    } else {
      v.pause();
      v.currentTime = 0;
      setPlaying(false);
    }

    return () => {
      v.pause();
    };
  }, [active]);

  if ((imgFailed || !src) && !hasVideo) {
    return (
      <div className="flex h-full w-full items-center justify-center text-center text-[12px] text-black/45">
        Image unavailable
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {hasVideo && (
        <video
          ref={videoRef}
          src={video}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setPlaying(true)}
          onError={() => {
            setVideoFailed(true);
            setPlaying(false);
          }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${
          playing ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const [active, setActive] = useState(false);
  const discounted = p.originalPrice !== undefined && p.originalPrice > p.price;
  const pct = discounted ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100) : 0;

  return (
    <li>
      <Link
        href={p.href ?? (p.id ? `/product/${p.id}` : "/shop")}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setActive(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setActive(false);
        }}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="group flex h-full flex-col items-center text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#754747]"
      >
        {/* No white background, no padding: the media fills the whole box */}
        <div className="aspect-[4/5] w-full overflow-hidden">
          <ProductMedia src={p.image} video={p.video} alt={p.name} active={active} />
        </div>

        <div className="mt-4 flex w-full flex-1 flex-col items-center px-1">
          {p.brand && (
            <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: BURGUNDY }}>
              {p.brand}
            </span>
          )}
          <h3
            className="mt-1 line-clamp-2 min-h-[2.6em] text-[18px] leading-[1.3] md:text-[20px]"
            style={{ fontFamily: serif, color: CHARCOAL, fontWeight: 500 }}
          >
            {p.name}
          </h3>

          {p.rating !== undefined && (
            <p className="mt-1.5 text-[13px]" style={{ color: CHARCOAL }}>
              <span style={{ color: "#B87333" }} aria-hidden>★</span>{" "}
              <span className="font-medium">{p.rating.toFixed(1)}</span>
              {p.reviewCount !== undefined && (
                <span className="text-black/55"> ({p.reviewCount})</span>
              )}
              <span className="sr-only"> out of 5 stars</span>
            </p>
          )}

          <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 text-[15px]">
            <span className="font-medium" style={{ color: CHARCOAL }}>{money(p.price)}</span>
            {discounted && (
              <>
                <s className="text-[13px] text-black/45">{money(p.originalPrice!)}</s>
                <span className="text-[13px] font-medium" style={{ color: BURGUNDY }}>{pct}% off</span>
              </>
            )}
          </p>
        </div>
      </Link>
    </li>
  );
}

interface Props {
  products?: Product[];
}

export default function PerfumeCategorySection({ products = allProducts }: Props) {
  const [selected, setSelected] = useState<Category>("Best Sellers");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  // Derived directly from state: no effect needed
  const visible = useMemo(() => {
    const list =
      selected === "Best Sellers"
        ? products.filter((p) => p.isBestSeller)
        : products.filter((p) => p.category === selected);
    return list.slice(0, MAX_ITEMS);
  }, [products, selected]);

  // Jump here from the navbar: select the category and scroll to this section.
  //  - from another page:  /?category=musk-powdery#perfume-categories
  //  - already on the homepage: the navbar sends a "select-category" event
  useEffect(() => {
    const apply = (slug: string | null) => {
      if (!slug) return;
      const match = CATEGORIES.find((c) => slugOf(c) === slug);
      if (!match) return;
      setSelected(match);
      setOpen(false);
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    apply(new URLSearchParams(window.location.search).get("category"));

    const onSelect = (e: Event) => apply((e as CustomEvent<string>).detail);
    window.addEventListener("select-category", onSelect);
    return () => window.removeEventListener("select-category", onSelect);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const openMenu = () => {
    setActive(CATEGORIES.indexOf(selected));
    setOpen(true);
  };

  const choose = (c: Category) => {
    setSelected(c);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const last = CATEGORIES.length - 1;
    switch (e.key) {
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else setActive((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (open) { e.preventDefault(); setActive(0); }
        break;
      case "End":
        if (open) { e.preventDefault(); setActive(last); }
        break;
      case "Enter":
      case " ":
        if (open) {
          e.preventDefault();
          choose(CATEGORIES[active]);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <section
      ref={sectionRef}
      id="perfume-categories"
      aria-labelledby={`${listId}-heading`}
      className="w-full scroll-mt-4"
      style={{ background: CREAM, fontFamily: sans }}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-14 md:px-8 md:py-20 lg:px-12">
        {/* Heading + dropdown */}
        <div className="flex flex-wrap items-baseline justify-center gap-x-3">
          <h2
            id={`${listId}-heading`}
            className="m-0 text-[28px] font-normal md:text-[36px]"
            style={{ fontFamily: serif, color: CHARCOAL }}
          >
            You are in
          </h2>

          <div ref={wrapRef} className="relative" onKeyDown={onKeyDown}>
            <button
              ref={btnRef}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listId}
              aria-label={`Fragrance category: ${selected}. Change category`}
              onClick={() => (open ? setOpen(false) : openMenu())}
              className="inline-flex items-center gap-2 border-b pb-0.5 text-[28px] md:text-[36px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#754747]"
              style={{ fontFamily: serif, color: BURGUNDY, borderColor: BURGUNDY }}
            >
              {selected}
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden
                className={`fill-none stroke-current transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                strokeWidth="1.8"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <ul
              id={listId}
              role="listbox"
              aria-label="Fragrance categories"
              aria-activedescendant={open ? `${listId}-opt-${active}` : undefined}
              className={`absolute left-1/2 top-full z-20 mt-3 w-[min(78vw,260px)] -translate-x-1/2 border border-black/10 bg-white py-2 shadow-sm transition-all duration-200 ease-out motion-reduce:transition-none ${
                open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-2 opacity-0"
              }`}
            >
              {CATEGORIES.map((c, i) => {
                const isSelected = c === selected;
                return (
                  <li
                    key={c}
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => choose(c)}
                    className="cursor-pointer px-5 py-2.5 text-left text-[15px] transition-colors"
                    style={{
                      color: isSelected ? BURGUNDY : CHARCOAL,
                      fontWeight: isSelected ? 600 : 400,
                      background: i === active ? "#F6EDE3" : "transparent",
                    }}
                  >
                    {c}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Products */}
        <div className="mt-12 md:mt-14" aria-live="polite">
          {visible.length > 0 ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-5">
              {visible.map((p, i) => (
                <ProductCard key={p.id ?? `${p.name}-${i}`} p={p} />
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-[16px]" style={{ color: CHARCOAL }}>
              No perfumes found in this category.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}