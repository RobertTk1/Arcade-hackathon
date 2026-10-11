import { arcade, errorResponse } from "@/lib/arcade/client";
import { resolveNotebook } from "@/lib/arcade/notebook";

export async function POST(req: Request) {
  try {
    const { patternId, requestId } = await req.json();
    if (typeof patternId !== "string" || !patternId) {
      return Response.json({ error: "patternId is required" }, { status: 400 });
    }
    const notebook = await resolveNotebook();
    const job = await arcade<{ jobId: string }>("/products/create", {
      requestId: typeof requestId === "string" ? requestId : crypto.randomUUID(),
      patternId,
      categoryId: notebook.categoryId,
      selections: notebook.selections,
      fit: { mode: "fill" },
    });
    return Response.json({ jobId: job.jobId, category: notebook.name });
  } catch (e) {
    return errorResponse(e);
  }
}
