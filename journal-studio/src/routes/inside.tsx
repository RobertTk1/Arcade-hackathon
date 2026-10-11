import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InsideJournal } from "@/components/como/PromptsDialog";

export const Route = createFileRoute("/inside")({
  head: () => ({
    meta: [
      { title: "Inside Your Journal — Como" },
      { name: "description", content: "Flip through the interior pages and 30 personalized reflections of your Como journal." },
      { property: "og:title", content: "Inside Your Journal — Como" },
      { property: "og:description", content: "Flip through the interior pages and 30 personalized reflections of your Como journal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InsidePage,
});

function InsidePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <Button asChild variant="ghost" className="rounded-full">
          <Link to="/studio"><ArrowLeft className="h-4 w-4" />Cover studio</Link>
        </Button>
        <div className="flex-1" />
        <Button asChild className="rounded-full">
          <Link to="/finished">Review<span className="hidden sm:inline">&nbsp;finished journal</span><ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </header>
      <main className="mx-auto max-w-5xl">
        <InsideJournal />
        <div className="flex justify-end px-6 pb-12 sm:px-8">
          <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
            <Link to="/finished">Review finished journal <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
