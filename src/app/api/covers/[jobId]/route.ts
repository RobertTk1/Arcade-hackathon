import { arcade, errorResponse } from "@/lib/arcade/client";

type Job = {
  status: "running" | "succeeded" | "failed";
  result: { patternId: string } | null;
  error?: { message: string } | null;
};

export async function GET(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await ctx.params;
    const job = await arcade<Job>("/jobs/get", { jobId });

    if (job.status === "failed") {
      return Response.json({ status: "failed", error: job.error?.message ?? "Generation failed" });
    }
    if (job.status === "succeeded") {
      if (!job.result) return Response.json({ status: "failed", error: "No pattern was returned" });
      const pattern = await arcade<{ imageUrl: string; width: number; height: number }>(
        "/patterns/get",
        { patternId: job.result.patternId },
      );
      return Response.json({
        status: "succeeded",
        patternId: job.result.patternId,
        imageUrl: pattern.imageUrl,
        width: pattern.width,
        height: pattern.height,
      });
    }
    return Response.json({ status: "running" });
  } catch (e) {
    return errorResponse(e);
  }
}
