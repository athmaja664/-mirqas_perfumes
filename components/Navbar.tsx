"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react";

// Solid copper is used ONLY for the Collections mega menu (and its mobile list)
// and for the Search button.
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
  "group relative whitespace-nowrap py-2 text-[11px] font-medium uppercase tracking-[0.1em] xl:text-[12px] xl:tracking-[0.18em] text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]";
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
  const [searchOpen, setSearchOpen] = useState(false); // phones/tablets only (dropdown panel)
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false); // navbar hidden while scrolling down
  const [accountHref, setAccountHref] = useState("/login"); // changes when someone is signed in
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

  // Ask the server who is signed in, and re-check whenever the page changes.
  // The server decides the role; the navbar only picks where the icon points.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const u = d?.user;
        setAccountHref(!u ? "/login" : u.role === "admin" ? "/admin/dashboard" : "/account");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    closeAll();
    router.push(`/shop?search=${encodeURIComponent(q)}`);
  };

  const signedIn = accountHref !== "/login";

  // Admin pages have their own sidebar, so the store navbar is not shown there.
  // (This must stay AFTER all the hooks above.)
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/*
        Spacer: keeps the page content below the fixed navbar. It must equal the header height:
        row 1 = logo box height + 16px padding,  row 2 (desktop only) = 44px.
          phones  76 + 16            = 92px
          tablets 96 + 16            = 112px
          desktop 112 + 16 + 44      = 172px
        If you change a logo BOX height below (the h-[..px] on the logo link),
        change the matching number here by the same amount.
      */}
      <div aria-hidden className="h-[92px] w-full md:h-[112px] lg:h-[172px]" />

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
          {/*
            Row 1
            - phones/tablets: menu + search icon (left) | logo (centre) | account, wishlist, bag (right)
            - desktop (lg+):  logo (left) | wide search bar (middle) | account, wishlist, bag (right)
          */}
          <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 px-4 py-2 md:px-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-4 lg:px-12">
            {/* phones/tablets only */}
            <div className="flex items-center justify-self-start lg:hidden" style={{ color: INK }}>
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={drawer}
                onClick={() => setDrawer(true)}
                className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 md:h-11 md:w-11"
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
                className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 md:h-11 md:w-11"
              >
                <SearchIcon />
              </button>
            </div>

            <Link
              href="/"
              aria-label="Mirqas Perfumes home"
              className="flex h-[76px] items-center justify-self-center overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#111111] md:h-[96px] lg:h-[112px] lg:justify-self-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logoo.png"
                alt="Mirqas Perfumes"
                className="block h-[150px] w-auto max-w-none shrink-0 mix-blend-multiply md:h-[170px] lg:h-[200px]"
              />
            </Link>

            {/* Desktop search bar: input with icon inside + solid copper Search button */}
            <form
              onSubmit={submitSearch}
              role="search"
              className="hidden w-full max-w-[680px] items-center gap-3 justify-self-center px-6 lg:flex xl:px-10"
            >
              <div className="relative flex-1">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setMega(false)}
                  placeholder="Search for perfumes"
                  aria-label="Search perfumes"
                  className="h-12 w-full border border-black/20 bg-white pl-4 pr-12 text-[14px] tracking-wide text-[#111111] outline-none transition-colors placeholder:text-black/45 focus:border-[#111111]"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#111111]">
                  <SearchIcon size={20} />
                </span>
              </div>
              <button
                type="submit"
                className="h-12 shrink-0 px-8 text-[14px] font-semibold tracking-wide text-white transition-colors hover:bg-[#7d4720] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
                style={{ background: COPPER }}
              >
                Search
              </button>
            </form>

            {/* Account, wishlist and bag: visible on every screen size */}
            <div className="flex items-center justify-self-end" style={{ color: INK }}>
              <Link
                href={accountHref}
                aria-label={signedIn ? "My account" : "Login or register"}
                className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 md:h-11 md:w-11"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" className="fill-none stroke-current" strokeWidth="1.4" aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                </svg>
              </Link>
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 md:h-11 md:w-11"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" className="fill-none stroke-current" strokeWidth="1.4" aria-hidden>
                  <path d="M12 20.5s-7.5-4.6-9-9.3C2 7.9 4 5 7 5c1.9 0 3.5 1 5 3 1.5-2 3.1-3 5-3 3 0 5 2.9 4 6.2-1.5 4.7-9 9.3-9 9.3z" />
                </svg>
              </Link>
              <Link
                href="/cart"
                aria-label="Shopping bag"
                className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60 md:h-11 md:w-11"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" className="fill-none stroke-current" strokeWidth="1.4">
                  <path d="M5 8h14l-1 13H6L5 8z" />
                  <path d="M9 8V6a3 3 0 016 0v2" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Row 2: centred navigation (desktop) */}
          <nav aria-label="Primary" className="hidden h-11 items-center justify-center px-4 lg:flex">
            <ul className="flex items-center gap-4 xl:gap-8 2xl:gap-10">
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

        {/* Search panel for phones/tablets (desktop uses the search bar in the header) */}
        <div
          id="search-panel"
          className={`absolute inset-x-0 top-full border-b border-black/10 transition-all duration-300 motion-reduce:transition-none lg:hidden ${
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
              placeholder="Search for perfumes"
              aria-label="Search perfumes"
              tabIndex={searchOpen ? 0 : -1}
              className="h-11 w-full border border-black/20 bg-white px-4 text-[14px] tracking-wide text-[#111111] outline-none transition-colors placeholder:text-black/45 focus:border-[#111111]"
            />
            <button
              type="submit"
              tabIndex={searchOpen ? 0 : -1}
              className="h-11 shrink-0 px-6 text-[14px] font-semibold tracking-wide text-white transition-colors hover:bg-[#7d4720]"
              style={{ background: COPPER }}
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

        {/* Home: mobile/tablet menu only (the desktop navbar has no Home link) */}
        <Link
          href="/"
          onClick={closeAll}
          className="pb-3 text-[13px] uppercase tracking-[0.16em]"
          style={{ borderBottom: "1px solid rgba(243,231,213,0.3)" }}
        >
          Home
        </Link>

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