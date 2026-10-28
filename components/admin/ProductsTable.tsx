"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
};

type ListResponse = { items: Item[]; page: number; total: number; pages: number };

const rupees = (paise: number) => "\u20B9" + (paise / 100).toLocaleString("en-IN");

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

function Thumb({ url }: { url?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-14 w-14 shrink-0 border border-black/10 bg-[#F3E7D5] object-cover xl:h-12 xl:w-12" />
  ) : (
    <div className="h-14 w-14 shrink-0 border border-black/10 bg-[#F3E7D5] xl:h-12 xl:w-12" />
  );
}

export default function ProductsTable() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

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

  const field =
    "border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-black/40 sm:py-2.5 sm:text-[14px]";

  return (
    <>
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
        <p role="alert" className="mt-4 border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-800">
          {error}
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
                    <Thumb url={p.images[0]} />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 break-words text-[15px] font-medium">{p.name}</p>
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
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] uppercase tracking-[0.15em]">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="border px-3 py-3 text-center font-semibold"
                      style={{ borderColor: COPPER, color: COPPER }}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggle(p)}
                      disabled={busyId === p.id}
                      className="border border-black/25 px-3 py-3 font-semibold uppercase tracking-[0.15em] disabled:opacity-40"
                    >
                      {busyId === p.id ? "Saving..." : p.isActive ? "Deactivate" : "Activate"}
                    </button>
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
                          <Thumb url={p.images[0]} />
                          <div>
                            <p className="m-0 font-medium">{p.name}</p>
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
                        <div className="flex gap-4 text-[12px] uppercase tracking-[0.15em]">
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