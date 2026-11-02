import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { UPLOAD_DIR } from "@/lib/uploads";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

type Ctx = { params: Promise<{ name: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { name } = await params;

  // Only names we generated are allowed, which also blocks ../ tricks.
  const match = /^[a-f0-9]{32}\.(jpg|png|webp|mp4|webm)$/.exec(name);
  if (!match) return new NextResponse("Not found", { status: 404 });

  let file: Buffer | null = null;

  // Search primary UPLOAD_DIR, then fallback paths (/tmp or process.cwd())
  const candidatePaths = [
    path.join(UPLOAD_DIR, name),
    path.join(os.tmpdir(), "uploads", "products", name),
    path.join(process.cwd(), "uploads", "products", name),
  ];

  for (const p of candidatePaths) {
    try {
      file = await readFile(p);
      break;
    } catch {
      // continue to next path
    }
  }

  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": TYPES[match[1]] || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };

  // Browsers ask for a piece of a video ("Range: bytes=0-"). Answer with just that piece.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const size = file.length;
    let start: number;
    let end: number;
    if (range[1] === "") {
      start = Math.max(0, size - Number(range[2]));
      end = size - 1;
    } else {
      start = Number(range[1]);
      end = range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
    }
    if (start >= size || start > end) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new NextResponse(new Uint8Array(file.subarray(start, end + 1)), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  return new NextResponse(new Uint8Array(file), {
    headers: { ...headers, "Content-Length": String(file.length) },
  });
}
