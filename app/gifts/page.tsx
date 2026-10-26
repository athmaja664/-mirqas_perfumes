"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ───────────────────────── Brand (same as Choose Your Bottle) ───────────────────────── */

const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const SAND = "#F6EEE0"; // image backgrounds / soft panels
const INK = "#111111";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

/* shared class fragments */
const BTN = "bg-[#9C5A2B] text-white transition-colors hover:bg-[#7d4720] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]";
const BTN_LINE = "border border-[#9C5A2B] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B] hover:text-white";
const LINE = "border-[#9C5A2B]/25";
const MUTED = "text-[#111111]/60";
const HEAD = "mq-serif font-medium text-[#9C5A2B]";
const CAPS = "uppercase tracking-[0.12em] font-semibold";

/* ───────────────────────── Types ───────────────────────── */

type StepId = 1 | 2;

interface Product { id: string; name: string; category: string; price: number; color: string }
interface GiftBox { id: string; name: string; price: number; color: string }
interface CartItem { id: string; title: string; lines: string[]; unitPrice: number; qty: number }
interface Selection {
  perfumes: Record<string, number>;
  box: string | null;
  message: string | null;
}

/* ───────────────────────── Data ───────────────────────── */

const PRODUCTS: Product[] = [
  { id: "oud-woody", name: "Oud & Woody", category: "Deep, smoky wood notes", price: 2899, color: "#4a3b34" },
  { id: "fresh-aquatic", name: "Fresh & Aquatic", category: "Clean, cool sea-air notes", price: 2499, color: "#7fb3c8" },
  { id: "floral", name: "Floral", category: "Soft, blooming petals", price: 2599, color: "#e3b5c4" },
  { id: "citrus-fruity", name: "Citrus & Fruity", category: "Bright, juicy and zesty", price: 2399, color: "#f0b93a" },
  { id: "amber-spicy", name: "Amber & Spicy", category: "Warm resin and spice", price: 2699, color: "#c9772b" },
  { id: "musk-powdery", name: "Musk & Powdery", category: "Soft, skin-close and smooth", price: 2499, color: "#d8cfc8" },
  { id: "sweet-gourmand", name: "Sweet & Gourmand", category: "Vanilla, caramel and cocoa", price: 2599, color: "#b5784a" },
];

const BOXES: GiftBox[] = [
  { id: "midnight-blue", name: "Midnight Blue Gift Box", price: 399, color: "#1d2a44" },
  { id: "ivory", name: "Ivory Gift Box", price: 399, color: "#efe9dc" },
  { id: "sage-green", name: "Sage Green Gift Box", price: 399, color: "#8fa58f" },
];

const STEPS: { id: StepId; label: string; title: string; hint: string }[] = [
  { id: 1, label: "Choose Your Perfumes", title: "Choose your perfumes", hint: "Pick as many fragrances as you like. Repeat a favourite with the + button." },
  { id: 2, label: "Choose Your Box", title: "Choose a gift box", hint: "Pick the box your perfumes arrive in." },
];

const MAX_PERFUME_QTY = 20;
const MAX_CART_QTY = 10;
const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const IMAGE_EXT = "jpg";
const perfumeImg = (id: string) => `/images/gift/perfumes/${id}.${IMAGE_EXT}`;
const boxImg = (id: string) => `/images/gift/boxes/${id}.${IMAGE_EXT}`;

const MAX_MESSAGE = 200;
const EMPTY: Selection = { perfumes: {}, box: null, message: null };

/* ───────────────────────── Icons ───────────────────────── */

function Icon({ d, size = 20, label }: { d: string; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined}>
      <path d={d} />
    </svg>
  );
}
const ICONS = {
  bag: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
};

/* ───────────────────────── Visuals ───────────────────────── */

