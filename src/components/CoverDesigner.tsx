"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NotebookMockup } from "./NotebookMockup";

type Phase = "idle" | "uploading" | "generating" | "done" | "error";

const POLL_MS = 3000;

export function CoverDesigner() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
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

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCover(null);
    setPatternId(null);
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
        {cover && patternId ? (
          <>
            <NotebookMockup cover={cover} />
            <p className="text-sm text-ink-light">Your cover on a COMO notebook</p>
            <a
              href={`/api/patterns/${patternId}/download`}
              className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-forest-light"
            >
              Download cover
            </a>
          </>
        ) : (
          <p className="text-center text-ink-light">
            {phase === "generating"
              ? "Generating your pattern. This usually takes a minute or two."
              : "Your cover will appear here."}
          </p>
        )}
      </div>
    </div>
  );
}
