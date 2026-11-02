import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest } from "@/lib/security";
import { connectDB } from "@/lib/db";
import { initMediaUpload } from "@/models/MediaUpload";
import { initMediaChunk } from "@/models/MediaChunk";
import { detectVideoType, detectImageType } from "@/lib/uploads";

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
  const blocked = guardRequest(req, "admin-uploads-chunk", 200);
  if (blocked) return blocked;

  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Could not read the chunk upload." }, { status: 400 });
  }

  const uploadId = String(form.get("uploadId") || "").trim();
  const chunkIndex = Number(form.get("chunkIndex"));
  const totalChunks = Number(form.get("totalChunks"));
  const filename = String(form.get("filename") || "").trim();
  const kind = form.get("kind") === "video" ? "video" : "image";
  const chunkFile = form.get("chunk");

  if (!uploadId || !Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || !(chunkFile instanceof File)) {
    return NextResponse.json({ message: "Invalid chunk upload payload." }, { status: 400 });
  }

  await connectDB();
  const ChunkModel = initMediaChunk();
  await ChunkModel.sync();

  const chunkBuf = Buffer.from(await chunkFile.arrayBuffer());

  // Save this chunk
  await ChunkModel.create({
    uploadId,
    chunkIndex,
    data: chunkBuf,
  });

  // Check how many chunks have arrived
  const count = await ChunkModel.count({ where: { uploadId } });

  if (count < totalChunks) {
    return NextResponse.json({ done: false, received: count, total: totalChunks });
  }

  // All chunks arrived! Assemble the complete file
  const allChunks = await ChunkModel.findAll({
    where: { uploadId },
    order: [["chunkIndex", "ASC"]],
  });

  const fullBuffer = Buffer.concat(allChunks.map((c) => Buffer.from(c.data)));

  // Validate the assembled file type
  const type =
    kind === "video"
      ? detectVideoType(fullBuffer, filename, chunkFile.type)
      : detectImageType(fullBuffer, filename);

  if (!type) {
    await ChunkModel.destroy({ where: { uploadId } });
    return NextResponse.json(
      { message: `${filename} is not a valid ${kind === "video" ? "MP4/WebM video" : "image"}.` },
      { status: 400 }
    );
  }

  const name = `${randomBytes(16).toString("hex")}.${type}`;
  const mimeType = CONTENT_TYPES[type] || (kind === "video" ? "video/mp4" : "application/octet-stream");

  // Save assembled file into persistent MediaUpload table
  const MediaModel = initMediaUpload();
  await MediaModel.sync();
  await MediaModel.upsert({
    name,
    mimeType,
    data: fullBuffer,
    size: fullBuffer.length,
  });

  // Clean up temporary chunks
  await ChunkModel.destroy({ where: { uploadId } });

  return NextResponse.json({
    done: true,
    urls: [`/api/uploads/${name}`],
  });
}
