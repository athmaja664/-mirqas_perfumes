"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

/* ================= EDIT HERE: your colours ================= */
const THEME = {
  primary: "#ffffff", // hero + badge background
  primaryDark: "#5A3039", // button hover, collage headline
  soft: "#f3f1ec", // chips, collage background
  light: "#ffffff", // text ON dark buttons
  dark: "#5A3039", // main text, buttons and outlines
  page: "#ffffff", // page background
  accent: "#cfcbc2", // hero glow, collage tile
  heart: "#ffffff", // saved wishlist heart
  heroText: "#3B2116", // PLAIN colour only (used by badge text + arrow button)
  heroGradient: "linear-gradient(90deg, #3B2116 0%, #5A3020 50%, #3B2116 100%)", // hero headline
  heroBottle: "#B4C646", // placeholder hero bottle, only if heroBottle image is empty
};

/* ================= EDIT HERE: add your image / video URLs ================= */
const CONFIG = {
  heroVideo: "", // optional background video, e.g. "/videos/hero.mp4"
  heroBottle: "/images/1.png", // transparent PNG bottle that overlaps the headline
  collage: [
    { src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcVAMNcych9WsuUPFBXjH477-1zeC5m46rQj6lCUei6Q&s=10", type: "image" },
    { src: "https://images.pexels.com/photos/10536602/pexels-photo-10536602.jpeg?cs=srgb&dl=pexels-ron-lach-10536602.jpg&fm=jpg", type: "image" },
    { src: "https://www.pexels.com/download/video/35200638/", type: "video" },
  ] as { src: string; type: "image" | "video" }[],
  currency: "₹",
  
};

type Product = {
  id: number;
  name: string;
  family: string;
  price: number; // base price for 50 ml
  color: string; // placeholder bottle colour
  cap: string;
  bg: string; // panel colour behind the bottle
  media: string; // image or video URL. Empty (or broken) = drawn bottle
  fit?: "cover" | "contain"; // cover = photo fills the arch (default). contain = transparent bottle cut-out
  mediaType: "image" | "video";
  notes: string[];
  concentration: string;
  longevity: string;
  desc: string;
};

const PRODUCTS: Product[] = [
  {
    id: 1, name: "Noir Esencia", family: "Woody · Amber", price: 1240,
    color: "#1c1c1c", cap: "#9a9a9a", bg: "#f1f1f1", media: "/images/noir-esencia.jpg", mediaType: "image",
    notes: ["Oud", "Black pepper", "Amber", "Tonka"], concentration: "Extrait", longevity: "10+ hours",
    desc: "A dark, resinous wood scent that opens with cracked pepper and settles into warm amber. Made for evenings that run late.",
  },
  {
    id: 2, name: "Citrus Dawn", family: "Fruit · Fresh", price: 1185,
    color: "#6e6e6e", cap: "#9a9a9a", bg: "#ececec", media: "/images/citrus-dawn.jpg", mediaType: "image",
    notes: ["Bergamot", "Blood orange", "Neroli", "Cedar"], concentration: "Eau de parfum", longevity: "6–8 hours",
    desc: "Sun-warmed peel and orange blossom over a clean cedar base. Bright enough for morning, refined enough for dinner.",
  },
  {
    id: 3, name: "Jasmine Hour", family: "Flower · Musk", price: 1210,
    color: "#cfcfcf", cap: "#9a9a9a", bg: "#f6f6f6", media: "/images/jasmine-hour.jpg", mediaType: "image",
    notes: ["Jasmine", "Tuberose", "Ylang", "White musk"], concentration: "Eau de parfum", longevity: "8–10 hours",
    desc: "Night-blooming jasmine laid over a soft, skin-like musk. Creamy and quietly confident, never loud.",
  },
  {
    id: 4, name: "Fig & Smoke", family: "Fruit · Smoky", price: 1225,
    color: "#444444", cap: "#9a9a9a", bg: "#e9e9e9", media: "/images/fig-smoke.jpg", mediaType: "image",
    notes: ["Green fig", "Birch tar", "Cedar", "Vanilla"], concentration: "Eau de parfum", longevity: "8–10 hours",
    desc: "Ripe fig skin meets a thread of campfire smoke. Sweet, green and slightly wild.",
  },
  {
    id: 5, name: "Cedar Study", family: "Woody · Leather", price: 1260,
    color: "#8c8c8c", cap: "#9a9a9a", bg: "#f0f0f0", media: "/images/cedar-study.jpg", mediaType: "image",
    notes: ["Atlas cedar", "Vetiver", "Leather", "Iris"], concentration: "Extrait", longevity: "10+ hours",
    desc: "Pencil shavings, old books and dry vetiver on a leather base. A quiet, intellectual signature.",
  },
];
/* ========================================================================= */

const SIZES = [
  { ml: 30, m: 0.6 },
  { ml: 50, m: 1 },
  { ml: 100, m: 1.65 },
] as const;
type Ml = (typeof SIZES)[number]["ml"];
type CartLine = { id: number; ml: Ml; q: number };

const T = THEME;
const PAD = "clamp(18px,5vw,64px)";
const FONT = "'Inter', system-ui, sans-serif";
const unitPrice = (p: Product, ml: Ml) => p.price * (SIZES.find((s) => s.ml === ml)?.m ?? 1);
const money = (n: number) => CONFIG.currency + Math.round(n);

/* shared inline style fragments */
const z: CSSProperties = { margin: 0, boxSizing: "border-box" };
const btn: CSSProperties = { ...z, font: "inherit", color: "inherit", cursor: "pointer", border: 0, background: "none", padding: 0 };
const fill: CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return match;
}

