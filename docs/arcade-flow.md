# Arcade flow for COMO covers

This is the contract between the UI and the Arcade API. Before adding UI copy or a control, check it against the tables below. If a row says "not supported", the UI must not promise it.

All Arcade calls are `POST https://platform.arcade.ai/v1/<endpoint>` with a bearer key, made only from route handlers in `src/app/api` through `src/lib/arcade/client.ts`. Source of truth: `.agents/skills/arcade-api/SKILL.md` and https://docs.arcade.ai/llms.txt.

## The stand-in product (decided)

Arcade has no notebook category. COMO shows a notebook in the UI, but the order is for the **closest flat, rectangular print product** on Arcade, with the generated pattern printed on it.

- `src/lib/arcade/product.ts` (`resolveStandIn`) calls `categories/list`, keeps `world: "print"` categories and takes the first that matches, in this order: `Placemats`, `Tea Towels`, `Pocket Squares`, `Table Runners`. It then calls `categories/get` with `selections: {}` and uses that product only if `canManufacture` is `true`.
- Override with `ARCADE_PRODUCT_CATEGORY` (exact category name, case-insensitive). It replaces the fallback list.
- Category IDs are never hardcoded. Always resolve them from `categories/list`.
- Verified on production: Placemats built as "Everyday Cotton Placemats (Set of 4)", 14" x 19", about 24 s, 29.85 USD.
- Consequences for the UI:
  - The product, price and image shown after "Order" are the **stand-in's**, not a notebook's. Show the returned `title` and `selectionLabel`, and say what it is printed on.
  - Do not show notebook specs (page count, binding, size, paper) as Arcade-backed.
  - The price is whatever `products/get` returns as `unitPrice`. Do not hardcode or estimate prices.
  - If the notebook itself is fulfilled elsewhere, that is outside Arcade and outside this document.

## Flow

1. `references/createUpload` -> PUT bytes -> `references/create` -> `referenceId` (optional inspiration image)
2. `patterns/create` `{requestId, prompt, referenceIds?}` -> `jobId`
3. `jobs/get` until `succeeded` -> `result.patternId`; then `patterns/get` -> `imageUrl`, `width`, `height`
4. `categories/list` -> `categories/get` -> stand-in category and a complete `selections` object
5. `products/create` `{requestId, patternId, categoryId, selections, fit}` -> `jobId`
6. `jobs/get` until `succeeded` -> `result.productId`; then `products/get` -> `title`, `selectionLabel`, `imageUrl`, `images`, `unitPrice`
7. `checkouts/create` `{requestId, lines: [{productId, quantity}], dropShip}` -> `checkoutId`, `checkoutUrl`
8. `orders/get` `{checkoutId}`: returns 404 until the checkout is paid, then the order with `status`, `orderNumber`, `total`, `lines`, `tracking`

Arcade documents **no return or success URL** on `checkouts/create`, so the browser cannot be sent back after payment. The UI opens `checkoutUrl` in a new tab (the tab is opened synchronously in the click handler, or the browser blocks it) and moves the current tab to `/order/[checkoutId]`, which polls `orders/get`. If pop-ups are blocked, it pays in the same tab and keeps the `checkoutId` in `localStorage` so the designer can link back to the status page.

Order `status` values from Arcade, grouped into the UI's five steps (Payment, Order placed, Being made, On its way, Delivered): `ordered` is placed; `cadReview`, `sampleReview`, `inProduction`, `inReview`, `inCorrection`, `approved`, `updatedInfo` are being made; `shipped`; `delivered` and `fulfilled`; `refunded` is shown separately.

## UI element to API map

| UI element | Route in this repo | Arcade endpoint(s) | Status |
|---|---|---|---|
| Upload inspiration image | `POST /api/references` | `references/createUpload`, PUT, `references/create` | Wired |
| Generate my cover | `POST /api/covers` | `patterns/create` | Wired |
| Generating / progress state | `GET /api/covers/[jobId]` (poll every 3 s) | `jobs/get`, `patterns/get` | Wired |
| Cover image preview | from `imageUrl` above | `patterns/get` | Wired |
| Download cover | `GET /api/patterns/[patternId]/download` | `patterns/get`, then fetches `imageUrl` | Wired |
| Order my notebook (build) | `POST /api/products`, `GET /api/products/[jobId]` | `categories/list`, `categories/get`, `products/create`, `jobs/get`, `products/get` | Wired, stand-in product |
| Continue to checkout | `POST /api/checkouts` | `checkouts/create` | Wired |
| Order confirmation / status page | `GET /api/orders/[checkoutId]` (poll every 4 s unpaid, 20 s after) | `orders/get` | Built; **unverified against a paid order** |
| Style picker (journal studio) | `GET /api/models` | `models/list` | Wired; style names matched to `modelId` by name, unmatched styles go in the prompt only |
| Refine: edit, change one area, recolor, extend, make seamless, fix details (journal studio) | `POST /api/patterns/[patternId]/refine` `{operation, ...}`, poll `GET /api/covers/[jobId]` | `refine/edit`, `editRegion`, `recolor`, `extendPattern`, `extendScene`, `makeSeamless`, `fixDeformity` | Wired, **unverified live** |
| Recolor cluster lookup | `POST /api/patterns/[patternId]/clusters` | `refine/recolorClusters` (sync) | Wired |
| Refresh an expired image URL | `GET /api/patterns/[patternId]` | `patterns/get` | Wired |

