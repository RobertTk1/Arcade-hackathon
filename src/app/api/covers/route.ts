import { arcade, errorResponse } from "@/lib/arcade/client";

const HEX = /^#[0-9a-fA-F]{6}$/;

export async function POST(req: Request) {
  try {
    const { prompt, referenceId, referenceIds, colors, modelId, requestId } = await req.json();
    if (typeof prompt !== "string" || !prompt.trim()) {
      return Response.json({ error: "Describe your pattern" }, { status: 400 });
    }
    if (prompt.trim().length > 1000) {
      return Response.json({ error: "Keep the description under 1000 characters" }, { status: 400 });
    }
    // Accept the original single referenceId or an array (Arcade allows up to 3).
    const refs = (Array.isArray(referenceIds) ? referenceIds : referenceId ? [referenceId] : [])
      .filter((r): r is string => typeof r === "string" && r.length > 0)
      .slice(0, 3);
    const palette = (Array.isArray(colors) ? colors : [])
      .filter((c): c is string => typeof c === "string" && HEX.test(c))
      .slice(0, 10);

    const job = await arcade<{ jobId: string }>("/patterns/create", {
      requestId: typeof requestId === "string" ? requestId : crypto.randomUUID(),
      prompt: prompt.trim(),
      ...(refs.length ? { referenceIds: refs } : {}),
      ...(palette.length ? { colors: palette } : {}),
      ...(typeof modelId === "string" && modelId ? { modelId } : {}),
    });
    return Response.json({ jobId: job.jobId });
  } catch (e) {
    return errorResponse(e);
  }
}
