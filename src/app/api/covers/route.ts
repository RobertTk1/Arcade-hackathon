import { arcade, errorResponse } from "@/lib/arcade/client";

export async function POST(req: Request) {
  try {
    const { prompt, referenceId, requestId } = await req.json();
    if (typeof prompt !== "string" || !prompt.trim()) {
      return Response.json({ error: "Describe your pattern" }, { status: 400 });
    }
    const job = await arcade<{ jobId: string }>("/patterns/create", {
      requestId: typeof requestId === "string" ? requestId : crypto.randomUUID(),
      prompt: prompt.trim(),
      ...(referenceId ? { referenceIds: [referenceId] } : {}),
    });
    return Response.json({ jobId: job.jobId });
  } catch (e) {
    return errorResponse(e);
  }
}
