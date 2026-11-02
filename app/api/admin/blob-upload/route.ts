import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function POST(request: Request) {
  // Enforce admin authentication before issuing any upload token
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
          ],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25 MB max
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
