import { arcade, errorResponse } from "@/lib/arcade/client";
import { resolveStandIn } from "@/lib/arcade/product";

export async function POST(req: Request) {
  try {
    const { patternId, requestId } = await req.json();
    if (typeof patternId !== "string" || !patternId) {
      return Response.json({ error: "patternId is required" }, { status: 400 });
    }
    const standIn = await resolveStandIn();
    const job = await arcade<{ jobId: string }>("/products/create", {
      requestId: typeof requestId === "string" ? requestId : crypto.randomUUID(),
      patternId,
      categoryId: standIn.categoryId,
      selections: standIn.selections,
      fit: { mode: "fill" },
    });
    return Response.json({ jobId: job.jobId, category: standIn.name });
  } catch (e) {
    return errorResponse(e);
  }
}
