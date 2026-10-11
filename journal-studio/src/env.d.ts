/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the COMO Next.js API. Defaults to production. */
  readonly VITE_COMO_API_URL?: string;
  /** "true" uses the local mock instead of real Arcade calls. */
  readonly VITE_ARCADE_MOCK?: string;
  /** Ideas per "Generate" click, 1–4. Each is a separate paid Arcade generation. */
  readonly VITE_IDEAS_PER_BATCH?: string;
}
