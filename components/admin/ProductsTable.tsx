"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

type Item = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  images: string[];
  description?: string;
  video?: string;
  isBestSeller?: boolean;
};

type ListResponse = { items: Item[]; page: number; total: number; pages: number };

const rupees = (paise: number) => "\u20B9" + (paise / 100).toLocaleString("en-IN");

function deleteMessage(name: string) {
  return (
    `Delete "${name}" for good?\n\n` +
    "Its reviews will be removed, and it will be removed from all carts and wishlists. " +
    "Old orders keep their own copy of the name, price and image.\n\n" +
    "This cannot be undone."
  );
}

function Price({ p }: { p: Item }) {
  return p.salePrice ? (
    <>
      <span className="font-medium">{rupees(p.salePrice)}</span>{" "}
      <span className="text-black/40 line-through">{rupees(p.price)}</span>
    </>
  ) : (
    <>{rupees(p.price)}</>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`px-2 py-1 text-[11px] uppercase tracking-[0.15em] ${
        active ? "bg-green-100 text-green-800" : "bg-black/10 text-black/60"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Product Detail Modal ────────────────────────────────────────────────────
function ProductDetailModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = item.images.length > 0 ? item.images : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setImgIdx((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setImgIdx((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, images.length]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-2xl flex-col gap-0 border border-black/10 bg-[#FCF8F0] shadow-2xl"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center bg-white/80 text-black/60 hover:text-black"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Image panel */}
          <div className="relative w-full shrink-0 bg-[#F3E7D5] sm:w-64">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[imgIdx]}
                alt={item.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-[13px] text-black/40">
                No image
              </div>
            )}
            {images.length > 1 && (
              <div className="flex items-center justify-between px-2 py-1">
                <button
                  type="button"
                  disabled={imgIdx === 0}
                  onClick={() => setImgIdx((i) => i - 1)}
                  className="px-2 py-1 text-[12px] disabled:opacity-30"
                >
                  ‹ Prev
                </button>
                <span className="text-[11px] text-black/50">
                  {imgIdx + 1} / {images.length}
                </span>
                <button
                  type="button"
                  disabled={imgIdx === images.length - 1}
                  onClick={() => setImgIdx((i) => i + 1)}
                  className="px-2 py-1 text-[12px] disabled:opacity-30"
                >
                  Next ›
                </button>
              </div>
            )}
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-1 overflow-x-auto px-2 pb-2">
                {images.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    onClick={() => setImgIdx(i)}
                    className={`h-10 w-10 shrink-0 object-cover ${i === imgIdx ? "ring-2 ring-[#9C5A2B]" : "opacity-60 hover:opacity-100"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div>
              <h2 className="m-0 text-2xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
                {item.name}
              </h2>
              {item.brand && <p className="m-0 mt-0.5 text-[13px] text-black/55">{item.brand}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[14px]">
              <Price p={item} />
              <Badge active={item.isActive} />
              {item.isBestSeller && (
                <span className="bg-amber-100 px-2 py-1 text-[11px] uppercase tracking-[0.15em] text-amber-800">
                  Best seller
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <div className="text-black/55">Category</div>
              <div>{item.category}</div>
              <div className="text-black/55">Stock</div>
              <div>{item.stock} units</div>
              <div className="text-black/55">Product ID</div>
              <div className="truncate font-mono text-[11px]">{item.id}</div>
            </div>

            {item.description && (
              <p className="m-0 line-clamp-4 text-[13px] leading-relaxed text-black/70">
                {item.description}
              </p>
            )}

            <div className="mt-auto pt-2">
              <Link
                href={`/admin/products/${item.id}`}
                className="inline-block px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white"
                style={{ background: COPPER }}
                onClick={onClose}
              >
                Edit product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Thumbnail (clickable) ────────────────────────────────────────────────────
function Thumb({ url, onClick }: { url?: string; onClick: () => void }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="View details"
      title="Click to view product details"
      onClick={onClick}
      className="h-14 w-14 shrink-0 border border-black/10 bg-[#F3E7D5] object-cover xl:h-12 xl:w-12"
    />
  ) : (
    <div
      onClick={onClick}
      title="Click to view product details"
      className="h-14 w-14 shrink-0 border border-black/10 bg-[#F3E7D5] xl:h-12 xl:w-12"
    />
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ProductsTable({ isOwner = false }: { isOwner?: boolean }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [detail, setDetail] = useState<Item | null>(null);

  // Wait a moment after typing before searching.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError("");

    const p = new URLSearchParams({ page: String(page), limit: "10" });
    if (query) p.set("search", query);
    if (status) p.set("status", status);

    fetch(`/api/admin/products?${p.toString()}`, { signal: ctrl.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Could not load products.");
        setData(json);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [page, query, status, reload]);

  async function toggle(item: Item) {
    if (item.isActive && !window.confirm(`Deactivate "${item.name}"? Customers will no longer see it.`)) return;
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const res = item.isActive
        ? await fetch(`/api/admin/products/${item.id}`, { method: "DELETE" })
        : await fetch(`/api/admin/products/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: true }),
          });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not update the product.");
      setReload((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the product.");
    } finally {
      setBusyId("");
    }
  }

  // Permanent delete — available to all admins (server enforces owner-only rule).
  async function deleteForever(item: Item) {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/products/${item.id}?permanent=true`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Could not delete the product (error ${res.status}).`);
      setNotice(json.message || "Product deleted.");
      if (data && data.items.length === 1 && page > 1) setPage((n) => n - 1);
      setReload((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the product.");
    } finally {
      setBusyId("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const field =
    "border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-black/40 sm:py-2.5 sm:text-[14px]";

  // Available to all admins
  const canDelete = true;

  return (
    <>
      {detail && <ProductDetailModal item={detail} onClose={() => setDetail(null)} />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
            Products
          </h1>
          <p className="mb-0 mt-2 text-[14px] text-black/55">{data ? `${data.total} products` : "Loading..."}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="w-full px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7d4720] sm:w-auto"
          style={{ background: COPPER }}
        >
          Add product
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or brand"
          className={`${field} w-full sm:w-72`}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={`${field} w-full sm:w-auto`}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-[#A32A1F]/30 bg-[#F8E3E0] px-4 py-3 text-[14px] text-[#A32A1F]">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 border border-[#1F7A3A]/30 bg-[#E3F2E6] px-4 py-3 text-[14px] text-[#1F7A3A]">
          {notice}
        </p>
      )}

      <div className="mt-5 border border-black/10 bg-white">
        {loading && !data ? (
          <p className="m-0 p-6 text-[15px] text-black/55">Loading products...</p>
        ) : data && data.items.length === 0 ? (
          <p className="m-0 p-6 text-[15px] text-black/55">No products match your search.</p>
        ) : (
          <>
            {/* Phones and tablets: one card per product */}
            <ul className={`m-0 list-none p-0 xl:hidden ${loading ? "opacity-50" : ""}`}>
              {data?.items.map((p) => (
                <li key={p.id} className="border-b border-black/5 p-4 last:border-0">
                  <div className="flex gap-3">
                    <Thumb url={p.images[0]} onClick={() => setDetail(p)} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setDetail(p)}
                        className="m-0 break-words text-left text-[15px] font-medium hover:underline"
                      >
                        {p.name}
                      </button>
                      {p.brand && <p className="m-0 text-[12px] text-black/50">{p.brand}</p>}
                      <p className="m-0 mt-1 text-[12px] text-black/50">{p.category}</p>
                      <p className="m-0 mt-2 text-[14px]">
                        <Price p={p} />
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-black/60">
                        <Badge active={p.isActive} />
                        <span>Stock: {p.stock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[12px] uppercase tracking-[0.15em]">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex-1 border px-3 py-3 text-center font-semibold"
                      style={{ borderColor: COPPER, color: COPPER }}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(p)}
                      disabled={busyId === p.id}
                      className="flex-1 border border-black/25 px-3 py-3 font-semibold uppercase tracking-[0.15em] disabled:opacity-40"
                    >
                      {busyId === p.id ? "Saving..." : p.isActive ? "Deactivate" : "Activate"}
                    </button>
                    {canDelete && (
                      <ConfirmDeleteButton
                        label={`Delete ${p.name} permanently`}
                        message={deleteMessage(p.name)}
                        onConfirm={() => deleteForever(p)}
                        disabled={busyId === p.id}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Wide desktops: a table */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.2em] text-black/50">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className={loading ? "opacity-50" : ""}>
                  {data?.items.map((p) => (
                    <tr key={p.id} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb url={p.images[0]} onClick={() => setDetail(p)} />
                          <div>
                            <button
                              type="button"
                              onClick={() => setDetail(p)}
                              className="m-0 text-left font-medium hover:underline"
                            >
                              {p.name}
                            </button>
                            {p.brand && <p className="m-0 text-[12px] text-black/50">{p.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.category}</td>
                      <td className="px-4 py-3">
                        <Price p={p} />
                      </td>
                      <td className="px-4 py-3">{p.stock}</td>
                      <td className="px-4 py-3">
                        <Badge active={p.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-4 text-[12px] uppercase tracking-[0.15em]">
                          <Link href={`/admin/products/${p.id}`} className="underline underline-offset-4" style={{ color: COPPER }}>
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggle(p)}
                            disabled={busyId === p.id}
                            className="uppercase tracking-[0.15em] underline underline-offset-4 disabled:opacity-40"
                          >
                            {busyId === p.id ? "Saving..." : p.isActive ? "Deactivate" : "Activate"}
                          </button>
                          {canDelete && (
                            <ConfirmDeleteButton
                              label={`Delete ${p.name} permanently`}
                              message={deleteMessage(p.name)}
                              onConfirm={() => deleteForever(p)}
                              disabled={busyId === p.id}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3 text-[13px]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((n) => n - 1)}
            className="border border-black/20 px-4 py-3 uppercase tracking-[0.15em] disabled:opacity-30 sm:py-2"
          >
            Previous
          </button>
          <span className="text-center text-black/55">
            Page {data.page} of {data.pages}
          </span>
          <button
            type="button"
            disabled={page >= data.pages}
            onClick={() => setPage((n) => n + 1)}
            className="border border-black/20 px-4 py-3 uppercase tracking-[0.15em] disabled:opacity-30 sm:py-2"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
