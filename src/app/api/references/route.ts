import { arcade, errorResponse } from "@/lib/arcade/client";

const TYPES = ["image/gif", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024; // Vercel function body limit is ~4.5MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !TYPES.includes(file.type)) {
      return Response.json({ error: "Upload a GIF, JPEG, PNG or WebP image" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: "Image must be under 4 MB" }, { status: 400 });
    }

    const upload = await arcade<{
      uploadId: string;
      uploadUrl: string;
      requiredHeaders: Record<string, string>;
    }>("/references/createUpload", {
      requestId: crypto.randomUUID(),
      mediaType: file.type,
      byteLength: file.size,
    });

    const put = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: upload.requiredHeaders,
      body: await file.arrayBuffer(),
    });
    if (!put.ok) {
      return Response.json({ error: "Image upload failed" }, { status: 502 });
    }

    const ref = await arcade<{ referenceId: string; thumbnailUrl: string }>(
      "/references/create",
      { requestId: crypto.randomUUID(), uploadId: upload.uploadId },
    );
    return Response.json({ referenceId: ref.referenceId, thumbnailUrl: ref.thumbnailUrl });
  } catch (e) {
    return errorResponse(e);
  }
}
