/**
 * Typed service adapters. Every future backend call goes through these interfaces.
 * The current implementations are local mocks: no network requests, no credentials.
 * Logical operations mirror Arcade's documented print-pattern capabilities
 * (https://docs.arcade.ai/agents); method names are app adapter names, not SDK names.
 */
import { ART_POOL, ALL_STYLES, type PatternStyle } from "@/data/catalog";
import type { ArtworkAsset, ArtworkRender, ReferenceImage, StickerEffect } from "./types";

export interface PatternRequest {
  prompt: string; // max 1000 chars
  modelId?: string | null; // omitted = let Arcade choose
  colors?: string[]; // up to 10, #RRGGBB
  references?: Pick<ReferenceImage, "id" | "name" | "mimeType" | "size">[]; // up to 3
  productCategory?: string; // reserved for future use; not used in V1
}

export type EditOperation =
  | "editPattern"
  | "editPatternRegion"
  | "recolorPattern"
  | "cropPattern"
  | "extendPattern"
  | "extendScene"
  | "makeSeamless"
  | "fixPatternDetails";

export interface ArcadeService {
  listPatternModels(): Promise<PatternStyle[]>;
  createReference(ref: ReferenceImage): Promise<{ referenceId: string }>;
  createPattern(req: PatternRequest, variant: number): Promise<Omit<ArtworkAsset, "id" | "createdAt">>;
  editPattern(base: ArtworkAsset, op: EditOperation, args: { instruction?: string; colors?: string[]; region?: number }): Promise<Omit<ArtworkAsset, "id" | "createdAt">>;
  getGenerationJob(jobId: string): Promise<{ status: "succeeded" }>;
  retrievePattern(patternId: string): Promise<{ patternId: string }>;
}

export interface StickerService {
  makeSticker(photoDataUrl: string, effect: StickerEffect): Promise<{ src: string }>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export const MAX_PROMPT = 1000;

function pickArt(prompt: string, styleName: string | null, variant: number) {
  const text = `${prompt} ${styleName ?? ""}`.toLowerCase();
  const scored = ART_POOL.map((a, i) => ({
    a,
    score: a.tags.reduce((s, t) => s + (text.includes(t) ? 2 : 0), 0) + ((i * 7 + text.length) % 5) / 10,
  })).sort((x, y) => y.score - x.score);
  return scored[variant % scored.length]!.a;
}

const VARIANT_RENDER: Partial<ArtworkRender>[] = [
  { tileScale: 1, position: "50% 50%", filter: "" },
  { tileScale: 0.55, position: "20% 30%", filter: "saturate(0.9)" },
  { tileScale: 1, position: "30% 70%", filter: "brightness(1.03) saturate(0.85)" },
  { tileScale: 0.7, position: "80% 20%", filter: "contrast(1.05)" },
];

function paletteTint(colors?: string[]) {
  if (!colors || colors.length === 0) return null;
  return colors[Math.min(3, colors.length - 1)] ?? null;
}

export const mockArcade: ArcadeService = {
  async listPatternModels() {
    await wait(200);
    return ALL_STYLES.map((name) => ({ name, modelId: null }));
  },
  async createReference(ref) {
    await wait(300);
    return { referenceId: `local-ref-${ref.id}` };
  },
  async createPattern(req, variant): Promise<Omit<ArtworkAsset, "id" | "createdAt">> {
    await wait(rand(1400, 3200));
    if (Math.random() < 0.08) throw new Error("This idea didn't come through. Try again?");
    const styleName = ALL_STYLES.find((s) => req.prompt.includes(s)) ?? null;
    const art = pickArt(req.prompt, styleName, variant);
    const tint = paletteTint(req.colors);
    return {
      arcadePatternId: null,
      prompt: req.prompt,
      style: null,
      colors: req.colors ?? [],
      referenceIds: (req.references ?? []).map((r) => r.id),
      parentId: null,
      operation: "createPattern",
      label: `Idea ${variant + 1}`,
      status: "succeeded",
      render: {
        src: art.src,
        tint,
        tintOpacity: tint ? 0.18 : 0,
        openSpace: 0,
        ...{ tileScale: 1, position: "50% 50%", filter: "" },
        ...(VARIANT_RENDER[variant % VARIANT_RENDER.length] as Pick<ArtworkRender, "tileScale" | "position" | "filter">),
      },
    };
  },
  async editPattern(base, op, args) {
    await wait(rand(1200, 2400));
    const r = { ...base.render };
    const ins = (args.instruction ?? "").toLowerCase();
    let label = "Refined";
    switch (op) {
      case "editPattern":
        label = args.instruction ? `“${args.instruction.slice(0, 28)}”` : "Edited";
        if (ins.includes("softer")) { r.filter = `${r.filter} saturate(0.65) brightness(1.06)`; r.openSpace = Math.max(r.openSpace, 0.1); }
        if (ins.includes("minimal") || ins.includes("open space")) r.openSpace = Math.min(0.45, r.openSpace + 0.2);
        if (ins.includes("larger")) r.tileScale = Math.min(1.6, r.tileScale * 1.35);
        if (ins.includes("smaller")) r.tileScale = Math.max(0.3, r.tileScale * 0.7);
        if (ins.includes("composition") || !ins.match(/softer|minimal|open|larger|smaller/)) {
          r.position = `${Math.round(rand(0, 100))}% ${Math.round(rand(0, 100))}%`;
          r.filter = `${r.filter} hue-rotate(${Math.round(rand(-14, 14))}deg)`;
        }
        break;
      case "editPatternRegion":
        label = "Area refined";
        r.filter = `${r.filter} contrast(1.03)`;
        break;
      case "recolorPattern":
        label = "Recolored";
        r.tint = args.colors?.[3] ?? args.colors?.[0] ?? r.tint;
        r.tintOpacity = 0.38;
        break;
      case "cropPattern":
        label = "Cropped";
        r.tileScale = Math.min(1.8, r.tileScale * 1.25);
        break;
      case "extendPattern":
        label = "Pattern extended";
        r.tileScale = Math.max(0.3, r.tileScale * 0.6);
        break;
      case "extendScene":
        label = "Scene extended";
        r.tileScale = Math.max(0.5, r.tileScale * 0.85);
        break;
      case "makeSeamless":
        label = "Seamless square";
        r.tileScale = 0.5;
        break;
      case "fixPatternDetails":
        label = "Details cleaned";
        r.filter = `${r.filter} contrast(1.04) saturate(1.02)`;
        break;
    }
    return { ...base, parentId: base.id, operation: op, label, status: "succeeded", render: r };
  },
  async getGenerationJob() {
    return { status: "succeeded" };
  },
  async retrievePattern(patternId) {
    return { patternId };
  },
};

/** Separate mock: sticker cutouts are NOT an Arcade capability. */
export const mockStickerService: StickerService = {
  async makeSticker(photoDataUrl) {
    await wait(rand(1200, 2000));
    return { src: photoDataUrl };
  },
};

export const arcade = mockArcade;
export const stickerService = mockStickerService;
