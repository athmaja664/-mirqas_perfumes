import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { initMediaUpload } from "@/models/MediaUpload";
import {
  UPLOAD_DIR,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  detectImageType,
  detectVideoType,
} from "@/lib/uploads";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "admin-uploads", 100);
  if (blocked) return blocked;

  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Could not read the upload." }, { status: 400 });
  }

  const kind = form.get("kind") === "video" ? "video" : "image";
  const files = [
    ...form.getAll("files"),
    ...form.getAll("file"),
  ].filter((f): f is File => f instanceof File);

  if (files.length === 0) return NextResponse.json({ message: "No files were sent." }, { status: 400 });

  const maxFiles = kind === "video" ? 1 : 10;
  if (files.length > maxFiles)
    return NextResponse.json(
      { message: kind === "video" ? "Upload one video at a time." : "Upload at most 10 images at a time." },
      { status: 400 }
    );

  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const preferLocal = process.env.STORAGE_PROVIDER === "local";
  const useBlob = hasBlobToken && !preferLocal;

  const urls: string[] = [];

  for (const file of files) {
    const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit)
      return NextResponse.json(
        { message: `${file.name} is larger than ${limit / 1024 / 1024} MB.` },
        { status: 400 }
      );

    const buf = Buffer.from(await file.arrayBuffer());
    const type =
      kind === "video"
        ? detectVideoType(buf, file.name, file.type)
        : detectImageType(buf, file.name);

    if (!type)
      return NextResponse.json(
        {
          message:
            kind === "video"
              ? `${file.name} is not an MP4 or WebM video.`
              : `${file.name} is not a JPG, PNG or WebP image.`,
        },
        { status: 400 }
      );

    // Collision-free unique 32-hex filename
    const name = `${randomBytes(16).toString("hex")}.${type}`;
    const mimeType = CONTENT_TYPES[type] || "application/octet-stream";

    if (useBlob) {
      try {
        const blob = await put(`products/${name}`, buf, {
          access: "public",
          contentType: mimeType,
          addRandomSuffix: false,
        });
        urls.push(blob.url);
      } catch (err) {
        console.error("Vercel Blob upload error:", err);
        return NextResponse.json(
          { message: "Could not save to cloud storage. Please try again." },
          { status: 502 }
        );
      }
    } else {
      // Primary Server-Side Storage: Persist in the database
      let saved = false;
      try {
        await connectDB();
        const MediaModel = initMediaUpload();
        await MediaModel.sync();
        await MediaModel.upsert({
          name,
          mimeType,
          data: buf,
          size: buf.length,
        });
        urls.push(`/api/uploads/${name}`);
        saved = true;
      } catch (dbErr) {
        console.warn("Database media storage failed, falling back to disk:", dbErr);
      }

      if (!saved) {
        // Fallback: server disk storage
        try {
          await mkdir(UPLOAD_DIR, { recursive: true });
          await writeFile(path.join(UPLOAD_DIR, name), buf);
          urls.push(`/api/uploads/${name}`);
        } catch (diskErr) {
          console.error("Server disk upload error:", diskErr);
          return NextResponse.json(
            { message: "Could not save the file to server storage. Please try again." },
            { status: 500 }
          );
        }
      }
    }
  }

  return NextResponse.json({ urls, url: urls[0] || null }, { status: 201 });
}