`/api/orders/[checkoutId]` returns only the order number, status, total, line items and carrier tracking links. It drops the shipping address, maker name and tracking number, because checkout IDs are plain numbers and the page has no login.

## Journal studio (`journal-studio/`)

The Lovable app (TanStack Start + Vite) lives in `journal-studio/` and keeps being edited in Lovable. It is deployed as its own Vercel project, `como-studio` (root directory `journal-studio`, production from `main`), and `next.config.ts` serves it on the main site: `/`, `/studio`, `/inside` and `/finished` plus any path this app doesn't own are proxied to `STUDIO_URL` (default `https://como-studio.vercel.app`), while `/api/*` and `/order/*` stay in this app. It has no server code of its own: `journal-studio/src/lib/como/arcade-http.ts` calls the routes above over HTTP, and the Arcade key stays on the Next.js server. `src/proxy.ts` allows cross-origin calls from `*.lovable.app`, `*.lovableproject.com`, `localhost` and `CORS_ALLOWED_ORIGINS`.

- Generate: one `patterns/create` job per idea (`VITE_IDEAS_PER_BATCH`, default 4), with `colors`, up to 3 `referenceIds` and a `modelId` when the style name matches a model.
- Change one area: the 3×3 picker cell becomes a PNG mask (alpha > 0 is editable) at the pattern's aspect ratio, long edge at most 1536 px.
- Recolor: `recolorClusters`, then each cluster gets the palette color closest in lightness.
- Extend: grows the canvas to the cover's 148:210 proportions (or 25% if already there).
- Make seamless: centered square tile at the image's short side.
- Crop & frame: local zoom and position only; no Arcade call.
- Title, subtitle, initials and stickers are drawn over the artwork in the preview only. They are never sent to Arcade or printed.
- Order: `/api/products`, `/api/checkouts`, then the Next.js `/order/[checkoutId]` page.

## Request constraints

| Item | Constraint | Source |
|---|---|---|
| `requestId` | Required on every create call, string up to 128 chars, unique per distinct request. Reuse it only to retry an identical body. A different body with the same ID returns 409. | Arcade |
| `prompt` | Free text. Arcade documents no length limit; the 1200-character cap is a UI choice, not an Arcade rule. | Arcade / UI |
| Reference image | GIF, JPEG, PNG or WebP. `/api/references` rejects files over **4 MB** because of Vercel's ~4.5 MB request body limit. UI copy must say 4 MB, not 10 MB, unless uploads move to direct-to-Arcade. | Vercel / route |
| References per cover | The API accepts `referenceIds` as an array; our route passes one. | Route |
| Pattern job time | Typically 1 to 2 minutes. Poll every 2 to 5 s; the edge answers 429 when you exceed the rate limit. | Arcade |
| Succeeded job | `result` can be `null`. Check before reading IDs. | Arcade |
| Image URLs (`imageUrl`, `thumbnailUrl`, `downloadUrl`) | Short-lived signed links. Do not store them; call `patterns/get` again. | Arcade |
| Aspect ratio | If the pattern does not match the product, `products/create` needs `fit`. We send `{mode: "fill"}`. | Arcade |
| Checkout | Single-quantity lines require `dropShip: true` (set in `/api/checkouts`). Creating a link charges nothing; payment happens when the user opens `checkoutUrl`. | Arcade |

## Not supported by Arcade: do not promise in the UI

- **A notebook product.** Only the stand-in above.
- **A style parameter.** The "Look" chips (Minimal cover, Soft illustration, Paper texture) are appended to the prompt as text. They steer the model but are not guaranteed.
- **Several concepts from one request.** One `patterns/create` job produces one pattern. "Choose a concept" means running it again.
- **A title or text on the cover.** There is no text-overlay endpoint. Refines (`edit`, `editRegion`, `recolor`, `recolorClusters`, `crop`, `makeSeamless`, `extendPattern`, `extendScene`) change the image; they are not a typesetting tool, so exact lettering is not guaranteed. The journal studio wires them up as image refines only.
- **Exact reproduction of an inspiration image.** References steer style; the output is a new pattern.
- **A dynamic "reflection prompt".** That card is static copy in the UI; no Arcade call is involved.
- **Predictable timing or price before building.** Price comes only from `products/get` after the product job succeeds.

## Errors

`errorResponse` in `src/lib/arcade/client.ts` maps an Arcade failure to `{error}` with the same HTTP status. Treat 5xx and 409 as retryable (same `requestId`, same body, after a short delay) and other 4xx as final. A failed job returns `error.message`.
