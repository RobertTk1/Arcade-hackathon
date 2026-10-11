"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
        body: JSON.stringify({ prompt, referenceId }),
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
    <div className="grid w-full gap-10 md:grid-cols-2">
      <form onSubmit={generate} className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="font-medium">Your image (optional)</span>
          <input
            type="file"
            accept="image/gif,image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your reference" className="mt-2 h-28 w-28 rounded-lg object-cover" />
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-medium">Describe your pattern</span>
          <textarea
            required
            rows={4}
            value={prompt}
            disabled={busy}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Soft watercolor leaves in sage green and cream"
            className="rounded-2xl border border-line bg-white p-3 outline-none focus:border-forest"
          />
        </label>

        <button
          type="submit"
          disabled={busy || !prompt.trim()}
          className="self-start rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-forest-light disabled:opacity-50"
        >
          {phase === "uploading" ? "Uploading image…" : phase === "generating" ? "Designing…" : "Design my cover"}
        </button>
        {error && <p role="alert" className="text-raspberry">{error}</p>}
      </form>

      <div className="flex min-h-80 flex-col items-center justify-center gap-5 rounded-[var(--radius-card)] border border-line bg-off-white p-4">
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
          <p className="text-center text-ink-light">
            {phase === "generating"
              ? "Generating your pattern. This usually takes a minute or two."
              : "Your cover will appear here."}
          </p>
        )}
        {nbError && <p role="alert" className="text-raspberry">{nbError}</p>}
      </div>
    </div>
  );
}
