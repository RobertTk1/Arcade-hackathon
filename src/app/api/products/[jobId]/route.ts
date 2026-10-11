import { arcade, errorResponse } from "@/lib/arcade/client";

type Job = {
  status: "running" | "succeeded" | "failed";
  result: { productId: string } | null;
  error?: { message: string } | null;
};

type Product = {
  productId: string;
  title: string;
  selectionLabel: string;
  imageUrl: string;
  images: { url: string }[];
  unitPrice: { amount: string; currency: string } | null;
};

export async function GET(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await ctx.params;
    const job = await arcade<Job>("/jobs/get", { jobId });

    if (job.status === "failed") {
      return Response.json({ status: "failed", error: job.error?.message ?? "Product build failed" });
    }
    if (job.status === "succeeded") {
      if (!job.result) return Response.json({ status: "failed", error: "No product was returned" });
      const p = await arcade<Product>("/products/get", { productId: job.result.productId });
      return Response.json({
        status: "succeeded",
        productId: p.productId,
        title: p.title,
        selectionLabel: p.selectionLabel,
        imageUrl: p.imageUrl,
        images: p.images.map((i) => i.url),
        unitPrice: p.unitPrice,
      });
    }
    return Response.json({ status: "running" });
  } catch (e) {
    return errorResponse(e);
  }
}
