import { useRef, useState, type PointerEvent as RPE } from "react";
import { RotateCw, Copy, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useComo, updateDesign, pushHistory, getState, uid } from "@/lib/como/store";
import type { ArtworkAsset, CoverDesign, StickerAsset, StickerEffect } from "@/lib/como/types";
import { cn } from "@/lib/utils";

export const COVER_RATIO = 148 / 210;

const FONT: Record<string, string> = {
  serif: "var(--font-serif)",
  sans: "var(--font-sans)",
  script: "var(--font-script)",
};

export function effectStyle(effect?: StickerEffect): React.CSSProperties {
  switch (effect) {
    case "outline":
      return { filter: "drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 3px 4px rgba(60,40,30,.25))" };
    case "illustrated":
      return { filter: "saturate(1.4) contrast(1.15) sepia(0.15) drop-shadow(0 0 0 #fff) drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff)" };
    case "rounded":
      return { borderRadius: "18%", border: "3px solid #fff", objectFit: "cover", aspectRatio: "1", boxShadow: "0 3px 8px rgba(60,40,30,.25)" };
    case "cutout":
      return { filter: "drop-shadow(0 3px 4px rgba(60,40,30,.3))" };
    default:
      return { filter: "drop-shadow(0 1px 2px rgba(60,40,30,.15))" };
  }
}

export function ArtworkLayer({ art, fit }: { art?: ArtworkAsset | undefined; fit?: CoverDesign["fit"] | undefined }) {
  if (!art) return <div className="absolute inset-0 bg-secondary" />;
  const r = art.render;
  const zoom = fit?.zoom ?? 1;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundImage: `url(${r.src})`,
          backgroundSize: r.tileScale >= 1 ? `${r.tileScale * 100 * zoom}% auto` : `${r.tileScale * 100 * zoom}% auto`,
          backgroundRepeat: "repeat",
          backgroundPosition: fit ? `calc(${r.position.split(" ")[0]} + ${fit.offsetX}%) calc(${r.position.split(" ")[1] ?? "50%"} + ${fit.offsetY}%)` : r.position,
          filter: r.filter || undefined,
        }}
      />
      {r.tint && <div className="absolute inset-0 mix-blend-color" style={{ background: r.tint, opacity: r.tintOpacity }} />}
      {r.openSpace > 0 && (
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, #FAF6EE 20%, transparent 85%)", opacity: r.openSpace * 2 }} />
      )}
    </div>
  );
}

interface Props {
  design?: CoverDesign;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onTitleClick?: () => void;
  className?: string;
}

