"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { FRAGRANCE_FAMILIES } from "@/lib/validations/product";
import { SHOP_SECTIONS, COLLECTION_SECTIONS } from "@/lib/sections";
import MultiSelect from "@/components/MultiSelect";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export type ProductData = {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number; // paise
  salePrice: number | null; // paise
  category: string;
  images: string[];
  // The "card media": ONE video OR ONE image, shown on the product card when it is
  // hovered (laptop) or scrolled into view (phone). It is saved in the same "video" field.
  video: string;
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  sections?: string[];
  collections?: string[];
  showInNewArrivals?: boolean;
};

type CardMedia = "none" | "video" | "image";

const toRupees = (paise: number) => String(paise / 100);

// A saved link ending in .mp4 or .webm is a video. Any other link is an image.
const isVideoUrl = (url: string) => /\.(mp4|webm)(\?.*)?$/i.test(url);

// Shows one image. If the browser cannot load it, a message appears instead of a blank box.
function Thumb({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-[#F3E7D5] px-2 text-center text-[11px] text-black/60">
        Could not load
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      onError={() => setFailed(true)}
      className="aspect-square w-full bg-[#F3E7D5] object-cover"
    />
  );
}

export default function ProductForm({ product }: { product?: ProductData }) {
  const router = useRouter();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? FRAGRANCE_FAMILIES[0]);
  const [price, setPrice] = useState(product ? toRupees(product.price) : "");
  const [salePrice, setSalePrice] = useState(product?.salePrice ? toRupees(product.salePrice) : "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [images, setImages] = useState<string[]>(product?.images ?? []);

  // Card media: none, one video, or one image (saved in the "video" field)
  const [media, setMedia] = useState(product?.video ?? "");
  const [mediaType, setMediaType] = useState<CardMedia>(
    !product?.video ? "none" : isVideoUrl(product.video) ? "video" : "image"
  );

  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false);

  // Where the product shows on the website.
  // "new-arrivals" is not in this list. It has its own box (showInNewArrivals).
  const [sections, setSections] = useState<string[]>(
    (product?.sections ?? ["shop-all"]).filter((s) => s !== "new-arrivals")
  );
  const [collections, setCollections] = useState<string[]>(product?.collections ?? []);
  const [showInNewArrivals, setShowInNewArrivals] = useState(product?.showInNewArrivals ?? true);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
  //   const input = e.target;
  //   const picked = Array.from(input.files ?? []);
  //   input.value = ""; // lets the admin pick the same file again later
  //   if (picked.length === 0) return;

  //   setError("");
  //   if (images.length + picked.length > MAX_IMAGES)
  //     return setError(`A product can have at most ${MAX_IMAGES} images.`);
  //   const tooBig = picked.find((f) => f.size > MAX_BYTES);
  //   if (tooBig) return setError(`${tooBig.name} is larger than 5 MB.`);

  //   const body = new FormData();
  //   picked.forEach((f) => body.append("files", f));

  //   setUploading(true);
  //   try {
  //     // Do not set Content-Type here. The browser sets it for file uploads.
  //     const res = await fetch("/api/admin/uploads", { method: "POST", body });
  //     const json = await res.json();
  //     if (!res.ok) throw new Error(json.message || "Upload failed.");
  //     setImages((prev) => [...prev, ...(json.urls as string[])]);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : "Upload failed.");
  //   } finally {
  //     setUploading(false);
  //   }
  // }
  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const picked = Array.from(input.files ?? []);
    input.value = ""; // lets the admin pick the same file again later
    if (picked.length === 0) return;

    setError("");
    if (images.length + picked.length > MAX_IMAGES)
      return setError(`A product can have at most ${MAX_IMAGES} images.`);
    const tooBig = picked.find((f) => f.size > MAX_BYTES);
    if (tooBig) return setError(`${tooBig.name} is larger than 5 MB.`);

    setUploading(true);
    try {
      // Each file goes straight from the browser to Vercel Blob
      const results = await Promise.all(
        picked.map((f) =>
          upload(`products/${f.name}`, f, {
            access: "public",
            handleUploadUrl: "/api/admin/blob-upload",
          })
        )
      );
      setImages((prev) => [...prev, ...results.map((r) => r.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function makeMain(url: string) {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  }

  // Choosing a different card media type clears the old file, so only ONE kind is ever saved
  function changeMediaType(t: CardMedia) {
    if (t === mediaType) return;
    setMediaType(t);
    setMedia("");
    setError("");
  }

  // Uploads the card media: one video (MP4/WebM) or one image, depending on the chosen type
  // async function onPickMedia(e: React.ChangeEvent<HTMLInputElement>) {
  //   const input = e.target;
  //   const file = input.files?.[0];
  //   input.value = "";
  //   if (!file || mediaType === "none") return;

  //   setError("");
  //   const isVideo = mediaType === "video";
  //   const limit = isVideo ? MAX_VIDEO_BYTES : MAX_BYTES;
  //   if (file.size > limit) return setError(`${file.name} is larger than ${limit / 1024 / 1024} MB.`);

  //   const body = new FormData();
  //   if (isVideo) body.append("kind", "video");
  //   body.append("files", file);

  //   setUploadingMedia(true);
  //   try {
  //     const res = await fetch("/api/admin/uploads", { method: "POST", body });
  //     const json = await res.json();
  //     if (!res.ok) throw new Error(json.message || "Upload failed.");
  //     setMedia((json.urls as string[])[0]);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : "Upload failed.");
  //   } finally {
  //     setUploadingMedia(false);
  //   }
  // }
    async function onPickMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file || mediaType === "none") return;

    setError("");
    const isVideo = mediaType === "video";
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_BYTES;
    if (file.size > limit) return setError(`${file.name} is larger than ${limit / 1024 / 1024} MB.`);

    setUploadingMedia(true);
    try {
      const blob = await upload(`products/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
      });
      setMedia(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (uploading || uploadingMedia) return setError("Please wait for the uploads to finish.");

    // Rupees typed by the admin become whole paise (₹1,499 -> 149900).
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return setError("Enter a valid price in rupees.");
    const pricePaise = Math.round(priceNum * 100);

    let salePaise: number | null = null;
    if (salePrice.trim() !== "") {
      const s = Number(salePrice);
      if (!Number.isFinite(s) || s <= 0) return setError("Enter a valid sale price in rupees, or leave it empty.");
      salePaise = Math.round(s * 100);
      if (salePaise >= pricePaise) return setError("Sale price must be lower than the price.");
    }

    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) return setError("Stock must be a whole number, 0 or more.");

    if (images.length === 0) return setError("Add at least one image. The first image is the card thumbnail.");
    if (mediaType !== "none" && !media)
      return setError(
        mediaType === "video"
          ? "Upload the video, or choose “No hover media”."
          : "Upload the hover image, or choose “No hover media”."
      );

    // The gender follows the sections: only Men -> Men, only Women -> Women, anything else -> Unisex
    const isMen = sections.includes("men");
    const isWomen = sections.includes("women");
    const gender = isMen && !isWomen ? "Men" : isWomen && !isMen ? "Women" : "Unisex";

    const payload = {
      name,
      brand,
      description,
      category,
      price: pricePaise,
      salePrice: salePaise,
      stock: stockNum,
      images,
      video: mediaType === "none" ? "" : media.trim(),
      isActive,
      isBestSeller,
      gender,
      sections,
      collections,
      showInNewArrivals,
    };

    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not save the product.");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the product.");
      setSaving(false);
    }
  }

  // 16px text on phones stops iPhones from zooming in when a field is tapped.
  const input =
    "w-full border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-black/40 sm:py-2.5 sm:text-[14px]";
  const label = "mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/55";
  const filePicker =
    "block w-full text-[14px] file:mr-4 file:border-0 file:bg-[#F3E7D5] file:px-4 file:py-3 file:text-[12px] file:font-semibold file:uppercase file:tracking-[0.15em] file:text-[#111] disabled:opacity-50 sm:file:py-2.5";
  const smallLink = "px-1 py-2 underline underline-offset-4";
  const hint = "m-0 mb-3 text-[13px] leading-relaxed text-black/55";

  const mediaOptions: { value: CardMedia; title: string; text: string }[] = [
    { value: "none", title: "No hover media", text: "The card shows only the first image." },
    { value: "video", title: "Video", text: "A video plays when the card is hovered or scrolled into view." },
    { value: "image", title: "One image", text: "The card changes to this image when hovered or scrolled into view." },
  ];

  return (
    <>
      <h1 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
        {editing ? "Edit product" : "Add product"}
      </h1>

      <form
        onSubmit={onSubmit}
        className="mt-6 grid max-w-[760px] gap-6 border border-black/10 bg-white p-4 sm:p-6 md:mt-8 md:p-8 [&>*]:min-w-0"
      >
        {error && (
          <p role="alert" className="m-0 border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-800">
            {error}
          </p>
        )}

        <div>
          <label className={label} htmlFor="name">Name</label>
          <input id="name" className={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="brand">Brand</label>
            <input id="brand" className={input} value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="category">Category</label>
            <select id="category" className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {FRAGRANCE_FAMILIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Website sections + Collections menu (multiple choice) */}
        <div className="grid gap-6 sm:grid-cols-2">
          <MultiSelect
            label="Show in website sections"
            options={SHOP_SECTIONS}
            value={sections}
            onChange={setSections}
          />
          <MultiSelect
            label="Show in Collections menu"
            options={COLLECTION_SECTIONS}
            value={collections}
            onChange={setCollections}
          />
        </div>

        <div>
          <label className={label} htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            className={input}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="price">Price (₹)</label>
            <input id="price" inputMode="decimal" className={input} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1499" required />
          </div>
          <div>
            <label className={label} htmlFor="salePrice">Sale price (₹)</label>
            <input id="salePrice" inputMode="decimal" className={input} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className={label} htmlFor="stock">Stock</label>
            <input id="stock" inputMode="numeric" className={input} value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>

        {/* 1. Product images (many) */}
        <div>
          <label className={label} htmlFor="imageFiles">
            Product images (JPG, PNG or WebP, max 5 MB each, up to {MAX_IMAGES})
          </label>
          <p className={hint}>
            The <strong>Main</strong> image is the thumbnail on the product card. All the images show when a
            customer opens the product to see more.
          </p>
          <input
            id="imageFiles"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading || images.length >= MAX_IMAGES}
            onChange={onPickFiles}
            className={filePicker}
          />
          {uploading && <p className="mb-0 mt-2 text-[13px] text-black/55">Uploading…</p>}

          {images.length > 0 && (
            <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {images.map((url, i) => (
                <li key={url} className="border border-black/10">
                  <Thumb url={url} />
                  <div className="flex items-center justify-between gap-2 px-2 py-1 text-[11px] uppercase tracking-[0.12em]">
                    {i === 0 ? (
                      <span style={{ color: COPPER }}>Main</span>
                    ) : (
                      <button type="button" onClick={() => makeMain(url)} className={smallLink}>
                        Make main
                      </button>
                    )}
                    <button type="button" onClick={() => removeImage(url)} className={smallLink}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 2. Card media: ONE video OR ONE image */}
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className={label}>Card hover media (choose one, optional)</legend>
          <p className={hint}>
            This shows on the product card after the thumbnail. Choose a video <strong>or</strong> one image,
            not both.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {mediaOptions.map((o) => {
              const active = mediaType === o.value;
              return (
                <label
                  key={o.value}
                  className={`flex cursor-pointer flex-col gap-1 border px-3 py-3 text-[13px] transition-colors ${
                    active ? "border-[#9C5A2B] bg-[#9C5A2B]/5" : "border-black/10 hover:border-black/30"
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <input
                      type="radio"
                      name="cardMedia"
                      value={o.value}
                      checked={active}
                      onChange={() => changeMediaType(o.value)}
                      className="h-4 w-4 accent-[#9C5A2B]"
                    />
                    {o.title}
                  </span>
                  <span className="text-[12px] leading-snug text-black/55">{o.text}</span>
                </label>
              );
            })}
          </div>

          {mediaType !== "none" && (
            <div className="mt-4">
              <label className={label} htmlFor="mediaFile">
                {mediaType === "video"
                  ? "Video (MP4 or WebM, max 20 MB)"
                  : "Hover image (JPG, PNG or WebP, max 5 MB)"}
              </label>
              <input
                id="mediaFile"
                key={mediaType}
                type="file"
                accept={mediaType === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp"}
                disabled={uploadingMedia}
                onChange={onPickMedia}
                className={filePicker}
              />
              {uploadingMedia && (
                <p className="mb-0 mt-2 text-[13px] text-black/55">
                  {mediaType === "video" ? "Uploading video…" : "Uploading image…"}
                </p>
              )}

              {media && (
                <div className="mt-4 w-full max-w-[12rem] border border-black/10">
                  {isVideoUrl(media) ? (
                    <video
                      key={media}
                      src={media}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="aspect-square w-full bg-[#F3E7D5] object-cover"
                    />
                  ) : (
                    <Thumb url={media} />
                  )}
                  <div className="px-2 py-1 text-[11px] uppercase tracking-[0.12em]">
                    <button type="button" onClick={() => setMedia("")} className={smallLink}>
                      {mediaType === "video" ? "Remove video" : "Remove image"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </fieldset>

        <div className="flex flex-col gap-4 text-[14px] sm:flex-row sm:flex-wrap sm:gap-8">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-[#9C5A2B]" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (visible in the store)
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-[#9C5A2B]" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} />
            Best seller
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-[#9C5A2B]" checked={showInNewArrivals} onChange={(e) => setShowInNewArrivals(e.target.checked)} />
            Show in New Arrivals (for 30 days)
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving || uploading || uploadingMedia}
            className="w-full px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7d4720] disabled:opacity-50 sm:w-auto sm:py-3"
            style={{ background: COPPER }}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
          </button>
          <Link
            href="/admin/products"
            className="py-2 text-center text-[12px] uppercase tracking-[0.18em] underline underline-offset-4"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}