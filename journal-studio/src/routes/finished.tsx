import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JournalCover } from "@/components/como/JournalCover";
import { JournalMockup } from "@/components/como/JournalMockup";
import { PromptsDialog } from "@/components/como/PromptsDialog";
import { CHAPTERS } from "@/data/journal";
import { selectedPrompts, setState, uid, useComo } from "@/lib/como/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/finished")({
  head: () => ({
    meta: [
      { title: "Your Finished Journal — Como" },
      { name: "description", content: "Review your personalized Como journal: your cover, your title, and your curated reflections." },
      { property: "og:title", content: "Your Finished Journal — Como" },
      { property: "og:description", content: "A journal that's entirely yours." },
    ],
  }),
  component: Finished,
});

type View = "front" | "angled" | "inside";

function Finished() {
  const [view, setView] = useState<View>("angled");
  const [open, setOpen] = useState(false);
  const design = useComo((s) => s.design);
  const promptIds = useComo((s) => s.promptIds);
  const extra = useComo((s) => s.extraPrompts);
  const prompts = useMemo(() => selectedPrompts({ promptIds, extraPrompts: extra }), [promptIds, extra]);
  const first = prompts[0];

  const save = () => {
    setState((s) => ({ savedDesigns: [{ id: uid(), name: s.design.title, design: s.design, savedAt: Date.now() }, ...s.savedDesigns] }));
    toast.success("Design saved");
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/inside" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to inside pages</Link>
        <span className="font-serif text-2xl font-medium">como</span>
        <span className="w-24" />
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 sm:px-8 md:grid-cols-2 md:gap-16">
        <section>
          <div className="relative mx-auto flex min-h-[460px] max-w-[360px] items-center justify-center sm:min-h-[540px]">
            <div className="absolute inset-0 -z-10 rounded-[40%] bg-sage/40 blur-3xl" />
            {view !== "inside" ? (
              <JournalMockup angled={view === "angled"} className="w-full">
                <JournalCover />
              </JournalMockup>
            ) : first ? (
              <div className="aspect-[148/210] w-full rounded-r-lg rounded-l-sm bg-card p-[9%] shadow-[var(--shadow-book)]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Chapter {first.chapter} · {CHAPTERS[first.chapter - 1]?.title ?? ""}</p>
                <p className="mt-5 font-serif text-sm italic text-accent">Day 1</p>
                <h3 className="font-serif text-2xl leading-tight">{first.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{first.body}</p>
                <div className="mt-6 space-y-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-px bg-border" />)}</div>
              </div>
            ) : null}
          </div>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex rounded-full bg-muted p-1 text-sm">
              {(["front", "angled", "inside"] as View[]).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn("rounded-full px-4 py-1.5 capitalize transition", view === v ? "bg-card shadow-sm" : "text-muted-foreground")}>
                  {v === "front" ? "Front cover" : v === "angled" ? "Journal" : "Inside page"}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h1 className="text-4xl font-medium leading-tight sm:text-5xl">A journal that's entirely yours.</h1>
          <p className="mt-4 text-lg text-muted-foreground">Thoughtfully made for where you are, and decorated with the things that matter to you.</p>
          <div className="mt-8 rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-medium">Your journal includes</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Your custom cover",
                `Your personalized title — “${design.title}”`,
                `Your chosen decorations — ${design.placements.length} sticker${design.placements.length === 1 ? "" : "s"}`,
                `Your curated collection of ${prompts.length} journal prompts`,
              ].map((t) => (
                <li key={t} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t}</li>
              ))}
            </ul>
          </div>
          <Button size="lg" className="mt-8 h-12 w-full rounded-full text-base sm:w-auto sm:px-10" onClick={() => toast("Ordering and printing will be available when production is connected.")}>
            Continue to order
          </Button>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="rounded-full"><Link to="/studio">Edit cover</Link></Button>
            <Button asChild variant="secondary" className="rounded-full"><Link to="/inside">View inside pages</Link></Button>
            <Button variant="secondary" className="rounded-full" onClick={save}>Save design</Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">This preview shows your design; final print artwork is prepared separately.</p>
        </section>
      </main>
      <PromptsDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
