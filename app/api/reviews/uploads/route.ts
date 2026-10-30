import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/session";
import { guardRequest } from "@/lib/security";
import {
  UPLOAD_DIR,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  detectImageType,
  detectVideoType,
} from "@/lib/uploads";

export const runtime = "nodejs";

// Photos and one video for a customer review. Signed-in customers only.
export async function POST(req: NextRequest) {
  const blocked = guardRequest(req, "review-uploads", 20);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please log in to upload." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Could not read the upload." }, { status: 400 });
  }

  const kind = form.get("kind") === "video" ? "video" : "image";
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ message: "No files were sent." }, { status: 400 });

  const maxFiles = kind === "video" ? 1 : 4;
  if (files.length > maxFiles)
    return NextResponse.json(
      { message: kind === "video" ? "You can add one video." : "You can add up to 4 photos." },
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
    // The real file type is read from the first bytes. The file name is ignored.
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

    const name = `${randomBytes(16).toString("hex")}.${type}`;
    await writeFile(path.join(UPLOAD_DIR, name), buf);
    urls.push(`/api/uploads/${name}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}