function Bottle({ color, small = false }: { color: string; small?: boolean }) {
  return (
    <svg viewBox="0 0 120 150" className="h-full w-full" role="img" aria-label="Perfume bottle">
      <rect width="120" height="150" fill={SAND} />
      <ellipse cx="60" cy="136" rx="30" ry="5" fill="#0001" />
      <rect x="50" y="14" width="20" height={small ? 18 : 22} rx="2" fill={COPPER} />
      <rect x="54" y="32" width="12" height="8" fill="#c9c9c9" />
      <rect x="32" y="40" width="56" height="92" rx="8" fill="#ffffffcc" stroke="#d8d4cc" />
      <rect x="35" y="72" width="50" height="57" rx="6" fill={color} opacity={0.85} />
      <rect x="42" y="86" width="36" height="22" fill="#fff" opacity={0.9} />
      <rect x="47" y="93" width="26" height="2" fill="#1a1a1a" />
      <rect x="51" y="99" width="18" height="2" fill="#1a1a1a" opacity={0.5} />
    </svg>
  );
}

function BoxArt({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label="Gift box">
      <rect width="120" height="120" fill={SAND} />
      <rect x="18" y="42" width="84" height="58" rx="3" fill={color} stroke="#0002" />
      <rect x="12" y="32" width="96" height="16" rx="3" fill={color} stroke="#0002" />
      <rect x="56" y="32" width="8" height="68" fill="#fff" opacity={0.7} />
    </svg>
  );
}

