// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { FRAGRANCE_FAMILIES } from "@/lib/validations/product";
// import { SHOP_SECTIONS, COLLECTION_SECTIONS } from "@/lib/sections";
// import MultiSelect from "@/components/MultiSelect";
// import AlertModal from "@/components/admin/AlertModal";

// const COPPER = "#9C5A2B";
// const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
// const MAX_IMAGES = 10;
// const MAX_BYTES = 4 * 1024 * 1024; // 4 MB client check
// const COMPRESS_TARGET = 3 * 1024 * 1024; // auto-compress images above 3 MB

// // Resize + JPEG-compress an image client-side so it easily fits within Vercel's 4.5 MB body limit.
// async function compressImage(file: File): Promise<File> {
//   if (!file.type.startsWith("image/")) return file;
//   if (file.size <= COMPRESS_TARGET) return file;
//   return new Promise((resolve) => {
//     const url = URL.createObjectURL(file);
//     const img = new Image();
//     img.onload = () => {
//       URL.revokeObjectURL(url);
//       const MAX_SIDE = 1920;
//       let { naturalWidth: w, naturalHeight: h } = img;
//       if (w > MAX_SIDE || h > MAX_SIDE) {
//         if (w > h) {
//           h = Math.round((h * MAX_SIDE) / w);
//           w = MAX_SIDE;
//         } else {
//           w = Math.round((w * MAX_SIDE) / h);
//           h = MAX_SIDE;
//         }
//       }
//       const canvas = document.createElement("canvas");
//       canvas.width = w;
//       canvas.height = h;
//       const ctx = canvas.getContext("2d");
//       if (!ctx) {
//         resolve(file);
//         return;
//       }
//       ctx.drawImage(img, 0, 0, w, h);
//       canvas.toBlob(
//         (blob) => {
//           if (!blob) {
//             resolve(file);
//             return;
//           }
//           resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
//         },
//         "image/jpeg",
//         0.82
//       );
//     };
//     img.onerror = () => {
//       URL.revokeObjectURL(url);
//       resolve(file);
//     };
//     img.src = url;
//   });
// }

// export type ProductData = {
//   id: string;
//   name: string;
//   brand: string;
//   description: string;
//   price: number; // paise
//   salePrice: number | null; // paise
//   category: string;
//   images: string[];
//   video: string; // stores hover flip image URL or ""
//   stock: number;
//   isActive: boolean;
//   isBestSeller: boolean;
//   sections?: string[];
//   collections?: string[];
//   showInNewArrivals?: boolean;
// };

// type CardMedia = "none" | "image";

// const toRupees = (paise: number) => String(paise / 100);

// function Thumb({ url, onClick }: { url: string; onClick?: () => void }) {
//   const [failed, setFailed] = useState(false);
//   if (failed) {
//     return (
//       <div
//         onClick={onClick}
//         className="flex aspect-square w-full cursor-pointer items-center justify-center bg-[#F3E7D5] px-2 text-center text-[11px] text-black/60 hover:opacity-85"
//       >
//         Click to view
//       </div>
//     );
//   }
//   return (
//     // eslint-disable-next-line @next/next/no-img-element
//     <img
//       src={url}
//       alt="Thumbnail"
//       title="Click to view details"
//       onClick={onClick}
//       onError={() => setFailed(true)}
//       className={`aspect-square w-full bg-[#F3E7D5] object-cover transition-opacity ${
//         onClick ? "cursor-pointer hover:opacity-85" : ""
//       }`}
//     />
//   );
// }

// export default function ProductForm({ product }: { product?: ProductData }) {
//   const router = useRouter();
//   const editing = Boolean(product);

//   const [name, setName] = useState(product?.name ?? "");
//   const [brand, setBrand] = useState(product?.brand ?? "");
//   const [description, setDescription] = useState(product?.description ?? "");
//   const [category, setCategory] = useState(product?.category ?? FRAGRANCE_FAMILIES[0]);
//   const [price, setPrice] = useState(product ? toRupees(product.price) : "");
//   const [salePrice, setSalePrice] = useState(product?.salePrice ? toRupees(product.salePrice) : "");
//   const [stock, setStock] = useState(String(product?.stock ?? 0));
//   const [images, setImages] = useState<string[]>(product?.images ?? []);

//   // Card hover image: either "none" or "image" (stored in product.video column, ignoring any legacy .mp4/.webm videos)
//   const isLegacyVideo = Boolean(product?.video && /\.(mp4|webm|mov)(\?.*)?$/i.test(product.video));
//   const initialHoverImage = isLegacyVideo ? "" : (product?.video ?? "");
//   const [media, setMedia] = useState(initialHoverImage);
//   const [mediaType, setMediaType] = useState<CardMedia>(!initialHoverImage ? "none" : "image");

//   const [isActive, setIsActive] = useState(product?.isActive ?? true);
//   const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false);

//   const [sections, setSections] = useState<string[]>(
//     (product?.sections ?? ["shop-all"]).filter((s) => s !== "new-arrivals")
//   );
//   const [collections, setCollections] = useState<string[]>(product?.collections ?? []);
//   const [showInNewArrivals, setShowInNewArrivals] = useState(product?.showInNewArrivals ?? true);

//   const [error, setError] = useState("");
//   const [alertData, setAlertData] = useState<{
//     open: boolean;
//     title?: string;
//     message: string;
//     type?: "info" | "error" | "success";
//   }>({
//     open: false,
//     message: "",
//   });

