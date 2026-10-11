import { toast } from "sonner";
import { arcade, MAX_PROMPT, type EditOperation } from "@/lib/como/services";
import { getState, setState, uid, updateDesign } from "@/lib/como/store";
import type { ArtworkAsset } from "@/lib/como/types";

function placeholder(base: Partial<ArtworkAsset> & { render: ArtworkAsset["render"] }, id: string): ArtworkAsset {
  return {
    id, arcadePatternId: null, prompt: "", style: null, colors: [], referenceIds: [], parentId: null,
    operation: "createPattern", label: "", status: "running", createdAt: Date.now(), ...base,
  };
}

/** Patch an existing artwork; no-op if it no longer exists. */
function patchArtwork(id: string, patch: (a: ArtworkAsset) => ArtworkAsset) {
  setState((st) => {
    const cur = st.artworks[id];
    if (!cur) return {};
    return { artworks: { ...st.artworks, [id]: patch(cur) } };
  });
}

async function runCandidate(id: string, variant: number) {
  const s = getState();
  const g = s.genInput;
  const prompt = `${g.prompt.slice(0, MAX_PROMPT - 60)}${g.styleName ? ` — ${g.styleName}` : ""}`;
  patchArtwork(id, (a) => ({ ...a, status: "running", error: undefined }));
  try {
    const res = await arcade.createPattern(
      { prompt, modelId: null, colors: g.colors.slice(0, 10), references: s.references.slice(0, 3).map(({ id, name, mimeType, size }) => ({ id, name, mimeType, size })) },
      variant,
    );
    patchArtwork(id, (a) => ({
      ...a, ...res, prompt: g.prompt, style: g.styleName ? { name: g.styleName, modelId: null } : null, id, createdAt: a.createdAt,
    }));
  } catch (e) {
    patchArtwork(id, (a) => ({ ...a, status: "failed", error: (e as Error).message }));
  }
}

export function generateIdeas() {
  const s = getState();
  if (!s.genInput.prompt.trim()) {
    toast("Describe the cover you'd like first.");
    return;
  }
  const blankArt = s.artworks[s.design.artworkId];
  if (!blankArt) return;
  const batchNo = s.batches.length;
  const ids = [0, 1, 2, 3].map(() => uid());
  const blank = blankArt.render;
  setState((st) => ({
    artworks: { ...st.artworks, ...Object.fromEntries(ids.map((id, i) => [id, placeholder({ render: blank, label: `Idea ${i + 1}`, prompt: st.genInput.prompt }, id)])) },
    batches: [{ id: uid(), prompt: st.genInput.prompt, styleName: st.genInput.styleName, candidateIds: ids, createdAt: Date.now() }, ...st.batches],
  }));
  // Four individual requests — no assumption of a multi-image endpoint.
  ids.forEach((id, i) => runCandidate(id, batchNo * 2 + i));
}

export function retryCandidate(id: string) {
  const b = getState().batches.find((x) => x.candidateIds.includes(id));
  runCandidate(id, (b?.candidateIds.indexOf(id) ?? 0) + Math.floor(Math.random() * 7));
}

export async function refineArtwork(op: EditOperation, args: { instruction?: string; colors?: string[]; region?: number }) {
  const s = getState();
  const base = s.artworks[s.design.artworkId];
  if (!base) return;
  const id = uid();
  setState((st) => ({
    artworks: { ...st.artworks, [id]: { ...base, id, parentId: base.id, operation: op, status: "running", label: "Refining…", createdAt: Date.now() } },
  }));
  try {
    const res = await arcade.editPattern(base, op, args);
    patchArtwork(id, (a) => ({ ...a, ...res, id, parentId: base.id }));
    updateDesign((d) => ({ ...d, artworkId: id }));
  } catch {
    patchArtwork(id, (a) => ({ ...a, status: "failed", error: "That change didn't work. Try again?" }));
  }
}

export function applyArtwork(id: string) {
  const a = getState().artworks[id];
  if (a?.status !== "succeeded") return;
  updateDesign((d) => ({ ...d, artworkId: id, fit: { zoom: 1, offsetX: 0, offsetY: 0 } }));
}

export function toggleFavorite(id: string) {
  setState((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites] }));
}

export function rootOf(id: string): string {
  const arts = getState().artworks;
  let cur = arts[id];
  while (cur?.parentId && arts[cur.parentId]) cur = arts[cur.parentId];
  return cur?.id ?? id;
}
