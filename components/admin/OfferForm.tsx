"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AlertModal from "@/components/admin/AlertModal";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

const STANDARD_SIZES = ["10ml", "15ml", "30ml", "50ml", "100ml"] as const;

export type ProductOption = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number; // paise
};

export type OfferInitialData = {
  id?: string;
  title: string;
  description: string;
  offerType: "quantity" | "percentage" | "fixed";
  offerPrice?: number | null; // paise
  discountValue?: number | null;
  requiredQuantity: number;
  eligibleSizes: string[];
  allowMixedVariants: boolean;
  applicableToAll: boolean;
  displayHomepage: boolean;
  displayListing: boolean;
  displayProductDetails: boolean;
  bannerImage?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: "draft" | "published" | "unpublished";
  productIds?: string[];
};

export default function OfferForm({
  initialOffer,
  productsList = [],
}: {
  initialOffer?: OfferInitialData;
  productsList?: ProductOption[];
}) {
  const router = useRouter();
  const editing = Boolean(initialOffer?.id);

  const [title, setTitle] = useState(initialOffer?.title ?? "");
  const [description, setDescription] = useState(initialOffer?.description ?? "");
  const [offerType, setOfferType] = useState<"quantity" | "percentage" | "fixed">(
    initialOffer?.offerType ?? "quantity"
  );
  const [requiredQuantity, setRequiredQuantity] = useState(
    String(initialOffer?.requiredQuantity ?? 2)
  );

  // Price in rupees
  const [offerPrice, setOfferPrice] = useState(
    initialOffer?.offerPrice != null ? String(initialOffer.offerPrice / 100) : ""
  );
  const [discountValue, setDiscountValue] = useState(
    initialOffer?.discountValue != null
      ? initialOffer.offerType === "fixed"
        ? String(initialOffer.discountValue / 100)
        : String(initialOffer.discountValue)
      : ""
  );

  const [applicableToAll, setApplicableToAll] = useState(
    initialOffer?.applicableToAll ?? false
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialOffer?.productIds ?? []
  );
  const [productSearch, setProductSearch] = useState("");

  const [eligibleSizes, setEligibleSizes] = useState<string[]>(
    initialOffer?.eligibleSizes ?? []
  );
  const [allSizes, setAllSizes] = useState(
    !initialOffer?.eligibleSizes || initialOffer.eligibleSizes.length === 0
  );
  const [allowMixedVariants, setAllowMixedVariants] = useState(
    initialOffer?.allowMixedVariants ?? true
  );

  const [displayHomepage, setDisplayHomepage] = useState(
    initialOffer?.displayHomepage ?? true
  );
  const [displayListing, setDisplayListing] = useState(
    initialOffer?.displayListing ?? true
  );
  const [displayProductDetails, setDisplayProductDetails] = useState(
    initialOffer?.displayProductDetails ?? true
  );

  const [bannerImage, setBannerImage] = useState(initialOffer?.bannerImage ?? "");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Date strings formatted for datetime-local input: YYYY-MM-DDTHH:mm
  const toLocalInputDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const [startDate, setStartDate] = useState(toLocalInputDate(initialOffer?.startDate));
  const [endDate, setEndDate] = useState(toLocalInputDate(initialOffer?.endDate));
  const [noExpiry, setNoExpiry] = useState(!initialOffer?.endDate);

  const [status, setStatus] = useState<"draft" | "published" | "unpublished">(
    initialOffer?.status ?? "published"
  );

  const [saving, setSaving] = useState(false);
  const [alertData, setAlertData] = useState<{
    open: boolean;
    title?: string;
    message: string;
    type?: "info" | "error" | "success";
  }>({
    open: false,
    message: "",
  });

  const showAlert = (message: string, type: "info" | "error" | "success" = "error", alertTitle?: string) => {
    setAlertData({ open: true, message, type, title: alertTitle });
  };

  // Toggle individual size
  const toggleSize = (s: string) => {
    if (allSizes) {
      setAllSizes(false);
      setEligibleSizes([s]);
      return;
    }
    setEligibleSizes((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  // Toggle individual product
  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle banner image upload
  const onPickBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert("Banner image must be under 5 MB.", "error");
      return;
    }

    setUploadingBanner(true);
    try {
      const body = new FormData();
      body.append("files", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed.");
      const url = json.urls?.[0];
      if (!url) throw new Error("No URL returned.");
      setBannerImage(url);
    } catch (err: unknown) {
      showAlert(err instanceof Error ? err.message : "Banner upload failed.", "error");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Form submission
  const onSubmit = async (e: React.FormEvent, overrideStatus?: "draft" | "published") => {
    e.preventDefault();

    if (!title.trim()) {
      showAlert("Please enter an offer name.", "error");
      return;
    }

    if (!applicableToAll && selectedProductIds.length === 0) {
      showAlert("Please select at least one product, or enable 'Apply to All Products'.", "error");
      return;
    }

    const reqQtyNum = Number(requiredQuantity);
    if (!Number.isInteger(reqQtyNum) || reqQtyNum < 1) {
      showAlert("Required quantity must be a whole number of at least 1.", "error");
      return;
    }

    let parsedOfferPrice: number | null = null;
    let parsedDiscountValue: number | null = null;

    if (offerType === "quantity") {
      const p = Number(offerPrice);
      if (!Number.isFinite(p) || p <= 0) {
        showAlert("Enter a valid special offer price in rupees.", "error");
        return;
      }
      parsedOfferPrice = p; // in rupees, converted on server
    } else if (offerType === "percentage") {
      const d = Number(discountValue);
      if (!Number.isFinite(d) || d <= 0 || d > 100) {
        showAlert("Enter a valid percentage discount between 1% and 100%.", "error");
        return;
      }
      parsedDiscountValue = d;
    } else if (offerType === "fixed") {
      const f = Number(discountValue);
      if (!Number.isFinite(f) || f <= 0) {
        showAlert("Enter a valid fixed discount amount in rupees.", "error");
        return;
      }
      parsedDiscountValue = f;
    }

    const finalStatus = overrideStatus || status;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      offerType,
      offerPrice: parsedOfferPrice,
      discountValue: parsedDiscountValue,
      requiredQuantity: reqQtyNum,
      eligibleSizes: allSizes ? [] : eligibleSizes,
      allowMixedVariants,
      applicableToAll,
      displayHomepage,
      displayListing,
      displayProductDetails,
      bannerImage: bannerImage.trim() || null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: noExpiry || !endDate ? null : new Date(endDate).toISOString(),
      status: finalStatus,
      productIds: applicableToAll ? [] : selectedProductIds,
    };

    setSaving(true);
    try {
      const url = editing ? `/api/admin/offers/${initialOffer!.id}` : "/api/admin/offers";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not save offer.");

      router.push("/admin/offers");
      router.refresh();
    } catch (err: unknown) {
      showAlert(err instanceof Error ? err.message : "Could not save offer.", "error");
      setSaving(false);
    }
  };

  const inputStyle =
    "w-full border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9C5A2B]";
  const labelStyle = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black/70";

  // Filter products for the selector
  const filteredProducts = productsList.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <>
      <AlertModal
        open={alertData.open}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        onClose={() => setAlertData((prev) => ({ ...prev, open: false }))}
      />

      <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/offers"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-black/60 hover:text-black"
          >
            ← Back to Offers
          </Link>
          <span className="text-xs uppercase tracking-wider text-black/40">
            {editing ? "Editing Offer" : "New Promotional Offer"}
          </span>
        </div>

        <h1 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
          {editing ? "Edit Offer" : "Create Special Offer"}
        </h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-8 border border-black/10 bg-white p-6 sm:p-8">
          {/* 1. Basic Info */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold uppercase tracking-wider text-black">
              1. General Details
            </h2>

            <div>
              <label className={labelStyle} htmlFor="offer-title">
                Offer Name *
              </label>
              <input
                id="offer-title"
                className={inputStyle}
                placeholder='e.g. "Buy 2 for ₹2599 Special Deal"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelStyle} htmlFor="offer-description">
                Offer Description
              </label>
              <textarea
                id="offer-description"
                rows={3}
                className={inputStyle}
                placeholder="e.g. Buy any two 50ml bottles from our signature collection and pay only ₹2599."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Offer Type & Pricing */}
          <div className="space-y-4 border-t border-black/10 pt-6">
            <h2 className="text-base font-semibold uppercase tracking-wider text-black">
              2. Offer Type & Special Pricing
            </h2>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  type: "quantity",
                  title: "Quantity Bundle",
                  sub: "Buy X for special price ₹Y",
                },
                {
                  type: "percentage",
                  title: "Percentage Discount",
                  sub: "X% off on purchase of Y",
                },
                {
                  type: "fixed",
                  title: "Fixed Amount Discount",
                  sub: "₹X off on purchase of Y",
                },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setOfferType(opt.type as any)}
                  className={`cursor-pointer border p-4 text-left transition-colors ${
                    offerType === opt.type
                      ? "border-[#9C5A2B] bg-[#FCF8F0] ring-1 ring-[#9C5A2B]"
                      : "border-black/15 bg-white hover:bg-black/[0.02]"
                  }`}
                >
                  <div className="text-sm font-semibold text-black">{opt.title}</div>
                  <div className="mt-1 text-xs text-black/60">{opt.sub}</div>
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <label className={labelStyle} htmlFor="required-qty">
                  Required Quantity (Bottles) *
                </label>
                <input
                  id="required-qty"
                  type="number"
                  min="1"
                  step="1"
                  className={inputStyle}
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(e.target.value)}
                  placeholder="2"
                  required
                />
                <p className="mt-1 text-[11px] text-black/50">
                  Minimum number of eligible bottles customer must add to activate offer.
                </p>
              </div>

              {offerType === "quantity" && (
                <div>
                  <label className={labelStyle} htmlFor="offer-price">
                    Special Total Price (₹) *
                  </label>
                  <input
                    id="offer-price"
                    type="number"
                    min="1"
                    step="1"
                    className={inputStyle}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="2599"
                    required
                  />
                  <p className="mt-1 text-[11px] text-black/50">
                    The combined special price customer pays for the required quantity.
                  </p>
                </div>
              )}

              {offerType === "percentage" && (
                <div>
                  <label className={labelStyle} htmlFor="discount-pct">
                    Discount Percentage (%) *
                  </label>
                  <input
                    id="discount-pct"
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    className={inputStyle}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="15"
                    required
                  />
                  <p className="mt-1 text-[11px] text-black/50">
                    Percentage deducted from the eligible bottles subtotal.
                  </p>
                </div>
              )}

              {offerType === "fixed" && (
                <div>
                  <label className={labelStyle} htmlFor="discount-fixed">
                    Discount Amount (₹) *
                  </label>
                  <input
                    id="discount-fixed"
                    type="number"
                    min="1"
                    step="1"
                    className={inputStyle}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="500"
                    required
                  />
                  <p className="mt-1 text-[11px] text-black/50">
                    Fixed rupee amount deducted from total when required quantity is met.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Product Selection */}
          <div className="space-y-4 border-t border-black/10 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold uppercase tracking-wider text-black">
                3. Eligible Product(s)
              </h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-black/80">
                <input
                  type="checkbox"
                  checked={applicableToAll}
                  onChange={(e) => setApplicableToAll(e.target.checked)}
                  className="h-4 w-4 accent-[#9C5A2B]"
                />
                Apply to ALL Products
              </label>
            </div>

            {!applicableToAll && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search products to include in this offer..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={inputStyle}
                />

                <div className="max-h-60 overflow-y-auto border border-black/15 divide-y divide-black/5">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-black/50">
                      No matching products found.
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const checked = selectedProductIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex cursor-pointer items-center justify-between p-3 transition-colors ${
                            checked ? "bg-[#FCF8F0]" : "hover:bg-black/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProduct(p.id)}
                              className="h-4 w-4 accent-[#9C5A2B]"
                            />
                            {p.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.image}
                                alt=""
                                className="h-8 w-8 object-cover border border-black/10"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-black/5 flex items-center justify-center text-[10px]">
                                —
                              </div>
                            )}
                            <span className="text-sm font-medium text-black">{p.name}</span>
                          </div>
                          <span className="text-xs text-black/55">
                            ₹{(p.price / 100).toLocaleString("en-IN")}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="text-xs text-black/60">
                  {selectedProductIds.length} product(s) selected for this offer.
                </div>
              </div>
            )}
          </div>

          {/* 4. Eligible Sizes / Variants */}
          <div className="space-y-4 border-t border-black/10 pt-6">
            <h2 className="text-base font-semibold uppercase tracking-wider text-black">
              4. Eligible Bottle Sizes (ML)
            </h2>

            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-black/80">
                <input
                  type="checkbox"
                  checked={allSizes}
                  onChange={(e) => {
                    setAllSizes(e.target.checked);
                    if (e.target.checked) setEligibleSizes([]);
                  }}
                  className="h-4 w-4 accent-[#9C5A2B]"
                />
                All Bottle Sizes Eligible
              </label>
            </div>

            {!allSizes && (
              <div className="flex flex-wrap gap-3 pt-1">
                {STANDARD_SIZES.map((s) => {
                  const checked = eligibleSizes.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSize(s)}
                      className={`cursor-pointer border px-4 py-2 text-xs font-medium transition-colors ${
                        checked
                          ? "border-[#9C5A2B] bg-[#9C5A2B] text-white"
                          : "border-black/20 bg-white text-black/80 hover:bg-black/5"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-black/80">
                <input
                  type="checkbox"
                  checked={allowMixedVariants}
                  onChange={(e) => setAllowMixedVariants(e.target.checked)}
                  className="h-4 w-4 accent-[#9C5A2B]"
                />
                Allow Mixed Variants (Customer can mix different eligible sizes or perfumes)
              </label>
              <p className="mt-1 pl-6 text-[11px] text-black/50">
                When checked, customer can satisfy the {requiredQuantity}-bottle requirement with different eligible perfumes/sizes.
              </p>
            </div>
          </div>

          {/* 5. Display Placements */}
          <div className="space-y-4 border-t border-black/10 pt-6">
            <h2 className="text-base font-semibold uppercase tracking-wider text-black">
              5. Where To Display
            </h2>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex cursor-pointer items-start gap-2.5 border border-black/10 p-3.5 hover:bg-black/[0.02]">
                <input
                  type="checkbox"
                  checked={displayHomepage}
                  onChange={(e) => setDisplayHomepage(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#9C5A2B]"
                />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-black">
                    Homepage
                  </div>
                  <div className="mt-0.5 text-[11px] text-black/55">
                    Show in Special Offers section on homepage
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 border border-black/10 p-3.5 hover:bg-black/[0.02]">
                <input
                  type="checkbox"
                  checked={displayListing}
                  onChange={(e) => setDisplayListing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#9C5A2B]"
                />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-black">
                    Product Listing Cards
                  </div>
                  <div className="mt-0.5 text-[11px] text-black/55">
                    Show SPECIAL OFFER badge on Shop All cards
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 border border-black/10 p-3.5 hover:bg-black/[0.02]">
                <input
                  type="checkbox"
                  checked={displayProductDetails}
                  onChange={(e) => setDisplayProductDetails(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#9C5A2B]"
                />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-black">
                    Product Details Page
                  </div>
                  <div className="mt-0.5 text-[11px] text-black/55">
                    Show special offer banner near size selector
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <label className={labelStyle}>Promotional Banner Image (Optional)</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer border border-black/20 bg-[#FCF8F0] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black/70 hover:bg-black/5">
                  {uploadingBanner ? "Uploading..." : "Upload Banner"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPickBanner}
                    className="hidden"
                    disabled={uploadingBanner}
                  />
                </label>
                {bannerImage && (
                  <button
                    type="button"
                    onClick={() => setBannerImage("")}
                    className="text-xs text-red-600 underline"
                  >
                    Remove Banner
                  </button>
                )}
              </div>
              {bannerImage && (
                <div className="mt-3 max-w-md overflow-hidden border border-black/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerImage} alt="Banner Preview" className="h-32 w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* 6. Validity Period & Status */}
          <div className="space-y-4 border-t border-black/10 pt-6">
            <h2 className="text-base font-semibold uppercase tracking-wider text-black">
              6. Validity Period & Publication Status
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelStyle} htmlFor="start-date">
                  Start Date & Time (Optional)
                </label>
                <input
                  id="start-date"
                  type="datetime-local"
                  className={inputStyle}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-black/50">
                  Leave empty to activate immediately upon publishing.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={labelStyle} htmlFor="end-date">
                    End Date & Time
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-black/70">
                    <input
                      type="checkbox"
                      checked={noExpiry}
                      onChange={(e) => {
                        setNoExpiry(e.target.checked);
                        if (e.target.checked) setEndDate("");
                      }}
                      className="h-3.5 w-3.5 accent-[#9C5A2B]"
                    />
                    No Expiry Date
                  </label>
                </div>
                <input
                  id="end-date"
                  type="datetime-local"
                  disabled={noExpiry}
                  className={`${inputStyle} disabled:bg-black/5 disabled:opacity-50`}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className={labelStyle}>Offer Status</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: "published", label: "Published (Active for Customers)" },
                  { value: "draft", label: "Draft (Work in progress)" },
                  { value: "unpublished", label: "Unpublished (Hidden from store)" },
                ].map((st) => (
                  <label
                    key={st.value}
                    className={`flex cursor-pointer items-center gap-2 border px-4 py-2 text-xs font-medium transition-colors ${
                      status === st.value
                        ? "border-[#9C5A2B] bg-[#FCF8F0] text-black font-semibold"
                        : "border-black/15 bg-white text-black/70 hover:bg-black/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="offer-status"
                      value={st.value}
                      checked={status === st.value}
                      onChange={() => setStatus(st.value as any)}
                      className="accent-[#9C5A2B]"
                    />
                    {st.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 7. Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-6">
            <Link
              href="/admin/offers"
              className="border border-black/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black/70 hover:bg-black/5"
            >
              Cancel
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={(e) => onSubmit(e, "draft")}
                className="cursor-pointer border border-black/20 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition-colors hover:bg-black/5 disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer bg-[#9C5A2B] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FFF9F3] transition-colors hover:bg-[#834920] disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Update Offer" : "Publish Offer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

