import { useState } from "react";
import { Crop, Expand, Grid3x3, Loader2, Maximize, Paintbrush, Palette, Scan, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { PALETTES } from "@/data/catalog";
import { getState, pushHistory, updateDesign, useComo } from "@/lib/como/store";
import type { EditOperation } from "@/lib/como/services";
import { refineArtwork, rootOf, applyArtwork } from "./generation";
import { ArtThumb } from "./ArtworkPanel";
import { Label, Section } from "./ui";
import { cn } from "@/lib/utils";

const QUICK = ["Softer colors", "More minimal", "Larger motifs", "Smaller motifs", "More open space", "Different composition"];

const ADVANCED: { op: EditOperation; label: string; icon: typeof Wand2; desc: string }[] = [
  { op: "editPatternRegion", label: "Change one area", icon: Paintbrush, desc: "Pick a spot and describe the change" },
  { op: "recolorPattern", label: "Recolor", icon: Palette, desc: "Apply a palette to this artwork" },
  { op: "cropPattern", label: "Crop & frame", icon: Crop, desc: "Zoom and reposition" },
  { op: "extendScene", label: "Extend scene", icon: Expand, desc: "Grow the scene beyond its edges" },
  { op: "extendPattern", label: "Extend pattern", icon: Maximize, desc: "Continue the repeat outward" },
  { op: "makeSeamless", label: "Make seamless", icon: Grid3x3, desc: "Square, tileable repeat" },
  { op: "fixPatternDetails", label: "Fix details", icon: Scan, desc: "Tidy malformed shapes" },
];

export function RefinePanel() {
  const artworks = useComo((s) => s.artworks);
  const current = useComo((s) => artworks[s.design.artworkId]);
  const fit = useComo((s) => s.design.fit);
  const busy = Object.values(artworks).some((a) => a.status === "running" && a.parentId);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<EditOperation | null>(null);
  const [region, setRegion] = useState<number | null>(null);
  const [regionText, setRegionText] = useState("");
  const [palette, setPalette] = useState(PALETTES[0]?.name ?? "");

  const run = (op: EditOperation, args: Parameters<typeof refineArtwork>[1]) => refineArtwork(op, args);
  const setFit = (patch: Partial<typeof fit>, record: boolean) => updateDesign((d) => ({ ...d, fit: { ...d.fit, ...patch } }), record);

  return (
    <div className="space-y-6">
      <Section title="What would you like to change?">
        <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { run("editPattern", { instruction: text }); setText(""); } }} className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. add a few more small flowers" className="rounded-full bg-card" maxLength={1000} />
          <Button type="submit" disabled={busy || !text.trim()} className="rounded-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}</Button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button key={q} disabled={busy} onClick={() => run("editPattern", { instruction: q })} className="rounded-full border px-3 py-1 text-xs transition hover:border-primary disabled:opacity-50">{q}</button>
          ))}
        </div>
        {busy && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Reworking your artwork — your original is kept safe.</p>}
      </Section>

      <Section title="More ways to refine">
        <div className="grid grid-cols-2 gap-1.5">
          {ADVANCED.map(({ op, label, icon: Icon, desc }) => (
            <button key={op} disabled={busy}
              onClick={() => (["editPatternRegion", "recolorPattern", "cropPattern"].includes(op) ? setMode(mode === op ? null : op) : run(op, {}))}
              className={cn("rounded-xl border p-2.5 text-left transition hover:border-primary disabled:opacity-50", mode === op && "border-primary bg-sage/40")}>
              <Icon className="mb-1 h-4 w-4 text-accent" />
              <p className="text-xs font-medium">{label}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>

        {mode === "editPatternRegion" && current && (
          <div className="mt-3 rounded-2xl bg-card p-3">
            <Label>Tap the area to change</Label>
            <div className="relative mx-auto aspect-[148/210] w-32 overflow-hidden rounded-lg">
              <div className="absolute inset-0" style={{ backgroundImage: `url(${current.render.src})`, backgroundSize: "cover", filter: current.render.filter }} />
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <button key={i} onClick={() => setRegion(i)} className={cn("border border-card/40 transition", region === i ? "bg-primary/40" : "hover:bg-card/30")} aria-label={`Area ${i + 1}`} />
                ))}
              </div>
            </div>
            <Input value={regionText} onChange={(e) => setRegionText(e.target.value)} placeholder="What should change here?" className="mt-2" />
            <Button size="sm" className="mt-2 w-full rounded-full" disabled={region === null || !regionText.trim() || busy}
              onClick={() => { run("editPatternRegion", { region: region!, instruction: regionText }); setMode(null); setRegion(null); setRegionText(""); }}>
              Change this area
            </Button>
          </div>
        )}

        {mode === "recolorPattern" && (
          <div className="mt-3 rounded-2xl bg-card p-3">
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTES.map((p) => (
                <button key={p.name} onClick={() => setPalette(p.name)} className={cn("rounded-lg border p-1.5 text-left text-[11px]", palette === p.name && "border-primary")}>
                  <div className="mb-1 flex h-3 overflow-hidden rounded-full">{p.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>{p.name}
                </button>
              ))}
            </div>
            <Button size="sm" className="mt-2 w-full rounded-full" disabled={busy} onClick={() => { run("recolorPattern", { colors: PALETTES.find((p) => p.name === palette)!.colors }); setMode(null); }}>Recolor artwork</Button>
          </div>
        )}

        {mode === "cropPattern" && (
          <CropControls fit={fit} setFit={setFit} />
        )}
      </Section>
    </div>
  );
}

function CropControls({ fit, setFit }: { fit: { zoom: number; offsetX: number; offsetY: number }; setFit: (p: Partial<typeof fit>, r: boolean) => void }) {
  const begin = () => pushHistory(getState().design);
  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-card p-3" onPointerDown={begin}>
      {([["zoom", "Zoom", 1, 2.5, 0.05], ["offsetX", "Left / right", -50, 50, 1], ["offsetY", "Up / down", -50, 50, 1]] as const).map(([k, label, min, max, step]) => (
        <div key={k}>
          <Label>{label}</Label>
          <Slider min={min} max={max} step={step} value={[fit[k]]} onValueChange={([v]) => setFit({ [k]: v }, false)} />
        </div>
      ))}
      <button className="text-xs text-primary" onClick={() => setFit({ zoom: 1, offsetX: 0, offsetY: 0 }, true)}>Reset framing</button>
    </div>
  );
}

export function VersionHistory() {
  const artworks = useComo((s) => s.artworks);
  const currentId = useComo((s) => s.design.artworkId);
  const favorites = useComo((s) => s.favorites);
  const root = rootOf(currentId);
  const versions = Object.values(artworks)
    .filter((a) => rootOf(a.id) === root)
    .sort((a, b) => a.createdAt - b.createdAt);

  return (
    <Section title="Versions" hint="Your original is always kept">
      <div className="grid grid-cols-3 gap-2">
        {versions.map((a, i) => (
          <ArtThumb key={a.id} a={{ ...a, label: i === 0 ? "Original" : a.label }} active={a.id === currentId} fav={favorites.includes(a.id)} onClick={() => applyArtwork(a.id)} />
        ))}
      </div>
    </Section>
  );
}
