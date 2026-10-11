import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Camera, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DECORATIVE_STICKERS, svgToDataUrl } from "@/data/catalog";
import { stickerService } from "@/lib/como/services";
import { getState, setState, uid, updateDesign, useComo } from "@/lib/como/store";
import type { StickerAsset, StickerEffect } from "@/lib/como/types";
import { effectStyle } from "../JournalCover";
import { Section } from "./ui";
import { cn } from "@/lib/utils";

const EFFECTS: { id: StickerEffect; label: string }[] = [
  { id: "cutout", label: "Clean cutout" },
  { id: "outline", label: "White outline" },
  { id: "illustrated", label: "Soft illustrated" },
  { id: "rounded", label: "Rounded photo" },
];

const CATS = Array.from(new Set(DECORATIVE_STICKERS.map((s) => s.category)));

export function placeSticker(asset: StickerAsset, onSelect?: (id: string) => void) {
  setState((s) => (s.stickers.some((x) => x.id === asset.id) ? {} : { stickers: [...s.stickers, asset] }));
  const id = uid();
  const n = getState().design.placements.length;
  updateDesign((d) => ({ ...d, placements: [...d.placements, { id, assetId: asset.id, x: 50 + ((n * 9) % 30) - 15, y: 70 - ((n * 7) % 20), size: asset.kind === "personal" ? 30 : 16, rotation: (n % 2 ? 6 : -6) }] }));
  onSelect?.(id);
}