function Bottle({ color, cap, style }: { color: string; cap: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 160" aria-hidden="true" style={{ display: "block", ...style }}>
      <rect x="38" y="6" width="24" height="26" rx="3" fill={cap} />
      <rect x="44" y="30" width="12" height="8" fill={cap} opacity=".7" />
      <rect x="14" y="38" width="72" height="116" rx="12" fill={color} />
      <rect x="24" y="46" width="8" height="98" rx="4" fill="#fff" opacity=".18" />
      <rect x="30" y="84" width="44" height="34" rx="3" fill="#fff" opacity=".9" />
      <rect x="36" y="94" width="32" height="3" fill="#1a1a1a" />
      <rect x="40" y="102" width="24" height="3" fill="#1a1a1a" opacity=".5" />
    </svg>
  );
}

function Media({ p, bottleStyle, bottleOnly = false }: { p: Product; bottleStyle?: CSSProperties; bottleOnly?: boolean }) {
  const [failed, setFailed] = useState(false); // if the file is missing, show the drawn bottle instead
  useEffect(() => setFailed(false), [p.media]);
  if (!p.media || failed || (bottleOnly && p.mediaType === "video")) return <Bottle color={p.color} cap={p.cap} style={bottleStyle} />;
  const style: CSSProperties = p.fit === "contain" ? { ...fill, objectFit: "contain", padding: "14%" } : fill;
  if (p.mediaType === "video") return <video src={p.media} autoPlay muted loop playsInline style={fill} onError={() => setFailed(true)} />;
  return <img src={p.media} alt={p.name} loading="lazy" style={style} onError={() => setFailed(true)} />;
}

