import { arcade, errorResponse } from "@/lib/arcade/client";

export async function GET() {
  try {
    const { items } = await arcade<{ items: { modelId: string; name: string }[] }>("/models/list", {});
    return Response.json({ models: items });
  } catch (e) {
    return errorResponse(e);
  }
}
