import { arcade, errorResponse } from "@/lib/arcade/client";

// Re-reads the pattern from Arcade (image URLs are short-lived) and streams the
// image back so the browser can save it. Only Arcade-known patternIds resolve.
export async function GET(_req: Request, ctx: { params: Promise<{ patternId: string }> }) {
  try {
    const { patternId } = await ctx.params;
    const pattern = await arcade<{ imageUrl: string }>("/patterns/get", { patternId });
    const img = await fetch(pattern.imageUrl);
    if (!img.ok || !img.body) {
      return Response.json({ error: "Couldn't fetch the cover image" }, { status: 502 });
    }
    return new Response(img.body, {
      headers: {
        "Content-Type": img.headers.get("content-type") ?? "image/png",
        "Content-Disposition": 'attachment; filename="como-cover.png"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
