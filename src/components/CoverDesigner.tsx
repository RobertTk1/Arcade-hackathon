"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotebookMockup } from "./NotebookMockup";
import { ProgressTracker, type TrackerStep } from "./ProgressTracker";

type Phase = "idle" | "uploading" | "generating" | "done" | "error";
type OrderPhase = "idle" | "building" | "ready" | "ordering" | "error";

type Product = {
  productId: string;
  title: string;
  selectionLabel: string;
  unitPrice: { amount: string; currency: string } | null;
};

const POLL_MS = 3000;

type Activity = {
  title: string;
  steps: TrackerStep[];
  current: number;
  startedAt: number;
  note?: string;
};

const coverSteps = (withImage: boolean): TrackerStep[] => [
  ...(withImage ? [{ label: "Uploading your inspiration image", short: "Uploading image…" }] : []),
  { label: "Sending your description to Arcade", short: "Sending to Arcade…" },
  { label: "Arcade is painting your pattern", short: "Painting your pattern…", hint: "Usually 25–60 seconds, longer with an image" },
  { label: "Loading your cover", short: "Loading your cover…" },
];

const ORDER_STEPS: TrackerStep[] = [
  { label: "Sending your cover to Arcade", short: "Sending to Arcade…" },
  { label: "Arcade is building your notebook", short: "Building your notebook…", hint: "Usually under a minute" },
  { label: "Preparing your order", short: "Preparing your order…" },
];

const CHECKOUT_STEPS: TrackerStep[] = [
  { label: "Creating your checkout with Arcade", short: "Creating checkout…" },
  { label: "Opening secure checkout", short: "Opening checkout…" },
];

const jobNote = (jobId: string, checks: number) =>
  `Arcade job …${jobId.slice(-6)} · still working · checked ${checks} ${checks === 1 ? "time" : "times"}`;

export function CoverDesigner() {
  const router = useRouter();
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
  const [activity, setActivity] = useState<Activity | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const lastCheckout = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem("como:lastCheckout");
      } catch {
        return null;
      }
    },
    () => null,
  );

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const busy = phase === "uploading" || phase === "generating";
  const ordering = orderPhase === "building" || orderPhase === "ordering";

  function begin(title: string, steps: TrackerStep[]) {
    setActivity({ title, steps, current: 0, startedAt: Date.now() });
  }

  function advance(current: number, note?: string) {
    setActivity((a) => (a ? { ...a, current, note } : a));
  }

  function fail(message: string) {
    setActivity(null);
    setError(message);
    setPhase("error");
  }

  function poll(jobId: string, paintStep: number, checks = 1) {
    advance(paintStep, jobNote(jobId, checks));
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/covers/${jobId}`);
        const data = await res.json();
        if (!res.ok) return fail(data.error ?? "Something went wrong");
        if (data.status === "running") return poll(jobId, paintStep, checks + 1);
        if (data.status === "failed") return fail(data.error);
        setCover(data.imageUrl);
        setPatternId(data.patternId);
        setActivity(null);
        setPhase("done");
      } catch {
        fail("Lost connection while generating");
      }
    }, POLL_MS);
  }

  function orderFail(message: string) {
    setActivity(null);
    setOrderError(message);
    setOrderPhase("error");
  }

  function pollProduct(jobId: string, checks = 1) {
    advance(1, jobNote(jobId, checks));
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/${jobId}`);
        const data = await res.json();
        if (!res.ok) return orderFail(data.error ?? "Something went wrong");
        if (data.status === "running") return pollProduct(jobId, checks + 1);
        if (data.status === "failed") return orderFail(data.error);
        setProduct(data);
        setActivity(null);
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
    begin("Placing your order", ORDER_STEPS);
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
    setOrderError(null);
    setOrderPhase("ordering");
    // Arcade's checkout has no return URL, so payment opens in a new tab while this
    // tab moves to the order status page. The tab must be opened synchronously in the
    // click handler or the browser blocks it.
    const payTab = window.open("", "_blank");
    begin("Starting checkout", CHECKOUT_STEPS);
    try {
      const res = await fetch("/api/checkouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        payTab?.close();
        setActivity(null);
        setOrderPhase("ready");
        return setOrderError(data.error ?? "Couldn't start checkout");
      }
      advance(1, `Checkout ${String(data.checkoutId).slice(-6)} is ready`);
      if (payTab) {
        payTab.location.href = data.checkoutUrl;
        router.push(`/order/${data.checkoutId}`);
      } else {
        // Pop-up blocked: pay in this tab and keep the status page one click away.
        try {
          localStorage.setItem("como:lastCheckout", data.checkoutId);
        } catch {}
        window.location.assign(data.checkoutUrl);
      }
    } catch {
      payTab?.close();
      setActivity(null);
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
    const offset = file ? 1 : 0;
    begin("Creating your cover", coverSteps(!!file));
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
      advance(offset);
      const res = await fetch("/api/covers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${prompt.trim()}\nCover style: ${style}`, referenceId }),
      });
      const data = await res.json();
      if (!res.ok) return fail(data.error ?? "Something went wrong");
      poll(data.jobId, offset + 1);
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
        {lastCheckout && (
          <p className="studio-hint">
            Paid for an order in the last session? <Link href={`/order/${lastCheckout}`} className="underline">Check its status</Link>.
          </p>
        )}
      </form>

      <aside className="studio-preview" aria-label="Cover preview">
        <div className="reflection-note">
          <p className="studio-eyebrow">Your COMO reflection prompt</p>
          <strong>Getting to know your patterns</strong>
          <p>For your journaling, not a visual instruction. Only the cover description and inspiration guide the artwork.</p>
        </div>
        <div className="studio-card preview-card" aria-live="polite" aria-busy={!!activity}>
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
              {activity ? (
                <ProgressTracker {...activity} />
              ) : product ? (
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
                    Continue to checkout
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={prepareOrder}
                  disabled={orderPhase === "building"}
                  className="studio-primary"
                >
                  Order my notebook
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
              {activity ? (
                <ProgressTracker {...activity} />
              ) : (
                <p className="studio-hint">Room to breathe, gentle colours and a simple composition. Add your title after choosing a concept.</p>
              )}
              {!busy && <span className="preview-example">Illustrative starting point</span>}
            </>
          )}
        </div>
      </aside>
      <footer className="studio-footer">
        <Link href="/" className="studio-secondary">← Back</Link>
        <p>A few words today. A cover that feels like you.</p>
        <button type="submit" form="cover-form" disabled={busy || ordering || !prompt.trim()} className="studio-primary">
          {busy && activity ? (
            <><span className="spinner" aria-hidden="true" />{activity.steps[activity.current]?.short}</>
          ) : cover ? "Generate again ↗" : "Generate my cover ↗"}
        </button>
      </footer>
    </div>
  );
}