//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [uploadingMedia, setUploadingMedia] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   // Used only for actual errors
//   function showAlert(message: string, type: "info" | "error" | "success" = "error", title?: string) {
//     setError(type === "error" ? message : "");
//     setAlertData({ open: true, message, type, title });
//   }

//   async function uploadOne(file: File): Promise<string> {
//     const body = new FormData();
//     body.append("files", file);

//     const res = await fetch("/api/admin/uploads", { method: "POST", body });
//     const json = await res.json().catch(() => ({}));
//     if (!res.ok) {
//       throw new Error(json.message || "Upload failed.");
//     }
//     const url = (json.urls as string[])?.[0];
//     if (!url) throw new Error("Server returned no URL for uploaded file.");
//     return url;
//   }

//   async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
//     const input = e.target;
//     const picked = Array.from(input.files ?? []);
//     input.value = "";
//     if (picked.length === 0) return;

//     setError("");
//     if (images.length + picked.length > MAX_IMAGES) {
//       showAlert(`A product can have at most ${MAX_IMAGES} images.`, "error");
//       return;
//     }

//     const tooBig = picked.find((f) => f.size > MAX_BYTES);
//     if (tooBig) {
//       showAlert(`${tooBig.name} is too large. Please select a file under 4 MB.`, "error");
//       return;
//     }

//     setUploading(true);
//     try {
//       const compressed = await Promise.all(picked.map((f) => compressImage(f)));
//       const results: string[] = [];
//       for (const f of compressed) {
//         const u = await uploadOne(f);
//         results.push(u);
//       }
//       setImages((prev) => [...prev, ...results]);
//     } catch (err) {
//       showAlert(err instanceof Error ? err.message : "Upload failed.", "error");
//     } finally {
//       setUploading(false);
//     }
//   }

//   function removeImage(url: string) {
//     setImages((prev) => prev.filter((u) => u !== url));
//   }

//   function makeMain(url: string) {
//     setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
//   }

//   function changeMediaType(t: CardMedia) {
//     if (t === mediaType) return;
//     setMediaType(t);
//     setMedia("");
//     setError("");
//   }

//   async function onPickMedia(e: React.ChangeEvent<HTMLInputElement>) {
//     const input = e.target;
//     const file = input.files?.[0];
//     input.value = "";
//     if (!file || mediaType === "none") return;

//     setError("");
//     if (file.size > MAX_BYTES) {
//       showAlert(`${file.name} is larger than 4 MB. Please select a smaller image.`, "error");
//       return;
//     }

//     setUploadingMedia(true);
//     try {
//       const ready = await compressImage(file);
//       const url = await uploadOne(ready);
//       setMedia(url);
//     } catch (err) {
//       showAlert(err instanceof Error ? err.message : "Upload failed.", "error");
//     } finally {
//       setUploadingMedia(false);
//     }
//   }

//   async function onDeleteProduct() {
//     if (!product?.id) return;
//     if (
//       !window.confirm(
//         `Delete "${product.name}" permanently?\n\nThis will remove the product, reviews, and cart entries. This cannot be undone.`
//       )
//     )
//       return;

//     setDeleting(true);
//     setError("");
//     try {
//       const res = await fetch(`/api/admin/products/${product.id}?permanent=true`, { method: "DELETE" });
//       const json = await res.json().catch(() => ({}));
//       if (!res.ok) throw new Error(json.message || "Could not delete product.");
//       router.push("/admin/products");
//       router.refresh();
//     } catch (err) {
//       showAlert(err instanceof Error ? err.message : "Could not delete product.", "error");
//       setDeleting(false);
//     }
//   }

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError("");
//     if (uploading || uploadingMedia) {
//       showAlert("Please wait for file uploads to finish before saving.", "info");
//       return;
//     }

//     const priceNum = Number(price);
//     if (!Number.isFinite(priceNum) || priceNum <= 0) {
//       showAlert("Enter a valid price in rupees.", "error");
//       return;
//     }
//     const pricePaise = Math.round(priceNum * 100);

//     let salePaise: number | null = null;
//     if (salePrice.trim() !== "") {
//       const s = Number(salePrice);
//       if (!Number.isFinite(s) || s <= 0) {
//         showAlert("Enter a valid sale price in rupees, or leave it empty.", "error");
//         return;
//       }
//       salePaise = Math.round(s * 100);
//       if (salePaise >= pricePaise) {
//         showAlert("Sale price must be lower than the original price.", "error");
//         return;
//       }
//     }

//     const stockNum = Number(stock);
//     if (!Number.isInteger(stockNum) || stockNum < 0) {
//       showAlert("Stock must be a whole number, 0 or more.", "error");
//       return;
//     }

//     if (images.length === 0) {
//       showAlert("Add at least one product image before saving.", "error");
//       return;
//     }

//     if (mediaType === "image" && !media) {
//       showAlert("Upload the hover flip image, or select 'No hover image'.", "error");
//       return;
//     }

//     const isMen = sections.includes("men");
//     const isWomen = sections.includes("women");
//     const gender = isMen && !isWomen ? "Men" : isWomen && !isMen ? "Women" : "Unisex";

//     const payload = {
//       name,
//       brand,
//       description,
//       category,
//       price: pricePaise,
//       salePrice: salePaise,
//       stock: stockNum,
//       images,
//       video: mediaType === "none" ? "" : media.trim(),
//       isActive,
//       isBestSeller,
//       gender,
//       sections,
//       collections,
//       showInNewArrivals,
//     };

