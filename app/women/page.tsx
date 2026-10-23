// Save as: app/shop/women/page.tsx
// Images go in: public/perfumes/<slug>/main.jpg  and  public/perfumes/<slug>/hover.jpg

const perfumes = [
    { slug: "celeste", name: "Celeste Eau De Parfum", price: 556, mrp: 695, badge: "Bestseller" },
    { slug: "pristine", name: "Pristine Eau De Parfum", price: 556, mrp: 695 },
    { slug: "tales-vanilla", name: "Tales Vanilla Eau De Parfum", price: 596, mrp: 745, badge: "Shop 2 Tales and get 10% extra off" },
    { slug: "sheer", name: "Sheer Eau De Parfum", price: 556, mrp: 695 },
    { slug: "nude", name: "Nude Eau De Parfum", price: 556, mrp: 695 },
    { slug: "verve", name: "Verve Eau De Parfum", price: 596, mrp: 745 },
    { slug: "aura", name: "Aura Eau De Parfum", price: 596, mrp: 745 },
    { slug: "amber-glow", name: "Amber Glow Eau De Parfum", price: 646, mrp: 795 },
    { slug: "bloom", name: "Bloom Eau De Parfum", price: 556, mrp: 695 },
    { slug: "midnight-rose", name: "Midnight Rose Eau De Parfum", price: 646, mrp: 795, badge: "New" },
];

export default function WomenShopPage() {
    return (
        <main className="min-h-screen bg-white px-6 py-12 text-neutral-900 lg:px-16">
            <div className="mx-auto max-w-[1400px]">


                {/* Women's perfume video banner */}
                <section className="group relative mb-8 h-[300px] w-full overflow-hidden sm:h-[360px] lg:h-[420px]">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster="/perfumes/banner-poster.jpg"
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        aria-label="Women's perfume campaign video"
                    >
                        <source
                            src="/videos/w_video.mp4"
                            type="video/mp4"
                        />
                    </video>

                    {/* Warm overlay for readable text */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/25" />

                    {/* Campaign text */}
                    <div className="absolute inset-0 flex items-center justify-center px-5 text-center sm:justify-end sm:pr-[8%] sm:text-left lg:pr-[10%]">
                        <div className="max-w-xl text-white drop-shadow-md">
                            <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] sm:text-sm">
                                Discover your signature scent
                            </p>

                            <h1 className="font-['Inter'] text-4xl font-normal leading-tight sm:text-5xl lg:text-7xl">
    Make every moment
    <span className="block text-5xl sm:text-6xl lg:text-8xl">
        Special
    </span>
</h1>

                            <a
                                href="#women-perfumes"
                                className="mt-6 inline-flex border border-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-white hover:text-neutral-900 sm:mt-8"
                            >
                                Shop Now
                            </a>
                        </div>
                    </div>
                </section>


                <p className="mb-10 text-sm text-neutral-500">WOMEN &nbsp;|&nbsp; {perfumes.length} Products</p>


                <div
                    id="women-perfumes"
                    className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4"
                >
                    {perfumes.map((p) => (
                        <a
                            key={p.slug}
                            href={`/product/${p.slug}`}
                            className="group relative block"
                        >
                            {p.badge && (
                                <span className="absolute left-0 top-0 z-10 max-w-[140px] bg-[#b1e549] px-3 py-2 text-xs font-semibold leading-tight text-white">
                                    {p.badge}
                                </span>
                            )}

                            {/* Product images */}
                            <div className="relative aspect-[3/4] overflow-hidden bg-[#ffffff]">
                                <img
                                    src="/perfumes/main.jpg"
                                    alt={p.name}
                                    className="absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500 group-hover:opacity-0"
                                />

                                <img
                                    src="/perfumes/hover.jpg"
                                    alt={`${p.name} alternate view`}
                                    className="absolute inset-0 h-full w-full object-contain p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                />
                            </div>

                            {/* Product details */}
                            <div className="mt-4 text-center">
                                <h3 className="text-sm font-medium">{p.name}</h3>

                                <p className="mt-2 text-sm font-semibold">
                                    ₹ {p.price}
                                    <span className="ml-2 text-xs font-normal text-neutral-400 line-through">
                                        ₹ {p.mrp}
                                    </span>
                                </p>
                            </div>
                        </a>
                    ))}
                </div>

            </div>
        </main>
    );
}