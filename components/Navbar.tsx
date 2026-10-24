"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react";

// Solid copper is used ONLY for the Collections mega menu (and its mobile list).
const COPPER = "#9C5A2B"; // proper copper, solid (no transparency)
const COPPER_SOLID = "#9C5A2B"; // mobile drawer uses the same copper
const PASTEL = "#F3E7D5"; // ivory text inside copper surfaces
const INK = "#111111";
const IVORY = "#FCF8F0"; // same pastel as the benefits strip

const glass = {
  background: COPPER,
  borderBottom: "1px solid rgba(243,231,213,0.2)",
} as const;

const mainLinks = [
  { label: "Shop All Perfumes", href: "/shopallperfume" },
  { label: "Men", href: "/men" },
  { label: "Women", href: "/women" },
  { label: "Unisex", href: "/unisexual" },
  { label: "Luxury Collection", href: "/luxuary" },
  { label: "Oud & Arabian", href: "/oud" },
];
const afterLinks = [
  { label: "Gift Sets", href: "/gifts" },
  { label: "New Arrivals", href: "/shop/new-arrivals" },
];

// Each family jumps to the homepage section "You are in ...".
// slug must match the category name in data/products.tsx (lowercase, dashes).
const families = [
  { label: "Oud & Woody", slug: "oud-woody" },
  { label: "Fresh & Aquatic", slug: "fresh-aquatic" },
  { label: "Floral", slug: "floral" },
  { label: "Citrus & Fruity", slug: "citrus-fruity" },
  { label: "Amber & Spicy", slug: "amber-spicy" },
  { label: "Musk & Powdery", slug: "musk-powdery" },
  { label: "Sweet & Gourmand", slug: "sweet-gourmand" },
];
const familyHref = (slug: string) => `/?category=${slug}#perfume-categories`;

// Black nav label with a full-width underline that grows left to right
const navItem =
  "group relative whitespace-nowrap py-2 text-[12px] font-medium uppercase tracking-[0.12em] xl:tracking-[0.18em] text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]";
const navLine =
  "pointer-events-none absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-[#111111] transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100";
const creamLine =
  "pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100";

function SearchIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="fill-none stroke-current" strokeWidth="1.4" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobileColl, setMobileColl] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false); // navbar hidden while scrolling down
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeAll = () => {
    setMega(false);
    setDrawer(false);
    setSearchOpen(false);
    setMobileColl(false);
  };

  // Family link: on the homepage, tell the section to switch category (no reload).
  // On any other page, the link navigates to the homepage with ?category=...
  const goToFamily = (e: MouseEvent<HTMLAnchorElement>, slug: string) => {
    closeAll();
    if (pathname === "/") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("select-category", { detail: slug }));
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMega(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  // Hide the navbar when scrolling down, show it again as soon as you scroll up
  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (y < 80) {
        setHidden(false); // always visible near the top
      } else if (delta > 6) {
        setHidden(true); // scrolling down
        setMega(false);
        setSearchOpen(false);
      } else if (delta < -6) {
        setHidden(false); // scrolling up
      }

      if (Math.abs(delta) > 6) lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    closeAll();
    router.push(`/shop?search=${encodeURIComponent(q)}`);
  };

  return (
    <>
      {/* Spacer: keeps the page content below the fixed navbar (same heights as the header) */}
      <div aria-hidden className="h-[76px] w-full md:h-[88px] lg:h-[144px]" />

      {/*
        The navbar is FIXED to the top of the screen (works even when the page CSS
        has overflow-x: hidden, which breaks position: sticky). It slides up when
        scrolling down and back in when scrolling up.
      */}
      <div
        ref={wrapRef}
        className={`fixed inset-x-0 top-0 z-30 w-full transition-transform duration-300 ease-out motion-reduce:transition-none ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        onMouseLeave={() => setMega(false)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setMega(false);
        }}
      >
        <header style={{ background: IVORY }}>
          {/* Row 1: search (left) | logo (true centre) | icons (right) */}
          <div className="mx-auto grid h-[76px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 md:h-[88px] md:px-8 lg:h-24 lg:px-12">
            <div className="flex items-center justify-self-start" style={{ color: INK }}>
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={drawer}
                onClick={() => setDrawer(true)}
                className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-60 lg:hidden"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" className="fill-none stroke-current" strokeWidth="1.4">
                  <path d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                aria-controls="search-panel"
                onClick={() => {
                  setMega(false);
                  setSearchOpen((v) => !v);
                }}
                className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-60"
              >
                <SearchIcon />
              </button>
            </div>

            <Link href="/" aria-label="Mirqas Perfumes home" className="justify-self-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logoo.png"
                alt="Mirqas Perfumes"
                className="h-[95px] w-auto mix-blend-multiply md:h-[108px] lg:h-[125px]"
              />
            </Link>

            <div className="flex items-center justify-self-end" style={{ color: INK }}>
              <Link
                href="/cart"
                aria-label="Shopping bag"
                className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-60"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" className="fill-none stroke-current" strokeWidth="1.4">
                  <path d="M5 8h14l-1 13H6L5 8z" />
                  <path d="M9 8V6a3 3 0 016 0v2" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Row 2: centred navigation (desktop) */}
          <nav aria-label="Primary" className="hidden h-12 items-start justify-center lg:flex">
            <ul className="flex items-center gap-6 xl:gap-10">
              {mainLinks.map((l) => (
                <li key={l.label} onMouseEnter={() => setMega(false)}>
                  <Link href={l.href} className={navItem}>
                    {l.label}
                    <span className={navLine} />
                  </Link>
                </li>
              ))}

              <li onMouseEnter={() => { setSearchOpen(false); setMega(true); }}>
                <button
                  type="button"
                  className={navItem}
                  aria-expanded={mega}
                  aria-haspopup="true"
                  aria-controls="mega-menu"
                  onClick={() => { setSearchOpen(false); setMega((v) => !v); }}
                >
                  Collections
                  <span className={`${navLine} ${mega ? "scale-x-100" : ""}`} />
                </button>
              </li>

              {afterLinks.map((l) => (
                <li key={l.label} onMouseEnter={() => setMega(false)}>
                  <Link href={l.href} className={navItem}>
                    {l.label}
                    <span className={navLine} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {/* Collections mega menu (desktop) */}
        <div
          id="mega-menu"
          role="region"
          aria-label="Collections"
          className={`absolute inset-x-0 top-full hidden transition-all duration-300 ease-out motion-reduce:transition-none lg:block ${
            mega
              ? "visible translate-y-0 opacity-100"
              : "pointer-events-none invisible -translate-y-2 opacity-0"
          }`}
          style={glass}
        >
          <div className="mx-auto max-w-[1600px] px-12 pb-10 pt-12">
            <p className="mb-8 text-[11px] uppercase tracking-[0.3em]" style={{ color: PASTEL, opacity: 0.85 }}>
              Explore by fragrance family
            </p>

            <ul className="grid grid-cols-3 gap-x-10 gap-y-6 xl:grid-cols-4">
              {families.map((f) => (
                <li key={f.label}>
                  <Link
                    href={familyHref(f.slug)}
                    onClick={(e) => goToFamily(e, f.slug)}
                    tabIndex={mega ? 0 : -1}
                    className="group relative inline-block text-[11px] uppercase leading-tight tracking-[0.3em]"
                    style={{ color: PASTEL }}
                  >
                    {f.label}
                    <span className={creamLine} style={{ background: "#E9D3A8" }} />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 border-t pt-5" style={{ borderColor: "rgba(243,231,213,0.2)" }}>
              <Link
                href="/collections"
                onClick={closeAll}
                tabIndex={mega ? 0 : -1}
                className="group relative inline-block text-[12px] uppercase tracking-[0.22em]"
                style={{ color: PASTEL }}
              >
                Shop all collections
                <span className={creamLine} style={{ background: PASTEL }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Search panel: ivory, black text, subtle border */}
        <div
          id="search-panel"
          className={`absolute inset-x-0 top-full border-b border-black/10 transition-all duration-300 motion-reduce:transition-none ${
            searchOpen
              ? "visible translate-y-0 opacity-100"
              : "pointer-events-none invisible -translate-y-2 opacity-0"
          }`}
          style={{ background: IVORY }}
        >
          <form onSubmit={submitSearch} role="search" className="mx-auto flex max-w-[720px] items-center gap-3 px-5 py-4">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search perfumes..."
              aria-label="Search perfumes"
              tabIndex={searchOpen ? 0 : -1}
              className="h-11 w-full border border-black/20 bg-transparent px-4 text-[14px] tracking-wide text-[#111111] outline-none transition-colors placeholder:text-black/45 focus:border-[#111111]"
            />
            <button
              type="submit"
              tabIndex={searchOpen ? 0 : -1}
              className="h-11 shrink-0 border border-[#111111] bg-[#111111] px-6 text-[12px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-transparent hover:text-[#111111]"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        onClick={() => setDrawer(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${
          drawer ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Menu"
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[min(86vw,340px)] flex-col gap-5 overflow-y-auto px-8 pb-10 pt-24 transition-transform duration-300 lg:hidden ${
          drawer ? "translate-x-0" : "invisible -translate-x-full"
        }`}
        style={{ background: COPPER_SOLID, color: PASTEL, fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
          className="absolute right-4 top-5 flex h-11 w-11 items-center justify-center"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" className="fill-none stroke-current" strokeWidth="1.4">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>

        {mainLinks.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            onClick={closeAll}
            className="pb-3 text-[13px] uppercase tracking-[0.16em]"
            style={{ borderBottom: "1px solid rgba(243,231,213,0.3)" }}
          >
            {l.label}
          </Link>
        ))}

        <div>
          <button
            type="button"
            aria-expanded={mobileColl}
            aria-controls="mobile-collections"
            onClick={() => setMobileColl((v) => !v)}
            className="flex w-full items-center justify-between pb-3 text-[13px] uppercase tracking-[0.16em]"
            style={{ borderBottom: "1px solid rgba(243,231,213,0.3)" }}
          >
            Collections
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              className={`fill-none stroke-current transition-transform duration-300 ${mobileColl ? "rotate-180" : ""}`}
              strokeWidth="1.6"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div
            id="mobile-collections"
            className={`grid transition-all duration-300 ${
              mobileColl ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <ul className="flex flex-col gap-1 px-4 py-3" style={glass}>
                <li className="pb-2 text-[10px] uppercase tracking-[0.3em] opacity-80">Explore by fragrance family</li>
                {families.map((f) => (
                  <li key={f.label}>
                    <Link
                      href={familyHref(f.slug)}
                      onClick={(e) => goToFamily(e, f.slug)}
                      tabIndex={mobileColl ? 0 : -1}
                      className="block py-2.5 text-[11px] uppercase tracking-[0.3em]"
                    >
                      {f.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/collections"
                    onClick={closeAll}
                    tabIndex={mobileColl ? 0 : -1}
                    className="block pt-3 text-[11px] uppercase tracking-[0.2em]"
                  >
                    Shop all collections
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {afterLinks.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            onClick={closeAll}
            className="pb-3 text-[13px] uppercase tracking-[0.16em]"
            style={{ borderBottom: "1px solid rgba(243,231,213,0.3)" }}
          >
            {l.label}
          </Link>
        ))}

        <button
          type="button"
          onClick={() => {
            setDrawer(false);
            setSearchOpen(true);
          }}
          className="flex items-center gap-3 pb-3 text-[13px] uppercase tracking-[0.16em]"
          style={{ borderBottom: "1px solid rgba(243,231,213,0.3)" }}
        >
          <SearchIcon size={18} /> Search
        </button>
      </aside>
    </>
  );
}