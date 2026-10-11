import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHAPTERS, MAYA_PROMPTS } from "@/data/journal";
import { LIBRARY_PROMPTS } from "@/data/catalog";
import { selectedPrompts, setState, useComo } from "@/lib/como/store";
import { cn } from "@/lib/utils";

export function InsideJournal({ dialog = false }: { dialog?: boolean }) {
  const promptIds = useComo((s) => s.promptIds);
  const extra = useComo((s) => s.extraPrompts);
  const list = useMemo(() => selectedPrompts({ promptIds, extraPrompts: extra }), [promptIds, extra]);
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<"journal" | "library">("journal");
  const [q, setQ] = useState("");
  const removed = MAYA_PROMPTS.filter((p) => !promptIds.includes(p.id));
  const current = list[Math.min(page, list.length - 1)];
  const chapterOf = (n: number) => CHAPTERS.find((c) => c.number === n)!;

  const remove = (id: string) => setState((s) => ({ promptIds: s.promptIds.filter((x) => x !== id) }));
  const restore = (id: string) =>
    setState((s) => {
      const order = [...MAYA_PROMPTS.map((p) => p.id), ...s.extraPrompts.map((p) => p.id)];
      return { promptIds: [...s.promptIds, id].sort((a, b) => order.indexOf(a) - order.indexOf(b)) };
    });
  const add = (id: string) =>
    setState((s) => {
      const p = LIBRARY_PROMPTS.find((x) => x.id === id)!;
      const ids = [...s.promptIds];
      // insert after the last prompt of the same chapter
      const all = selectedPrompts(s);
      let idx = -1;
      all.forEach((x, i) => x.chapter <= p.chapter && (idx = i));
      ids.splice(idx + 1, 0, id);
      return { promptIds: ids, extraPrompts: s.extraPrompts.some((x) => x.id === id) ? s.extraPrompts : [...s.extraPrompts, p] };
    });

  const library = LIBRARY_PROMPTS.filter((p) => !promptIds.includes(p.id)).filter((p) =>
    `${p.title} ${p.body} ${chapterOf(p.chapter).title}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
        <div className="p-6 pb-0 sm:p-8 sm:pb-0">
          <Header dialog={dialog} count={list.length} />
          <div className="mt-5 inline-flex rounded-full bg-muted p-1 text-sm">
            {(["journal", "library"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 transition", tab === t ? "bg-card shadow-sm" : "text-muted-foreground")}>
                {t === "journal" ? "Your reflections" : "Add more"}
              </button>
            ))}
          </div>
        </div>

        {tab === "journal" ? (
          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_1fr]">
            {current ? (
              <div>
                <div className="relative aspect-[148/210] rounded-r-lg rounded-l-sm bg-card p-[8%] shadow-[var(--shadow-book)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Chapter {current.chapter} · {chapterOf(current.chapter).title}
                  </p>
                  <p className="mt-4 font-serif text-sm italic text-accent">{current.day ? `Day ${page + 1}` : `Day ${page + 1} · added`}</p>
                  <h3 className="mt-1 font-serif text-xl leading-tight">{current.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">{current.body}</p>
                  <div className="mt-5 space-y-[18px]">
                    {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-px bg-border" />)}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" />Previous</Button>
                  <span className="text-sm text-muted-foreground">{page + 1} / {list.length}</span>
                  <Button variant="ghost" size="sm" disabled={page >= list.length - 1} onClick={() => setPage(page + 1)}>Next<ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No reflections selected. Restore some below.</p>
            )}
            <div className={cn(dialog ? "max-h-[60vh]" : "max-h-[75vh]", "space-y-5 overflow-y-auto pr-1")}>
              {CHAPTERS.map((c) => {
                const items = list.map((p, i) => ({ p, i })).filter(({ p }) => p.chapter === c.number);
                return (
                  <div key={c.number}>
                    <p className="font-serif text-sm font-medium">Chapter {c.number} — {c.title}</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {items.map(({ p, i }) => (
                        <li key={p.id} className={cn("group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm", i === page ? "bg-secondary" : "hover:bg-muted")}>
                          <button className="flex-1 text-left" onClick={() => setPage(i)}>
                            <span className="mr-2 text-muted-foreground">{i + 1}</span>{p.title}
                          </button>
                          <button aria-label={`Remove ${p.title}`} onClick={() => { remove(p.id); setPage(Math.max(0, Math.min(page, list.length - 2))); }} className="rounded-full p-1 text-muted-foreground hover:bg-card hover:text-foreground">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {removed.length > 0 && (
                <div className="rounded-xl border border-dashed p-3">
                  <p className="text-sm font-medium">Set aside ({removed.length})</p>
                  <ul className="mt-1">
                    {removed.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-1 text-sm text-muted-foreground">
                        {p.title}
                        <button onClick={() => restore(p.id)} className="inline-flex items-center gap-1 text-primary"><RotateCcw className="h-3.5 w-3.5" />Restore</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reflections — comfort, rest, kindness…" className="pl-9" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {library.map((p) => (
                <div key={p.id} className="rounded-2xl border bg-card p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{chapterOf(p.chapter).title}</p>
                  <p className="mt-1 font-serif text-lg">{p.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                  <Button size="sm" variant="secondary" className="mt-3 rounded-full" onClick={() => add(p.id)}><Plus className="h-4 w-4" />Add to journal</Button>
                </div>
              ))}
              {library.length === 0 && <p className="text-sm text-muted-foreground">Nothing else matches — try another word.</p>}
            </div>
          </div>
        )}
    </div>
  );
}

export function PromptsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto bg-background p-0">
        <InsideJournal dialog />
      </DialogContent>
    </Dialog>
  );
}


function Header({ dialog, count }: { dialog: boolean; count: number }) {
  const eyebrow = <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Inside your journal · {count} reflections</p>;
  const desc = "These reflections explore the patterns you've shared with Como, including stress, comfort, and self-kindness.";
  if (dialog)
    return (
      <DialogHeader className="text-left">
        {eyebrow}
        <DialogTitle className="font-serif text-3xl font-medium">Chosen with you in mind</DialogTitle>
        <DialogDescription className="text-base">{desc}</DialogDescription>
      </DialogHeader>
    );
  return (
    <div>
      {eyebrow}
      <h1 className="mt-2 font-serif text-4xl font-medium">Inside Your Journal</h1>
      <p className="mt-2 max-w-xl text-base text-muted-foreground">{desc} Flip through each page, set aside what doesn't fit, or add more.</p>
    </div>
  );
}
