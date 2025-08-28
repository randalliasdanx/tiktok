# PrivyLens

Redacts text and images before they reach cloud LLMs. Monorepo with Next.js (App Router), Express, and Supabase schema. Strong typing, clean architecture, minimal deps.

## Stack

- Next.js (App Router) + Tailwind + shadcn/ui (selected components)
- Express API (CORS-limited)
- Packages: `@privylens/redaction-text`, `@privylens/redaction-image`
- Supabase schema for policies, logs, assets

## Getting Started

```bash
pnpm install
pnpm dev # runs web:3000 and server:4000
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` at repo root and fill values as needed.

## Scripts

- dev: run server and web concurrently
- build: build all workspaces
- test: run unit tests for packages and server
- lint/format: repo-wide

## Packages

- `@privylens/redaction-text`: Basic regex for EMAIL/PHONE/CARD with TODOs for Luhn and NER
- `@privylens/redaction-image`: Pixelates dummy region with TODOs for OCR/face/plate

## Supabase

See `supabase/schema.sql` and `supabase/seed.sql`. Do not upload originals by default.

## Notes

- This repo includes clear TODO hooks for ML/NER/OCR integrations.
- CORS locked to `ALLOWED_ORIGINS`.

