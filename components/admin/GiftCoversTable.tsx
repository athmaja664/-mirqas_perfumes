"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import AlertModal from "./AlertModal";

const COPPER = "#9C5A2B";
const CARD_LINE = "#EADFCC";
const sans = "Inter, system-ui, sans-serif";

interface GiftCoverItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  image: string;
  images: string[];
  stock: number;
  inStock: boolean;
  isActive: boolean;
  category: string;
}

export default function GiftCoversTable() {
  const [items, setItems] = useState<GiftCoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [alert, setAlert] = useState<{ open: boolean; title: string; message: string; type?: "info" | "error" | "success" }>({
    open: false,
    title: "",
    message: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchCovers = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (statusFilter !== "all") sp.set("status", statusFilter);
      if (search) sp.set("search", search);
      const res = await fetch(`/api/admin/gift-covers?${sp.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.giftCovers || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCovers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCovers();
  };

  const toggleActive = async (item: GiftCoverItem) => {
    try {
      const res = await fetch(`/api/admin/gift-covers/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, isActive: !item.isActive } : x))
        );
      } else {
        const err = await res.json();
        setAlert({ open: true, title: "Action Failed", message: err.message || "Failed to update status.", type: "error" });
      }
    } catch {
      setAlert({ open: true, title: "Error", message: "Network error occurred.", type: "error" });
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/gift-covers/${id}?permanent=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((x) => x.id !== id));
        setAlert({ open: true, title: "Deleted", message: "Gift cover removed successfully.", type: "success" });
      } else {
        const err = await res.json();
        setAlert({ open: true, title: "Delete Failed", message: err.message || "Could not delete gift cover.", type: "error" });
      }
    } catch {
      setAlert({ open: true, title: "Error", message: "Network error occurred.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ fontFamily: sans }}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
            Gift Covers
          </h1>
          <p className="mt-1 text-sm text-[#111111]/60">
            Manage boxes and covers available on the customer Gift Page.
          </p>
        </div>
        <Link
          href="/admin/gift-covers/new"
          className="inline-flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold tracking-wide text-white transition-opacity hover:opacity-95 sm:w-auto"
          style={{ background: COPPER }}
        >
          + Add New Gift Cover
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-md gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description..."
            className="h-10 flex-1 rounded-lg border bg-white px-3 text-sm outline-none focus:border-[#9C5A2B]"
            style={{ borderColor: CARD_LINE }}
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg border px-4 text-xs font-semibold uppercase tracking-wider text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white"
            style={{ borderColor: COPPER }}
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#111111]/60">Status:</span>
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-[#9C5A2B] text-white"
                  : "bg-white text-[#111111]/70 border hover:bg-stone-50"
              }`}
              style={{ borderColor: CARD_LINE }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content table */}
      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm" style={{ borderColor: CARD_LINE }}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#111111]/60">Loading gift covers...</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base font-medium text-[#111111]">No gift covers found</p>
            <p className="mt-1 text-sm text-[#111111]/60">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first gift cover using the button above."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile / Tablet View: Card list (matching other admin pages) */}
            <ul className="m-0 list-none divide-y divide-stone-100 p-0 lg:hidden">
              {items.map((it) => (
                <li key={it.id} className="p-4 transition-colors hover:bg-stone-50/50">
                  <div className="flex gap-3">
                    <div
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-stone-100"
                      style={{ borderColor: CARD_LINE }}
                    >
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-[#111111]">{it.name}</p>
                        <span className="shrink-0 text-sm font-semibold text-[#9C5A2B]">
                          ₹{it.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                      {it.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[#111111]/60">{it.description}</p>
                      )}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                          {it.category || "Gift Cover"}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            it.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {it.stock > 0 ? `${it.stock} in stock` : "Out of stock"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            it.isActive ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${it.isActive ? "bg-green-600" : "bg-stone-500"}`}
                          />
                          {it.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="mt-3.5 flex items-center gap-2 border-t border-stone-100 pt-2.5">
                    <Link
                      href={`/admin/gift-covers/${it.id}`}
                      className="flex-1 rounded-lg border py-2 text-center text-xs font-semibold uppercase tracking-wider text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B]/10"
                      style={{ borderColor: COPPER }}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleActive(it)}
                      className={`flex-1 rounded-lg border py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                        it.isActive
                          ? "border-stone-300 text-stone-700 hover:bg-stone-100"
                          : "border-green-600 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {it.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(it.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Laptop / Desktop View: Exact Table (preserved unchanged) */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-[#FAF6F0] text-[11px] font-semibold uppercase tracking-wider text-[#111111]/70" style={{ borderColor: CARD_LINE }}>
                  <tr>
                    <th className="px-4 py-3.5">Cover</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Stock</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-stone-100" style={{ borderColor: CARD_LINE }}>
                            {it.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">No img</div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[260px]">
                            <p className="truncate font-semibold text-[#111111]">{it.name}</p>
                            <p className="line-clamp-1 text-xs text-[#111111]/60">{it.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-stone-600 font-medium">{it.category}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-[#9C5A2B]">₹{it.price.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            it.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {it.stock > 0 ? `${it.stock} in stock` : "Out of stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleActive(it)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            it.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                          }`}
                          title="Click to toggle active status"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${it.isActive ? "bg-green-600" : "bg-stone-500"}`} />
                          {it.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/gift-covers/${it.id}`}
                            className="rounded px-2.5 py-1 text-xs font-medium text-[#9C5A2B] hover:bg-[#9C5A2B]/10"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingId(it.id)}
                            className="rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
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

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#111111]">Delete Gift Cover?</h3>
            <p className="mt-2 text-sm text-[#111111]/70">
              Are you sure you want to permanently delete this gift cover? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
                style={{ borderColor: CARD_LINE }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deletingId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert modal */}
      <AlertModal
        open={alert.open}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ open: false, title: "", message: "" })}
      />
    </div>
  );
}

