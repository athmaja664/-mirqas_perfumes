import Image from "next/image";
import Link from "next/link";

const sans = "Inter, system-ui, sans-serif";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

// ---------- EDIT HERE: image and text ----------
const brandStoryConfig = {
  image: "/images/story/perfume-story.jpg", // save the file in public/images/story/
  imagePosition: "center", // which part of the photo is in focus, e.g. "70% center"
  alt: "Hand holding a fluted glass perfume bottle",
  eyebrow: "THE ESSENCE OF MIRQAS",
  title: "SOME MOMENTS DESERVE TO LAST FOREVER",
  description:
    "Some feelings are too beautiful for words. Discover fragrances that capture your memories, celebrate meaningful connections, and leave a lasting impression long after the moment has passed.",
  ctaLabel: "DISCOVER OUR STORY",
  href: "/about", // change this if your story/about page has another route
};

const isValidSrc = (s: string) =>
  s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://");

export default function BrandStorySection() {
  const c = brandStoryConfig;

  return (
    <section
      aria-labelledby="brand-story-heading"
      className="bs-section relative w-full"
      style={{ fontFamily: sans, background: "#8E5F5B" }}
    >
      <style>{`
        /* The section clips everything inside it. The photo inside is fixed to
           the screen, so it stays still while the section scrolls over it. */
        .bs-section {
          clip-path: inset(0);
          min-height: 50svh; /* phone height: change this number to make it taller or shorter */
        }
        @media (min-width: 768px) {
          .bs-section { min-height: 85svh; }
        }
        .bs-fixed {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100svh;
        }
        @media (prefers-reduced-motion: reduce) {
          .bs-fixed { position: absolute; height: 100%; }
        }
      `}</style>

      {/* Photo: fixed to the screen, shown through the section */}
      <div className="bs-fixed" aria-hidden={!isValidSrc(brandStoryConfig.image)}>
        {isValidSrc(c.image) && (
          <Image
            src="https://images.pexels.com/photos/1666405/pexels-photo-1666405.jpeg"
            alt={c.alt}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: c.imagePosition }}
          />
        )}
        {/* Soft overlay so the cream text stays readable */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black/35 md:bg-gradient-to-r md:from-[#7A4A46]/80 md:via-[#7A4A46]/35 md:to-transparent"
        />
      </div>

      {/* Text: scrolls normally with the page, over the still photo */}
      <div className="relative z-10 flex min-h-[50svh] items-center px-6 py-16 md:min-h-[85svh] md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-[520px] text-center text-[#FFF9F3] md:mx-0 md:w-[42%] md:max-w-none lg:w-[40%]">
          <p className="m-0 text-[11px] uppercase tracking-[0.3em] opacity-80">
            {c.eyebrow}
          </p>
          <h2
            id="brand-story-heading"
            className="m-0 mt-4 font-medium leading-[1.15]"
            style={{ fontFamily: serif, fontSize: "clamp(1.9rem, 3.2vw, 3.2rem)" }}
          >
            {c.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[440px] text-[14px] leading-relaxed md:text-[15px]">
            {c.description}
          </p>
          <div className="mt-8">
            <Link
              href={c.href}
              className="inline-block border border-current px-8 py-3.5 text-[12px] uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-[#FFF9F3] hover:text-[#242424] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFF9F3]"
            >
              {c.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}