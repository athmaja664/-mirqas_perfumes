"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/admin/AlertModal";

export type AdminOfferItem = {
  id: string;
  title: string;
  description: string;
  offerType: "quantity" | "percentage" | "fixed";
  offerPrice: number | null; // paise
  discountValue: number | null;
  requiredQuantity: number;
  eligibleSizes: string[];
  allowMixedVariants: boolean;
  applicableToAll: boolean;
  displayHomepage: boolean;
  displayListing: boolean;
  displayProductDetails: boolean;
  bannerImage: string | null;
  startDate: string | null;
  endDate: string | null;
  status: "draft" | "published" | "unpublished";
  products: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    salePrice: number | null;
  }[];
  createdAt?: string;
};

export default function OffersTable({ initialOffers }: { initialOffers: AdminOfferItem[] }) {
  const router = useRouter();
  const [offers, setOffers] = useState<AdminOfferItem[]>(initialOffers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<{
    open: boolean;
    title?: string;
    message: string;
    type?: "info" | "error" | "success";
  }>({ open: false, message: "" });
  const [deleteTarget, setDeleteTarget] = useState<AdminOfferItem | null>(null);

  const showAlert = (message: string, type: "info" | "error" | "success" = "error", title?: string) => {
    setAlertData({ open: true, message, type, title });
  };

  const filtered = offers.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = o.title.toLowerCase().includes(q);
      const matchDesc = o.description.toLowerCase().includes(q);
      const matchProduct = o.products.some((p) => p.name.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchProduct) return false;
    }
    return true;
  });

  const toggleStatus = async (offer: AdminOfferItem) => {
    const nextStatus = offer.status === "published" ? "unpublished" : "published";
    setBusyId(offer.id);
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setOffers((prev) =>
          prev.map((item) => (item.id === offer.id ? { ...item, status: nextStatus } : item))
        );
        router.refresh();
      } else {
        showAlert("Could not update offer status.", "error");
      }
    } catch {
      showAlert("Error updating offer status.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const offer = deleteTarget;
    setDeleteTarget(null);
    setBusyId(offer.id);
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, { method: "DELETE" });
      if (res.ok) {
        setOffers((prev) => prev.filter((item) => item.id !== offer.id));
        router.refresh();
      } else {
        showAlert("Could not delete offer.", "error");
      }
    } catch {
      showAlert("Error deleting offer.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const deleteOffer = (offer: AdminOfferItem) => {
    setDeleteTarget(offer);
  };

  const formatOfferPrice = (o: AdminOfferItem) => {
    if (o.offerType === "quantity" && o.offerPrice != null) {
      return `₹${(o.offerPrice / 100).toLocaleString("en-IN")}`;
    }
    if (o.offerType === "percentage" && o.discountValue != null) {
      return `${o.discountValue}% OFF`;
    }
    if (o.offerType === "fixed" && o.discountValue != null) {
      return `₹${(o.discountValue / 100).toLocaleString("en-IN")} OFF`;
    }
    return "—";
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "No date set";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* ── Custom Alert Modal Box ──────────────────────────────────── */}
      <AlertModal
        open={alertData.open}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        onClose={() => setAlertData((prev) => ({ ...prev, open: false }))}
      />

      {/* ── Delete Confirmation Modal ───────────────────────────────── */}
      <AlertModal
        open={Boolean(deleteTarget)}
        title="Delete Offer"
        message={deleteTarget ? `Are you sure you want to permanently delete the offer "${deleteTarget.title}"?\nThis cannot be undone.` : ""}
        type="confirm"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <div className="border border-black/10 bg-white">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 border-b border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search offers or products..."
            className="w-full border border-black/15 bg-[#FCF8F0] px-3 py-2 text-sm text-black outline-none focus:border-[#9C5A2B]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["all", "published", "draft", "unpublished"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                statusFilter === st
                  ? "bg-[#9C5A2B] text-white"
                  : "bg-black/[0.04] text-black/70 hover:bg-black/[0.08]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-black/10 bg-[#FCF8F0] text-[11px] uppercase tracking-[0.15em] text-black/60">
            <tr>
              <th className="px-4 py-3.5">Offer Name</th>
              <th className="px-4 py-3.5">Product(s)</th>
              <th className="px-4 py-3.5">Type & Qty</th>
              <th className="px-4 py-3.5">Price / Discount</th>
              <th className="px-4 py-3.5">Validity Period</th>
              <th className="px-4 py-3.5">Placement</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-black/50">
                  No promotional offers found.
                </td>
              </tr>
            ) : (
              filtered.map((offer) => {
                const isBusy = busyId === offer.id;
                return (
                  <tr key={offer.id} className="hover:bg-black/[0.01]">
                    <td className="px-4 py-4">
                      <div className="font-medium text-black">{offer.title}</div>
                      {offer.description && (
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-black/55">
                          {offer.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        {offer.products.length > 0 && offer.products[0].image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={offer.products[0].image}
                            alt=""
                            className="h-10 w-10 border border-black/10 object-cover"
                          />
                        ) : offer.bannerImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={offer.bannerImage}
                            alt=""
                            className="h-10 w-10 border border-black/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center border border-black/10 bg-[#FCF8F0] text-[10px] font-semibold text-[#9C5A2B]">
                            Offer
                          </div>
                        )}
                        <div className="text-xs">
                          {offer.applicableToAll ? (
                            <div>
                              <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                All Products
                              </span>
                              {offer.products.length > 0 && (
                                <span className="block text-[11px] text-black/50 line-clamp-1">
                                  {offer.products[0].name}
                                </span>
                              )}
                            </div>
                          ) : offer.products.length > 0 ? (
                            <div>
                              <span className="font-medium text-black line-clamp-1">
                                {offer.products[0].name}
                              </span>
                              {offer.products.length > 1 && (
                                <span className="text-[11px] text-black/50">
                                  +{offer.products.length - 1} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-black/40">None selected</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="font-medium capitalize text-black">
                        {offer.offerType === "quantity"
                          ? "Quantity-based"
                          : offer.offerType === "percentage"
                          ? "Percentage discount"
                          : "Fixed discount"}
                      </div>
                      <div className="text-black/55">Req. Qty: {offer.requiredQuantity}</div>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className="font-semibold text-[#9C5A2B]">
                        {formatOfferPrice(offer)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-black/70">
                      <div>From: {formatDate(offer.startDate)}</div>
                      <div>To: {offer.endDate ? formatDate(offer.endDate) : "No expiry"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {offer.displayHomepage && (
                          <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-black/70">
                            Home
                          </span>
                        )}
                        {offer.displayListing && (
                          <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-black/70">
                            Listing
                          </span>
                        )}
                        {offer.displayProductDetails && (
                          <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-black/70">
                            Details
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          offer.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : offer.status === "draft"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => toggleStatus(offer)}
                          className="cursor-pointer border border-black/15 bg-white px-2.5 py-1 text-[11px] font-medium text-black/70 transition-colors hover:bg-black/5 disabled:opacity-50"
                        >
                          {offer.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <Link
                          href={`/admin/offers/${offer.id}`}
                          className="border border-[#9C5A2B] bg-white px-2.5 py-1 text-[11px] font-medium text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B]/10"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => deleteOffer(offer)}
                          className="cursor-pointer border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

