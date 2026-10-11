import { arcade, errorResponse } from "@/lib/arcade/client";

// One entry point for Arcade's async refines. Returns a jobId; poll it with
// GET /api/covers/[jobId], which yields the new patternId and image.
// Arcade field rules: https://docs.arcade.ai/llms.txt (Refine section).

const HEX = /^#[0-9a-fA-F]{6}$/;
const isInt = (n: unknown, min = 0): n is number => Number.isInteger(n) && (n as number) >= min;
const text = (s: unknown) => (typeof s === "string" ? s.trim() : "");

type Body = Record<string, unknown>;
type Built = { endpoint: string; body: Body } | { error: string };

function build(op: string, b: Body): Built {
  switch (op) {
    case "edit": {
      const instruction = text(b.instruction);
      if (!instruction || instruction.length > 1000) return { error: "Describe the change (up to 1000 characters)" };
      return {
        endpoint: "/patterns/refine/edit",
        body: { instruction, ...(typeof b.referenceId === "string" ? { referenceId: b.referenceId } : {}) },
      };
    }
    case "editRegion": {
      const instruction = text(b.instruction);
      if (!instruction || instruction.length > 1000) return { error: "Describe the change (up to 1000 characters)" };
      if (typeof b.mask !== "string" || !b.mask.startsWith("data:image/png;base64,")) {
        return { error: "mask must be a PNG data URL" };
      }
      return { endpoint: "/patterns/refine/editRegion", body: { instruction, mask: b.mask } };
    }
    case "recolor": {
      const colors = Array.isArray(b.colors) ? b.colors : [];
      const valid = colors.every(
        (c) => c && typeof c.clusterId === "string" && typeof c.color === "string" && HEX.test(c.color),
      );
      if (colors.length < 2 || !valid) return { error: "colors must be at least 2 {clusterId, color} pairs" };
      return {
        endpoint: "/patterns/refine/recolor",
        body: { colors, ...(isInt(b.clusterCount, 2) ? { clusterCount: b.clusterCount } : {}) },
      };
    }
    case "crop": {
      const r = (b.rectangle ?? {}) as Body;
      if (!isInt(r.left) || !isInt(r.top) || !isInt(r.width, 16) || !isInt(r.height, 16)) {
        return { error: "rectangle needs integer left, top, and width/height of at least 16" };
      }
      return { endpoint: "/patterns/refine/crop", body: { rectangle: { left: r.left, top: r.top, width: r.width, height: r.height } } };
    }
    case "makeSeamless": {
      const t = (b.tile ?? {}) as Body;
      if (!isInt(t.left) || !isInt(t.top) || !isInt(t.size, 16)) {
        return { error: "tile needs integer left, top and a size of at least 16" };
      }
      return { endpoint: "/patterns/refine/makeSeamless", body: { tile: { left: t.left, top: t.top, size: t.size } } };
    }
    case "extendPattern":
    case "extendScene": {
      if (!isInt(b.targetWidth, 16) || !isInt(b.targetHeight, 16)) {
        return { error: "targetWidth and targetHeight are required" };
      }
      return { endpoint: `/patterns/refine/${op}`, body: { targetWidth: b.targetWidth, targetHeight: b.targetHeight } };
    }
    case "fixDeformity":
      return { endpoint: "/patterns/refine/fixDeformity", body: { maxPasses: isInt(b.maxPasses, 1) ? b.maxPasses : 2 } };
    default:
      return { error: `Unknown operation "${op}"` };
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ patternId: string }> }) {
  try {
    const { patternId } = await ctx.params;
    const b = (await req.json()) as Body;
    const built = build(text(b.operation), b);
    if ("error" in built) return Response.json({ error: built.error }, { status: 400 });

    const job = await arcade<{ jobId: string }>(built.endpoint, {
      requestId: typeof b.requestId === "string" ? b.requestId : crypto.randomUUID(),
      patternId,
      ...built.body,
    });
    return Response.json({ jobId: job.jobId });
  } catch (e) {
    return errorResponse(e);
  }
}
