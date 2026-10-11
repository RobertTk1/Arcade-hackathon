import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen, Bookmark, Redo2, Smile, Sparkles, Type, Undo2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JournalCover } from "@/components/como/JournalCover";
import { JournalMockup } from "@/components/como/JournalMockup";
import { PromptsDialog } from "@/components/como/PromptsDialog";
import { ArtworkPanel, ArtworkResults } from "@/components/como/studio/ArtworkPanel";
import { RefinePanel, VersionHistory } from "@/components/como/studio/RefinePanel";
import { TextPanel } from "@/components/como/studio/TextPanel";
import { LayerList, StickerPanel } from "@/components/como/studio/StickerPanel";
import { redo, setState, uid, undo, updateDesign, useComo } from "@/lib/como/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Cover Studio — Como" },
      { name: "description", content: "Design your journal cover with artwork, lettering, and stickers made from the things you love." },
      { property: "og:title", content: "Cover Studio — Como" },
      { property: "og:description", content: "A little color, a meaningful image, a favorite memory — create a cover that feels like you." },
    ],
  }),
  component: Studio,
});

type Tool = "artwork" | "refine" | "text" | "stickers";
const TOOLS: { id: Tool; label: string; icon: typeof Sparkles }[] = [
  { id: "artwork", label: "Artwork", icon: Sparkles },
  { id: "refine", label: "Refine", icon: Wand2 },
  { id: "text", label: "Title", icon: Type },
  { id: "stickers", label: "Stickers", icon: Smile },
];

function Studio() {
  const [tool, setTool] = useState<Tool>("artwork");
  const [selected, setSelected] = useState<string | null>(null);
  const [mockup, setMockup] = useState(false);
  const [prompts, setPrompts] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const canUndo = useComo((s) => s.past.length > 0);
  const canRedo = useComo((s) => s.future.length > 0);
  const count = useComo((s) => s.promptIds.length);
  const saved = useComo((s) => s.savedDesigns);

  const saveDraft = () => {
    setState((s) => ({ savedDesigns: [{ id: uid(), name: s.design.title, design: s.design, savedAt: Date.now() }, ...s.savedDesigns] }));
    toast.success("Draft saved");
  };

  const panel = tool === "artwork" ? <ArtworkPanel /> : tool === "refine" ? <RefinePanel /> : tool === "text" ? <TextPanel /> : <StickerPanel onSelect={(id) => { setSelected(id); setMockup(false); }} />;
  const context = tool === "artwork" ? <ArtworkResults /> : tool === "refine" ? <VersionHistory /> : tool === "stickers" ? <LayerList selectedId={selected} onSelect={setSelected} /> : null;

  const inside = (
    <button onClick={() => setPrompts(true)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-[var(--shadow-soft)]">
      <BookOpen className="h-5 w-5 text-accent" />
      <div className="flex-1"><p className="text-sm font-medium">Inside your journal · {count} reflections</p><p className="text-xs text-primary">Preview and adjust</p></div>
    </button>
  );

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex items-center gap-2 border-b bg-background/90 px-3 py-2.5 sm:px-5">
        <Button asChild variant="ghost" size="icon" className="rounded-full"><Link to="/" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-medium leading-tight sm:text-xl">Make it yours</h1>
          <p className="hidden truncate text-xs text-muted-foreground md:block">A little color, a meaningful image, a favorite memory — create a cover that feels like you.</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" disabled={!canUndo} onClick={undo} aria-label="Undo"><Undo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="rounded-full" disabled={!canRedo} onClick={redo} aria-label="Redo"><Redo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSavedOpen(true)} aria-label="Saved designs"><Bookmark className="h-4 w-4" /></Button>
        <Button asChild variant="ghost" className="hidden rounded-full md:inline-flex"><Link to="/inside">Inside pages</Link></Button>
        <Button variant="secondary" className="hidden rounded-full sm:inline-flex" onClick={saveDraft}>Save draft</Button>
        <Button asChild className="rounded-full"><Link to="/inside">Next<span className="hidden sm:inline">: Inside pages</span></Link></Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[340px_1fr_300px]">
        {/* Left: tools (desktop) */}
        <aside className="hidden min-h-0 flex-col border-r md:flex">
          <ToolTabs tool={tool} setTool={setTool} />
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{panel}</div>
          <div className="border-t p-3">{inside}</div>
        </aside>

        {/* Center: preview */}
        <main className="relative flex min-h-0 shrink-0 flex-col items-center justify-center bg-secondary/50 px-6 py-4 md:flex-1 md:py-8" onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="w-[min(52vw,230px)] sm:w-[260px] md:w-[min(100%,calc((100dvh-220px)*0.705),440px)]">
            {mockup ? (
              <JournalMockup angled><JournalCover /></JournalMockup>
            ) : (
              <div className="rounded-[4px] shadow-[var(--shadow-book)]">
                <JournalCover editable selectedId={selected} onSelect={setSelected} onTitleClick={() => setTool("text")} />
              </div>
            )}
          </div>
          <div className="mt-4 inline-flex rounded-full bg-card p-1 text-xs shadow-sm">
            {[["Edit", false], ["Journal view", true]].map(([l, v]) => (
              <button key={String(l)} onClick={() => setMockup(v as boolean)} className={cn("rounded-full px-3 py-1", mockup === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{l as string}</button>
            ))}
          </div>
        </main>

        {/* Right: context (desktop) */}
        <aside className="hidden min-h-0 overflow-y-auto border-l p-5 md:block">
          {context ?? <p className="text-sm text-muted-foreground">Tap your title on the cover to edit it directly.</p>}
        </aside>

        {/* Mobile bottom sheet */}
        <div className="flex min-h-0 flex-1 flex-col rounded-t-3xl border-t bg-background shadow-[var(--shadow-soft)] md:hidden">
          <ToolTabs tool={tool} setTool={setTool} />
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            {context && tool === "artwork" && context}
            {panel}
            {context && tool !== "artwork" && context}
            {inside}
          </div>
        </div>
      </div>

      <PromptsDialog open={prompts} onOpenChange={setPrompts} />
      <Dialog open={savedOpen} onOpenChange={setSavedOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif text-2xl font-medium">Saved designs</DialogTitle></DialogHeader>
          {saved.length === 0 ? <p className="text-sm text-muted-foreground">Nothing saved yet. Use “Save draft” to keep a version.</p> : (
            <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto">
              {saved.map((s) => (
                <div key={s.id}>
                  <button className="w-full overflow-hidden rounded-md shadow-[var(--shadow-soft)]" onClick={() => { updateDesign(() => s.design); setSavedOpen(false); toast("Design restored"); }}>
                    <JournalCover design={s.design} />
                  </button>
                  <p className="mt-1 truncate text-xs">{s.name}</p>
                  <button className="text-[11px] text-muted-foreground hover:text-destructive" onClick={() => setState((st) => ({ savedDesigns: st.savedDesigns.filter((x) => x.id !== s.id) }))}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolTabs({ tool, setTool }: { tool: Tool; setTool: (t: Tool) => void }) {
  return (
    <nav className="flex gap-1 border-b px-3 py-2">
      {TOOLS.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => setTool(id)} className={cn("flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] transition", tool === id ? "bg-sage/50 text-primary" : "text-muted-foreground hover:bg-muted")}>
          <Icon className="h-4 w-4" />{label}
        </button>
      ))}
    </nav>
  );
}
