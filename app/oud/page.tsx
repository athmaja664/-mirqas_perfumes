// app/oud-arabian/page.tsx  (Next.js App Router + Tailwind)
// Visit: http://localhost:3000/oud-arabian

import Image from "next/image";

const GOLD = "#D4A017";
const COPPER = "#B87333";

// Paste your hero image URL here (https://... or /oud-arabian/hero.jpg).
// Leave it empty ("") to show the example placeholder.
const HERO_IMAGE = "https://images.pexels.com/photos/30618765/pexels-photo-30618765.jpeg";

// Paste your history section image URL here. Leave "" for the placeholder.
const HISTORY_IMAGE = "/images/history.jpg";

type Item = { name: string; size: string; price: string; image?: string };

// Put each product photo in /public/oud-arabian/ (or use a direct https image URL)
const collection: Item[] = [
  { name: "Nadeem", size: "100ML", price: "₹ 6,290.00", image: "/images/collection-one.jpg" },
  { name: "Oudh Al Ayal", size: "100ML", price: "₹ 2,490.00", image: "/images/collection-two.jpg" },
  { name: "A Poem", size: "100ML", price: "₹ 5,990.00", image: "/images/collection-three.jpg" },
  { name: "Rouge Vanilla", size: "100ML", price: "₹ 5,990.00", image: "/images/collection-four.jpg" },
  { name: "7 Moons", size: "100ML", price: "₹ 5,990.00", image: "/images/collection-nine.jpg" },
  { name: "Maliki", size: "100ML", price: "₹ 5,990.00", image: "/images/collection-seven.jpg" },
];

const history = [
  {
    year: "Origins",
    text: "Oud, the dark resinous heartwood of the Aquilaria tree, has been treasured in Arabia for centuries. Burned in homes and worn as oil, it became a sign of hospitality and honour.",
  },
  {
    year: "The Craft",
    text: "Master perfumers age oud for months, sometimes years, distilling it slowly to draw out its deep, smoky-sweet character. Every batch is blended by hand.",
  },
  {
    year: "Today",
    text: "Oud Arabian carries this heritage forward, pairing time-honoured attars with modern perfumes in bottles worthy of the tradition.",
  },
];

// Placeholder shown when no real image is supplied
function ExampleImage({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-black to-neutral-900 ${className}`}
    >
      <svg viewBox="0 0 200 200" className="h-1/2 w-1/2 opacity-80" fill="none">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="100%" stopColor={COPPER} />
          </linearGradient>
        </defs>
        <rect x="70" y="80" width="60" height="90" rx="10" stroke="url(#g)" strokeWidth="3" />
        <rect x="88" y="55" width="24" height="25" rx="4" stroke="url(#g)" strokeWidth="3" />
        <path d="M80 120h40" stroke="url(#g)" strokeWidth="2" />
      </svg>
      <span
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em]"
        style={{ color: COPPER }}
      >
        {label}
      </span>
    </div>
  );
}

function Pic({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  return src ? (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
    </div>
  ) : (
    <ExampleImage label={alt} className={className} />
  );
}

export default function OudArabianPage() {
  return (
    <main className="min-h-screen bg-black text-[#D4A017]">
      {/* HERO */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0">
          {HERO_IMAGE ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={HERO_IMAGE}
              alt="Oud Arabian"
              className="h-full w-full object-cover opacity-50"
            />
          ) : (
            <ExampleImage label="Hero image" className="h-full w-full opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
        </div>
        <div className="relative z-10">
          <p className="mb-4 text-sm uppercase tracking-[0.5em]" style={{ color: COPPER }}>
            Mirqas Presents
          </p>
          <h1 className="text-5xl font-light uppercase tracking-[0.25em] md:text-7xl">Oud Arabian</h1>
          <div className="mx-auto my-6 h-px w-24" style={{ background: COPPER }} />
          <p className="mx-auto max-w-xl text-lg" style={{ color: COPPER }}>
            A tribute to the ancient art of oud, crafted in gold and shadow.
          </p>
          <a
            href="#collection"
            className="mt-10 inline-block border px-8 py-3 text-sm uppercase tracking-[0.3em] transition hover:bg-[#D4A017] hover:text-black"
            style={{ borderColor: GOLD }}
          >
            Explore Collection
          </a>
        </div>
      </section>

      {/* HISTORY */}
      <section className="border-y py-20" style={{ borderColor: "#3a2a12" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          {HISTORY_IMAGE ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={HISTORY_IMAGE}
              alt="Oud Arabian history"
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <ExampleImage label="History image" className="aspect-[4/5] w-full" />
          )}
          <div>
            <h2 className="mb-10 text-3xl uppercase tracking-[0.3em]">Our History</h2>
            <div className="space-y-8">
              {history.map((h) => (
                <div key={h.year} className="border-l-2 pl-6" style={{ borderColor: COPPER }}>
                  <h3 className="mb-2 text-sm uppercase tracking-[0.3em]" style={{ color: COPPER }}>
                    {h.year}
                  </h3>
                  <p className="leading-relaxed text-[#C9A24B]">{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION  (3-column grid, full-size product photos like Oud Arabia) */}
      <section id="collection" className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="mb-14 text-center text-3xl uppercase tracking-[0.3em]">The Collection</h2>
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {collection.map((p) => (
            <a key={p.name} href="#" className="group block text-center">
              <div className="overflow-hidden">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={p.name}
                    className="aspect-square w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <ExampleImage label={p.name} className="aspect-square w-full" />
                )}
              </div>
              <h3 className="mt-5 text-sm uppercase tracking-[0.3em]">
                {p.name} ({p.size})
              </h3>
              <p className="mt-2 text-sm text-white">{p.price}</p>
            </a>
          ))}
        </div>
      </section>

      <footer className="py-10 text-center text-xs uppercase tracking-[0.4em]" style={{ color: COPPER }}>
        © Mirqas Perfumes · Oud Arabian
      </footer>
    </main>
  );
}