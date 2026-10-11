/**
 * Real ArcadeService: every call goes through the COMO Next.js API, which holds
 * the Arcade key. Field rules come from Arcade's OpenAPI spec
 * (https://docs.arcade.ai/openapi.json).
 */
import { ALL_STYLES, type PatternStyle } from "@/data/catalog";
import {
  api,
  USE_MOCK,
  getPattern,
  NoResultError,
  pollPatternJob,
  type PatternResult,
} from "./api";
import type { ArcadeService, EditOperation } from "./services";
import type { ArtworkAsset, ArtworkRender } from "./types";

const COVER_RATIO = 148 / 210; // matches JournalCover

const PLAIN_RENDER: Omit<ArtworkRender, "src"> = {
  tileScale: 1,
  position: "50% 50%",
  filter: "",
  tint: null,
  tintOpacity: 0,
  openSpace: 0,
};

function asset(
  p: PatternResult,
): Pick<ArtworkAsset, "arcadePatternId" | "render" | "size" | "status"> {
  return {
    arcadePatternId: p.patternId,
    render: { ...PLAIN_RENDER, src: p.imageUrl },
    size: { width: p.width, height: p.height },
    status: "succeeded",
  };
}

let models: Promise<PatternStyle[]> | null = null;

/** Arcade's real models, matched by name to the style list. Unmatched styles keep modelId null. */
function loadModels(): Promise<PatternStyle[]> {
  models ??= api<{ models: { modelId: string; name: string }[] }>("/api/models")
    .then(({ models: list }) => {
      const byName = new Map(list.map((m) => [m.name.trim().toLowerCase(), m.modelId]));
      const known = ALL_STYLES.map((name) => ({
        name,
        modelId: byName.get(name.toLowerCase()) ?? null,
      }));
      const extra = list.filter(
        (m) => !ALL_STYLES.some((s) => s.toLowerCase() === m.name.trim().toLowerCase()),
      );
      return [...known, ...extra.map((m) => ({ name: m.name, modelId: m.modelId }))];
    })
    .catch((e) => {
      models = null; // retry next time
      throw e;
    });
  return models;
}

export async function modelIdFor(styleName: string | null): Promise<string | null> {
  if (!styleName || USE_MOCK) return null;
  try {
    return (await loadModels()).find((m) => m.name === styleName)?.modelId ?? null;
  } catch {
    return null; // style still reaches Arcade as prompt text
  }
}

async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob();
}

async function sizeOf(base: ArtworkAsset) {
  if (base.size) return base.size;
  const p = await getPattern(base.arcadePatternId!);
  return { width: p.width, height: p.height };
}

/** Visible part of the image when drawn with background-size: cover in a cover-shaped box. */
function coverWindow(w: number, h: number) {
  if (w / h > COVER_RATIO) {
    const vw = h * COVER_RATIO;
    return { left: (w - vw) / 2, top: 0, width: vw, height: h };
  }
  const vh = w / COVER_RATIO;
  return { left: 0, top: (h - vh) / 2, width: w, height: vh };
}

/**
 * PNG mask for one cell of the 3×3 picker. Arcade edits pixels with alpha > 0;
 * the mask keeps the image's aspect ratio and a long edge of at most 1536 px.
 */
function regionMask(size: { width: number; height: number }, cell: number) {
  const scale = Math.min(1, 1536 / Math.max(size.width, size.height));
  const cw = Math.max(1, Math.round(size.width * scale));
  const ch = Math.max(1, Math.round(size.height * scale));
  const win = coverWindow(cw, ch);
  const col = cell % 3;
  const row = Math.floor(cell / 3);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(
    Math.round(win.left + (col * win.width) / 3),
    Math.round(win.top + (row * win.height) / 3),
    Math.max(16, Math.round(win.width / 3)),
    Math.max(16, Math.round(win.height / 3)),
  );
  return canvas.toDataURL("image/png");
}

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
};

