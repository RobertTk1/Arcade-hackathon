import { useRef, useState } from "react";
import { Heart, ImagePlus, Loader2, RefreshCw, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ALL_STYLES, CURATED_STYLES, DIRECTIONS, PALETTES } from "@/data/catalog";
import { MAX_PROMPT } from "@/lib/como/services";
import { setState, uid, useComo } from "@/lib/como/store";
import type { ArtworkAsset } from "@/lib/como/types";
import { ArtworkLayer } from "../JournalCover";
import { applyArtwork, generateIdeas, retryCandidate, toggleFavorite } from "./generation";
import { cn } from "@/lib/utils";
import { Label, Section } from "./ui";

export function ArtworkPanel() {
  const g = useComo((s) => s.genInput);
  const refs = useComo((s) => s.references);
  const batches = useComo((s) => s.batches);
  const artworks = useComo((s) => s.artworks);
  const busy = batches[0]?.candidateIds.some((id) => artworks[id]?.status === "running");
  const [allOpen, setAllOpen] = useState(false);
  const [q, setQ] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const set = (patch: Partial<typeof g>) => setState((s) => ({ genInput: { ...s.genInput, ...patch } }));

  const addFiles = (files: FileList | File[]) => {
    Array.from(files).filter((f) => f.type.startsWith("image/")).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = { id: uid(), name: f.name, dataUrl: String(reader.result), mimeType: f.type, size: f.size };
        setState((s) => {
          if (replaceId) return { references: s.references.map((r) => (r.id === replaceId ? img : r)) };
          return { references: [...s.references, img].slice(0, 3) };
        });
        setReplaceId(null);
      };
      reader.readAsDataURL(f);
    });
  };

  const styleChoices = g.styleName && !CURATED_STYLES.includes(g.styleName) ? [g.styleName, ...CURATED_STYLES.slice(0, 5)] : CURATED_STYLES;

  return (
    <div className="space-y-6">
      <Section title="What would you like your cover to look like?">
        <Textarea
          value={g.prompt}
          maxLength={MAX_PROMPT}
          onChange={(e) => set({ prompt: e.target.value })}
          className="min-h-[110px] resize-none rounded-2xl bg-card text-[15px] leading-relaxed"
        />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">{g.prompt.length}/{MAX_PROMPT}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {DIRECTIONS.map((d) => (
            <button key={d.label} onClick={() => set({ prompt: d.prompt, styleName: d.style })}
              className={cn("rounded-full border px-3 py-1 text-xs transition hover:border-primary", g.prompt === d.prompt && "border-primary bg-sage/40")}>
              {d.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Artistic style">
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => set({ styleName: null })} className={cn("rounded-xl border px-3 py-2 text-left text-xs", g.styleName === null && "border-primary bg-sage/40")}>
            <Sparkles className="mb-0.5 h-3.5 w-3.5 text-accent" />Let Arcade choose
          </button>
          {styleChoices.map((s) => (
            <button key={s} onClick={() => set({ styleName: s })} className={cn("rounded-xl border px-3 py-2 text-left text-xs", g.styleName === s && "border-primary bg-sage/40")}>{s}</button>
          ))}
        </div>
        <button onClick={() => setAllOpen(true)} className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline">Explore all styles</button>
      </Section>

      <Section title="Colors" hint="Optional">
        <div className="grid grid-cols-2 gap-1.5">
          {PALETTES.map((p) => (
            <button key={p.name} onClick={() => set(g.paletteName === p.name ? { paletteName: null, colors: [] } : { paletteName: p.name, colors: p.colors })}
              className={cn("rounded-xl border p-2 text-left text-xs", g.paletteName === p.name && "border-primary bg-sage/40")}>
              <div className="mb-1.5 flex h-4 overflow-hidden rounded-full">{p.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
              {p.name}
            </button>
          ))}
        </div>
        <button onClick={() => setAdvanced(!advanced)} className="mt-2 text-xs font-medium text-primary">{advanced ? "Hide" : "Adjust colors individually"}</button>
        {advanced && (
          <div className="mt-2 flex flex-wrap gap-2">
            {g.colors.map((c, i) => (
              <label key={i} className="relative">
                <input type="color" value={c} onChange={(e) => set({ colors: g.colors.map((x, j) => (j === i ? e.target.value.toUpperCase() : x)), paletteName: "Custom" })} className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                <button aria-label="Remove color" onClick={() => set({ colors: g.colors.filter((_, j) => j !== i) })} className="absolute -right-1 -top-1 rounded-full bg-card p-0.5 shadow"><X className="h-2.5 w-2.5" /></button>
              </label>
            ))}
            {g.colors.length < 10 && (
              <button onClick={() => set({ colors: [...g.colors, "#B8C4A4"], paletteName: "Custom" })} className="h-8 w-8 rounded-full border border-dashed text-sm text-muted-foreground">+</button>
            )}
          </div>
        )}
      </Section>

      <Section title="Inspiration images" hint={`${refs.length}/3`}>
        <p className="mb-2 text-xs text-muted-foreground">Add an image whose colors, textures, or style you'd like to inspire your cover.</p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="grid grid-cols-3 gap-2"
        >
          {refs.map((r) => (
            <div key={r.id} className="group relative aspect-square overflow-hidden rounded-xl">
              <img src={r.dataUrl} alt={r.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-foreground/50 to-transparent p-1 opacity-0 transition group-hover:opacity-100">
                <button className="rounded-full bg-card px-2 py-0.5 text-[10px]" onClick={() => { setReplaceId(r.id); fileRef.current?.click(); }}>Replace</button>
                <button aria-label="Remove" className="rounded-full bg-card p-1" onClick={() => setState((s) => ({ references: s.references.filter((x) => x.id !== r.id) }))}><X className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
          {refs.length < 3 && (
            <button onClick={() => { setReplaceId(null); fileRef.current?.click(); }} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-[11px] text-muted-foreground hover:border-primary">
              <ImagePlus className="h-4 w-4" />Drop or choose
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { e.target.files && addFiles(e.target.files); e.target.value = ""; }} />
      </Section>

      <Button onClick={generateIdeas} disabled={busy} size="lg" className="sticky bottom-2 h-12 w-full rounded-full text-base shadow-[var(--shadow-soft)]">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Creating your ideas…</> : <><Sparkles className="h-4 w-4" />Generate cover ideas</>}
      </Button>

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">All styles</DialogTitle>
            <DialogDescription>Each style shapes how your artwork is drawn.</DialogDescription>
          </DialogHeader>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search styles" className="pl-9" /></div>
          <div className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {ALL_STYLES.filter((s) => s.toLowerCase().includes(q.toLowerCase())).map((s) => (
              <button key={s} onClick={() => { set({ styleName: s }); setAllOpen(false); }} className={cn("rounded-xl border px-3 py-3 text-left text-sm hover:border-primary", g.styleName === s && "border-primary bg-sage/40")}>{s}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ArtThumb({ a, active, onClick, fav }: { a: ArtworkAsset; active?: boolean; onClick?: () => void; fav?: boolean }) {
  return (
    <div className={cn("group relative aspect-[148/210] overflow-hidden rounded-xl ring-offset-2 ring-offset-background transition", active ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border")}>
      {a.status === "succeeded" ? (
        <button onClick={onClick} className="absolute inset-0" aria-label={`Use ${a.label}`}><ArtworkLayer art={a} /></button>
      ) : a.status === "failed" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted p-2 text-center text-[11px] text-muted-foreground">
          {a.error ?? "Something went wrong."}
          <Button size="sm" variant="secondary" className="h-7 rounded-full text-xs" onClick={() => retryCandidate(a.id)}><RefreshCw className="h-3 w-3" />Retry</Button>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary text-[11px] text-muted-foreground">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-blush/50 via-transparent to-sage/50" />
          <Loader2 className="relative h-4 w-4 animate-spin" /><span className="relative">Painting…</span>
        </div>
      )}
      {a.status === "succeeded" && (
        <button aria-label="Save as favorite" onClick={() => toggleFavorite(a.id)} className="absolute right-1.5 top-1.5 rounded-full bg-card/90 p-1.5 shadow-sm">
          <Heart className={cn("h-3 w-3", fav ? "fill-accent text-accent" : "text-muted-foreground")} />
        </button>
      )}
      <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-card/90 px-2 py-0.5 text-[10px]">{a.label}</span>
    </div>
  );
}

export function ArtworkResults() {
  const batches = useComo((s) => s.batches);
  const artworks = useComo((s) => s.artworks);
  const favorites = useComo((s) => s.favorites);
  const current = useComo((s) => s.design.artworkId);
  const [showAll, setShowAll] = useState(false);
  const latest = batches[0];
  const busy = latest?.candidateIds.some((id) => artworks[id]?.status === "running");

  return (
    <div className="space-y-6">
      {latest && (
        <Section title="Cover ideas">
          <div className="grid grid-cols-2 gap-2.5">
            {latest.candidateIds.map((id) => artworks[id] && (
              <ArtThumb key={id} a={artworks[id]} active={current === id} fav={favorites.includes(id)} onClick={() => applyArtwork(id)} />
            ))}
          </div>
          <Button variant="secondary" disabled={busy} onClick={generateIdeas} className="mt-3 w-full rounded-full"><RefreshCw className="h-4 w-4" />Generate more variations</Button>
        </Section>
      )}
      {favorites.length > 0 && (
        <Section title="Favorites">
          <div className="grid grid-cols-3 gap-2">
            {favorites.map((id) => artworks[id] && <ArtThumb key={id} a={artworks[id]} active={current === id} fav onClick={() => applyArtwork(id)} />)}
          </div>
        </Section>
      )}
      {batches.length > 1 && (
        <Section title="Earlier ideas">
          {(showAll ? batches.slice(1) : batches.slice(1, 3)).map((b) => (
            <div key={b.id} className="mb-3">
              <p className="mb-1 line-clamp-1 text-[11px] text-muted-foreground">{b.styleName ?? "Arcade's choice"} · {b.prompt}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {b.candidateIds.map((id) => artworks[id] && <ArtThumb key={id} a={artworks[id]} active={current === id} fav={favorites.includes(id)} onClick={() => applyArtwork(id)} />)}
              </div>
            </div>
          ))}
          {batches.length > 3 && <button className="text-xs font-medium text-primary" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : `Show all ${batches.length - 1}`}</button>}
        </Section>
      )}
    </div>
  );
}

export { Label };