/** Flat 2D cover composition rendered from structured layers. */
export function JournalCover({ design: override, editable, selectedId, onSelect, onTitleClick, className }: Props) {
  const live = useComo((s) => s.design);
  const design = override ?? live;
  const artworks = useComo((s) => s.artworks);
  const stickers = useComo((s) => s.stickers);
  const ref = useRef<HTMLDivElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const t = design.typography;
  const art = artworks[design.artworkId];

  return (
    <div
      ref={ref}
      className={cn("relative w-full select-none overflow-hidden", className)}
      style={{ aspectRatio: `${COVER_RATIO}`, containerType: "inline-size" }}
      onPointerDown={(e) => {
        if (editable && e.target === e.currentTarget) onSelect?.(null);
      }}
    >
      <ArtworkLayer art={art} fit={design.fit} />
      {/* paper grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />

      {/* title block */}
      <div
        className="absolute px-[9%]"
        style={{ top: `${t.vertical}%`, left: 0, right: 0, transform: "translateY(-50%)", textAlign: t.align, zIndex: 5 }}
      >
        <div
          className={cn("inline-block max-w-full rounded-[3cqw] px-[5cqw] py-[3.5cqw]", t.backing && "backdrop-blur-[2px]")}
          style={{ background: t.backing ? "rgba(250,246,238,.82)" : "transparent" }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {editable && editingTitle ? (
            <input
              autoFocus
              defaultValue={design.title}
              maxLength={40}
              onBlur={(e) => {
                const v = e.target.value.trim() || "Untitled";
                setEditingTitle(false);
                if (v !== design.title) updateDesign((d) => ({ ...d, title: v }));
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="w-full bg-transparent outline-none ring-1 ring-ring/60 rounded"
              style={{ fontFamily: FONT[t.font], fontSize: `${t.size}cqw`, color: t.color, textAlign: t.align, lineHeight: 1.1 }}
            />
          ) : (
            <h2
              onClick={() => {
                if (!editable) return;
                setEditingTitle(true);
                onTitleClick?.();
              }}
              className={cn("leading-[1.08] font-medium", editable && "cursor-text hover:outline hover:outline-1 hover:outline-dashed hover:outline-offset-4 rounded")}
              style={{ fontFamily: FONT[t.font], fontSize: `${t.size * (t.font === "script" ? 1.25 : 1)}cqw`, color: t.color }}
            >
              {design.title}
            </h2>
          )}
          {design.subtitle && (
            <p className="mt-[2.2cqw] leading-snug" style={{ fontFamily: "var(--font-sans)", fontSize: `${Math.max(2.6, t.size * 0.3)}cqw`, color: t.color, opacity: 0.85 }}>
              {design.subtitle}
            </p>
          )}
        </div>
      </div>

      {design.initials && (
        <div className="absolute bottom-[5%] left-0 right-0 text-center tracking-[0.3em] uppercase" style={{ fontSize: "3cqw", color: t.color, zIndex: 5 }}>
          {design.initials}
        </div>
      )}

      {/* stickers */}
      {design.placements.map((p, i) => {
        const asset = stickers.find((s) => s.id === p.assetId);
        if (!asset) return null;
        return (
          <StickerNode
            key={p.id}
            placement={p}
            asset={asset}
            z={10 + i}
            editable={!!editable}
            selected={selectedId === p.id}
            onSelect={() => onSelect?.(p.id)}
            container={ref}
          />
        );
      })}
    </div>
  );
}

function StickerNode({
  placement: p, asset, z, editable, selected, onSelect, container,
}: {
  placement: CoverDesign["placements"][number];
  asset: StickerAsset;
  z: number;
  editable: boolean;
  selected: boolean;
  onSelect: () => void;
  container: React.RefObject<HTMLDivElement | null>;
}) {
  const setP = (patch: Partial<typeof p>) =>
    updateDesign((d) => ({ ...d, placements: d.placements.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) }), false);

  const startMove = (e: RPE) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect();
    const rect = container.current!.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ox = p.x, oy = p.y;
    const snap = getState().design;
    let moved = false;
    const move = (ev: PointerEvent) => {
      moved = true;
      setP({
        x: Math.min(100, Math.max(0, ox + ((ev.clientX - sx) / rect.width) * 100)),
        y: Math.min(100, Math.max(0, oy + ((ev.clientY - sy) / rect.height) * 100)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (moved) pushHistory(snap);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startTransform = (e: RPE) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = container.current!.getBoundingClientRect();
    const cx = rect.left + (p.x / 100) * rect.width;
    const cy = rect.top + (p.y / 100) * rect.height;
    const d0 = Math.hypot(e.clientX - cx, e.clientY - cy);
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    const s0 = p.size, r0 = p.rotation;
    const snap = getState().design;
    const move = (ev: PointerEvent) => {
      const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
      const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      setP({ size: Math.min(80, Math.max(5, (s0 * d) / d0)), rotation: Math.round(r0 + ((a - a0) * 180) / Math.PI) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      pushHistory(snap);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const act = (kind: "dup" | "del" | "up" | "down") => (e: React.MouseEvent) => {
    e.stopPropagation();
    updateDesign((d) => {
      const list = [...d.placements];
      const i = list.findIndex((x) => x.id === p.id);
      if (kind === "del") list.splice(i, 1);
      if (kind === "dup") list.push({ ...p, id: uid(), x: Math.min(95, p.x + 6), y: Math.min(95, p.y + 6) });
      if (kind === "up" && i < list.length - 1) [list[i], list[i + 1]] = [list[i + 1]!, list[i]!];
      if (kind === "down" && i > 0) [list[i], list[i - 1]] = [list[i - 1]!, list[i]!];
      return { ...d, placements: list };
    });
  };

  return (
    <div
      className={cn("absolute touch-none", editable && "cursor-grab active:cursor-grabbing")}
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}%`, transform: `translate(-50%,-50%) rotate(${p.rotation}deg)`, zIndex: selected ? 100 : z }}
      onPointerDown={startMove}
    >
      <img src={asset.src} alt={asset.name} draggable={false} className="block w-full" style={effectStyle(asset.effect)} />
      {editable && selected && (
        <>
          <div className="pointer-events-none absolute -inset-1.5 rounded-md border-[1.5px] border-dashed border-primary" />
          <button
            aria-label="Resize and rotate"
            onPointerDown={startTransform}
            className="absolute -bottom-3.5 -right-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md touch-none"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <div
            className="absolute -top-11 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-full bg-card p-1 shadow-[var(--shadow-soft)]"
            style={{ transform: `translateX(-50%) rotate(${-p.rotation}deg)` }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {([["dup", Copy, "Duplicate"], ["up", ArrowUp, "Bring forward"], ["down", ArrowDown, "Send backward"], ["del", Trash2, "Delete"]] as const).map(([k, Icon, label]) => (
              <button key={k} aria-label={label} title={label} onClick={act(k)} className="flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted">
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .4 0 0 0 0 .35 0 0 0 0 .3 0 0 0 .6 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>',
)}")`;
