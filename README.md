# Lens — Privacy-First Conversational AI

A secure, redaction-by-default chat interface that detects and masks sensitive text and blurs identifiable regions in images **before** anything reaches an external LLM.

---

## Inspiration
Modern AI apps make it far too easy to leak private data—names, emails, locations, or even faces in photos—into third-party models and logs. We wanted a chat experience that treats privacy as a **first-class feature**, not an afterthought.

---

## What it does
- **Text Redaction**  
  Automatically detects PII (names, locations, organizations, emails, phone numbers, credit cards) and replaces them with placeholders.
- **Image Redaction**  
  Detects faces client-side and applies precise pixelation/blur for irreversible anonymization.
- **Policy-Driven Controls**  
  Users choose what to redact; policies are enforced on both client and server.
- **Secure Processing**  
  Ensures **no raw sensitive data** is ever sent to external APIs. Inputs are validated as redacted before LLM calls.
- **Privacy-Aware Chat UI**  
  ChatGPT-style interface with streaming responses that only sees masked text and blurred imagery.
- **Zero-Knowledge Auditing**  
  Logs *events* (what was redacted) without storing the original sensitive content.

### Key Features
- **Hybrid text engine:** transformer-based NER + regex rules for robust PII detection.  
- **Real-time face blurring:** TinyFaceDetector-powered detection with configurable thresholds.  
- **Local-first design:** on-device inference paths minimize data exposure.  
- **Policy presets:** granular toggles for PII types (emails, phones, orgs, etc.).  
- **Auditability:** cryptographic integrity for privacy event trails.

---

## How we built it
- **On-Device Processing Architecture**
  - Client-side NER and face detection first; only sanitized payloads can cross the boundary.
  - Server validates redaction again before proxying to the OpenAI API.

- **Frontend**
  - **React + TypeScript** (Vite)
  - **Tailwind CSS** for styling and a clean, responsive chat experience

- **Backend**
  - **Node.js + Express** API
  - **TypeScript** with strict types
  - **Multer** for image uploads, **sharp** for image ops when needed
  - **Server-Sent Events (SSE)** for LLM streaming

- **Data & Infra**
  - **Supabase** (Postgres + real-time) for auth, policy storage, audit metadata (never the raw PII)

- **Code Quality & Testing**
  - ESLint + Prettier
  - **Vitest** for unit tests

- **Assets & Implementation Notes**
  - **TinyFaceDetector** weights (≈416 KB) loaded at runtime for client-side detection
  - **Canvas-based** image processing on the web; server uses **sharp** when applicable
  - **Inline SVGs** for icons; CSS-only effects for visuals (no external image assets)
  - **Tailwind design system** for predictable spacing, color, type

---

## Challenges we ran into
- **Balancing accuracy vs. latency** for face detection on varied devices (tuning input size/thresholds).  
- **PII detection edge cases** (overlapping spans, partial matches, false positives/negatives) and safe placeholder merging.  
- **Strict privacy guarantees** across boundaries (ensuring masked-only requests reach the LLM).  
- **Cross-environment dependencies** (keeping Node-only libs like `tfjs-node`/`sharp` out of the browser bundle).  
- **Consistent dataset handling** when precomputing masks/landmarks for model experiments.

---

## Accomplishments that we're proud of
- A **fully redaction-first** chat flow where sensitive content is never exposed upstream.  
- **Multi-layer validation** (client and server) for defense-in-depth.  
- Smooth, **real-time UX** that still honors strict privacy policies.  
- A reusable **redaction-image** and **redaction-text** package for other apps.

---

## What we learned
- Privacy-by-design means reshaping **architecture** (not just adding a filter).  
- Combining **ML (NER)** with **deterministic rules (regex)** delivers better coverage than either alone.  
- Small vision models (e.g., TinyFaceDetector) can be **fast and good enough** for anonymization with the right thresholds.  
- Strong type systems and clear boundaries reduce accidental data exposure.

---

## What's next for Lens
- **Broader visual redaction:** license plates, screens, IDs, documents (OCR-aware masking).  
- **Stronger on-device NER:** more compact multilingual models and custom PII domains.  
- **Policy packs & org controls:** team-wide presets, audit exports, DLP integrations.  
- **Mobile & Edge:** PWA and edge-compute variants for ultra-low latency, offline safety.  
- **Developer SDK:** drop-in redaction middleware for any AI pipeline.

---

## APIs Used
- **OpenAI API** — GPT with SSE streaming (only after server-side redaction validation).  
- **Supabase API** — Auth, policy storage, audit metadata; never stores original sensitive content.

---

## Tech Stack

**Frontend**
- React + TypeScript  
- Vite  
- Tailwind CSS

**Backend**
- Node.js + Express  
- TypeScript (strict)  
- Multer (uploads), Sharp (image processing)  
- pnpm workspaces

**Testing / Quality**
- Vitest, ESLint, Prettier

---

## Libraries

**AI/ML**
- **@xenova/transformers** — in-browser BERT-style NER via WASM/WebGL, no external API needed.  
- **face-api.js / TinyFaceDetector** — lightweight CNN for real-time face detection (e.g., 416px input, ~0.4 threshold).

**PrivyLens packages**
- **@privylens/redaction-text** — regex-based detectors, span merging, placeholder policies.  
- **@privylens/redaction-image** — Canvas/Sharp image ops; pixelation & blur with normalized boxes.

---

## Setup (optional quick start)

```bash
# Running the repo 
1) download node js 

2) cd into tiktok/privylens

3) npm install -g pnpm 

// install pnpm globally 

4) pnpm install 

5) pnpm dev 

- website would be on localhost:3000

# Models (client)
# Load TinyFaceDetector weights from CDN or place in /public/models

# Environment
# SUPABASE_*, OPENAI_API_KEY set in server env; client never sees raw PII