function PerfumeImage({ id, name, color, small = false }: { id: string; name: string; color: string; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Bottle color={color} small={small} />;
  return <Image src={perfumeImg(id)} alt={name} width={800} height={800} onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

function BoxImage({ id, name, color }: { id: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <BoxArt color={color} />;
  return <Image src={boxImg(id)} alt={name} width={800} height={800} onError={() => setFailed(true)} className="h-full w-full object-cover" />;
}

/* ───────────────────────── Components ───────────────────────── */

function Hero({ onShop }: { onShop: () => void }) {
  const items: { art: ReactNode; text: string }[] = [
    {
      art: (
        <div className="grid h-full w-full grid-cols-2 gap-2 bg-[#F6EEE0] p-2 sm:p-4">
          {PRODUCTS.slice(0, 2).map((p) => (
            <PerfumeImage key={p.id} id={p.id} name={p.name} color={p.color} />
          ))}
        </div>
      ),
      text: "Choose your perfumes",
    },
    { art: <BoxImage id={BOXES[0].id} name={BOXES[0].name} color={BOXES[0].color} />, text: "Choose a gift box" },
  ];
  return (
    <section className={`border-b ${LINE}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 sm:py-14 lg:py-20">
        <h1 className={`${HEAD} mx-auto max-w-3xl leading-tight`} style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)" }}>
          You Know Their Taste. Build Their Gift
        </h1>
        <p className={`mx-auto mt-4 max-w-xl text-sm sm:text-base ${MUTED}`}>
          Personalise a fragrance gift bundle in two steps: choose as many perfumes as you like, then a box they will keep.
        </p>
        <button type="button" onClick={onShop} className={`${BTN} ${CAPS} mt-7 w-full px-10 py-3.5 text-[13px] sm:w-auto`}>
          Shop now
        </button>
        <ol className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:mt-14 sm:gap-6 md:gap-0">
          {items.map((it, i) => (
            <li key={it.text} className={`flex flex-col items-center gap-3 sm:gap-4 md:px-6 ${i > 0 ? `md:border-l ${LINE}` : ""}`}>
              <div className="aspect-square w-full max-w-[16rem] overflow-hidden">{it.art}</div>
              <p className="mq-serif text-lg leading-snug text-[#9C5A2B] sm:text-2xl">{i + 1}. {it.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProgressIndicator({ step, maxReached, onGo }: { step: StepId; maxReached: StepId; onGo: (s: StepId) => void }) {
  return (
    <nav aria-label="Gift builder progress" className="mx-auto max-w-3xl">
      <ol className="flex items-start">
        {STEPS.map((s, i) => {
          const done = s.id < step;
          const active = s.id === step;
          const reachable = s.id <= maxReached;
          return (
            <li key={s.id} className="flex flex-1 items-start last:flex-none">
              <button type="button" disabled={!reachable} onClick={() => onGo(s.id)} aria-current={active ? "step" : undefined} className="flex w-20 flex-col items-center gap-2 text-center disabled:cursor-not-allowed sm:w-28">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${active || done ? "border-[#9C5A2B] bg-[#9C5A2B] text-white" : "border-[#9C5A2B]/40 text-[#9C5A2B]/60"}`}>
                  {done ? <Icon d={ICONS.check} size={16} /> : s.id}
                </span>
                <span className={`text-[11px] leading-tight sm:text-xs ${active ? "font-semibold text-[#9C5A2B]" : MUTED}`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <span className={`mt-4 h-px flex-1 ${done ? "bg-[#9C5A2B]" : "bg-[#9C5A2B]/30"}`} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface CardProps {
  id: string; name: string; subtitle: string; price: number; art: ReactNode;
  qty: number; canAdd: boolean; multi: boolean; onAdd: () => void; onRemove: () => void;
}

function SelectCard({ name, subtitle, price, art, qty, canAdd, multi, onAdd, onRemove }: CardProps) {
  const selected = qty > 0;
  return (
    <article className={`flex flex-col border p-2 transition sm:p-3 ${selected ? "border-[#9C5A2B] bg-white shadow-sm" : `${LINE} bg-white/60 hover:border-[#9C5A2B]/60`}`} aria-label={name}>
      <div className="aspect-square overflow-hidden bg-[#F6EEE0]">{art}</div>
      <h3 className="mq-serif mt-2 text-lg font-medium leading-snug sm:mt-3 sm:text-2xl text-[#9C5A2B]">{name}</h3>
      <p className={`text-xs sm:text-sm ${MUTED}`}>{subtitle}</p>
      <p className="mt-1 text-sm font-medium">{money(price)}</p>
      <div className="mt-3">
        {multi && selected ? (
          <div className="flex items-center justify-between border border-[#9C5A2B] text-[#9C5A2B]">
            <button type="button" aria-label={`Remove one ${name}`} onClick={onRemove} className="p-3"><Icon d={ICONS.minus} size={16} /></button>
            <span aria-live="polite" className="text-sm font-semibold">{qty}</span>
            <button type="button" aria-label={`Add one more ${name}`} onClick={onAdd} disabled={!canAdd} className="p-3 disabled:opacity-30"><Icon d={ICONS.plus} size={16} /></button>
          </div>
        ) : !multi && selected ? (
          <button type="button" onClick={onRemove} aria-pressed className={`${BTN} ${CAPS} flex w-full items-center justify-center gap-2 py-3 text-[11px] sm:text-[13px]`}>
            <Icon d={ICONS.check} size={16} /> Selected
          </button>
        ) : (
          <button type="button" onClick={onAdd} disabled={!canAdd} className={`${BTN_LINE} ${CAPS} w-full py-3 text-[11px] sm:text-[13px] disabled:cursor-not-allowed disabled:border-[#111111]/20 disabled:text-[#111111]/30 disabled:hover:bg-transparent disabled:hover:text-[#111111]/30`}>
            Add to Box
          </button>
        )}
      </div>
    </article>
  );
}

function GiftCardEditor({ message, onChange }: { message: string | null; onChange: (m: string | null) => void }) {
  const enabled = message !== null;
  const text = message ?? "";
  return (
    <section aria-labelledby="card-title" className={`mt-6 border bg-white/60 p-4 sm:mt-8 sm:p-5 ${LINE}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h3 id="card-title" className={`${HEAD} text-2xl`}>Add a gift card</h3>
          <p className={`text-sm ${MUTED}`}>Write a personal note. It is printed on a card inside the box. Free.</p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked ? "" : null)} className="h-4 w-4 accent-[#9C5A2B]" />
          Include card
        </label>
      </div>
      {enabled && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="card-text" className="mb-1 block text-sm">Your message</label>
            <textarea
              id="card-text" value={text} maxLength={MAX_MESSAGE} rows={6}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Dear Aanya, happy birthday. I chose these because they remind me of you."
              className="w-full resize-none border border-[#9C5A2B]/40 bg-white p-3 text-base outline-none focus:border-[#9C5A2B] sm:text-sm"
            />
            <p className={`mt-1 text-right text-xs ${MUTED}`} aria-live="polite">{text.length}/{MAX_MESSAGE}</p>
          </div>
          <div aria-label="Card preview" className="flex min-h-48 flex-col justify-between border border-[#9C5A2B]/30 bg-[#F6EEE0] p-5 shadow-sm">
            <p className="mq-serif whitespace-pre-wrap break-words text-xl italic leading-relaxed text-[#111111]">
              {text.trim() ? text : "Your message will appear here."}
            </p>
            <p className="mt-4 text-center text-[10px] tracking-[0.3em] text-[#9C5A2B]">MIRQAS PERFUMES</p>
          </div>
        </div>
      )}
    </section>
  );
}

interface SummaryProps {
  step: StepId; sel: Selection; perfumeCount: number; subtotal: number; error: string | null;
  onClear: () => void; onNext: () => void; onBack: () => void;
  onRemovePerfume: (id: string) => void; onRemoveBox: () => void; onRemoveMessage: () => void; onAddToCart: () => void;
}

function BundleSummary(p: SummaryProps) {
  const box = BOXES.find((x) => x.id === p.sel.box);
  const perfumes = PRODUCTS.filter((x) => (p.sel.perfumes[x.id] ?? 0) > 0);
  const note = p.sel.message?.trim() ? p.sel.message.trim() : null;
  const count = p.perfumeCount + (box ? 1 : 0) + (note ? 1 : 0);
  const Row = ({ art, label, sub, onRemove }: { art: ReactNode; label: string; sub: string; onRemove: () => void }) => (
    <li className="flex items-center gap-3 py-2">
      <div className={`h-12 w-12 shrink-0 overflow-hidden border ${LINE}`}>{art}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{label}</p>
        <p className={`text-xs ${MUTED}`}>{sub}</p>
      </div>
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="p-1 text-[#111111]/50 hover:text-[#9C5A2B]"><Icon d={ICONS.x} size={16} /></button>
    </li>
  );
  return (
    <aside aria-label="Your bundle" className={`border bg-white p-5 lg:sticky lg:top-6 ${LINE}`}>
      <div className="flex items-baseline justify-between">
        <h2 className={`${HEAD} text-3xl`}>Your Bundle</h2>
        <button type="button" onClick={p.onClear} disabled={count === 0} className="text-sm text-[#9C5A2B] underline disabled:text-[#111111]/25 disabled:no-underline">Clear</button>
      </div>
      <p className={`mt-1 text-sm ${MUTED}`}>Review your bundle · {count} {count === 1 ? "item" : "items"}</p>

      {count === 0 ? (
        <p className={`my-6 border border-dashed p-4 text-center text-sm ${LINE} ${MUTED}`}>Your bundle is empty. Start by choosing your perfumes.</p>
      ) : (
        <ul className="my-4 divide-y divide-[#9C5A2B]/15">
          {perfumes.map((m) => (
            <Row key={m.id} art={<PerfumeImage id={m.id} name={m.name} color={m.color} small />} label={m.name} sub={`${p.sel.perfumes[m.id]} × ${money(m.price)} = ${money(m.price * p.sel.perfumes[m.id])}`} onRemove={() => p.onRemovePerfume(m.id)} />
          ))}
          {box && <Row art={<BoxImage id={box.id} name={box.name} color={box.color} />} label={box.name} sub={money(box.price)} onRemove={p.onRemoveBox} />}
          {note && <Row art={<div className="mq-serif flex h-full w-full items-center justify-center bg-[#F6EEE0] text-xl italic text-[#9C5A2B]">“</div>} label="Gift card" sub={note.length > 36 ? `${note.slice(0, 36)}…` : note} onRemove={p.onRemoveMessage} />}
        </ul>
      )}

      <p className={`text-xs ${MUTED}`}>Perfumes selected: {p.perfumeCount}</p>
      <dl className={`mt-3 space-y-1 border-t pt-3 text-sm ${LINE}`}>
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(p.subtotal)}</dd></div>
        <div className="flex justify-between text-base font-semibold text-[#9C5A2B]"><dt>Total</dt><dd>{money(p.subtotal)}</dd></div>
      </dl>

      {p.error && <p role="alert" className="mt-3 border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-700">{p.error}</p>}

      <div className="mt-4 flex flex-col gap-2">
        {p.step < 2 ? (
          <button type="button" onClick={p.onNext} className={`${BTN} ${CAPS} w-full py-3.5 text-[13px]`}>Next</button>
        ) : (
          <button type="button" onClick={p.onAddToCart} className={`${BTN} ${CAPS} w-full py-3.5 text-[13px]`}>Add to cart</button>
        )}
        {p.step > 1 && <button type="button" onClick={p.onBack} className={`${BTN_LINE} ${CAPS} w-full py-3.5 text-[13px]`}>Back</button>}
      </div>
    </aside>
  );
}

function CartDrawer({ open, items, onClose, onQty, onRemove }: { open: boolean; items: CartItem[]; onClose: () => void; onQty: (id: string, d: number) => void; onRemove: (id: string) => void }) {
  const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
      <aside role="dialog" aria-modal="true" aria-label="Shopping cart" className={`absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col bg-[#FCF8F0] shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className={`flex items-center justify-between border-b p-4 ${LINE}`}>
          <h2 className={`${HEAD} text-2xl`}>Your Cart</h2>
          <button type="button" aria-label="Close cart" onClick={onClose} tabIndex={open ? 0 : -1} className="p-1 text-[#9C5A2B]"><Icon d={ICONS.x} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className={MUTED}>Your cart is empty.</p>
              <button type="button" onClick={onClose} tabIndex={open ? 0 : -1} className={`${BTN} ${CAPS} mt-4 px-6 py-3 text-[13px]`}>Explore Products</button>
            </div>
          ) : (
            <ul className="divide-y divide-[#9C5A2B]/20">
              {items.map((it) => (
                <li key={it.id} className="py-4">
                  <div className="flex justify-between gap-3">
                    <h3 className="mq-serif text-xl font-medium text-[#9C5A2B]">{it.title}</h3>
                    <p className="text-sm">{money(it.unitPrice * it.qty)}</p>
                  </div>
                  <ul className={`mt-1 text-xs ${MUTED}`}>{it.lines.map((l) => <li key={l}>{l}</li>)}</ul>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center border border-[#9C5A2B] text-[#9C5A2B]">
                      <button type="button" aria-label="Decrease quantity" onClick={() => onQty(it.id, -1)} disabled={it.qty <= 1} className="p-2 disabled:opacity-30"><Icon d={ICONS.minus} size={14} /></button>
                      <span className="w-8 text-center text-sm">{it.qty}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => onQty(it.id, 1)} disabled={it.qty >= MAX_CART_QTY} className="p-2 disabled:opacity-30"><Icon d={ICONS.plus} size={14} /></button>
                    </div>
                    <button type="button" onClick={() => onRemove(it.id)} className="text-sm text-[#9C5A2B] underline">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className={`border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${LINE}`}>
            <div className="flex justify-between text-base font-semibold text-[#9C5A2B]"><span>Total</span><span>{money(total)}</span></div>
            <button type="button" onClick={onClose} className={`${BTN_LINE} ${CAPS} mt-3 w-full py-3.5 text-[13px]`}>Continue Shopping</button>
            <p className={`mt-2 text-center text-xs ${MUTED}`}>Demo cart only. Checkout is not connected.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function GiftPage() {
  const builderRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState<StepId>(1);
  const [maxReached, setMaxReached] = useState<StepId>(1);
  const [sel, setSel] = useState<Selection>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const perfumeCount = useMemo(() => Object.values(sel.perfumes).reduce((a, b) => a + b, 0), [sel.perfumes]);
  const subtotal = useMemo(() => {
    const perfumes = PRODUCTS.reduce((t, p) => t + p.price * (sel.perfumes[p.id] ?? 0), 0);
    const box = BOXES.find((b) => b.id === sel.box)?.price ?? 0;
    return perfumes + box;
  }, [sel]);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const bundleCount = perfumeCount + (sel.box ? 1 : 0) + (sel.message?.trim() ? 1 : 0);

  const scrollToBuilder = () => builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const validate = (s: StepId): string | null => {
    if (s === 1 && perfumeCount < 1) return "Choose at least one perfume to continue.";
    if (s === 2 && !sel.box) return "Choose a gift box to complete your bundle.";
    if (s === 2 && sel.message !== null && !sel.message.trim()) return "Write your gift card message, or untick Include card.";
    return null;
  };

  const goTo = (s: StepId) => { setError(null); setStep(s); setSummaryOpen(false); scrollToBuilder(); };
  const next = () => {
    const err = validate(step);
    if (err) return setError(err);
    const n = (step + 1) as StepId;
    setMaxReached((m) => (n > m ? n : m));
    goTo(n);
  };
  const back = () => goTo((step - 1) as StepId);

  const addPerfume = (id: string) => {
    if (perfumeCount >= MAX_PERFUME_QTY) return setError(`You can add up to ${MAX_PERFUME_QTY} perfumes per bundle.`);
    setError(null);
    setSel((s) => ({ ...s, perfumes: { ...s.perfumes, [id]: (s.perfumes[id] ?? 0) + 1 } }));
  };
  const removePerfume = (id: string) => {
    setError(null);
    setSel((s) => {
      const q = (s.perfumes[id] ?? 0) - 1;
      const perfumes = { ...s.perfumes };
      if (q <= 0) delete perfumes[id]; else perfumes[id] = q;
      return { ...s, perfumes };
    });
  };
  const removePerfumeAll = (id: string) => setSel((s) => { const perfumes = { ...s.perfumes }; delete perfumes[id]; return { ...s, perfumes }; });

  const clear = () => { setSel(EMPTY); setError(null); setStep(1); setMaxReached(1); };

  const addToCart = () => {
    const err = validate(1) ?? validate(2);
    if (err) {
      setError(err);
      if (perfumeCount < 1) setStep(1);
      return;
    }
    const box = BOXES.find((b) => b.id === sel.box);
    if (!box) return;
    const chosen = PRODUCTS.filter((p) => (sel.perfumes[p.id] ?? 0) > 0);
    const key = chosen.map((m) => `${m.id}x${sel.perfumes[m.id]}`).join("_");
    const note = sel.message?.trim() || null;
    const id = `${key}__${box.id}__${note ?? ""}`;
    const lines = [...chosen.map((m) => `${sel.perfumes[m.id]} × ${m.name}`), box.name, ...(note ? [`Card: “${note}”`] : [])];
    setCart((c) => {
      const found = c.find((i) => i.id === id);
      if (found) return c.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_CART_QTY, i.qty + 1) } : i));
      return [...c, { id, title: "Custom Gift Bundle", lines, unitPrice: subtotal, qty: 1 }];
    });
    setToast("Your gift bundle was added to the cart.");
    setTimeout(() => setToast(null), 3500);
    setSel(EMPTY); setStep(1); setMaxReached(1); setError(null);
    setSummaryOpen(false);
    setCartOpen(true);
  };

  const cartQty = (id: string, d: number) => setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_CART_QTY, Math.max(1, i.qty + d)) } : i)));
  const cartRemove = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const summary = (
    <BundleSummary
      step={step} sel={sel} perfumeCount={perfumeCount} subtotal={subtotal} error={error}
      onClear={clear} onNext={next} onBack={back} onAddToCart={addToCart}
      onRemovePerfume={removePerfumeAll}
      onRemoveBox={() => setSel((s) => ({ ...s, box: null }))}
      onRemoveMessage={() => setSel((s) => ({ ...s, message: null }))}
    />
  );
  const cur = STEPS[step - 1];

  return (
    <div className="min-h-screen" style={{ background: IVORY, color: INK, fontFamily: sans }}>
      {/* fonts + serif helper class */}
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap");
        .mq-serif { font-family: ${serif}; }
      `}</style>

      <main>
        <Hero onShop={scrollToBuilder} />

        <section ref={builderRef} id="builder" aria-labelledby="builder-title" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-8 pb-28 sm:px-6 sm:py-12 sm:pb-32 lg:pb-12">
          <ProgressIndicator step={step} maxReached={maxReached} onGo={goTo} />
          <div className="mt-10 text-center">
            <h2 id="builder-title" className={`${HEAD}`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>{cur.title}</h2>
            <p className={`mt-1 text-sm ${MUTED}`}>{cur.hint}</p>
            {step === 1 && <p className="mt-2 text-sm font-medium text-[#9C5A2B]" aria-live="polite">{perfumeCount} {perfumeCount === 1 ? "perfume" : "perfumes"} selected</p>}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              {step === 1 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                  {PRODUCTS.map((p) => (
                    <SelectCard
                      key={p.id} id={p.id}
                      name={p.name} subtitle={p.category}
                      price={p.price}
                      art={<PerfumeImage id={p.id} name={p.name} color={p.color} />}
                      qty={sel.perfumes[p.id] ?? 0} multi
                      canAdd={perfumeCount < MAX_PERFUME_QTY}
                      onAdd={() => addPerfume(p.id)}
                      onRemove={() => removePerfume(p.id)}
                    />
                  ))}
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                    {BOXES.map((b) => (
                      <SelectCard
                        key={b.id} id={b.id} name={b.name} subtitle="Fits your whole selection"
                        price={b.price} art={<BoxImage id={b.id} name={b.name} color={b.color} />}
                        qty={sel.box === b.id ? 1 : 0} multi={false} canAdd
                        onAdd={() => { setSel((s) => ({ ...s, box: b.id })); setError(null); }}
                        onRemove={() => setSel((s) => ({ ...s, box: null }))}
                      />
                    ))}
                  </div>
                  <GiftCardEditor message={sel.message} onChange={(m) => { setSel((x) => ({ ...x, message: m })); setError(null); }} />
                </div>
              )}
            </div>

            {/* Desktop summary */}
            <div className="hidden lg:block">{summary}</div>

          </div>
        </section>
      </main>

      {/* Phones / tablets: sticky bottom bar + bundle sheet */}
      <div className="lg:hidden">
        {summaryOpen && (
          <div className="fixed inset-0 z-40">
            <div onClick={() => setSummaryOpen(false)} className="absolute inset-0 bg-black/40" />
            <div role="dialog" aria-modal="true" aria-label="Your bundle" className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto bg-[#FCF8F0] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl">
              <button type="button" onClick={() => setSummaryOpen(false)} aria-label="Close bundle" className="mb-2 ml-auto flex p-1 text-[#9C5A2B]"><Icon d={ICONS.x} /></button>
              {summary}
            </div>
          </div>
        )}
        <div className={`fixed inset-x-0 bottom-0 z-30 border-t bg-[#FCF8F0] px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] ${LINE}`}>
          {error && !summaryOpen && <p role="alert" className="mb-2 border-l-2 border-red-600 bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>}
          <div className="flex items-stretch gap-2">
            <button type="button" aria-expanded={summaryOpen} onClick={() => setSummaryOpen(true)} className={`${BTN_LINE} flex min-h-[48px] flex-1 flex-col items-center justify-center px-2 text-xs leading-tight`}>
              <span className="font-semibold">Your Bundle ({bundleCount})</span>
              <span>{money(subtotal)}</span>
            </button>
            {step < 2
              ? <button type="button" onClick={next} className={`${BTN} ${CAPS} min-h-[48px] flex-1 text-xs`}>Next</button>
              : <button type="button" onClick={addToCart} className={`${BTN} ${CAPS} min-h-[48px] flex-1 text-xs`}>Add to cart</button>}
          </div>
        </div>
      </div>

      {cartCount > 0 && !cartOpen && (
        <button type="button" aria-label={`Open cart, ${cartCount} items`} onClick={() => setCartOpen(true)} className={`${BTN} fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 text-sm shadow-lg lg:bottom-4`}>
          <Icon d={ICONS.bag} size={18} /> Cart ({cartCount})
        </button>
      )}

      <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onQty={cartQty} onRemove={cartRemove} />

      {toast && (
        <div role="status" className="fixed bottom-24 left-1/2 z-[60] lg:bottom-4 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 bg-[#9C5A2B] px-4 py-3 text-center text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}