export default function PerfumeSection() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [wish, setWish] = useState<Set<number>>(new Set());
  const [sizes, setSizes] = useState<Record<number, Ml>>(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, 50 as Ml])));
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hover, setHover] = useState<number | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const bottleRef = useRef<HTMLDivElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const m = useMedia("(max-width: 820px)");
  const xs = useMedia("(max-width: 480px)");
  const reduce = useMedia("(prefers-reduced-motion: reduce)");

  const lines = useMemo(
    () =>
      cart.flatMap((l) => {
        const p = PRODUCTS.find((x) => x.id === l.id);
        return p ? [{ ...l, p, unit: unitPrice(p, l.ml) }] : [];
      }),
    [cart]
  );
  const count = lines.reduce((n, l) => n + l.q, 0);
  const subtotal = lines.reduce((n, l) => n + l.unit * l.q, 0);

  /* load Inter + remembered cart (client only) */
  useEffect(() => {
    if (!document.getElementById("inter-font")) {
      const link = document.createElement("link");
      link.id = "inter-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
    try {
      const raw = JSON.parse(localStorage.getItem("mirqas_cart") || "[]");
      if (Array.isArray(raw)) setCart(raw);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("mirqas_cart", JSON.stringify(cart));
    } catch {}
  }, [cart, ready]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1800);
  };

  const add = (p: Product) => {
    const ml = sizes[p.id];
    setCart((c) => {
      const hit = c.find((l) => l.id === p.id && l.ml === ml);
      return hit ? c.map((l) => (l === hit ? { ...l, q: l.q + 1 } : l)) : [...c, { id: p.id, ml, q: 1 }];
    });
    say(`${p.name} added to cart`);
  };

  const change = (i: number, d: number) =>
    setCart((c) => c.flatMap((l, idx) => (idx !== i ? [l] : l.q + d > 0 ? [{ ...l, q: l.q + d }] : [])));

  const toggleWish = (p: Product) => {
    const next = new Set(wish);
    next.has(p.id) ? next.delete(p.id) : next.add(p.id);
    setWish(next);
    say(next.has(p.id) ? "Saved to wishlist" : "Removed from wishlist");
  };

  const onHeroMove = (e: MouseEvent) => {
    if (reduce || !window.matchMedia("(hover:hover)").matches || !bottleRef.current) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 24;
    const y = (e.clientY / window.innerHeight - 0.5) * 16;
    bottleRef.current.style.transform = `translate(calc(-50% + ${x}px),calc(-52% + ${y}px)) rotate(${x / 6}deg)`;
  };

  const closeCart = () => {
    setOpen(false);
    cartBtnRef.current?.focus();
  };

  const tile = (i: number): CSSProperties => {
    const base: CSSProperties = { position: "absolute", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,.18)" };
    if (i === 0) return { ...base, width: "48%", height: "58%", top: 0, left: 0, background: T.accent };
    if (i === 1) return { ...base, width: "52%", height: "66%", bottom: 0, right: 0, background: "#1a1a1a" };
    return { ...base, width: "38%", height: "44%", top: "10%", right: "2%", background: T.primaryDark };
  };

  return (
    <div style={{ ...z, width: "100%", maxWidth: "100%", fontFamily: FONT, background: T.page, color: T.dark, lineHeight: 1.55, overflowX: "clip" }}>
      

      <main>
        {/* hero */}
        <div
          onMouseMove={onHeroMove}
          style={{
            ...z, position: "relative", minHeight: "100svh", color: T.heroText, display: "grid", placeItems: "center",
            overflow: "hidden", textAlign: "center", padding: xs ? "76px 14px 132px" : "clamp(80px,10vh,120px) 16px clamp(130px,16vh,170px)",
            background: `radial-gradient(ellipse 60% 55% at 50% 45%, color-mix(in srgb, ${T.accent} 16%, transparent), transparent 70%), ${T.primary}`,
          }}
        >
          

          {CONFIG.heroVideo && (
            <video src={CONFIG.heroVideo} autoPlay muted loop playsInline
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
          )}

          <h1 style={{ ...z, position: "relative", fontWeight: 800, lineHeight: 0.95, letterSpacing: "-.045em", textTransform: "uppercase", fontSize: xs ? "clamp(36px,11vw,54px)" : "clamp(42px,9.5vw,150px)", backgroundImage: T.heroGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            <span style={{ display: "block" }}>Awaken senses</span>
            <span style={{ display: "block", fontSize: ".5em", letterSpacing: "-.03em" }}>with unforgettable</span>
            <span style={{ display: "block" }}>fragrance</span>
          </h1>

          <div
            ref={bottleRef}
            style={{
              position: "absolute", left: "50%", top: "50%", width: xs ? "clamp(112px,31vw,160px)" : m ? "clamp(145px,27vw,230px)" : "clamp(180px,22vw,300px)", transform: "translate(-50%,-52%)",
              zIndex: 3, filter: "drop-shadow(0 30px 30px rgba(0,0,0,.6))", transition: "transform .2s ease-out", pointerEvents: "none",
            }}
          >
            {CONFIG.heroBottle ? (
              <img src={CONFIG.heroBottle} alt="" style={{ width: "100%", display: "block" }} />
            ) : (
              <Bottle color={T.heroBottle} cap={T.accent} style={{ width: "100%" }} />
            )}
          </div>

          <div
            style={{
              position: "absolute", left: "50%", bottom: m ? -50 : -60, transform: "translateX(-50%)", width: m ? 116 : 140, height: m ? 116 : 140,
              borderRadius: "50%", background: T.primary, zIndex: 5, display: "grid", placeItems: "center",
              boxShadow: `0 0 0 12px ${T.page}`, border: `1px solid color-mix(in srgb, ${T.accent} 55%, transparent)`,
            }}
          >
            <svg viewBox="0 0 150 150" aria-hidden="true" style={{ position: "absolute", inset: 6 }}>
              <defs>
                <path id="mq-circle" d="M75,75 m-60,0 a60,60 0 1,1 120,0 a60,60 0 1,1 -120,0" />
              </defs>
              <g>
                {!reduce && <animateTransform attributeName="transform" type="rotate" from="0 75 75" to="360 75 75" dur="18s" repeatCount="indefinite" />}
                <text fontSize="12.5" fontFamily={FONT} fill={T.heroText} letterSpacing="3">
                  <textPath href="#mq-circle">EXPLORE THE SCENT LIBRARY • EXPLORE THE SCENT LIBRARY •</textPath>
                </text>
              </g>
            </svg>
            <a
              href="#mq-list"
              aria-label="Shop perfumes"
              style={{ width: m ? 44 : 52, height: m ? 44 : 52, borderRadius: "50%", background: T.heroText, color: T.primary, display: "grid", placeItems: "center", fontSize: 22, textDecoration: "none" }}
            >
              ↓
            </a>
          </div>
        </div>

        {/* listing */}
        <section id="mq-list" style={{ ...z, width: "100%", maxWidth: 1600, margin: "0 auto", padding: `${xs ? 100 : m ? 118 : 130}px ${PAD} clamp(32px,5vw,64px)`, display: "grid", gap: "clamp(44px,7vw,100px)" }}>
          <div style={{ maxWidth: 760 }}>
            <h2 style={{ ...z, fontWeight: 800, fontSize: "clamp(34px,6vw,88px)", lineHeight: 1, letterSpacing: "-.04em" }}>The signature five</h2>
            <p style={{ ...z, marginTop: 14, maxWidth: "52ch", opacity: 0.75 }}>
              Five small-batch eaux de parfum, each built on natural ingredients and aged for six weeks before bottling.
            </p>
          </div>

          {PRODUCTS.map((p, i) => {
            const ml = sizes[p.id];
            const saved = wish.has(p.id);
            const hot = hover === p.id;
            return (
              <article
                key={p.id}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                style={{ ...z, display: "grid", gridTemplateColumns: m ? "minmax(0,1fr)" : "minmax(0,1fr) minmax(0,1fr)", gap: "clamp(22px,4vw,64px)", alignItems: "center", width: "100%", minWidth: 0 }}
              >
                <div
                  style={{
                    ...z, position: "relative", aspectRatio: m ? "1/1.05" : "4/5", maxWidth: m ? 520 : undefined, width: "100%", minWidth: 0,
                    margin: m ? "0 auto" : 0, order: !m && i % 2 === 1 ? 2 : 0, borderRadius: "999px 999px 24px 24px",
                    overflow: "hidden", display: "grid", placeItems: "center", background: p.bg,
                  }}
                >
                  <Media
                    p={p}
                    bottleStyle={{
                      width: "42%", transition: reduce ? "none" : "transform .5s", filter: "drop-shadow(0 24px 20px rgba(0,0,0,.25))",
                      transform: hot ? "translateY(-10px) rotate(-3deg)" : "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gap: "clamp(12px,2vw,16px)", alignContent: "center", minWidth: 0, width: "100%" }}>
                  <small style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>{p.family}</small>
                  <h3 style={{ ...z, fontWeight: 800, fontSize: "clamp(30px,5vw,72px)", overflowWrap: "anywhere", lineHeight: 1, letterSpacing: "-.04em" }}>{p.name}</h3>
                  <p style={{ ...z, maxWidth: "48ch" }}>{p.desc}</p>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {p.notes.map((n) => (
                      <span key={n} style={{ background: T.soft, border: `1px solid color-mix(in srgb, ${T.dark} 14%, transparent)`, borderRadius: 99, padding: "5px 14px", fontSize: 13 }}>
                        {n}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "clamp(16px,3vw,28px)", flexWrap: "wrap", fontSize: 13 }}>
                    <div style={{ display: "grid" }}><small style={{ opacity: 0.7 }}>Concentration</small><b style={{ fontSize: 15 }}>{p.concentration}</b></div>
                    <div style={{ display: "grid" }}><small style={{ opacity: 0.7 }}>Longevity</small><b style={{ fontSize: 15 }}>{p.longevity}</b></div>
                  </div>

                  <div role="group" aria-label={`Size for ${p.name}`} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {SIZES.map((s) => {
                      const on = s.ml === ml;
                      return (
                        <button
                          key={s.ml}
                          aria-pressed={on}
                          onClick={() => setSizes({ ...sizes, [p.id]: s.ml })}
                          style={{ ...btn, border: `1.5px solid ${T.dark}`, borderRadius: 99, padding: "8px 18px", fontSize: 14, transition: "background .2s,color .2s", background: on ? T.dark : "transparent", color: on ? T.light : T.dark }}
                        >
                          {s.ml} ml
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: xs ? 10 : 14, flexWrap: "wrap", marginTop: 6 }}>
                    <span aria-live="polite" style={{ fontWeight: 700, fontSize: "clamp(27px,4vw,34px)", lineHeight: 1, letterSpacing: "-.03em", minWidth: 0, flex: xs ? "1 1 100%" : undefined }}>
                      {money(unitPrice(p, ml))}
                    </span>
                    <button
                      onClick={() => add(p)}
                      style={{
                        ...btn, padding: "14px clamp(18px,3vw,30px)", borderRadius: 99, fontWeight: 600, flex: xs ? "1 1 100%" : "1 1 auto", minWidth: xs ? 0 : 150, maxWidth: xs ? "none" : 260,
                        order: xs ? 3 : 0, color: T.light, background: hot ? T.primaryDark : T.dark,
                        transition: reduce ? "none" : "transform .2s, background .2s", transform: hot ? "translateY(-2px)" : "none",
                      }}
                    >
                      Add to cart
                    </button>
                    <button
                      aria-pressed={saved}
                      aria-label={`Save ${p.name}`}
                      onClick={() => toggleWish(p)}
                      style={{ ...btn, width: 50, height: 50, borderRadius: "50%", fontSize: 19, border: `1.5px solid ${T.dark}`, background: saved ? T.dark : "transparent", color: saved ? T.heart : T.dark }}
                    >
                      {saved ? "♥" : "♡"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* collage */}
        <section
          style={{
            ...z, background: T.soft, marginTop: "clamp(48px,8vw,90px)", position: "relative", overflow: "hidden", minHeight: xs ? 510 : m ? 560 : "min(620px,70vw)",
            display: "grid", alignItems: m ? "end" : "center", padding: m ? `0 ${PAD} 36px` : `clamp(40px,6vw,72px) ${PAD}`,
          }}
        >
          <h2
            style={{
              ...z, position: "relative", zIndex: 1, color: T.primaryDark, fontWeight: 800, textTransform: "uppercase",
              fontSize: "clamp(34px,10.5vw,170px)", overflowWrap: "anywhere", lineHeight: 0.95, letterSpacing: "-.05em", marginTop: m ? (xs ? 270 : 290) : 0, maxWidth: "100%",
            }}
          >
            {["New", "perfume", "collection"].map((w) => (
              <span key={w} style={{ display: "block", marginLeft: m ? 0 : "10vw" }}>{w}</span>
            ))}
          </h2>
          <div
            style={
              m
                ? { position: "absolute", top: xs ? 18 : 24, left: PAD, right: PAD, height: xs ? 230 : 260, zIndex: 2 }
                : { position: "absolute", right: PAD, top: "50%", transform: "translateY(-50%)", width: "min(44vw,520px)", height: "min(56vw,520px)", zIndex: 2 }
            }
          >
            {CONFIG.collage.map((c, i) => (
              <div key={i} style={tile(i)}>
                {c.src &&
                  (c.type === "video" ? (
                    <video src={c.src} autoPlay muted loop playsInline style={fill} />
                  ) : (
                    <img src={c.src} alt="" loading="lazy" style={fill} />
                  ))}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* cart drawer */}
      <div
        onClick={closeCart}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .3s", zIndex: 50 }}
      />
      <aside
        aria-label="Cart"
        aria-hidden={!open}
        style={{
          ...z, position: "fixed", top: 0, right: 0, height: "100dvh", maxHeight: "100dvh", width: "min(420px,100vw)", background: T.page, color: T.dark,
          borderLeft: `1px solid color-mix(in srgb, ${T.dark} 12%, transparent)`, zIndex: 60, display: "flex", flexDirection: "column",
          padding: "max(16px, env(safe-area-inset-top)) clamp(14px,4vw,22px) max(18px, env(safe-area-inset-bottom))", transform: open ? "none" : "translateX(105%)",
          visibility: open ? "visible" : "hidden", transition: reduce ? "none" : "transform .35s cubic-bezier(.2,.8,.2,1), visibility .35s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: `1px solid ${T.soft}` }}>
          <h2 style={{ ...z, fontWeight: 700, fontSize: 26, letterSpacing: "-.02em" }}>Your cart</h2>
          <button ref={closeRef} onClick={closeCart} aria-label="Close cart" style={{ ...btn, width: 38, height: 38, borderRadius: "50%", background: T.soft, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "12px 0" }}>
          {lines.length === 0 && <p style={{ ...z, padding: "30px 0", opacity: 0.7 }}>Your cart is empty. Choose a fragrance to begin.</p>}
          {lines.map((l, i) => (
            <div key={l.id + "-" + l.ml} style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1fr) auto", gap: "clamp(8px,2.5vw,14px)", alignItems: "center", minWidth: 0, padding: "12px 0", borderBottom: `1px solid ${T.soft}` }}>
              <div style={{ width: 56, height: 72, borderRadius: "32px 32px 8px 8px", background: l.p.bg, display: "grid", placeItems: "center", overflow: "hidden" }}>
                <Media p={l.p} bottleOnly bottleStyle={{ width: "60%" }} />
              </div>
              <div>
                <h4 style={{ ...z, fontWeight: 600, fontSize: 16 }}>{l.p.name}</h4>
                <small style={{ opacity: 0.7 }}>{l.ml} ml · {money(l.unit)}</small>
                <br />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10, border: `1px solid ${T.dark}`, borderRadius: 99, marginTop: 6 }}>
                  <button onClick={() => change(i, -1)} aria-label="Decrease" style={{ ...btn, width: 30, height: 30 }}>−</button>
                  {l.q}
                  <button onClick={() => change(i, 1)} aria-label="Increase" style={{ ...btn, width: 30, height: 30 }}>+</button>
                </span>
                <button onClick={() => change(i, -l.q)} style={{ ...btn, fontSize: 12, textDecoration: "underline", display: "block", marginTop: 4, opacity: 0.7 }}>Remove</button>
              </div>
              <strong>{money(l.unit * l.q)}</strong>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 600, padding: "16px 0" }}>
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        <button
          disabled={!lines.length}
          onClick={() => say("Connect this button to your checkout")}
          style={{ ...btn, width: "100%", background: T.dark, color: T.light, padding: 16, borderRadius: 99, fontWeight: 600, opacity: lines.length ? 1 : 0.4, cursor: lines.length ? "pointer" : "not-allowed" }}
        >
          Checkout
        </button>
      </aside>

      {/* toast */}
      <div
        role="status"
        style={{
          position: "fixed", left: "50%", bottom: "max(24px, env(safe-area-inset-bottom))", background: T.dark, color: T.light,
          padding: "11px clamp(14px,4vw,22px)", borderRadius: 99, fontSize: 14, zIndex: 80, pointerEvents: "none", whiteSpace: "normal", width: "max-content", maxWidth: "calc(100vw - 28px)", textAlign: "center",
          opacity: toast ? 1 : 0, transform: `translate(-50%, ${toast ? 0 : 30}px)`, transition: "opacity .3s, transform .3s",
        }}
      >
        {toast}
      </div>
    </div>
  );
}