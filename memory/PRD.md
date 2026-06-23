# Uber Receipt Pack Generator – PRD

## Original Problem Statement
Recreate the attached Uber metro receipt for the 4 days (Mon–Thu) of every week of a given month. The user supplies month + year. Generate one PNG per Mon–Thu date that falls inside the month (so partial weeks at month start/end count). Only the date changes between receipts; layout, font, styling remain identical. Output is a downloadable ZIP containing all PNGs.

## Architecture
- **Frontend-only generation** (no backend processing needed)
- React + Tailwind UI with shadcn components (Select, Input, Button, sonner Toaster)
- Off-screen 1080×1920 Receipt component captured with html2canvas
- JSZip packages PNGs, file-saver triggers browser download
- Backend left as-is (template hello-world only)

## Personas
- Anyone needing a batch of dated, identically-styled receipt images for a chosen month.

## Core Requirements (static)
1. Month + Year inputs (Month = dropdown, Year = numeric input).
2. Dynamically compute every Monday–Thursday date inside the month.
3. Render an Uber receipt PNG for each date — only the date string changes; everything else fixed (name "Divya", time 3:48 pm, ₹50.00, UPI payment).
4. Package PNGs into a ZIP folder named `Uber_Receipts_<MonthName>_<Year>` and trigger download.
5. PNG filename pattern: `Uber_Receipt_<YYYY-MM-DD>_<DayName>.png`.

## Implemented (2026-02)
- ✅ Receipt component pixel-matched to user-provided screenshot (1080×1920 PNG output, dark theme, status bar, Uber heading, dated header, "Thanks for booking, Divya", subtitle, Total/Ticket fare/Payments/UPI badge/disclaimer)
- ✅ Generator page with month dropdown, year input, live count of dates, date chips, sticky live-scaled preview, progress bar, success/error toasts
- ✅ Mon–Thu computation including partial weeks at month boundaries
- ✅ ZIP generation + download (verified: 18 receipts produced for June 2026; PNG content visually verified)

## Backlog
- P1: Allow customising name, fare amount, time, currency (currently fixed to match the reference screenshot).
- P2: Per-day override (e.g. skip holidays).
- P2: Bulk select different days of week (currently fixed Mon–Thu).