/** Pair each of the pattern's color clusters with a palette color of similar lightness. */
async function recolorPairs(patternId: string, palette: string[]) {
  const colors = palette.filter((c) => /^#[0-9a-fA-F]{6}$/.test(c));
  if (colors.length < 2) throw new Error("Pick a palette with at least two colors.");
  const { clusters } = await api<{ clusters: { clusterId: string; color: string }[] }>(
    `/api/patterns/${encodeURIComponent(patternId)}/clusters`,
    { body: { clusterCount: Math.min(Math.max(colors.length, 2), 20) } },
  );
  const byLight = [...clusters].sort((a, b) => luminance(a.color) - luminance(b.color));
  const target = [...colors].sort((a, b) => luminance(a) - luminance(b));
  return byLight.map((c, i) => ({
    clusterId: c.clusterId,
    color: target[Math.round((i * (target.length - 1)) / Math.max(1, byLight.length - 1))]!,
  }));
}

/** Smallest canvas with the cover's proportions that contains the image; grows 25% if already there. */
function extendTarget({ width: w, height: h }: { width: number; height: number }) {
  if (Math.abs(w / h - COVER_RATIO) < 0.02)
    return { targetWidth: Math.round(w * 1.25), targetHeight: Math.round(h * 1.25) };
  if (w / h > COVER_RATIO) return { targetWidth: w, targetHeight: Math.round(w / COVER_RATIO) };
  return { targetWidth: Math.round(h * COVER_RATIO), targetHeight: h };
}

const LABELS: Record<EditOperation, string> = {
  editPattern: "Edited",
  editPatternRegion: "Area refined",
  recolorPattern: "Recolored",
  cropPattern: "Cropped",
  extendPattern: "Pattern extended",
  extendScene: "Scene extended",
  makeSeamless: "Seamless square",
  fixPatternDetails: "Details cleaned",
};

export const httpArcade: ArcadeService = {
  listPatternModels: loadModels,

  async createReference(ref) {
    if (ref.size > 4 * 1024 * 1024)
      throw new Error(`${ref.name} is over 4 MB. Try a smaller image.`);
    const form = new FormData();
    form.append(
      "file",
      new File([await dataUrlToBlob(ref.dataUrl)], ref.name, { type: ref.mimeType }),
    );
    const { referenceId } = await api<{ referenceId: string }>("/api/references", { form });
    return { referenceId };
  },

  async createPattern(req, variant) {
    const { jobId } = await api<{ jobId: string }>("/api/covers", {
      body: {
        prompt: req.prompt,
        ...(req.modelId ? { modelId: req.modelId } : {}),
        ...(req.colors?.length ? { colors: req.colors.slice(0, 10) } : {}),
        ...(req.referenceIds?.length ? { referenceIds: req.referenceIds.slice(0, 3) } : {}),
      },
    });
    const p = await pollPatternJob(jobId);
    return {
      ...asset(p),
      prompt: req.prompt,
      style: null,
      colors: req.colors ?? [],
      referenceIds: req.referenceIds ?? [],
      parentId: null,
      operation: "createPattern",
      label: `Idea ${variant + 1}`,
    };
  },

  async editPattern(base, op, args) {
    if (!base.arcadePatternId)
      throw new Error("Sample covers can't be refined. Generate your own artwork first.");
    // Crop & frame is local zoom/position (design.fit); it never reaches here.
    if (op === "cropPattern") return { ...base, parentId: base.id, label: LABELS.cropPattern };

    const id = base.arcadePatternId;
    let body: Record<string, unknown>;
    switch (op) {
      case "editPattern":
        body = { operation: "edit", instruction: args.instruction ?? "" };
        break;
      case "editPatternRegion":
        body = {
          operation: "editRegion",
          instruction: args.instruction ?? "",
          mask: regionMask(await sizeOf(base), args.region ?? 4),
        };
        break;
      case "recolorPattern":
        body = { operation: "recolor", colors: await recolorPairs(id, args.colors ?? []) };
        break;
      case "extendPattern":
      case "extendScene":
        body = { operation: op, ...extendTarget(await sizeOf(base)) };
        break;
      case "makeSeamless": {
        const { width, height } = await sizeOf(base);
        const size = Math.min(width, height);
        body = {
          operation: "makeSeamless",
          tile: {
            left: Math.floor((width - size) / 2),
            top: Math.floor((height - size) / 2),
            size,
          },
        };
        break;
      }
      case "fixPatternDetails":
        body = { operation: "fixDeformity", maxPasses: 2 };
        break;
    }

    const { jobId } = await api<{ jobId: string }>(
      `/api/patterns/${encodeURIComponent(id)}/refine`,
      { body },
    );
    try {
      const p = await pollPatternJob(jobId);
      const label =
        op === "editPattern" && args.instruction
          ? `“${args.instruction.slice(0, 28)}”`
          : LABELS[op];
      return { ...base, ...asset(p), parentId: base.id, operation: op, label };
    } catch (e) {
      if (e instanceof NoResultError)
        return { ...base, parentId: base.id, operation: op, label: "Already tidy" };
      throw e;
    }
  },

  async getGenerationJob(jobId) {
    await pollPatternJob(jobId);
    return { status: "succeeded" };
  },

  async retrievePattern(patternId) {
    return { patternId: (await getPattern(patternId)).patternId };
  },
};
