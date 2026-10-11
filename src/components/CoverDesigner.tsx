"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { NotebookMockup } from "./NotebookMockup";

type Phase = "idle" | "uploading" | "generating" | "done" | "error";
type OrderPhase = "idle" | "building" | "ready" | "ordering" | "error";

type Product = {
  productId: string;
  title: string;
  selectionLabel: string;
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
  const [orderPhase, setOrderPhase] = useState<OrderPhase>("idle");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [patternId, setPatternId] = useState<string | null>(null);
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

  const busy = phase === "uploading" || phase === "generating";
  const ordering = orderPhase === "building" || orderPhase === "ordering";

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

  function orderFail(message: string) {
    setOrderError(message);
    setOrderPhase("error");
  }

  function pollProduct(jobId: string) {
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/${jobId}`);
        const data = await res.json();
        if (!res.ok) return orderFail(data.error ?? "Something went wrong");
        if (data.status === "running") return pollProduct(jobId);
        if (data.status === "failed") return orderFail(data.error);
        setProduct(data);
        setOrderPhase("ready");
      } catch {
        orderFail("Lost connection while preparing your order");
      }
    }, POLL_MS);
  }

  async function prepareOrder() {
    if (!patternId) return;
    setOrderError(null);
    setOrderPhase("building");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternId }),
      });
      const data = await res.json();
      if (!res.ok) return orderFail(data.error ?? "Something went wrong");
      pollProduct(data.jobId);
    } catch {
      orderFail("Something went wrong. Try again.");
    }
  }

  async function checkout() {
    if (!product) return;
    setOrderPhase("ordering");
    try {
      const res = await fetch("/api/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderPhase("ready");
        return setOrderError(data.error ?? "Couldn't start checkout");
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setOrderPhase("ready");
      setOrderError("Couldn't start checkout");
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (busy || ordering) return;
    if (timer.current) clearTimeout(timer.current);
    setError(null);
    setCover(null);
    setPatternId(null);
    setProduct(null);
    setOrderPhase("idle");
    setOrderError(null);
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
            disabled={busy || ordering}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Soft repeating leaf shapes on a warm cream background. Muted sage and forest green, a gentle botanical rhythm, and plenty of open space for the title. Calm, simple and not too busy."
            className="studio-textarea"
          />
          <div className="studio-field-meta">
            <span>A few thoughtful words are enough.</span>
            <span>{prompt.length} / 1200</span>
          </div>
          <p className="studio-hint">Suggestions to set your style and texture. Edit the words before generating.</p>
          <fieldset className="studio-styles" disabled={busy || ordering}>
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
              <span>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "PNG, JPG, GIF or WebP · up to 4 MB"}</span>
            </div>
            <input
              ref={fileInput}
              id="cover-reference"
              aria-label="Upload a cover inspiration image"
              type="file"
              accept="image/gif,image/jpeg,image/png,image/webp"
              disabled={busy || ordering}
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                if (selected && (!['image/gif', 'image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 4 * 1024 * 1024)) {
                  setError("Choose a PNG, JPG, GIF or WebP image under 4 MB.");
                  e.target.value = "";
                  return;
                }
                setFile(selected);
                setError(null);
              }}
              className="sr-only"
            />
            <button type="button" className="studio-secondary" disabled={busy || ordering} onClick={() => fileInput.current?.click()}>{file ? "Replace image" : "+ Upload image"}</button>
            {file && <button type="button" className="studio-remove" disabled={busy || ordering} onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }}>Remove</button>}
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
        <div className="studio-card preview-card" aria-live="polite" aria-busy={busy || orderPhase === "building"}>
          {cover && patternId ? (
            <>
              <NotebookMockup cover={cover} />
              <p className="studio-hint">Your cover on a COMO notebook</p>
              <a
                href={`/api/patterns/${patternId}/download`}
                className="studio-primary"
              >
                Download cover
              </a>
              {product ? (
                <div className="text-center">
                  <p className="studio-hint">
                    <strong>Your COMO notebook</strong>
                    {product.unitPrice ? ` · ${product.unitPrice.amount} ${product.unitPrice.currency}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={checkout}
                    disabled={orderPhase === "ordering"}
                    className="studio-primary"
                  >
                    {orderPhase === "ordering" ? "Opening checkout…" : "Continue to checkout"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={prepareOrder}
                  disabled={orderPhase === "building"}
                  className="studio-primary"
                >
                  {orderPhase === "building" ? "Preparing your order…" : "Order my notebook"}
                </button>
              )}
              {orderError && <p role="alert" className="studio-error">{orderError}</p>}
              <p className="studio-hint">
                Hackathon demo: checkout uses an Arcade placemat as a placeholder for the notebook.
              </p>
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
        </div>
      </aside>
      <footer className="studio-footer">
        <Link href="/" className="studio-secondary">← Back</Link>
        <p>A few words today. A cover that feels like you.</p>
        <button type="submit" form="cover-form" disabled={busy || ordering || !prompt.trim()} className="studio-primary">
          {phase === "uploading" ? "Uploading image…" : phase === "generating" ? "Creating your cover…" : cover ? "Generate again ↗" : "Generate my cover ↗"}
        </button>
      </footer>
    </div>
  );
}
