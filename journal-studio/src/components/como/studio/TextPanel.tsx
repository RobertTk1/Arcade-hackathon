import { AlignCenter, AlignLeft, AlignRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TITLE_SUGGESTIONS } from "@/data/catalog";
import { getState, pushHistory, updateDesign, useComo } from "@/lib/como/store";
import type { FontStyle, Typography } from "@/lib/como/types";
import { Label, Section } from "./ui";
import { cn } from "@/lib/utils";

const FONTS: { id: FontStyle; label: string; family: string }[] = [
  { id: "serif", label: "Classic", family: "var(--font-serif)" },
  { id: "sans", label: "Modern", family: "var(--font-sans)" },
  { id: "script", label: "Handwritten", family: "var(--font-script)" },
];
const INK = ["#33402F", "#2B2622", "#6E4644", "#22445E", "#4C4566", "#FAF6EE"];

export function TextPanel() {
  const d = useComo((s) => s.design);
  const t = d.typography;
  const setT = (patch: Partial<Typography>, record = true) => updateDesign((x) => ({ ...x, typography: { ...x.typography, ...patch } }), record);
  const setField = (k: "title" | "subtitle" | "initials", v: string) => updateDesign((x) => ({ ...x, [k]: v }), false);
  const begin = () => pushHistory(getState().design);

  return (
    <div className="space-y-6">
      <Section title="Title">
        <Input value={d.title} maxLength={40} onFocus={begin} onChange={(e) => setField("title", e.target.value)} className="rounded-xl bg-card font-serif text-base" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TITLE_SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => updateDesign((x) => ({ ...x, title: s }))} className={cn("rounded-full border px-3 py-1 font-serif text-xs italic hover:border-primary", d.title === s && "border-primary bg-sage/40")}>{s}</button>
          ))}
        </div>
      </Section>
      <Section title="Subtitle" hint="Optional">
        <Input value={d.subtitle} maxLength={110} onFocus={begin} onChange={(e) => setField("subtitle", e.target.value)} className="rounded-xl bg-card" placeholder="A line beneath your title" />
      </Section>
      <Section title="Name or initials" hint="Optional">
        <Input value={d.initials} maxLength={24} onFocus={begin} onChange={(e) => setField("initials", e.target.value)} className="rounded-xl bg-card" placeholder="e.g. Maya" />
      </Section>

      <Section title="Lettering">
        <div className="grid grid-cols-3 gap-1.5">
          {FONTS.map((f) => (
            <button key={f.id} onClick={() => setT({ font: f.id })} className={cn("rounded-xl border px-2 py-2.5 text-center", t.font === f.id && "border-primary bg-sage/40")}>
              <span className="block text-lg leading-none" style={{ fontFamily: f.family }}>Aa</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-4" onPointerDown={begin}>
          <div><Label>Size</Label><Slider min={7} max={16} step={0.5} value={[t.size]} onValueChange={([v]) => setT({ size: v ?? t.size }, false)} /></div>
          <div><Label>Position on cover</Label><Slider min={14} max={86} step={1} value={[t.vertical]} onValueChange={([v]) => setT({ vertical: v ?? t.vertical }, false)} /></div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {INK.map((c) => (
              <button key={c} aria-label={`Text color ${c}`} onClick={() => setT({ color: c })} className={cn("h-7 w-7 rounded-full border-2", t.color === c ? "border-primary" : "border-card")} style={{ background: c }} />
            ))}
          </div>
          <div className="flex rounded-full bg-muted p-0.5">
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
              <button key={a} aria-label={`Align ${a}`} onClick={() => setT({ align: a })} className={cn("rounded-full p-1.5", t.align === a && "bg-card shadow-sm")}><Icon className="h-3.5 w-3.5" /></button>
            ))}
          </div>
        </div>
      </Section>

      <div className="flex items-start justify-between gap-3 rounded-2xl bg-card p-3">
        <div className="flex gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium">Soft backing behind text</p>
            <p className="text-xs text-muted-foreground">Keeps your title easy to read on busy artwork.</p>
          </div>
        </div>
        <Switch checked={t.backing} onCheckedChange={(v) => setT({ backing: v })} />
      </div>
      <p className="text-[11px] text-muted-foreground">Tip: tap the title on the cover to edit it directly.</p>
    </div>
  );
}
