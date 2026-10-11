import type { PatternStyle } from "@/data/catalog";

export type JobStatus = "idle" | "pending" | "running" | "succeeded" | "failed";

export interface ReferenceImage {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  arcadeReferenceId?: string | undefined; // set once uploaded to Arcade
}

/** Visual parameters the mock renderer uses to display an artwork asset. */
export interface ArtworkRender {
  src: string;
  tileScale: number; // 1 = cover; <1 = repeating smaller motifs
  position: string;
  filter: string;
  tint: string | null; // recolor overlay
  tintOpacity: number;
  openSpace: number; // 0..1 washed-out cream veil
}

export interface ArtworkAsset {
  id: string; // local design ID
  arcadePatternId: string | null; // Arcade pattern ID; null for bundled sample art
  prompt: string;
  style: PatternStyle | null; // null = let Arcade choose (omitted modelId)
  colors: string[];
  referenceIds: string[];
  parentId: string | null;
  operation: string; // createPattern, editPattern, recolorPattern...
  label: string;
  status: JobStatus;
  error?: string | undefined;
  render: ArtworkRender;
  size?: { width: number; height: number } | undefined; // Arcade pixel size
  createdAt: number;
}

export interface GenerationBatch {
  id: string;
  prompt: string;
  styleName: string | null;
  candidateIds: string[];
  createdAt: number;
}

export type StickerEffect = "cutout" | "outline" | "illustrated" | "rounded";

export interface StickerAsset {
  id: string;
  kind: "decorative" | "personal";
  name: string;
  src: string; // processed image (or decorative svg data url)
  originalSrc?: string; // untouched original photo
  effect?: StickerEffect;
  createdAt: number;
}

export interface StickerPlacement {
  id: string;
  assetId: string;
  x: number; // % of cover width (center)
  y: number; // % of cover height (center)
  size: number; // % of cover width
  rotation: number; // deg
}

export type FontStyle = "serif" | "sans" | "script";

export interface Typography {
  font: FontStyle;
  size: number; // title size in % of cover width
  color: string;
  align: "left" | "center" | "right";
  vertical: number; // 0..100 % from top
  backing: boolean;
}

export interface CoverDesign {
  artworkId: string;
  fit: { zoom: number; offsetX: number; offsetY: number };
  title: string;
  subtitle: string;
  initials: string;
  typography: Typography;
  placements: StickerPlacement[]; // array order = layer order (last is top)
  dimensions: { widthMm: number; heightMm: number; bleedMm: number | null; dpi: number | null };
}

export interface SavedDesign {
  id: string;
  name: string;
  design: CoverDesign;
  savedAt: number;
}

export interface GenerationInput {
  prompt: string;
  styleName: string | null;
  colors: string[];
  paletteName: string | null;
}
