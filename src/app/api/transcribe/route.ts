import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { transcribeUpload } from "@/lib/transcription";

// Transcription can be slow (Gemini multimodal / local Whisper). Vercel Hobby
// clamps to 60s, Pro honors up to 300.
export const maxDuration = 300;

// Inline multimodal requests cap around 20MB. Larger media should be pasted as
// a transcript instead.
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error:
          "File is over the 20MB in-app limit. Trim the clip, or paste a transcript instead.",
      },
      { status: 413 },
    );
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const text = await transcribeUpload(bytes, file.type, file.name);
    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Couldn't get a usable transcript from that file. Try another, or paste a transcript." },
        { status: 422 },
      );
    }
    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transcription failed." },
      { status: 500 },
    );
  }
}