//     setSaving(true);
//     try {
//       const res = await fetch(editing ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
//         method: editing ? "PATCH" : "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const json = await res.json();
//       if (!res.ok) throw new Error(json.message || "Could not save the product.");
//       router.push("/admin/products");
//       router.refresh();
//     } catch (err) {
//       showAlert(err instanceof Error ? err.message : "Could not save the product.", "error");
//       setSaving(false);
//     }
//   }

//   const input =
//     "w-full border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-black/40 sm:py-2.5 sm:text-[14px]";
//   const label = "mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/55 cursor-pointer";
//   const filePicker =
//     "block w-full text-[14px] cursor-pointer file:cursor-pointer file:mr-4 file:border-0 file:bg-[#F3E7D5] file:px-4 file:py-3 file:text-[12px] file:font-semibold file:uppercase file:tracking-[0.15em] file:text-[#111] disabled:opacity-50 sm:file:py-2.5";
//   const smallLink = "px-1 py-2 underline underline-offset-4 cursor-pointer";
//   const hint = "m-0 mb-3 text-[13px] leading-relaxed text-black/55";

//   const mediaOptions: { value: CardMedia; title: string; text: string }[] = [
//     { value: "none", title: "No hover image", text: "The card shows only the main product image." },
//     { value: "image", title: "Hover flip image", text: "The card flips to this image when hovered or viewed." },
//   ];

//   return (
//     <>
//       {/* ── Custom Alert Modal Box (Only for Errors) ───────────────── */}
//       <AlertModal
//         open={alertData.open}
//         title={alertData.title}
//         message={alertData.message}
//         type={alertData.type}
//         onClose={() => setAlertData((prev) => ({ ...prev, open: false }))}
//       />

//       {/* ── Image Details / Preview Modal ────────────────────────────── */}
//       {previewUrl && (
//         <div
//           className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
//           onClick={() => setPreviewUrl(null)}
//         >
//           <div
//             role="dialog"
//             aria-modal="true"
//             aria-label="Image details"
//             onClick={(e) => e.stopPropagation()}
//             className="relative flex max-h-[90vh] w-full max-w-2xl flex-col border border-black/10 bg-[#FCF8F0] p-6 shadow-2xl"
//           >
//             <button
//               type="button"
//               onClick={() => setPreviewUrl(null)}
//               className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center bg-white/80 text-black/60 transition-colors hover:text-black"
//               aria-label="Close"
//             >
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M18 6 6 18M6 6l12 12" />
//               </svg>
//             </button>
//             <h3 className="m-0 mb-3 text-2xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
//               Image details
//             </h3>
//             <div className="flex max-h-[60vh] items-center justify-center overflow-hidden border border-black/10 bg-[#F3E7D5]">
//               {/* eslint-disable-next-line @next/next/no-img-element */}
//               <img src={previewUrl} alt="Preview" className="max-h-[58vh] w-auto max-w-full object-contain" />
//             </div>
//             <div className="mt-4 flex flex-col gap-2 text-[13px] text-black/70">
//               <p className="m-0 break-all font-mono text-[12px] text-black/60">
//                 <strong>Path:</strong> {previewUrl}
//               </p>
//               <div className="mt-2 flex flex-wrap gap-3">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     makeMain(previewUrl);
//                     setPreviewUrl(null);
//                   }}
//                   className="cursor-pointer border border-[#9C5A2B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B]/10"
//                 >
//                   Make Main Image
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     removeImage(previewUrl);
//                     setPreviewUrl(null);
//                   }}
//                   className="cursor-pointer border border-red-300 bg-red-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-red-800 transition-colors hover:bg-red-100"
//                 >
//                   Remove Image
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setPreviewUrl(null)}
//                   className="cursor-pointer border border-black/20 bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-black/60 transition-colors hover:bg-black/5"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <h1 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
//         {editing ? "Edit product" : "Add product"}
//       </h1>

//       <form
//         onSubmit={onSubmit}
//         className="mt-6 grid max-w-[760px] gap-6 border border-black/10 bg-white p-4 sm:p-6 md:mt-8 md:p-8 [&>*]:min-w-0"
//       >
//         {error && (
//           <p role="alert" className="m-0 border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-800">
//             {error}
//           </p>
//         )}

//         <div>
//           <label className={label} htmlFor="name">
//             Name
//           </label>
//           <input id="name" className={input} value={name} onChange={(e) => setName(e.target.value)} required />
//         </div>

//         <div className="grid gap-6 sm:grid-cols-2">
//           <div>
//             <label className={label} htmlFor="brand">
//               Brand
//             </label>
//             <input id="brand" className={input} value={brand} onChange={(e) => setBrand(e.target.value)} />
//           </div>
//           <div>
//             <label className={label} htmlFor="category">
//               Category
//             </label>
//             <select
//               id="category"
//               className={`${input} cursor-pointer`}
//               value={category}
//               onChange={(e) => setCategory(e.target.value)}
//             >
//               {FRAGRANCE_FAMILIES.map((f) => (
//                 <option key={f} value={f}>
//                   {f}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Website sections + Collections menu (multiple choice) */}
//         <div className="grid gap-6 sm:grid-cols-2">
//           <MultiSelect
//             label="Show in website sections"
//             options={SHOP_SECTIONS}
//             value={sections}
//             onChange={setSections}
//           />
//           <MultiSelect
//             label="Show in Collections menu"
//             options={COLLECTION_SECTIONS}
//             value={collections}
//             onChange={setCollections}
//           />
//         </div>

