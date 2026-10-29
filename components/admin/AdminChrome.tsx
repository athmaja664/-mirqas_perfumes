"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const PASTEL = "#F3E7D5";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// Items without an href are not built yet, so they show "Soon" instead of a broken link.
const NAV: { label: string; href?: string }[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Products", href: "/admin/products" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Orders" },
  { label: "Profile", href: "/admin/profile" },
];
export default function AdminChrome({
  active,
  logout,
  children,
}: {
  active: string;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the menu after moving to another page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onResize() {
      if (window.innerWidth >= 1024) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const navBase = "whitespace-nowrap px-4 py-3 text-[12px] uppercase tracking-[0.2em] transition-colors";

  return (
    <div className="min-h-screen lg:flex" style={{ background: IVORY, fontFamily: sans }}>
      <style>{`@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap");`}</style>

      {/* Top bar: phones and tablets only */}
      <header
        className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 lg:hidden"
        style={{ background: COPPER, color: PASTEL }}
      >
        <div>
          <p className="m-0 text-[24px] font-medium leading-none" style={{ fontFamily: serif }}>
            Mirqas
          </p>
          <p className="m-0 mt-0.5 text-[9px] uppercase tracking-[0.3em] opacity-80">Admin panel</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="flex h-11 w-11 items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Dark area behind the open menu */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        id="admin-drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] transform flex-col gap-6 overflow-y-auto px-6 py-6 transition-[transform,visibility] duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-[260px] lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:py-8 lg:visible ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
        style={{ background: COPPER, color: PASTEL }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[28px] font-medium leading-none" style={{ fontFamily: serif }}>
              Mirqas
            </p>
            <p className="mb-0 mt-1 text-[10px] uppercase tracking-[0.3em] opacity-80">Admin panel</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const isActive = item.label === active;
            if (!item.href) {
              return (
                <span key={item.label} className={`${navBase} flex items-center justify-between opacity-50`}>
                  {item.label}
                  <span className="ml-3 text-[9px] tracking-[0.15em]">Soon</span>
                </span>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`${navBase} ${isActive ? "bg-[#F3E7D5] font-semibold text-[#111]" : "hover:bg-white/10"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3">
          <Link href="/" className="py-2 text-[12px] uppercase tracking-[0.18em] underline-offset-4 hover:underline">
            View store
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-full border border-[#F3E7D5] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F3E7D5] transition-colors hover:bg-[#F3E7D5] hover:text-[#111]"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-12">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}