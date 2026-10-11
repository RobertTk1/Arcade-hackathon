# COMO

Design a notebook for emotional-eating awareness: your own cover (image + pattern prompt) and your own page prompts, renewed roughly every 30 days. Covers are generated through the Arcade API. The notebook is shown in the UI, but Arcade has no notebook category, so orders use the closest print product (see `docs/arcade-flow.md`).

## Stack

Next.js (App Router, TypeScript, Tailwind), deployed on Vercel. Arcade calls run in route handlers so `ARCADE_API_KEY` never reaches the browser.

## Structure

- `src/app`: pages. V1 landing shows a notebook image and a short "get started" explainer.
- `src/app/api`: route handlers wrapping Arcade (`references`, `covers`, `products`, `checkouts`, `patterns`).
- `src/components`: UI components.
- `src/lib/arcade`: server-side Arcade client.
- `public/images`: notebook imagery.
- `docs`: product notes, design language, and `arcade-flow.md` (the UI-to-API contract, including what Arcade cannot do; read it before adding UI).

## Setup

```bash
cp .env.example .env.local   # add ARCADE_API_KEY; optionally ARCADE_PRODUCT_CATEGORY
npm run dev
```

## Roadmap

1. V1: cover designer (reference image + pattern prompt)
2. Custom per-page prompts/questions
3. 30-day renewal flow
