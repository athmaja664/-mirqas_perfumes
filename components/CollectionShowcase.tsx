import Image from "next/image";
import Link from "next/link";

const CREAM = "#FFF9F3";
const CHARCOAL = "#242424";
const PASTEL = "#F3E7D5";
const BURGUNDY = "#754747";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// ---------- EDIT HERE: image, text and link for each collection ----------
// image: a full link (https://...) or a local file like "/images/collections/men.jpg"
//        Leave "" until you have the image: the card shows a neutral block.
// href:  "/shop" works today. Change it when /shop/women etc. exist.
const collections = [
  {
    id: "women",
    title: "Women's Collection",
    subtitle: "Elegance in every essence.",
    image:
      "https://plus.unsplash.com/premium_photo-1738860331028-9103e025522d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
    alt: "Woman wearing a signature Mirqas fragrance",
    position: "center",
    href: "/shop",
  },
  {
    id: "men",
    title: "Men's Collection",
    subtitle: "A statement of character.",
    image: "https://images.pexels.com/photos/28557815/pexels-photo-28557815.jpeg", 
    alt: "Man wearing a signature Mirqas fragrance",
    position: "center",
    href: "/shop",
  },
  {
    id: "unisex",
    title: "Unisex Collection",
    subtitle: "Fragrance without boundaries.",
    image: "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D", 
    alt: "Mirqas unisex fragrance collection",
    position: "center",
    href: "/shop",
  },
];

// An image is usable only if it is a full link or starts with "/"
const isValidSrc = (src: string) =>
  src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://");

export default function CollectionShowcase() {
  return (
    <section
      aria-labelledby="collection-showcase-heading"
      className="w-full"
      style={{ background: CREAM, fontFamily: sans }}
    >
      <style>{`
        .cs-img { transition: transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1); }
        .cs-card:focus-visible { outline: 2px solid ${BURGUNDY}; outline-offset: 4px; }

        @media (hover: hover) {
          .cs-card:hover .cs-img,
          .cs-card:focus-visible .cs-img { transform: scale(1.05); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-img { transition: none; }
          .cs-card:hover .cs-img, .cs-card:focus-visible .cs-img { transform: none; }
        }
      `}</style>

      <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8 md:py-16 lg:px-12 lg:py-24">
        <div className="text-center">
          <h2
            id="collection-showcase-heading"
            className="m-0 font-normal uppercase tracking-[0.18em]"
            style={{
              fontFamily: serif,
              color: CHARCOAL,
              fontSize: "clamp(1.6rem, 3vw, 2.5rem)",
            }}
          >
            Discover Your Signature
          </h2>
          <p
            className="mx-auto mt-4 max-w-md text-[14px] md:text-[15px]"
            style={{ color: CHARCOAL, opacity: 0.7 }}
          >
            Three worlds of fragrance. One expression of you.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:mt-14 md:grid-cols-3 md:gap-4 lg:gap-8">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={c.href}
                className="cs-card relative block aspect-[4/5] w-full overflow-hidden"
                style={{ background: PASTEL }}
              >
                {isValidSrc(c.image) && (
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="cs-img object-cover"
                    style={{ objectPosition: c.position }}
                  />
                )}

                {/* Dark gradient so the text is always readable */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
                />

                {/* Text is always visible, over the image */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-8 text-center md:pb-10">
                  <h3
                    className="m-0 font-medium leading-tight"
                    style={{
                      fontFamily: serif,
                      color: PASTEL,
                      fontSize: "clamp(1.5rem, 2.4vw, 2rem)",
                      textShadow: "0 2px 18px rgba(0,0,0,0.35)",
                    }}
                  >
                    {c.title}
                  </h3>
                  <p className="mt-2 text-[13px] md:text-[14px]" style={{ color: PASTEL }}>
                    {c.subtitle}
                  </p>
                  <span
                    className="mt-5 inline-block border-b pb-1 text-[11px] uppercase tracking-[0.22em]"
                    style={{ color: PASTEL, borderColor: PASTEL }}
                  >
                    Explore Collection →
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