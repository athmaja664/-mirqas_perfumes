import path from "node:path";
import os from "node:os";

// On Vercel, process.cwd() is read-only (/var/task). /tmp is writable.
// On a local/VPS server with persistent disk, use process.cwd()/uploads/products.
export const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads", "products")
  : path.join(process.cwd(), "uploads", "products");

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30 MB (supported via chunking)

// Looks at the first bytes of the file to find its real type.
export function detectImageType(buf: Buffer, fallbackName?: string): "jpg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";

  const ext = (fallbackName || "").split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png") return "png";
  if (ext === "webp") return "webp";

  return null;
}

export function detectVideoType(
  buf: Buffer,
  fallbackName?: string,
  mimeType?: string
): "mp4" | "webm" | null {
  const header = buf.subarray(0, Math.min(buf.length, 256));

  // MP4 files contain "ftyp" in the initial box header
  if (header.includes(Buffer.from("ftyp")) || header.includes(Buffer.from("moov")) || header.includes(Buffer.from("mdat"))) {
    return "mp4";
  }

  // WebM files start with standard EBML 1A 45 DF A3
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return "webm";
  }

  // Fallback to extension or MIME type
  const ext = (fallbackName || "").split(".").pop()?.toLowerCase();
  if (ext === "mp4" || ext === "m4v" || ext === "mov" || mimeType?.includes("mp4") || mimeType?.includes("quicktime")) {
    return "mp4";
  }
  if (ext === "webm" || mimeType?.includes("webm")) {
    return "webm";
  }

  return null;
}
