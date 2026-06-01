import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/session";

// Issues short-lived client tokens so the browser can upload media straight to
// Vercel Blob, bypassing the 4.5MB serverless request-body limit. The bytes
// never pass through this function.
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const user = await getSessionUser();
        if (!user) throw new Error("Unauthorized");
        return {
          allowedContentTypes: ["audio/*", "video/*"],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      // Required by the type; the transcribe route deletes the blob when done.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload authorization failed." },
      { status: 400 },
    );
  }
}
