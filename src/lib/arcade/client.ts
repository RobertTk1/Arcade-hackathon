import "server-only";

export class ArcadeError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function arcade<T>(path: string, body: unknown): Promise<T> {
  const key = process.env.ARCADE_API_KEY;
  if (!key) throw new ArcadeError(500, "ARCADE_API_KEY is not set");
  const base = process.env.ARCADE_API_BASE_URL ?? "https://platform.arcade.ai/v1";

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ArcadeError(
      res.status,
      data?.message ?? data?.error?.message ?? `Arcade request failed (${res.status})`,
    );
  }
  return data as T;
}

export function errorResponse(e: unknown) {
  if (e instanceof ArcadeError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
