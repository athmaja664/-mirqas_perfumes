"use client";

import { useState } from "react";
import Link from "next/link";

// ---------- EDIT HERE ----------
// Banner image (a full link, or a file like "/images/new-arrivals.jpg").
// Use "" for a plain dark banner.
const BANNER_IMAGE =
  "https://images.pexels.com/photos/31707005/pexels-photo-31707005.jpeg?auto=compress&cs=tinysrgb&w=1920";

type Gender = "Women" | "Men" | "Unisex";

interface Perfume {
  slug: string; // must be unique: used for the /product/<slug> link
  name: string;
  price: number;
  mrp: number;
  gender: Gender;
  badge?: string;
  image?: string; // optional, default is /perfumes/main.jpg
  hoverImage?: string; // optional, default is /perfumes/hover.jpg
}

// Placeholder names and prices: replace with your real products
const perfumes: Perfume[] = [
  { slug: "midnight-rose", name: "Midnight Rose Eau De Parfum", price: 646, mrp: 795, gender: "Women", badge: "New",image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { slug: "bloom", name: "Bloom Eau De Parfum", price: 556, mrp: 695, gender: "Women", badge: "New",image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { slug: "amber-glow", name: "Amber Glow Eau De Parfum", price: 646, mrp: 795, gender: "Women", badge: "New" ,image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"},
  { slug: "spice-route", name: "Spice Route Eau De Parfum", price: 596, mrp: 745, gender: "Men", badge: "New",image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { slug: "black-amber", name: "Black Amber Eau De Parfum", price: 646, mrp: 795, gender: "Men", badge: "New",image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { slug: "cedar-wood", name: "Cedar Wood Eau De Parfum", price: 556, mrp: 695, gender: "Men", badge: "New" ,image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"},
  { slug: "velvet-smoke", name: "Velvet Smoke Eau De Parfum", price: 646, mrp: 795, gender: "Unisex", badge: "New" ,image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"},
  { slug: "golden-iris", name: "Golden Iris Eau De Parfum", price: 596, mrp: 745, gender: "Unisex", badge: "New" ,image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"},
  { slug: "white-sage", name: "White Sage Eau De Parfum", price: 556, mrp: 695, gender: "Unisex", badge: "New" ,image: "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",hoverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"},
];

const TABS = ["All", "Women", "Men", "Unisex"] as const;
type Tab = (typeof TABS)[number];

export default function NewArrivalsPage() {
  const [tab, setTab] = useState<Tab>("All");

  const visible =
    tab === "All" ? perfumes : perfumes.filter((p) => p.gender === tab);

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-neutral-900 lg:px-16">
      <div className="mx-auto max-w-[1400px]">
        {/* Banner */}
        <section className="relative mb-8 h-[300px] w-full overflow-hidden bg-neutral-800 sm:h-[360px] lg:h-[420px]">
          {BANNER_IMAGE && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={BANNER_IMAGE}
              alt="New arrivals perfume campaign"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          )}

          {/* Darker on the left, where the text is */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

          {/* Text: centered on phones, on the left from tablet up */}
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center sm:justify-start sm:pl-[8%] sm:text-left lg:pl-[10%]">
            <div className="max-w-xl text-white drop-shadow-md">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] sm:text-sm">
                Just landed
              </p>
              <h1 className="font-['Inter'] text-4xl font-normal leading-tight sm:text-5xl lg:text-7xl">
                New
                <span className="block text-5xl sm:text-6xl lg:text-8xl">
                  Arrivals
                </span>
              </h1>
              <a
                href="#new-perfumes"
                className="mt-6 inline-flex border border-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-white hover:text-neutral-900 sm:mt-8"
              >
                Shop Now
              </a>
            </div>
          </div>
        </section>

        {/* Filter tabs */}
        <div
          className="mb-4 flex flex-wrap gap-3"
          role="tablist"
          aria-label="Filter new arrivals"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`border px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                tab === t
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="mb-10 text-sm text-neutral-500">
          NEW ARRIVALS &nbsp;|&nbsp; {visible.length} Products
        </p>

        {visible.length === 0 ? (
          <p className="py-10 text-center text-neutral-500">
            No new arrivals here yet.
          </p>
        ) : (
          <div
            id="new-perfumes"
            className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4"
          >
            {visible.map((p) => (
              <Link
                key={p.slug}
                href={`/product/${p.slug}`}
                className="group relative block"
              >
                {p.badge && (
                  <span className="absolute left-0 top-0 z-10 max-w-[140px] bg-[#b1e549] px-3 py-2 text-xs font-semibold leading-tight text-white">
                    {p.badge}
                  </span>
                )}

                <div className="relative aspect-[3/4] overflow-hidden bg-[#ffffff]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image ?? "/perfumes/main.jpg"}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500 group-hover:opacity-0"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.hoverImage ?? "/perfumes/hover.jpg"}
                    alt={`${p.name} alternate view`}
                    className="absolute inset-0 h-full w-full object-contain p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                    {p.gender}
                  </p>
                  <h3 className="mt-1 text-sm font-medium">{p.name}</h3>
                  <p className="mt-2 text-sm font-semibold">
                    ₹ {p.price}
                    <span className="ml-2 text-xs font-normal text-neutral-400 line-through">
                      ₹ {p.mrp}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}