import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Physical-product presentation wrapper around the flat cover composition. */
export function JournalMockup({ children, angled, className }: { children: ReactNode; angled?: boolean; className?: string }) {
  return (
    <div className={cn("relative", className)} style={{ perspective: angled ? "1600px" : undefined }}>
      <div
        className="relative transition-transform duration-700"
        style={{ transform: angled ? "rotateY(-22deg) rotateX(6deg) rotateZ(1deg)" : undefined, transformStyle: "preserve-3d" }}
      >
        {/* page block peeking out */}
        <div className="absolute inset-y-[1.2%] -right-[2.2%] left-[3%] rounded-r-[6px] bg-card shadow-[var(--shadow-book)]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 2px, color-mix(in oklab, var(--border) 70%, transparent) 2px 3px)" }} />
        <div className="relative overflow-hidden rounded-r-[8px] rounded-l-[3px] shadow-[var(--shadow-book)]">
          {children}
          {/* spine / binding */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[7%]" style={{ background: "linear-gradient(90deg, rgba(40,30,20,.32), rgba(40,30,20,.08) 45%, rgba(255,255,255,.18) 60%, transparent)" }} />
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,.18), transparent 40%, rgba(0,0,0,.06))" }} />
        </div>
        {/* elastic band */}
        <div className="pointer-events-none absolute inset-y-0 right-[9%] w-[2.2%] rounded-sm bg-primary/85 shadow-sm" />
      </div>
    </div>
  );
}