//         <div>
//           <label className={label} htmlFor="description">
//             Description
//           </label>
//           <textarea
//             id="description"
//             rows={4}
//             className={input}
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />
//         </div>

//         <div className="grid gap-6 sm:grid-cols-3">
//           <div>
//             <label className={label} htmlFor="price">
//               Price (₹)
//             </label>
//             <input
//               id="price"
//               inputMode="decimal"
//               className={input}
//               value={price}
//               onChange={(e) => setPrice(e.target.value)}
//               placeholder="1499"
//               required
//             />
//           </div>
//           <div>
//             <label className={label} htmlFor="salePrice">
//               Sale price (₹)
//             </label>
//             <input
//               id="salePrice"
//               inputMode="decimal"
//               className={input}
//               value={salePrice}
//               onChange={(e) => setSalePrice(e.target.value)}
//               placeholder="Optional"
//             />
//           </div>
//           <div>
//             <div className="flex items-center justify-between">
//               <label className={label} htmlFor="stock">
//                 Stock Quantity
//               </label>
//               {Number(stock) <= 0 ? (
//                 <span className="mb-2 text-[11px] font-semibold text-red-600">● Out of stock</span>
//               ) : Number(stock) <= 5 ? (
//                 <span className="mb-2 text-[11px] font-semibold text-amber-600">● Low stock</span>
//               ) : (
//                 <span className="mb-2 text-[11px] font-semibold text-green-600">● In stock</span>
//               )}
//             </div>
//             <input
//               id="stock"
//               type="number"
//               min="0"
//               step="1"
//               className={input}
//               value={stock}
//               onChange={(e) => setStock(e.target.value)}
//               placeholder="0"
//               required
//             />
//             {/* Quick stock / unstock toggles */}
//             <div className="mt-2 flex items-center gap-2">
//               <button
//                 type="button"
//                 onClick={() => setStock(Number(stock) > 0 ? stock : "10")}
//                 className={`cursor-pointer rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
//                   Number(stock) > 0
//                     ? "border-green-600 bg-green-50 text-green-800"
//                     : "border-black/20 text-black/60 hover:bg-black/[0.04]"
//                 }`}
//               >
//                 In Stock
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setStock("0")}
//                 className={`cursor-pointer rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
//                   Number(stock) <= 0
//                     ? "border-red-600 bg-red-50 text-red-800"
//                     : "border-black/20 text-black/60 hover:bg-black/[0.04]"
//                 }`}
//               >
//                 Out of Stock (Unstock)
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* 1. Product images (many) */}
//         <div>
//           <label className={label} htmlFor="imageFiles">
//             Product images (JPG, PNG or WebP, auto-compressed, up to {MAX_IMAGES})
//           </label>
//           <p className={hint}>
//             The <strong>Main</strong> image is the thumbnail on the product card. Click any image to view details.
//           </p>
//           <input
//             id="imageFiles"
//             type="file"
//             accept="image/jpeg,image/png,image/webp"
//             multiple
//             disabled={uploading || images.length >= MAX_IMAGES}
//             onChange={onPickFiles}
//             className={filePicker}
//           />
//           {uploading && (
//             <p className="mb-0 mt-2 text-[13px] font-medium text-[#9C5A2B]">
//               Uploading images…
//             </p>
//           )}

//           {images.length > 0 && (
//             <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
//               {images.map((url, i) => (
//                 <li key={url} className="border border-black/10">
//                   <Thumb url={url} onClick={() => setPreviewUrl(url)} />
//                   <div className="flex items-center justify-between gap-2 px-2 py-1 text-[11px] uppercase tracking-[0.12em]">
//                     {i === 0 ? (
//                       <span style={{ color: COPPER }}>Main</span>
//                     ) : (
//                       <button type="button" onClick={() => makeMain(url)} className={smallLink}>
//                         Make main
//                       </button>
//                     )}
//                     <button type="button" onClick={() => removeImage(url)} className={smallLink}>
//                       Remove
//                     </button>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>

//         {/* 2. Card hover flip image (optional) */}
//         <fieldset className="m-0 min-w-0 border-0 p-0">
//           <legend className={label}>Card hover image (optional)</legend>
//           <p className={hint}>
//             Choose whether the product card flips to a second image when hovered on desktop or scrolled into view on mobile.
//           </p>

//           <div className="grid gap-3 sm:grid-cols-2">
//             {mediaOptions.map((o) => {
//               const active = mediaType === o.value;
//               return (
//                 <label
//                   key={o.value}
//                   className={`flex cursor-pointer flex-col gap-1 border px-3 py-3 text-[13px] transition-colors ${
//                     active ? "border-[#9C5A2B] bg-[#9C5A2B]/5" : "border-black/10 hover:border-black/30"
//                   }`}
//                 >
//                   <span className="flex items-center gap-2 font-semibold">
//                     <input
//                       type="radio"
//                       name="cardMedia"
//                       value={o.value}
//                       checked={active}
//                       onChange={() => changeMediaType(o.value)}
//                       className="h-4 w-4 cursor-pointer accent-[#9C5A2B]"
//                     />
//                     {o.title}
//                   </span>
//                   <span className="text-[12px] leading-snug text-black/55">{o.text}</span>
//                 </label>
//               );
//             })}
//           </div>

