/**
 * HTTP client for the COMO Next.js API (repo root, src/app/api). The Arcade key
 * lives only on that server; this app never sees it.
 *
 * VITE_COMO_API_URL  base URL of the Next.js app (default: production)
 * VITE_ARCADE_MOCK   "true" to use the local mock instead of real Arcade calls
 */
export const API_URL = (
  import.meta.env.VITE_COMO_API_URL ?? "https://como-puce.vercel.app"
).replace(/\/$/, "");
export const USE_MOCK = import.meta.env.VITE_ARCADE_MOCK === "true";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  init?: { method?: "GET" | "POST"; body?: unknown; form?: FormData },
): Promise<T> {
  const method = init?.method ?? (init?.body !== undefined || init?.form ? "POST" : "GET");
  const res = await fetch(`${API_URL}${path}`, {
    method,
    ...(init?.form
      ? { body: init.form }
      : init?.body !== undefined
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(init.body) }
        : {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

export interface PatternResult {
  patternId: string;
  imageUrl: string;
  width: number;
  height: number;
}

type JobPoll =
  | { status: "running" }
  | ({ status: "succeeded" } & PatternResult)
  | { status: "failed"; error: string; noResult?: boolean };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Thrown when a job succeeds without a new pattern (fixDeformity found nothing). */
export class NoResultError extends Error {}

/** Poll a pattern or refine job until it finishes. Arcade jobs usually take 1–2 minutes. */
export async function pollPatternJob(
  jobId: string,
  { intervalMs = 3000, timeoutMs = 6 * 60_000 } = {},
) {
  const started = Date.now();
  for (;;) {
    let job: JobPoll;
    try {
      job = await api<JobPoll>(`/api/covers/${encodeURIComponent(jobId)}`);
    } catch (e) {
      // 429 and 5xx are transient; keep polling. Other errors are final.
      if (!(e instanceof ApiError) || (e.status !== 429 && e.status < 500)) throw e;
      job = { status: "running" };
    }
    if (job.status === "succeeded") return job;
    if (job.status === "failed") {
      if (job.noResult) throw new NoResultError(job.error);
      throw new Error(job.error);
    }
    if (Date.now() - started > timeoutMs)
      throw new Error("This is taking longer than usual. Try again?");
    await wait(intervalMs);
  }
}

export function getPattern(patternId: string) {
  return api<PatternResult & { thumbnailUrl: string }>(
    `/api/patterns/${encodeURIComponent(patternId)}`,
  );
}
