import { arcade, errorResponse } from "@/lib/arcade/client";

// The pattern's dominant colors. recolor needs these clusterIds; it can't take
// a free palette. Synchronous: no job to poll.
export async function POST(req: Request, ctx: { params: Promise<{ patternId: string }> }) {
  try {
    const { patternId } = await ctx.params;
    const { clusterCount } = await req.json().catch(() => ({}));
    const res = await arcade<{ clusters: { clusterId: string; color: string }[] }>(
      "/patterns/refine/recolorClusters",
      {
        requestId: crypto.randomUUID(),
        patternId,
        ...(Number.isInteger(clusterCount) && clusterCount >= 2 && clusterCount <= 20 ? { clusterCount } : {}),
      },
    );
    return Response.json({ clusters: res.clusters });
  } catch (e) {
    return errorResponse(e);
  }
}
