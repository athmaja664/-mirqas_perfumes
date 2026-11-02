import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/auth/require-admin";
import { guardRequest } from "@/lib/security";
import { connectDB, Op } from "@/lib/db";
import { initMediaUpload } from "@/models/MediaUpload";
import { detectVideoType, detectImageType } from "@/lib/uploads";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export async function POST(req: NextRequest) {
  try {
    const blocked = guardRequest(req, "admin-uploads-chunk", 300);
    if (blocked) return blocked;

    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    let form: FormData;
    try {
      form = await req.formData();
    } catch (formErr) {
      console.error("Failed to parse chunk form data:", formErr);
      return NextResponse.json({ message: "Could not read chunk data." }, { status: 400 });
    }

    const uploadId = String(form.get("uploadId") || "").trim();
    const chunkIndex = Number(form.get("chunkIndex"));
    const totalChunks = Number(form.get("totalChunks"));
    const filename = String(form.get("filename") || "").trim();
    const kind = form.get("kind") === "video" ? "video" : "image";
    const chunkItem = form.get("chunk");

    if (!uploadId || !Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || !chunkItem) {
      return NextResponse.json({ message: "Invalid chunk upload payload." }, { status: 400 });
    }

    let chunkBuf: Buffer;
    if (typeof (chunkItem as Blob).arrayBuffer === "function") {
      chunkBuf = Buffer.from(await (chunkItem as Blob).arrayBuffer());
    } else {
      return NextResponse.json({ message: "Invalid chunk file format." }, { status: 400 });
    }

    await connectDB();
    const MediaModel = initMediaUpload();
    await MediaModel.sync();

    // Store this chunk in MediaUpload table with a unique chunk key
    const chunkKey = `chk_${uploadId}_${String(chunkIndex).padStart(4, "0")}`;
    await MediaModel.upsert({
      name: chunkKey,
      mimeType: "application/octet-stream",
      data: chunkBuf,
      size: chunkBuf.length,
    });

    // Check how many chunks have arrived for this uploadId
    const count = await MediaModel.count({
      where: {
        name: {
          [Op.like]: `chk_${uploadId}_%`,
        },
      },
    });

    if (count < totalChunks) {
      return NextResponse.json({ done: false, received: count, total: totalChunks });
    }

    // All chunks arrived! Assemble the complete file
    const allChunks = await MediaModel.findAll({
      where: {
        name: {
          [Op.like]: `chk_${uploadId}_%`,
        },
      },
      order: [["name", "ASC"]],
    });

    const fullBuffer = Buffer.concat(allChunks.map((c) => Buffer.from(c.data)));

    // Clean up chunk records immediately to free database space
    await MediaModel.destroy({
      where: {
        name: {
          [Op.like]: `chk_${uploadId}_%`,
        },
      },
    });

    // Validate video / image format
    const type =
      kind === "video"
        ? detectVideoType(fullBuffer, filename) || "mp4"
        : detectImageType(fullBuffer, filename) || "jpg";

    const name = `${randomBytes(16).toString("hex")}.${type}`;
    const mimeType = CONTENT_TYPES[type] || (kind === "video" ? "video/mp4" : "application/octet-stream");

    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    const preferLocal = process.env.STORAGE_PROVIDER === "local";
    const useBlob = hasBlobToken && !preferLocal;

    if (useBlob) {
      try {
        const blob = await put(`products/${name}`, fullBuffer, {
          access: "public",
          contentType: mimeType,
          addRandomSuffix: false,
        });
        return NextResponse.json({ done: true, urls: [blob.url] });
      } catch (blobErr) {
        console.warn("Vercel Blob put failed, storing in database:", blobErr);
      }
    }

    // Store assembled file in database permanently
    await MediaModel.upsert({
      name,
      mimeType,
      data: fullBuffer,
      size: fullBuffer.length,
    });

    return NextResponse.json({
      done: true,
      urls: [`/api/uploads/${name}`],
    });
  } catch (err) {
    console.error("Chunk upload route error:", err);
    return NextResponse.json(
      {
        message: err instanceof Error ? err.message : "Internal error during chunk upload.",
      },
      { status: 500 }
    );
  }
}