export function StickerPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const stickers = useComo((s) => s.stickers);
  const mine = stickers.filter((x) => x.kind === "personal");
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [effect, setEffect] = useState<StickerEffect>("outline");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cat, setCat] = useState(CATS[0]);

  const load = (f?: File) => {
    if (!f || !/image\/(jpeg|png|webp)/.test(f.type)) return;
    const r = new FileReader();
    r.onload = () => { setPhoto(String(r.result)); setResult(null); };
    r.readAsDataURL(f);
  };

  const make = async () => {
    if (!photo) return;
    setProcessing(true);
    const res = await stickerService.makeSticker(photo, effect);
    setResult(res.src);
    setProcessing(false);
  };

  const keep = () => {
    if (!result || !photo) return;
    const asset: StickerAsset = { id: uid(), kind: "personal", name: "My photo", src: result, originalSrc: photo, effect, createdAt: Date.now() };
    placeSticker(asset, onSelect);
    setPhoto(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <Section title="Add something you love" hint="Preview only, not printed">
        <p className="mb-3 text-xs text-muted-foreground">Turn a photo of your pet, someone special, or a favorite little thing into a sticker for your cover.</p>
        {!photo ? (
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); load(e.dataTransfer.files[0]); }}
            className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed bg-card px-4 py-6 text-sm text-muted-foreground hover:border-primary"
          >
            <Camera className="h-5 w-5 text-accent" />Choose or drop a photo
            <span className="text-[11px]">JPEG, PNG or WebP · stays on your device</span>
          </button>
        ) : (
          <div className="rounded-2xl bg-card p-3">
            <div className="grid grid-cols-2 gap-2">
              <figure>
                <div className="aspect-square overflow-hidden rounded-xl bg-muted"><img src={photo} alt="Your photo" className="h-full w-full object-cover" /></div>
                <figcaption className="mt-1 text-center text-[11px] text-muted-foreground">Before</figcaption>
              </figure>
              <figure>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[repeating-conic-gradient(var(--muted)_0_25%,var(--card)_0_50%)] bg-[length:16px_16px] p-3">
                  {processing ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : result ? (
                    <img src={result} alt="Sticker preview" className="max-h-full max-w-full" style={{ ...effectStyle(effect), ...(effect === "cutout" || effect === "outline" || effect === "illustrated" ? { clipPath: "ellipse(46% 48% at 50% 50%)" } : {}) }} />
                  ) : <span className="text-[11px] text-muted-foreground">Your sticker</span>}
                </div>
                <figcaption className="mt-1 text-center text-[11px] text-muted-foreground">After</figcaption>
              </figure>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {EFFECTS.map((e) => (
                <button key={e.id} onClick={() => { setEffect(e.id); setResult(null); }} className={cn("rounded-lg border px-2 py-1.5 text-xs", effect === e.id && "border-primary bg-sage/40")}>{e.label}</button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              {result ? (
                <Button className="flex-1 rounded-full" onClick={keep}>Place on cover</Button>
              ) : (
                <Button className="flex-1 rounded-full" disabled={processing} onClick={make}>{processing ? <><Loader2 className="h-4 w-4 animate-spin" />Making…</> : "Make a sticker"}</Button>
              )}
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Replace photo" onClick={() => fileRef.current?.click()}><Camera className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Remove photo" onClick={() => { setPhoto(null); setResult(null); }}><X className="h-4 w-4" /></Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">This is a preview; edges are refined before printing.</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { load(e.target.files?.[0]); e.target.value = ""; }} />
      </Section>

      {mine.length > 0 && (
        <Section title="My stickers">
          <div className="grid grid-cols-4 gap-2">
            {mine.map((s) => (
              <div key={s.id} className="group relative">
                <button onClick={() => placeSticker(s, onSelect)} className="flex aspect-square w-full items-center justify-center rounded-xl bg-card p-1.5 hover:ring-1 hover:ring-primary" title="Add to cover">
                  <img src={s.src} alt={s.name} className="max-h-full" style={effectStyle(s.effect)} />
                </button>
                <button aria-label="Remove sticker" onClick={() => { setState((st) => ({ stickers: st.stickers.filter((x) => x.id !== s.id) })); updateDesign((d) => ({ ...d, placements: d.placements.filter((p) => p.assetId !== s.id) })); }}
                  className="absolute -right-1 -top-1 hidden rounded-full bg-card p-0.5 shadow group-hover:block"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Decorations">
        <div className="-mx-1 mb-2 flex gap-1 overflow-x-auto px-1 pb-1">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full px-3 py-1 text-xs", cat === c ? "bg-primary text-primary-foreground" : "bg-muted")}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {DECORATIVE_STICKERS.filter((s) => s.category === cat).map((s) => (
            <button key={s.id} title={s.name} onClick={() => placeSticker({ id: `deco-${s.id}`, kind: "decorative", name: s.name, src: svgToDataUrl(s.svg), createdAt: Date.now() }, onSelect)}
              className="flex aspect-square items-center justify-center rounded-xl bg-card p-2 transition hover:scale-105 hover:ring-1 hover:ring-primary">
              <img src={svgToDataUrl(s.svg)} alt={s.name} className="max-h-full" />
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function LayerList({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  const placements = useComo((s) => s.design.placements);
  const stickers = useComo((s) => s.stickers);
  const move = (id: string, dir: 1 | -1) => updateDesign((d) => {
    const l = [...d.placements];
    const i = l.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= l.length) return d;
    [l[i], l[j]] = [l[j]!, l[i]!];
    return { ...d, placements: l };
  });
  return (
    <Section title="On your cover" hint={`${placements.length} sticker${placements.length === 1 ? "" : "s"}`}>
      {placements.length === 0 && <p className="text-xs text-muted-foreground">Tap a sticker to add it. Drag to move; use the round handle to resize and rotate.</p>}
      <ul className="space-y-1">
        {[...placements].reverse().map((p) => {
          const a = stickers.find((s) => s.id === p.assetId);
          return (
            <li key={p.id} className={cn("flex items-center gap-2 rounded-xl px-2 py-1.5", selectedId === p.id ? "bg-secondary" : "hover:bg-muted")}>
              <button className="flex flex-1 items-center gap-2 text-left text-sm" onClick={() => onSelect(p.id)}>
                {a && <img src={a.src} alt="" className="h-8 w-8 object-contain" style={effectStyle(a.effect)} />}{a?.name}
              </button>
              <button aria-label="Bring forward" onClick={() => move(p.id, 1)} className="rounded-full p-1 hover:bg-card"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button aria-label="Send backward" onClick={() => move(p.id, -1)} className="rounded-full p-1 hover:bg-card"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button aria-label="Delete" onClick={() => updateDesign((d) => ({ ...d, placements: d.placements.filter((x) => x.id !== p.id) }))} className="rounded-full p-1 hover:bg-card"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
