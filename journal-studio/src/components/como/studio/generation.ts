import { toast } from "sonner";
import { arcade, MAX_PROMPT, type EditOperation } from "@/lib/como/services";
import { modelIdFor } from "@/lib/como/arcade-http";
import { getState, setState, uid, updateDesign } from "@/lib/como/store";
import type { ArtworkAsset } from "@/lib/como/types";

/** Each idea is a separate, paid Arcade generation (about 1–2 minutes each). */
const IDEAS_PER_BATCH = Math.min(4, Math.max(1, Number(import.meta.env.VITE_IDEAS_PER_BATCH ?? 4) || 4));

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

/** Upload inspiration images to Arcade once; the referenceId is kept on the image. */
async function ensureReferences(): Promise<string[]> {
  const refs = getState().references.slice(0, 3);
  const ids: string[] = [];
  for (const r of refs) {
    let refId = r.arcadeReferenceId;
    if (!refId) {
      refId = (await arcade.createReference(r)).referenceId;
      const saved = refId;
      setState((st) => ({ references: st.references.map((x) => (x.id === r.id ? { ...x, arcadeReferenceId: saved } : x)) }));
    }
    ids.push(refId);
  }
  return ids;
}

async function runCandidate(id: string, variant: number, prep: Promise<{ referenceIds: string[]; modelId: string | null }>) {
  const s = getState();
  const g = s.genInput;
  const prompt = `${g.prompt.slice(0, MAX_PROMPT - 60)}${g.styleName ? ` — ${g.styleName}` : ""}`;
  patchArtwork(id, (a) => ({ ...a, status: "running", error: undefined }));
  try {
    const { referenceIds, modelId } = await prep;
    const res = await arcade.createPattern(
      { prompt, modelId, colors: g.colors.slice(0, 10), referenceIds, references: s.references.slice(0, 3).map(({ id, name, mimeType, size }) => ({ id, name, mimeType, size })) },
      variant,
    );
    patchArtwork(id, (a) => ({
      ...a, ...res, prompt: g.prompt, style: g.styleName ? { name: g.styleName, modelId } : null, id, createdAt: a.createdAt,
    }));
  } catch (e) {
    patchArtwork(id, (a) => ({ ...a, status: "failed", error: (e as Error).message }));
  }
}

function prepareRequest() {
  const styleName = getState().genInput.styleName;
  return Promise.all([ensureReferences(), modelIdFor(styleName)]).then(([referenceIds, modelId]) => ({ referenceIds, modelId }));
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
  const ids = Array.from({ length: IDEAS_PER_BATCH }, () => uid());
  const blank = blankArt.render;
  setState((st) => ({
    artworks: { ...st.artworks, ...Object.fromEntries(ids.map((id, i) => [id, placeholder({ render: blank, label: `Idea ${i + 1}`, prompt: st.genInput.prompt }, id)])) },
    batches: [{ id: uid(), prompt: st.genInput.prompt, styleName: st.genInput.styleName, candidateIds: ids, createdAt: Date.now() }, ...st.batches],
  }));
  // One Arcade job per idea: patterns/create makes a single pattern per request.
  const prep = prepareRequest();
  ids.forEach((id, i) => runCandidate(id, batchNo * 2 + i, prep));
}

export function retryCandidate(id: string) {
  const b = getState().batches.find((x) => x.candidateIds.includes(id));
  runCandidate(id, (b?.candidateIds.indexOf(id) ?? 0) + Math.floor(Math.random() * 7), prepareRequest());
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
  } catch (e) {
    const message = (e as Error).message || "That change didn't work. Try again?";
    patchArtwork(id, (a) => ({ ...a, status: "failed", error: message }));
    toast(message);
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
