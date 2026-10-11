import { useSyncExternalStore } from "react";
import { ART_POOL, DECORATIVE_STICKERS, svgToDataUrl } from "@/data/catalog";
import { MAYA_PROMPTS, type Prompt } from "@/data/journal";
import dog from "@/assets/sticker-dog.png";
import { getPattern, USE_MOCK } from "./api";
import type {
  ArtworkAsset, CoverDesign, GenerationBatch, GenerationInput, ReferenceImage, SavedDesign, StickerAsset,
} from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export interface ComoState {
  design: CoverDesign;
  past: CoverDesign[];
  future: CoverDesign[];
  artworks: Record<string, ArtworkAsset>;
  batches: GenerationBatch[];
  favorites: string[];
  stickers: StickerAsset[];
  references: ReferenceImage[];
  genInput: GenerationInput;
  promptIds: string[]; // selected prompts in order
  extraPrompts: Prompt[]; // library prompts added
  savedDesigns: SavedDesign[];
}

const DEFAULT_PROMPT =
  "Delicate sage-green botanical leaves and small wildflowers on a warm ivory background. Soft, spacious, natural, and quietly hopeful.";

function seed(): ComoState {
  const now = Date.now() - 60_000;
  const seeds = (["botanical", "marbled", "floral", "abstract"] as const).map((key, i) => {
    const art = ART_POOL.find((a) => a.key === key)!;
    const a: ArtworkAsset = {
      id: `seed-${key}`,
      arcadePatternId: null,
      prompt: [DEFAULT_PROMPT, "Hand-marbled swirls in dusty rose and soft blue.", "Vintage French roses and vines on cream.", "Bold organic shapes in warm earth tones."][i] ?? "",
      style: { name: ["Japanese Botanical", "Archival Hand Marbled", "French Floral Wallpaper", "American Aesthetic Movement"][i] ?? "", modelId: null },
      colors: [],
      referenceIds: [],
      parentId: null,
      operation: "createPattern",
      label: ["Soft botanical", "Marbled paper", "Vintage floral", "Gentle abstract"][i] ?? "",
      status: "succeeded",
      render: { src: art.src, tileScale: 1, position: "50% 50%", filter: "", tint: null, tintOpacity: 0, openSpace: 0 },
      createdAt: now + i,
    };
    return a;
  });
  const stickers: StickerAsset[] = [
    { id: "seed-dog", kind: "personal", name: "Sample pet photo", src: dog, originalSrc: dog, effect: "outline", createdAt: now },
  ];
  const sprig = DECORATIVE_STICKERS[0]!;
  const star = DECORATIVE_STICKERS[3]!;
  stickers.push(
    { id: `deco-${sprig.id}`, kind: "decorative", name: sprig.name, src: svgToDataUrl(sprig.svg), createdAt: now },
    { id: `deco-${star.id}`, kind: "decorative", name: star.name, src: svgToDataUrl(star.svg), createdAt: now },
  );
  return {
    design: {
      artworkId: "seed-botanical",
      fit: { zoom: 1, offsetX: 0, offsetY: 0 },
      title: "Room to Grow",
      subtitle: "A journal for finding comfort, understanding yourself, and growing at your own pace.",
      initials: "",
      typography: { font: "serif", size: 11, color: "#33402F", align: "center", vertical: 30, backing: true },
      placements: [
        { id: "p-star", assetId: `deco-${star.id}`, x: 78, y: 14, size: 12, rotation: 12 },
      ],
      dimensions: { widthMm: 148, heightMm: 210, bleedMm: null, dpi: null },
    },
    past: [],
    future: [],
    artworks: Object.fromEntries(seeds.map((s) => [s.id, s])),
    batches: [{ id: "seed-batch", prompt: DEFAULT_PROMPT, styleName: null, candidateIds: seeds.map((s) => s.id), createdAt: now }],
    favorites: [],
    stickers,
    references: [],
    genInput: { prompt: DEFAULT_PROMPT, styleName: "Japanese Botanical", colors: [], paletteName: null },
    promptIds: MAYA_PROMPTS.map((p) => p.id),
    extraPrompts: [],
    savedDesigns: [],
  };
}

const KEY = "como-studio-v1";
let state: ComoState = seed();
const listeners = new Set<() => void>();
let hydrated = false;

function persist() {
  try {
    const { past: _p, future: _f, ...rest } = state;
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    // Storage full (large photos) — keep working in memory.
  }
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Drop any artwork stuck mid-generation from a previous session.
      for (const a of Object.values(saved.artworks ?? {}) as ArtworkAsset[]) {
        if (a.status === "pending" || a.status === "running") a.status = "failed";
      }
      state = { ...seed(), ...saved, past: [], future: [] };
      listeners.forEach((l) => l());
      void refreshArtworkUrls();
    }
  } catch {
    /* ignore */
  }
}

/** Arcade image URLs are short-lived; swap in fresh ones for every saved Arcade artwork. */
async function refreshArtworkUrls() {
  if (USE_MOCK) return;
  const queue = Object.values(state.artworks).filter((a) => a.arcadePatternId && a.status === "succeeded");
  const worker = async () => {
    for (let a = queue.shift(); a; a = queue.shift()) {
      const { id, arcadePatternId } = a;
      try {
        const p = await getPattern(arcadePatternId!);
        setState((s) => {
          const cur = s.artworks[id];
          if (!cur) return {};
          return { artworks: { ...s.artworks, [id]: { ...cur, render: { ...cur.render, src: p.imageUrl }, size: { width: p.width, height: p.height } } } };
        });
      } catch {
        // Keep the old URL; the image may still load or the pattern was deleted.
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
}

export function getState() {
  return state;
}

export function setState(updater: (s: ComoState) => Partial<ComoState>) {
  state = { ...state, ...updater(state) };
  persist();
  listeners.forEach((l) => l());
}

/** Update the cover design. record=false lets drags update live, then commit once. */
export function updateDesign(fn: (d: CoverDesign) => CoverDesign, record = true) {
  setState((s) => ({
    design: fn(s.design),
    past: record ? [...s.past.slice(-49), s.design] : s.past,
    future: record ? [] : s.future,
  }));
}

export function pushHistory(snapshot: CoverDesign) {
  setState((s) => ({ past: [...s.past.slice(-49), snapshot], future: [] }));
}

export function undo() {
  setState((s) => {
    const prev = s.past[s.past.length - 1];
    if (!prev) return {};
    return { design: prev, past: s.past.slice(0, -1), future: [s.design, ...s.future] };
  });
}
export function redo() {
  setState((s) => {
    const next = s.future[0];
    if (!next) return {};
    return { design: next, future: s.future.slice(1), past: [...s.past, s.design] };
  });
}

export function resetDemo() {
  state = seed();
  persist();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverSnapshot = seed();

export function useComo<T>(select: (s: ComoState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(serverSnapshot));
}

export function allPrompts(s: Pick<ComoState, "extraPrompts">): Prompt[] {
  return [...MAYA_PROMPTS, ...s.extraPrompts];
}

export function selectedPrompts(s: Pick<ComoState, "extraPrompts" | "promptIds">): Prompt[] {
  const all = allPrompts(s);
  return s.promptIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as Prompt[];
}
