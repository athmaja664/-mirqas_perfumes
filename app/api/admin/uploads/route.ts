import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest } from "@/lib/security";
import {
  UPLOAD_DIR,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  detectImageType,
  detectVideoType,
} from "@/lib/uploads";

export const runtime = "nodejs";

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
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ message: "No files were sent." }, { status: 400 });

  const maxFiles = kind === "video" ? 1 : 10;
  if (files.length > maxFiles)
    return NextResponse.json(
      { message: kind === "video" ? "Upload one video at a time." : "Upload at most 10 images at a time." },
      { status: 400 }
    );

  await mkdir(UPLOAD_DIR, { recursive: true });
  const urls: string[] = [];

  for (const file of files) {
    const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit)
      return NextResponse.json(
        { message: `${file.name} is larger than ${limit / 1024 / 1024} MB.` },
        { status: 400 }
      );

    const buf = Buffer.from(await file.arrayBuffer());
    const type = kind === "video" ? detectVideoType(buf) : detectImageType(buf);
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

    // The original file name is ignored. A random name is safer.
    const name = `${randomBytes(16).toString("hex")}.${type}`;
    await writeFile(path.join(UPLOAD_DIR, name), buf);
    urls.push(`/api/uploads/${name}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}