//           {mediaType === "image" && (
//             <div className="mt-4">
//               <label className={label} htmlFor="mediaFile">
//                 Hover flip image (JPG, PNG or WebP, auto-compressed)
//               </label>
//               <input
//                 id="mediaFile"
//                 type="file"
//                 accept="image/jpeg,image/png,image/webp"
//                 disabled={uploadingMedia}
//                 onChange={onPickMedia}
//                 className={filePicker}
//               />
//               {uploadingMedia && (
//                 <p className="mb-0 mt-2 text-[13px] font-medium text-[#9C5A2B]">
//                   Uploading hover image…
//                 </p>
//               )}

//               {media && (
//                 <div className="mt-4 w-full max-w-[12rem] border border-black/10">
//                   <Thumb url={media} onClick={() => setPreviewUrl(media)} />
//                   <div className="px-2 py-1 text-[11px] uppercase tracking-[0.12em]">
//                     <button type="button" onClick={() => setMedia("")} className={smallLink}>
//                       Remove hover image
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </fieldset>

//         <div className="flex flex-col gap-4 text-[14px] sm:flex-row sm:flex-wrap sm:gap-8">
//           <label className="flex cursor-pointer items-center gap-3">
//             <input
//               type="checkbox"
//               className="h-5 w-5 cursor-pointer accent-[#9C5A2B]"
//               checked={isActive}
//               onChange={(e) => setIsActive(e.target.checked)}
//             />
//             Active (visible in the store)
//           </label>
//           <label className="flex cursor-pointer items-center gap-3">
//             <input
//               type="checkbox"
//               className="h-5 w-5 cursor-pointer accent-[#9C5A2B]"
//               checked={isBestSeller}
//               onChange={(e) => setIsBestSeller(e.target.checked)}
//             />
//             Best seller
//           </label>
//           <label className="flex cursor-pointer items-center gap-3">
//             <input
//               type="checkbox"
//               className="h-5 w-5 cursor-pointer accent-[#9C5A2B]"
//               checked={showInNewArrivals}
//               onChange={(e) => setShowInNewArrivals(e.target.checked)}
//             />
//             Show in New Arrivals (for 30 days)
//           </label>
//         </div>

//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
//             <button
//               type="submit"
//               disabled={saving || uploading || uploadingMedia || deleting}
//               className="w-full cursor-pointer px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7d4720] disabled:opacity-50 sm:w-auto sm:py-3"
//               style={{ background: COPPER }}
//             >
//               {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
//             </button>
//             <Link
//               href="/admin/products"
//               className="cursor-pointer py-2 text-center text-[12px] uppercase tracking-[0.18em] underline underline-offset-4"
//             >
//               Cancel
//             </Link>
//           </div>

//           {editing && (
//             <button
//               type="button"
//               onClick={onDeleteProduct}
//               disabled={saving || deleting}
//               className="cursor-pointer border border-[#A32A1F] bg-transparent px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#A32A1F] transition-colors hover:bg-[#A32A1F]/10 disabled:opacity-50 sm:py-2.5"
//             >
//               {deleting ? "Deleting…" : "Delete product"}
//             </button>
//           )}
//         </div>
//       </form>
//     </>
//   );
// }




"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FRAGRANCE_FAMILIES } from "@/lib/validations/product";
import { SHOP_SECTIONS, COLLECTION_SECTIONS } from "@/lib/sections";
import MultiSelect from "@/components/MultiSelect";
import AlertModal from "@/components/admin/AlertModal";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const MAX_IMAGES = 10;
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB client check
const COMPRESS_TARGET = 3 * 1024 * 1024; // auto-compress images above 3 MB

