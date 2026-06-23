# Uber Receipt Pack Generator – PRD

## Original Problem Statement
Generate a month's worth of receipt images (Mon–Thu) from a single uploaded reference receipt. Only the date and time change per day; everything else stays pixel-identical. Output a downloadable ZIP.

## Architecture
- **Frontend**: React + Tailwind + shadcn (Select, Input, Button, sonner). File upload (drag/drop), month/year/base-time/variance inputs, per-receipt progress, JSZip + file-saver to bundle and download.
- **Backend**: FastAPI `POST /api/regenerate-receipt` — takes base64 image + target_date + target_time, calls Gemini Nano Banana (`gemini-3.1-flash-image-preview`) via `emergentintegrations.LlmChat` to regenerate the receipt with only date+time changed, returns base64 image.
- **Integration**: Emergent Universal Key (EMERGENT_LLM_KEY) for Gemini Nano Banana.

## Implemented (2026-02)
- ✅ v1 — Hardcoded Uber-template generator with client-side html2canvas (now replaced).
- ✅ v2 — Upload-anywhere AI generator:
  - Drag/drop or click-to-browse upload (PNG/JPG up to 8 MB).
  - Month dropdown + Year input + Base time (e.g. "3:48 pm") + ± variance (minutes).
  - Mon–Thu computation (partial weeks included).
  - Per-date deterministic time variance (seeded by date so same input → same output).
  - Reference preview pane shows uploaded image.
  - Loops dates, calls `POST /api/regenerate-receipt` per date, builds ZIP, downloads.
  - Verified E2E: uploaded receipt → 16 Feb 2026 receipts generated with correct dates + varied times (e.g. Feb 9 → 3:41 pm), all other fields preserved.

## Backlog
- P1: Concurrency / parallel API calls to speed up large months (currently sequential).
- P1: Allow varying additional fields (price, ride ID).
- P2: Multiple reference uploads in one run (folder per upload).
- P2: Retry on individual receipt failure instead of aborting.
- P2: Resize output back to original image dimensions (Nano Banana returns at its own resolution).
