import { arcade, errorResponse } from "@/lib/arcade/client";

// Fresh image URL and size for a pattern. Arcade image URLs are short-lived, so
// clients store the patternId and call this again instead of keeping the URL.
export async function GET(_req: Request, ctx: { params: Promise<{ patternId: string }> }) {
  try {
    const { patternId } = await ctx.params;
    const p = await arcade<{ imageUrl: string; thumbnailUrl: string; width: number; height: number }>(
      "/patterns/get",
      { patternId },
    );
    return Response.json({
      patternId,
      imageUrl: p.imageUrl,
      thumbnailUrl: p.thumbnailUrl,
      width: p.width,
      height: p.height,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
