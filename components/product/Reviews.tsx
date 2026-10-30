"use client";

// Star rating summary (under the description) and the customer reviews section.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const COPPER = "#9C5A2B";
const INK = "#111111";
const MUTED = "rgba(17,17,17,0.6)";
const CARD_LINE = "#EADFCC";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

const REVIEWS_EVENT = "mirqas-reviews-changed";
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

type Summary = { average: number; count: number; distribution: Record<string, number> };

type ReviewItem = {
  id: string;
  name: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  video: string;
  createdAt: string;
  mine: boolean;
};

type ReviewsResponse = {
  summary: Summary;
  reviews: ReviewItem[];
  page: number;
  pages: number;
  signedIn: boolean;
  hasReviewed: boolean;
};

const reviewsUrl = (slug: string, page = 1) =>
  `/api/products/slug/${encodeURIComponent(slug)}/reviews?page=${page}`;

// ---------------------------------------------------------------------------
// Stars (can show decimals like 4.6)
// ---------------------------------------------------------------------------
const STAR_PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  const row = (color: string) => (
    <span className="flex" style={{ width: size * 5 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );

  return (
    <span
      className="relative inline-block align-middle"
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {row("#E5D9C6")}
      <span className="absolute left-0 top-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row(COPPER)}
      </span>
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={value === n}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <svg viewBox="0 0 24 24" width="30" height="30" fill={n <= shown ? COPPER : "#E5D9C6"} aria-hidden>
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overall rating, shown under the description
// ---------------------------------------------------------------------------
export function RatingSummary({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const load = () =>
      fetch(reviewsUrl(slug), { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<ReviewsResponse>) : null))
        .then((d) => {
          if (!cancelled && d) setSummary(d.summary);
        })
        .catch(() => {
          // the rating is optional: show nothing if it fails
        });

    load();
    window.addEventListener(REVIEWS_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(REVIEWS_EVENT, load);
    };
  }, [slug]);

  if (!summary) return null;

  if (summary.count === 0) {
    return (
      <a href="#reviews" className="mt-5 flex items-center gap-2 text-sm hover:text-[#9C5A2B]" style={{ color: MUTED }}>
        <Stars value={0} size={18} />
        <span>No reviews yet. Be the first to review</span>
      </a>
    );
  }

  return (
    <a href="#reviews" className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 hover:opacity-80">
      <span className="text-lg font-semibold" style={{ color: INK }}>
        {summary.average.toFixed(1)}
      </span>
      <Stars value={summary.average} size={20} />
      <span className="text-sm underline underline-offset-4" style={{ color: MUTED }}>
        {summary.count} {summary.count === 1 ? "rating" : "ratings"}
      </span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Review form
// ---------------------------------------------------------------------------
type Picked = { file: File; url: string };

function ReviewForm({ slug, onDone }: { slug: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [video, setVideo] = useState<Picked | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Remember the preview links so they can be cleaned up when the form closes
  const previewsRef = useRef<string[]>([]);
  useEffect(() => {
    previewsRef.current = [...photos.map((p) => p.url), ...(video ? [video.url] : [])];
  }, [photos, video]);
  useEffect(() => {
    return () => previewsRef.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const picked = Array.from(input.files ?? []);
    input.value = "";
    if (picked.length === 0) return;

    setError("");
    if (photos.length + picked.length > MAX_PHOTOS) return setError(`You can add up to ${MAX_PHOTOS} photos.`);
    const tooBig = picked.find((f) => f.size > MAX_PHOTO_BYTES);
    if (tooBig) return setError(`${tooBig.name} is larger than 5 MB.`);

    setPhotos((prev) => [...prev, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  function removePhoto(url: string) {
    URL.revokeObjectURL(url);
    setPhotos((prev) => prev.filter((p) => p.url !== url));
  }

  function onPickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setError("");
    if (file.size > MAX_VIDEO_BYTES) return setError(`${file.name} is larger than 20 MB.`);
    if (video) URL.revokeObjectURL(video.url);
    setVideo({ file, url: URL.createObjectURL(file) });
  }

  function removeVideo() {
    if (video) URL.revokeObjectURL(video.url);
    setVideo(null);
  }

  async function upload(files: File[], kind: "image" | "video") {
    const body = new FormData();
    if (kind === "video") body.append("kind", "video");
    files.forEach((f) => body.append("files", f));
    const res = await fetch("/api/reviews/uploads", { method: "POST", body });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Upload failed.");
    return json.urls as string[];
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (rating < 1) return setError("Please choose a star rating.");
    if (comment.trim().length < 5) return setError("Please write at least 5 characters in your review.");

    setSending(true);
    try {
      const images = photos.length ? await upload(photos.map((p) => p.file), "image") : [];
      const videoUrl = video ? (await upload([video.file], "video"))[0] : "";

      const res = await fetch(`/api/products/slug/${encodeURIComponent(slug)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title: title.trim(), comment: comment.trim(), images, video: videoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Could not save your review.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your review.");
      setSending(false);
    }
  }

  const field =
    "w-full rounded-[6px] border bg-white px-3 py-3 text-[16px] outline-none transition-colors focus:border-[#9C5A2B] sm:text-[14px]";
  const label = "mb-2 block text-[11px] font-medium uppercase tracking-[0.16em]";
  const filePicker =
    "block w-full text-[13px] file:mr-3 file:rounded-[6px] file:border file:border-[#9C5A2B] file:bg-white file:px-4 file:py-2 file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.12em] file:text-[#9C5A2B] hover:file:bg-[#9C5A2B] hover:file:text-white disabled:opacity-50";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 grid gap-5 rounded-[14px] border bg-white p-4 sm:p-6"
      style={{ borderColor: CARD_LINE }}
    >
      <h3 className="m-0 text-2xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
        Write a review
      </h3>

      {error && (
        <p role="alert" className="m-0 rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {error}
        </p>
      )}

      <div>
        <span className={label} style={{ color: MUTED }}>
          Your rating
        </span>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="rv-title" className={label} style={{ color: MUTED }}>
          Title (optional)
        </label>
        <input
          id="rv-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className={field}
          style={{ borderColor: CARD_LINE }}
          placeholder="Sum it up in a few words"
        />
      </div>

      <div>
        <label htmlFor="rv-comment" className={label} style={{ color: MUTED }}>
          Your review
        </label>
        <textarea
          id="rv-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={5}
          className={field}
          style={{ borderColor: CARD_LINE }}
          placeholder="How does it smell? How long does it last?"
        />
      </div>

      <div>
        <label htmlFor="rv-photos" className={label} style={{ color: MUTED }}>
          Add photos (JPG, PNG or WebP, max 5 MB each, up to {MAX_PHOTOS})
        </label>
        <input
          id="rv-photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={sending || photos.length >= MAX_PHOTOS}
          onChange={onPickPhotos}
          className={filePicker}
        />
        {photos.length > 0 && (
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-3 p-0">
            {photos.map((p) => (
              <li key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-20 w-20 rounded-[10px] border object-cover" style={{ borderColor: CARD_LINE }} />
                <button
                  type="button"
                  onClick={() => removePhoto(p.url)}
                  aria-label="Remove photo"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[14px] leading-none shadow"
                  style={{ color: COPPER }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="rv-video" className={label} style={{ color: MUTED }}>
          Add a video (MP4 or WebM, max 20 MB, optional)
        </label>
        <input
          id="rv-video"
          type="file"
          accept="video/mp4,video/webm"
          disabled={sending}
          onChange={onPickVideo}
          className={filePicker}
        />
        {video && (
          <div className="relative mt-3 inline-block">
            <video
              src={video.url}
              controls
              muted
              playsInline
              className="h-32 w-auto max-w-full rounded-[10px] border bg-black"
              style={{ borderColor: CARD_LINE }}
            />
            <button
              type="button"
              onClick={removeVideo}
              aria-label="Remove video"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[14px] leading-none shadow"
              style={{ color: COPPER }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-[6px] px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#7d4720] disabled:cursor-wait disabled:opacity-70"
          style={{ background: COPPER }}
        >
          {sending && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {sending ? "Sending" : "Submit review"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// The whole reviews section
// ---------------------------------------------------------------------------
export default function ProductReviews({ slug }: { slug: string }) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(reviewsUrl(slug), { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const d = (await res.json()) as ReviewsResponse;
      setData(d);
      setReviews(d.reviews);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) load();
  }, [slug, load]);

  // Close the big photo with the Escape key
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  async function showMore() {
    if (!data || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(reviewsUrl(slug, data.page + 1), { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const d = (await res.json()) as ReviewsResponse;
      setReviews((prev) => [...prev, ...d.reviews.filter((r) => !prev.some((p) => p.id === r.id))]);
      setData({ ...data, page: d.page, pages: d.pages });
    } catch {
      // keep what is already shown
    } finally {
      setLoadingMore(false);
    }
  }

  async function afterChange() {
    setFormOpen(false);
    await load();
    window.dispatchEvent(new Event(REVIEWS_EVENT)); // updates the stars under the description
  }

  async function deleteMine() {
    if (!window.confirm("Delete your review?")) return;
    try {
      await fetch(`/api/products/slug/${encodeURIComponent(slug)}/reviews`, { method: "DELETE" });
    } finally {
      afterChange();
    }
  }

  const summary = data?.summary;

  return (
    <section id="reviews" className="scroll-mt-24 border-t pt-10" style={{ borderColor: "rgba(156,90,43,0.25)" }}>
      <h2 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
        Customer reviews
      </h2>

      {loadError && (
        <p className="mt-4 text-sm" style={{ color: MUTED }}>
          Could not load the reviews. Please refresh the page.
        </p>
      )}

      {!data && !loadError && (
        <p className="mt-4 text-sm" style={{ color: MUTED }}>
          Loading reviews…
        </p>
      )}

      {data && summary && (
        <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-12">
          {/* Left: overall rating + write a review */}
          <div>
            <div className="flex items-center gap-4">
              <span className="text-5xl font-semibold leading-none" style={{ color: INK }}>
                {summary.count ? summary.average.toFixed(1) : "–"}
              </span>
              <div>
                <Stars value={summary.average} size={22} />
                <p className="m-0 mt-1 text-sm" style={{ color: MUTED }}>
                  {summary.count} {summary.count === 1 ? "rating" : "ratings"}
                </p>
              </div>
            </div>

            <ul className="m-0 mt-5 grid list-none gap-2 p-0">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = summary.distribution[String(n)] ?? 0;
                const pct = summary.count ? (count / summary.count) * 100 : 0;
                return (
                  <li key={n} className="flex items-center gap-3 text-[13px]">
                    <span className="w-12 shrink-0" style={{ color: INK }}>
                      {n} star
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EADFCC]">
                      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: COPPER }} />
                    </span>
                    <span className="w-8 shrink-0 text-right" style={{ color: MUTED }}>
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6">
              {!data.signedIn ? (
                <p className="m-0 text-sm" style={{ color: MUTED }}>
                  <Link href="/login" className="font-semibold underline underline-offset-4" style={{ color: COPPER }}>
                    Log in
                  </Link>{" "}
                  to write a review.
                </p>
              ) : data.hasReviewed ? (
                <p className="m-0 text-sm" style={{ color: MUTED }}>
                  You have already reviewed this product.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setFormOpen((v) => !v)}
                  aria-expanded={formOpen}
                  className="rounded-[6px] border border-[#9C5A2B] px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[#9C5A2B] transition hover:bg-[#9C5A2B] hover:text-white"
                >
                  {formOpen ? "Close" : "Write a review"}
                </button>
              )}
            </div>
          </div>

          {/* Right: form + the reviews */}
          <div className="min-w-0">
            {formOpen && data.signedIn && !data.hasReviewed && <ReviewForm slug={slug} onDone={afterChange} />}

            {reviews.length === 0 ? (
              <p className="m-0 mt-2 text-sm" style={{ color: MUTED }}>
                No reviews yet. Be the first to share what you think.
              </p>
            ) : (
              <ul className="m-0 mt-2 grid list-none gap-0 p-0">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b py-6 first:pt-2" style={{ borderColor: CARD_LINE }}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Stars value={r.rating} size={16} />
                      <span className="text-sm font-semibold" style={{ color: INK }}>
                        {r.name}
                      </span>
                      {r.mine && (
                        <span
                          className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
                          style={{ background: COPPER }}
                        >
                          Your review
                        </span>
                      )}
                      <span className="text-xs" style={{ color: MUTED }}>
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {r.title && (
                      <p className="m-0 mt-2 text-[15px] font-semibold" style={{ color: INK }}>
                        {r.title}
                      </p>
                    )}
                    <p className="m-0 mt-1 whitespace-pre-line text-sm leading-relaxed" style={{ color: "rgba(17,17,17,0.8)" }}>
                      {r.comment}
                    </p>

                    {(r.images.length > 0 || r.video) && (
                      <div className="mt-3 flex flex-wrap items-start gap-3">
                        {r.images.map((src) => (
                          <button
                            key={src}
                            type="button"
                            onClick={() => setZoom(src)}
                            aria-label="Open photo"
                            className="overflow-hidden rounded-[10px] border transition hover:opacity-90"
                            style={{ borderColor: CARD_LINE }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Customer photo" className="h-24 w-24 object-cover" />
                          </button>
                        ))}
                        {r.video && (
                          <video
                            src={r.video}
                            controls
                            preload="metadata"
                            playsInline
                            className="h-24 w-auto max-w-full rounded-[10px] border bg-black"
                            style={{ borderColor: CARD_LINE }}
                          />
                        )}
                      </div>
                    )}

                    {r.mine && (
                      <button
                        type="button"
                        onClick={deleteMine}
                        className="mt-3 text-xs underline underline-offset-4 transition-colors hover:text-[#7d4720]"
                        style={{ color: COPPER }}
                      >
                        Delete my review
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {data.page < data.pages && (
              <button
                type="button"
                onClick={showMore}
                disabled={loadingMore}
                className="mt-6 rounded-[6px] border border-[#9C5A2B] px-8 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[#9C5A2B] transition hover:bg-[#9C5A2B] hover:text-white disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Show more reviews"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Big photo */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Customer photo" className="max-h-full max-w-full rounded-[10px] object-contain" />
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label="Close photo"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl"
            style={{ color: COPPER }}
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}