// Resize + JPEG-compress an image client-side so it easily fits within Vercel's 4.5 MB body limit.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= COMPRESS_TARGET) return file;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_SIDE = 1920;
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_SIDE || h > MAX_SIDE) {
        if (w > h) {
          h = Math.round((h * MAX_SIDE) / w);
          w = MAX_SIDE;
        } else {
          w = Math.round((w * MAX_SIDE) / h);
          h = MAX_SIDE;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export type ProductData = {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number; // paise
  salePrice: number | null; // paise
  category: string;
  images: string[];
  video: string; // stores hover flip image URL or ""
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  sections?: string[];
  collections?: string[];
  showInNewArrivals?: boolean;
  sizePrices?: Record<string, number>; // size -> price in paise
  pricingMethod?: "manual" | "percentage";
  baseSize?: number | null;
  basePrice?: number | null;
  sizeIncrement?: number | null;
  percentageIncrease?: number | null;
  priceOverrides?: Record<string, number> | null;
};

type CardMedia = "none" | "image";

const toRupees = (paise: number) => String(paise / 100);

function Thumb({ url, onClick }: { url: string; onClick?: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        onClick={onClick}
        className="flex aspect-square w-full cursor-pointer items-center justify-center bg-[#F3E7D5] px-2 text-center text-[11px] text-black/60 hover:opacity-85"
      >
        Click to view
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="Thumbnail"
      title="Click to view details"
      onClick={onClick}
      onError={() => setFailed(true)}
      className={`aspect-square w-full bg-[#F3E7D5] object-cover transition-opacity ${
        onClick ? "cursor-pointer hover:opacity-85" : ""
      }`}
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

  // Percentage increase for each subsequent bottle size
  const [percentageIncrease, setPercentageIncrease] = useState<string>(
    product?.percentageIncrease != null ? String(product.percentageIncrease) : "10"
  );

  // Live preview helpers
  const pctNum = Number(percentageIncrease) || 0;
  const priceNum = parseFloat(price) || 0;
  const saleNum = parseFloat(salePrice) || 0;
  const baseCost = saleNum > 0 ? saleNum : priceNum;

  const preview15 = baseCost > 0 ? (pctNum > 0 ? Math.round(baseCost * (1 + pctNum / 100)) : Math.round(baseCost * 1.35)) : 0;
  const preview30 = baseCost > 0 ? (pctNum > 0 ? Math.round(preview15 * (1 + pctNum / 100)) : Math.round(baseCost * 2.25)) : 0;
  const preview50 = baseCost > 0 ? (pctNum > 0 ? Math.round(preview30 * (1 + pctNum / 100)) : Math.round(baseCost * 3.4)) : 0;
  const preview100 = baseCost > 0 ? (pctNum > 0 ? Math.round(preview50 * (1 + pctNum / 100)) : Math.round(baseCost * 5.6)) : 0;
  const [images, setImages] = useState<string[]>(product?.images ?? []);

  // Card hover image: either "none" or "image" (stored in product.video column, ignoring any legacy .mp4/.webm videos)
  const isLegacyVideo = Boolean(product?.video && /\.(mp4|webm|mov)(\?.*)?$/i.test(product.video));
  const initialHoverImage = isLegacyVideo ? "" : (product?.video ?? "");
  const [media, setMedia] = useState(initialHoverImage);
  const [mediaType, setMediaType] = useState<CardMedia>(!initialHoverImage ? "none" : "image");

  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false);

  const [sections, setSections] = useState<string[]>(
    (product?.sections ?? ["shop-all"]).filter((s) => s !== "new-arrivals")
  );
  const [collections, setCollections] = useState<string[]>(product?.collections ?? []);
  const [showInNewArrivals, setShowInNewArrivals] = useState(product?.showInNewArrivals ?? true);

  const [error, setError] = useState("");
  const [alertData, setAlertData] = useState<{
    open: boolean;
    title?: string;
    message: string;
    type?: "info" | "error" | "success";
  }>({
    open: false,
    message: "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Used only for actual errors
  function showAlert(message: string, type: "info" | "error" | "success" = "error", title?: string) {
    setError(type === "error" ? message : "");
    setAlertData({ open: true, message, type, title });
  }

  async function uploadOne(file: File): Promise<string> {
    const body = new FormData();
    body.append("files", file);

    const res = await fetch("/api/admin/uploads", { method: "POST", body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || "Upload failed.");
    }
    const url = (json.urls as string[])?.[0];
    if (!url) throw new Error("Server returned no URL for uploaded file.");
    return url;
  }

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const picked = Array.from(input.files ?? []);
    input.value = "";
    if (picked.length === 0) return;

    setError("");
    if (images.length + picked.length > MAX_IMAGES) {
      showAlert(`A product can have at most ${MAX_IMAGES} images.`, "error");
      return;
    }

    const tooBig = picked.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      showAlert(`${tooBig.name} is too large. Please select a file under 4 MB.`, "error");
      return;
    }

    setUploading(true);
    try {
      const compressed = await Promise.all(picked.map((f) => compressImage(f)));
      const results: string[] = [];
      for (const f of compressed) {
        const u = await uploadOne(f);
        results.push(u);
      }
      setImages((prev) => [...prev, ...results]);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Upload failed.", "error");
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

  function changeMediaType(t: CardMedia) {
    if (t === mediaType) return;
    setMediaType(t);
    setMedia("");
    setError("");
  }

  async function onPickMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file || mediaType === "none") return;

    setError("");
    if (file.size > MAX_BYTES) {
      showAlert(`${file.name} is larger than 4 MB. Please select a smaller image.`, "error");
      return;
    }

    setUploadingMedia(true);
    try {
      const ready = await compressImage(file);
      const url = await uploadOne(ready);
      setMedia(url);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Upload failed.", "error");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function onDeleteProduct() {
    if (!product?.id) return;
    if (
      !window.confirm(
        `Delete "${product.name}" permanently?\n\nThis will remove the product, reviews, and cart entries. This cannot be undone.`
      )
    )
      return;

    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}?permanent=true`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Could not delete product.");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Could not delete product.", "error");
      setDeleting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (uploading || uploadingMedia) {
      showAlert("Please wait for file uploads to finish before saving.", "info");
      return;
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      showAlert("Enter a valid price in rupees.", "error");
      return;
    }
    const pricePaise = Math.round(priceNum * 100);

    let salePaise: number | null = null;
    if (salePrice.trim() !== "") {
      const s = Number(salePrice);
      if (!Number.isFinite(s) || s <= 0) {
        showAlert("Enter a valid sale price in rupees, or leave it empty.", "error");
        return;
      }
      salePaise = Math.round(s * 100);
      if (salePaise >= pricePaise) {
        showAlert("Sale price must be lower than the original price.", "error");
        return;
      }
    }

    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      showAlert("Stock must be a whole number, 0 or more.", "error");
      return;
    }

    const pct = Number(percentageIncrease) || 0;
    if (percentageIncrease.trim() !== "" && (!Number.isFinite(pct) || pct < 0)) {
      showAlert("Enter a valid percentage increase (0 or more).", "error");
      return;
    }

    const base10mlPaise = salePaise ?? pricePaise;
    const r = pct / 100;
    let sizePricesPaise: Record<string, number>;

    if (pct > 0) {
      const p10 = base10mlPaise;
      const p15 = Math.round(p10 * (1 + r));
      const p30 = Math.round(p15 * (1 + r));
      const p50 = Math.round(p30 * (1 + r));
      const p100 = Math.round(p50 * (1 + r));
      const p5 = Math.round(p10 / (1 + r));
      sizePricesPaise = {
        "5ml": p5,
        "10ml": p10,
        "15ml": p15,
        "30ml": p30,
        "50ml": p50,
        "100ml": p100,
      };
    } else {
      sizePricesPaise = {
        "5ml": Math.round((base10mlPaise / 100) * 0.65) * 100,
        "10ml": base10mlPaise,
        "15ml": Math.round((base10mlPaise / 100) * 1.35) * 100,
        "30ml": Math.round((base10mlPaise / 100) * 2.25) * 100,
        "50ml": Math.round((base10mlPaise / 100) * 3.4) * 100,
        "100ml": Math.round((base10mlPaise / 100) * 5.6) * 100,
      };
    }

    if (images.length === 0) {
      showAlert("Add at least one product image before saving.", "error");
      return;
    }

    if (mediaType === "image" && !media) {
      showAlert("Upload the hover flip image, or select 'No hover image'.", "error");
      return;
    }

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
      pricingMethod: "percentage",
      sizePrices: sizePricesPaise,
      baseSize: 10,
      basePrice: base10mlPaise,
      sizeIncrement: 10,
      percentageIncrease: pct,
      priceOverrides: null,
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
      showAlert(err instanceof Error ? err.message : "Could not save the product.", "error");
      setSaving(false);
    }
  }

  const input =
    "w-full border border-black/10 bg-white px-3 py-3 text-[16px] outline-none focus:border-black/40 sm:py-2.5 sm:text-[14px]";
  const label = "mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/55 cursor-pointer";
  const filePicker =
    "block w-full text-[14px] cursor-pointer file:cursor-pointer file:mr-4 file:border-0 file:bg-[#F3E7D5] file:px-4 file:py-3 file:text-[12px] file:font-semibold file:uppercase file:tracking-[0.15em] file:text-[#111] disabled:opacity-50 sm:file:py-2.5";
  const smallLink = "px-1 py-2 underline underline-offset-4 cursor-pointer";
  const hint = "m-0 mb-3 text-[13px] leading-relaxed text-black/55";

  const mediaOptions: { value: CardMedia; title: string; text: string }[] = [
    { value: "none", title: "No hover image", text: "The card shows only the main product image." },
    { value: "image", title: "Hover flip image", text: "The card flips to this image when hovered or viewed." },
  ];

  return (
    <>
      {/* ── Custom Alert Modal Box (Only for Errors) ───────────────── */}
      <AlertModal
        open={alertData.open}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        onClose={() => setAlertData((prev) => ({ ...prev, open: false }))}
      />

      {/* ── Image Details / Preview Modal ────────────────────────────── */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image details"
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col border border-black/10 bg-[#FCF8F0] p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center bg-white/80 text-black/60 transition-colors hover:text-black"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <h3 className="m-0 mb-3 text-2xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
              Image details
            </h3>
            <div className="flex max-h-[60vh] items-center justify-center overflow-hidden border border-black/10 bg-[#F3E7D5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="max-h-[58vh] w-auto max-w-full object-contain" />
            </div>
            <div className="mt-4 flex flex-col gap-2 text-[13px] text-black/70">
              <p className="m-0 break-all font-mono text-[12px] text-black/60">
                <strong>Path:</strong> {previewUrl}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    makeMain(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="cursor-pointer border border-[#9C5A2B] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9C5A2B] transition-colors hover:bg-[#9C5A2B]/10"
                >
                  Make Main Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeImage(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="cursor-pointer border border-red-300 bg-red-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-red-800 transition-colors hover:bg-red-100"
                >
                  Remove Image
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="cursor-pointer border border-black/20 bg-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-black/60 transition-colors hover:bg-black/5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <label className={label} htmlFor="name">
            Name
          </label>
          <input id="name" className={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="brand">
              Brand
            </label>
            <input id="brand" className={input} value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className={`${input} cursor-pointer`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {FRAGRANCE_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
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
          <label className={label} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className={input}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="price">
              Price (₹) <span className="normal-case text-black/40">(10ml Original / MRP)</span>
            </label>
            <input
              id="price"
              inputMode="decimal"
              className={input}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 1499"
              required
            />
          </div>
          <div>
            <label className={label} htmlFor="salePrice">
              Sale price (₹) <span className="normal-case text-black/40">(10ml Cost / Selling price)</span>
            </label>
            <input
              id="salePrice"
              inputMode="decimal"
              className={input}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="Optional, e.g. 1299"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="percentageIncrease">
              Bottle Size Price Increase (%)
            </label>
            <input
              id="percentageIncrease"
              type="number"
              min="0"
              step="0.5"
              className={input}
              value={percentageIncrease}
              onChange={(e) => setPercentageIncrease(e.target.value)}
              placeholder="10"
            />
            <p className="mt-1.5 text-[12px] text-black/55">
              Each subsequent bottle size (15ml, 30ml, 50ml, 100ml) increases in price by this % from the 10ml price.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className={label} htmlFor="stock">
                Stock Quantity
              </label>
              {Number(stock) <= 0 ? (
                <span className="mb-2 text-[11px] font-semibold text-red-600">● Out of stock</span>
              ) : Number(stock) <= 5 ? (
                <span className="mb-2 text-[11px] font-semibold text-amber-600">● Low stock</span>
              ) : (
                <span className="mb-2 text-[11px] font-semibold text-green-600">● In stock</span>
              )}
            </div>
            <input
              id="stock"
              type="number"
              min="0"
              step="1"
              className={input}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              required
            />
            {/* Quick stock / unstock toggles */}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStock(Number(stock) > 0 ? stock : "10")}
                className={`cursor-pointer rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  Number(stock) > 0
                    ? "border-green-600 bg-green-50 text-green-800"
                    : "border-black/20 text-black/60 hover:bg-black/[0.04]"
                }`}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => setStock("0")}
                className={`cursor-pointer rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  Number(stock) <= 0
                    ? "border-red-600 bg-red-50 text-red-800"
                    : "border-black/20 text-black/60 hover:bg-black/[0.04]"
                }`}
              >
                Out of Stock (Unstock)
              </button>
            </div>
          </div>
        </div>

        {/* Live calculated bottle sizes preview */}
        {baseCost > 0 && (
          <div className="border border-black/10 bg-[#FCF8F0] p-4 text-xs text-black/75">
            <div className="font-semibold uppercase tracking-wider text-[#9C5A2B]">
              Calculated Bottle Prices ({pctNum}% increase per size):
            </div>
            <div className="mt-2 flex flex-wrap gap-2.5 font-mono text-[13px]">
              <span className="rounded border border-black/10 bg-white px-2.5 py-1">
                10ml: <strong>₹{baseCost}</strong>
              </span>
              <span className="rounded border border-black/10 bg-white px-2.5 py-1">
                15ml: <strong>₹{preview15}</strong> (+{pctNum}%)
              </span>
              <span className="rounded border border-black/10 bg-white px-2.5 py-1">
                30ml: <strong>₹{preview30}</strong> (+{pctNum}%)
              </span>
              <span className="rounded border border-black/10 bg-white px-2.5 py-1">
                50ml: <strong>₹{preview50}</strong> (+{pctNum}%)
              </span>
              <span className="rounded border border-black/10 bg-white px-2.5 py-1">
                100ml: <strong>₹{preview100}</strong> (+{pctNum}%)
              </span>
            </div>
          </div>
        )}

        {/* 1. Product images (many) */}
        <div>
          <label className={label} htmlFor="imageFiles">
            Product images (JPG, PNG or WebP, auto-compressed, up to {MAX_IMAGES})
          </label>
          <p className={hint}>
            The <strong>Main</strong> image is the thumbnail on the product card. Click any image to view details.
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
          {uploading && (
            <p className="mb-0 mt-2 text-[13px] font-medium text-[#9C5A2B]">
              Uploading images…
            </p>
          )}

          {images.length > 0 && (
            <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {images.map((url, i) => (
                <li key={url} className="border border-black/10">
                  <Thumb url={url} onClick={() => setPreviewUrl(url)} />
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

        {/* 2. Card hover flip image (optional) */}
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className={label}>Card hover image (optional)</legend>
          <p className={hint}>
            Choose whether the product card flips to a second image when hovered on desktop or scrolled into view on mobile.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
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
                      className="h-4 w-4 cursor-pointer accent-[#9C5A2B]"
                    />
                    {o.title}
                  </span>
                  <span className="text-[12px] leading-snug text-black/55">{o.text}</span>
                </label>
              );
            })}
          </div>

          {mediaType === "image" && (
            <div className="mt-4">
              <label className={label} htmlFor="mediaFile">
                Hover flip image (JPG, PNG or WebP, auto-compressed)
              </label>
              <input
                id="mediaFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingMedia}
                onChange={onPickMedia}
                className={filePicker}
              />
              {uploadingMedia && (
                <p className="mb-0 mt-2 text-[13px] font-medium text-[#9C5A2B]">
                  Uploading hover image…
                </p>
              )}

              {media && (
                <div className="mt-4 w-full max-w-[12rem] border border-black/10">
                  <Thumb url={media} onClick={() => setPreviewUrl(media)} />
                  <div className="px-2 py-1 text-[11px] uppercase tracking-[0.12em]">
                    <button type="button" onClick={() => setMedia("")} className={smallLink}>
                      Remove hover image
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </fieldset>

        <div className="flex flex-col gap-4 text-[14px] sm:flex-row sm:flex-wrap sm:gap-8">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 cursor-pointer accent-[#9C5A2B]"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active (visible in the store)
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 cursor-pointer accent-[#9C5A2B]"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
            />
            Best seller
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 cursor-pointer accent-[#9C5A2B]"
              checked={showInNewArrivals}
              onChange={(e) => setShowInNewArrivals(e.target.checked)}
            />
            Show in New Arrivals (for 30 days)
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={saving || uploading || uploadingMedia || deleting}
              className="w-full cursor-pointer px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7d4720] disabled:opacity-50 sm:w-auto sm:py-3"
              style={{ background: COPPER }}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
            </button>
            <Link
              href="/admin/products"
              className="cursor-pointer py-2 text-center text-[12px] uppercase tracking-[0.18em] underline underline-offset-4"
            >
              Cancel
            </Link>
          </div>

          {editing && (
            <button
              type="button"
              onClick={onDeleteProduct}
              disabled={saving || deleting}
              className="cursor-pointer border border-[#A32A1F] bg-transparent px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#A32A1F] transition-colors hover:bg-[#A32A1F]/10 disabled:opacity-50 sm:py-2.5"
            >
              {deleting ? "Deleting…" : "Delete product"}
            </button>
          )}
        </div>
      </form>
    </>
  );
}