"use client";

import { useEffect, useState } from "react";

/** `short` is the verb phrase used on buttons while the step runs. */
export type TrackerStep = { label: string; short: string; hint?: string };

type Props = {
  title: string;
  steps: TrackerStep[];
  /** Index of the step in progress. Steps before it are done, after it are waiting. */
  current: number;
  startedAt: number;
  /** Live detail from the backend, such as the Arcade job reference and poll count. */
  note?: string;
};

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export function ProgressTracker({ title, steps, current, startedAt, note }: Props) {
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const elapsed = Math.max(0, Math.round((now - startedAt) / 1000));
  const active = steps[current];

  return (
    <div className="progress" role="status" aria-live="polite">
      <div className="progress-head">
        <strong>{title}</strong>
        <span className="progress-time">{formatElapsed(elapsed)}</span>
      </div>
      <div className="progress-bar" aria-hidden="true">
        <span style={{ width: `${((current + 0.5) / steps.length) * 100}%` }} />
      </div>
      <ol className="progress-steps">
        {steps.map((step, i) => {
          const state = i < current ? "done" : i === current ? "active" : "waiting";
          return (
            <li key={step.label} className={`progress-step ${state}`} aria-current={state === "active" ? "step" : undefined}>
              <span className="progress-dot" aria-hidden="true">{state === "done" ? "✓" : ""}</span>
              <span>
                {step.label}
                {state === "active" && step.hint && <small>{step.hint}</small>}
              </span>
            </li>
          );
        })}
      </ol>
      {note && <p className="progress-note">{note}</p>}
      {active && <span className="sr-only">{`Step ${current + 1} of ${steps.length}: ${active.label}`}</span>}
    </div>
  );
}
