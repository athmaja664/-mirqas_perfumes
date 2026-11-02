"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import AlertModal from "./AlertModal";

const COPPER = "#9C5A2B";
const CARD_LINE = "#EADFCC";
const sans = "Inter, system-ui, sans-serif";

interface GiftCoverData {
  id?: string;
  name?: string;
  description?: string;
  price?: number; // rupees
  salePrice?: number | null; // rupees
  images?: string[];
  stock?: number;
  isActive?: boolean;
  category?: string;
}

export default function GiftCoverForm({ giftCover }: { giftCover?: GiftCoverData }) {
  const router = useRouter();
  const isEditing = Boolean(giftCover?.id);

  const [name, setName] = useState(giftCover?.name || "");
  const [description, setDescription] = useState(giftCover?.description || "");
  const [price, setPrice] = useState<string>(giftCover?.price != null ? String(giftCover.price) : "");
  const [salePrice, setSalePrice] = useState<string>(
    giftCover?.salePrice != null ? String(giftCover.salePrice) : ""
  );
  const [category, setCategory] = useState(giftCover?.category || "Gift Cover");
  const [images, setImages] = useState<string[]>(giftCover?.images || []);
  const [stock, setStock] = useState<number>(giftCover?.stock != null ? giftCover.stock : 100);
  const [isActive, setIsActive] = useState<boolean>(giftCover?.isActive !== false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ open: boolean; title: string; message: string; type?: "info" | "error" | "success" }>({
    open: false,
    title: "",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/uploads", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to upload ${file.name}`);
        }

        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }

      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed.";
      setAlert({ open: true, title: "Upload Error", message: msg, type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const makePrimaryImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return setAlert({ open: true, title: "Missing Name", message: "Please enter a gift cover name.", type: "error" });
    }

    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      return setAlert({ open: true, title: "Invalid Price", message: "Please enter a valid price in rupees.", type: "error" });
    }

    if (!description.trim()) {
      return setAlert({ open: true, title: "Missing Description", message: "Please provide a description.", type: "error" });
    }

    if (images.length === 0) {
      return setAlert({ open: true, title: "Missing Image", message: "Please upload at least one image.", type: "error" });
    }

    const salePriceNum = salePrice ? Number(salePrice) : null;
    if (salePriceNum !== null && salePriceNum >= priceNum) {
      return setAlert({
        open: true,
        title: "Invalid Sale Price",
        message: "Sale price must be lower than the regular price.",
        type: "error",
      });
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: Math.round(priceNum * 100), // convert to paise
        salePrice: salePriceNum ? Math.round(salePriceNum * 100) : null,
        category: category.trim() || "Gift Cover",
        images,
        stock: Number(stock) || 0,
        isActive,
      };

      const url = isEditing ? `/api/admin/gift-covers/${giftCover?.id}` : "/api/admin/gift-covers";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to save gift cover.");
      }

      setAlert({
        open: true,
        title: "Success",
        message: isEditing ? "Gift cover updated successfully." : "Gift cover created successfully.",
        type: "success",
      });

      setTimeout(() => {
        router.push("/admin/gift-covers");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save gift cover.";
      setAlert({ open: true, title: "Save Error", message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl" style={{ fontFamily: sans }}>
      {/* Top back & title */}
      <div className="mb-6">
        <Link
          href="/admin/gift-covers"
          className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#9C5A2B] hover:underline"
        >
          ← Back to Gift Covers
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
          {isEditing ? `Edit: ${name || "Gift Cover"}` : "Add New Gift Cover"}
        </h1>
        <p className="mt-1 text-sm text-[#111111]/60">
          Set up gift cover details, pricing, images, and live availability.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details Card */}
        <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: CARD_LINE }}>
          <h2 className="text-base font-semibold text-[#111111]">Basic Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]/70">
                Gift Cover Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Midnight Blue Velvet Gift Box"
                className="mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]/70">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Gift Cover"
                className="mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]/70">
                Regular Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="399"
                className="mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]/70">
                Sale Price (₹) <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="e.g. 349"
                className="mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]/70">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the material, color, design, and size compatibility..."
                className="mt-1.5 w-full rounded-lg border bg-white p-3 text-sm outline-none focus:border-[#9C5A2B]"
                style={{ borderColor: CARD_LINE }}
              />
            </div>
          </div>
        </div>

        {/* Media & Images Card */}
        <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: CARD_LINE }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#111111]">Images <span className="text-red-500">*</span></h2>
              <p className="mt-0.5 text-xs text-[#111111]/60">
                Upload one or more images. The first image will be used as the primary cover.
              </p>
            </div>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#9C5A2B] hover:bg-[#9C5A2B] hover:text-white disabled:opacity-50"
              style={{ borderColor: COPPER }}
            >
              {uploading ? "Uploading..." : "+ Upload Image"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:bg-stone-50"
              style={{ borderColor: CARD_LINE }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9C5A2B" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p className="mt-2 text-sm font-medium text-[#111111]">Click to upload gift cover photo</p>
              <p className="mt-0.5 text-xs text-[#111111]/60">PNG, JPG, WebP supported</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border bg-stone-100" style={{ borderColor: CARD_LINE }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-[#9C5A2B] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Primary
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => makePrimaryImage(i)}
                        className="rounded bg-white/90 px-2 py-1 text-[10px] font-semibold text-stone-900 hover:bg-white"
                        title="Make Primary"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="rounded bg-red-600/90 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-600"
                      title="Remove image"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock & Availability Card */}
        <div className="rounded-xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: CARD_LINE }}>
          <h2 className="text-base font-semibold text-[#111111]">Stock & Availability</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]/70">
                Active on Storefront
              </label>
              <p className="text-xs text-[#111111]/60">
                When enabled, customers can view, select, and purchase this gift cover on the Gift Page.
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? "bg-[#9C5A2B]" : "bg-stone-300"
                  }`}
                  role="switch"
                  aria-checked={isActive}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-[#111111]">{isActive ? "Active (Visible)" : "Disabled (Hidden)"}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111]/70">
                Inventory Stock Units
              </label>
              <p className="text-xs text-[#111111]/60">
                Automatically decrements on order placement. Set to 0 to mark Out of Stock.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-11 w-32 rounded-lg border bg-white px-3 text-sm outline-none focus:border-[#9C5A2B]"
                  style={{ borderColor: CARD_LINE }}
                />
                <button
                  type="button"
                  onClick={() => setStock((s) => (s > 0 ? 0 : 50))}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    stock > 0
                      ? "border-red-300 text-red-600 hover:bg-red-50"
                      : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {stock > 0 ? "Mark Out of Stock" : "Mark In Stock (50)"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/gift-covers"
            className="rounded-lg border px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            style={{ borderColor: CARD_LINE }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-[150px] items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
            style={{ background: COPPER }}
          >
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Gift Cover"}
          </button>
        </div>
      </form>

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
