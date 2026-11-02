import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth/session";
import { guardRequest } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { initMediaUpload } from "@/models/MediaUpload";
import {
  UPLOAD_DIR,
  MAX_IMAGE_BYTES,
  detectImageType,
} from "@/lib/uploads";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "review-uploads", 20);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in to upload photos." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Could not read the upload." }, { status: 400 });
  }

  if (form.get("kind") === "video") {
    return NextResponse.json({ message: "Video uploads are not allowed for reviews. Please upload photos." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ message: "No files were sent." }, { status: 400 });

  if (files.length > 4) {
    return NextResponse.json({ message: "You can add up to 4 photos." }, { status: 400 });
  }

  const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const preferLocal = process.env.STORAGE_PROVIDER === "local";
  const useBlob = hasBlobToken && !preferLocal;

  const urls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { message: `${file.name} is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.` },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(buf);
    if (!type) {
      return NextResponse.json(
        { message: `${file.name} is not a JPG, PNG or WebP image.` },
        { status: 400 }
      );
    }

    const name = `${randomBytes(16).toString("hex")}.${type}`;
    const mimeType = CONTENT_TYPES[type] || "image/jpeg";

    if (useBlob) {
      try {
        const blob = await put(`reviews/${name}`, buf, {
          access: "public",
          contentType: mimeType,
          addRandomSuffix: false,
        });
        urls.push(blob.url);
      } catch (err) {
        console.error("Vercel Blob upload error (reviews):", err);
        return NextResponse.json(
          { message: "Could not save to cloud storage. Please try again." },
          { status: 502 }
        );
      }
    } else {
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
        console.warn("Review DB media storage failed:", dbErr);
      }

      if (!saved) {
        try {
          await mkdir(UPLOAD_DIR, { recursive: true });
          await writeFile(path.join(UPLOAD_DIR, name), buf);
          urls.push(`/api/uploads/${name}`);
        } catch (e) {
          console.error("Server disk upload error (review):", e);
          return NextResponse.json(
            { message: "Could not save the file to server storage. Please try again." },
            { status: 500 }
          );
        }
      }
    }
  }

  return NextResponse.json({ urls }, { status: 201 });
}
