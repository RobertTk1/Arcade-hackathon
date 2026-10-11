import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BookOpen, HeartHandshake, Leaf, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalCover } from "@/components/como/JournalCover";
import { JournalMockup } from "@/components/como/JournalMockup";
import { PromptsDialog } from "@/components/como/PromptsDialog";
import { useComo } from "@/lib/como/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your Journal — Como" },
      { name: "description", content: "A 30-day guided journal shaped around what you've been exploring with Como. The inside is ready. The cover is yours to create." },
      { property: "og:title", content: "Your Journal — Como" },
      { property: "og:description", content: "A personal 30-day guided journal, made for you and made yours by you." },
    ],
  }),
  component: YourJournal,
});

const TOPICS = [
  { icon: Leaf, title: "Finding comfort during stress", body: "Reflections about emotional needs and the role food can play." },
  { icon: HeartHandshake, title: "Being kinder to yourself", body: "Prompts exploring guilt, expectations, and self-compassion." },
  { icon: Sprout, title: "Building your own ways forward", body: "Reflections about support, coping, and everyday care." },
];

function YourJournal() {
  const [open, setOpen] = useState(false);
  const count = useComo((s) => s.promptIds.length);
  const title = useComo((s) => s.design.title);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="font-serif text-2xl font-medium tracking-tight">como</span>
        <span className="text-sm text-muted-foreground">Journal Studio</span>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-2 sm:px-8 md:grid-cols-[1.05fr_1fr] md:gap-16 md:pt-10">
        <section className="order-2 md:order-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">A journal made for you</p>
          <h1 className="mt-3 text-4xl font-medium leading-[1.08] sm:text-5xl md:text-[3.6rem]">
            Maya, we've made something <em className="text-primary">just for you.</em>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            A personal journal shaped around the things you've been exploring with Como. The inside is ready. The cover is yours to create.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <Link to="/studio">Make it mine <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-full px-6 text-base"><Link to="/inside">
              <BookOpen className="h-4 w-4" /> See what's inside</Link>
            </Button>
          </div>

          <div className="mt-12 rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-medium">Thoughtfully chosen for you</h2>
            <ul className="mt-4 space-y-4">
              {TOPICS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage/60 text-primary"><Icon className="h-4 w-4" /></span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">
              These are based on the themes in your sample Como profile. You can adjust what's included.
            </p>
          </div>
        </section>

        <section className="order-1 md:order-2">
          <div className="relative mx-auto max-w-[340px] md:max-w-[400px]">
            <div className="absolute -inset-10 -z-10 rounded-[45%] bg-blush/60 blur-2xl" />
            <JournalMockup angled>
              <JournalCover />
            </JournalMockup>
          </div>
          <div className="mx-auto mt-8 max-w-sm text-center">
            <p className="font-serif text-lg italic">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {count} guided reflections · five chapters. We've brought together reflections around stress, emotional comfort, self-kindness, and everyday ways of caring for yourself.
            </p>
          </div>
        </section>
      </main>
      <PromptsDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
