import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20 MB

// Looks at the first bytes of the file to find its real type.
export function detectImageType(buf: Buffer): "jpg" | "png" | "webp" | null {
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
  return null;
}

export function detectVideoType(buf: Buffer): "mp4" | "webm" | null {
  // MP4 files have the word "ftyp" at byte 4.
  if (buf.length >= 12 && buf.subarray(4, 8).toString("ascii") === "ftyp") return "mp4";
  // WebM files start with these four bytes.
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3)
    return "webm";
  return null;
}