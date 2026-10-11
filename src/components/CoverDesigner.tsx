"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Phase = "idle" | "uploading" | "generating" | "done" | "error";
type NotebookPhase = "idle" | "building" | "ready" | "ordering" | "error";

type Notebook = {
  productId: string;
  title: string;
  selectionLabel: string;
  imageUrl: string;
  unitPrice: { amount: string; currency: string } | null;
};

const POLL_MS = 3000;

export function CoverDesigner() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Minimal cover");
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [patternId, setPatternId] = useState<string | null>(null);
  const [nbPhase, setNbPhase] = useState<NotebookPhase>("idle");
  const [nbError, setNbError] = useState<string | null>(null);
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function fail(message: string) {
    setError(message);
    setPhase("error");
  }

  function poll(jobId: string) {
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/covers/${jobId}`);
        const data = await res.json();
        if (!res.ok) return fail(data.error ?? "Something went wrong");
        if (data.status === "running") return poll(jobId);
        if (data.status === "failed") return fail(data.error);
        setCover(data.imageUrl);
        setPatternId(data.patternId);
        setPhase("done");
      } catch {
        fail("Lost connection while generating");
      }
    }, POLL_MS);
  }

  function nbFail(message: string) {
    setNbError(message);
    setNbPhase("error");
  }

  function pollProduct(jobId: string) {
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/${jobId}`);
        const data = await res.json();
        if (!res.ok) return nbFail(data.error ?? "Something went wrong");
        if (data.status === "running") return pollProduct(jobId);
        if (data.status === "failed") return nbFail(data.error);
        setNotebook(data);
        setNbPhase("ready");
      } catch {
        nbFail("Lost connection while building your notebook");
      }
    }, POLL_MS);
  }

  async function makeNotebook() {
    if (!patternId) return;
    setNbError(null);
    setNbPhase("building");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternId }),
      });
      const data = await res.json();
      if (!res.ok) return nbFail(data.error ?? "Something went wrong");
      pollProduct(data.jobId);
    } catch {
      nbFail("Something went wrong. Try again.");
    }
  }

  async function checkout() {
    if (!notebook) return;
    setNbPhase("ordering");
    try {
      const res = await fetch("/api/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: notebook.productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNbPhase("ready");
        return setNbError(data.error ?? "Couldn't start checkout");
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setNbPhase("ready");
      setNbError("Couldn't start checkout");
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (busy || nbPhase === "building" || nbPhase === "ordering") return;
    if (timer.current) clearTimeout(timer.current);
    setError(null);
    setCover(null);
    setPatternId(null);
    setNotebook(null);
    setNbPhase("idle");
    setNbError(null);
    try {
      let referenceId: string | undefined;
      if (file) {
        setPhase("uploading");
        const form = new FormData();
        form.set("file", file);
        const up = await fetch("/api/references", { method: "POST", body: form });
        const upData = await up.json();
        if (!up.ok) return fail(upData.error ?? "Image upload failed");
        referenceId = upData.referenceId;
      }
      setPhase("generating");
      const res = await fetch("/api/covers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${prompt.trim()}\nCover style: ${style}`, referenceId }),
      });
      const data = await res.json();
      if (!res.ok) return fail(data.error ?? "Something went wrong");
      poll(data.jobId);
    } catch {
      fail("Something went wrong. Try again.");
    }
  }

  const busy = phase === "uploading" || phase === "generating";

  return (
    <div className="studio-grid">
      <form id="cover-form" onSubmit={generate} className="studio-form">
        <section className="studio-card">
          <h2>Describe your cover</h2>
          <label htmlFor="cover-description" className="studio-label">Visual description</label>
          <textarea
            id="cover-description"
            required
            maxLength={1200}
            rows={6}
            value={prompt}
            disabled={busy || nbPhase === "building" || nbPhase === "ordering"}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Soft repeating leaf shapes on a warm cream background. Muted sage and forest green, a gentle botanical rhythm, and plenty of open space for the title. Calm, simple and not too busy."
            className="studio-textarea"
          />
          <div className="studio-field-meta">
            <span>A few thoughtful words are enough.</span>
            <span>{prompt.length} / 1200</span>
          </div>
          <p className="studio-hint">Suggestions to set your style and texture. Edit the words before generating.</p>
          <fieldset className="studio-styles" disabled={busy || nbPhase === "building" || nbPhase === "ordering"}>
            <legend>Look</legend>
            {["Minimal cover", "Soft illustration", "Paper texture"].map((option) => (
              <label key={option} className={style === option ? "style-chip selected" : "style-chip"}>
                <input type="radio" name="cover-style" value={option} checked={style === option} onChange={() => setStyle(option)} />
                {style === option && <span aria-hidden="true">✓ </span>}{option}
              </label>
            ))}
          </fieldset>
        </section>

        <section className="studio-card">
          <h2>Add inspiration <span className="optional">· optional</span></h2>
          <div className="inspiration-upload">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Your cover inspiration" className="inspiration-thumbnail" />
            ) : <span className="upload-placeholder" aria-hidden="true">↗</span>}
            <div className="inspiration-file">
              <strong>{file ? file.name : "An image that feels like you"}</strong>
              <span>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "PNG, JPG, GIF or WebP · up to 10 MB"}</span>
            </div>
            <input
              ref={fileInput}
              id="cover-reference"
              aria-label="Upload a cover inspiration image"
              type="file"
              accept="image/gif,image/jpeg,image/png,image/webp"
              disabled={busy || nbPhase === "building" || nbPhase === "ordering"}
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                if (selected && (!['image/gif', 'image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 10 * 1024 * 1024)) {
                  setError("Choose a PNG, JPG, GIF or WebP image under 10 MB.");
                  e.target.value = "";
                  return;
                }
                setFile(selected);
                setError(null);
              }}
              className="sr-only"
            />
            <button type="button" className="studio-secondary" disabled={busy || nbPhase === "building" || nbPhase === "ordering"} onClick={() => fileInput.current?.click()}>{file ? "Replace image" : "+ Upload image"}</button>
            {file && <button type="button" className="studio-remove" disabled={busy || nbPhase === "building" || nbPhase === "ordering"} onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }}>Remove</button>}
          </div>
          <p className="studio-hint">Use images you’re happy to include. Inspiration helps shape the cover, rather than copying it exactly.</p>
        </section>
        {error && <p role="alert" className="studio-error">{error}</p>}
      </form>

      <aside className="studio-preview" aria-label="Cover preview">
        <div className="reflection-note">
          <p className="studio-eyebrow">Your COMO reflection prompt</p>
          <strong>Getting to know your patterns</strong>
          <p>For your journaling, not a visual instruction. Only the cover description and inspiration guide the artwork.</p>
        </div>
      <div className="studio-card preview-card" aria-live="polite" aria-busy={busy || nbPhase === "building"}>
        {notebook ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={notebook.imageUrl} alt={notebook.title} className="max-h-[28rem] rounded-2xl shadow-frame" />
            <div className="text-center">
              <p className="font-serif text-xl font-bold">{notebook.title}</p>
              <p className="text-sm text-ink-light">{notebook.selectionLabel}</p>
              {notebook.unitPrice && (
                <p className="mt-1 font-medium">
                  {notebook.unitPrice.amount} {notebook.unitPrice.currency}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={checkout}
              disabled={nbPhase === "ordering"}
              className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-forest-light disabled:opacity-50"
            >
              {nbPhase === "ordering" ? "Opening checkout…" : "Order this notebook"}
            </button>
          </>
        ) : cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="Your generated cover pattern" className="max-h-[28rem] rounded-2xl shadow-frame" />
            <button
              type="button"
              onClick={makeNotebook}
              disabled={nbPhase === "building"}
              className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-forest-light disabled:opacity-50"
            >
              {nbPhase === "building" ? "Building your notebook…" : "Turn it into a notebook"}
            </button>
          </>
        ) : (
          <>
            <h2>{busy ? "Creating your cover" : "Your starting point"}</h2>
            <div className={`botanical-preview${busy ? " generating-preview" : ""}`} aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => <span key={i} className={`botanical-leaf leaf-${i}`} />)}
            </div>
            <strong className="preview-caption">{busy ? "A little space for something yours." : "Minimal cover · flowing leaves"}</strong>
            <p className="studio-hint">{phase === "uploading" ? "Uploading your inspiration image…" : phase === "generating" ? "Exploring your description. This usually takes a minute or two." : "Room to breathe, gentle colours and a simple composition. Add your title after choosing a concept."}</p>
            {!busy && <span className="preview-example">Illustrative starting point</span>}
          </>
        )}
        {nbError && <p role="alert" className="text-raspberry">{nbError}</p>}
      </div>
      </aside>
      <footer className="studio-footer">
        <Link href="/" className="studio-secondary">← Back</Link>
        <p>A few words today. A cover that feels like you.</p>
        <button type="submit" form="cover-form" disabled={busy || nbPhase === "building" || nbPhase === "ordering" || !prompt.trim()} className="studio-primary">
          {phase === "uploading" ? "Uploading image…" : phase === "generating" ? "Creating your cover…" : cover ? "Generate again ↗" : "Generate my cover ↗"}
        </button>
      </footer>
    </div>
  );
}
