# HML Anti-Gravity Pack 2 — Import + Featured List

## What this pack contains
1) `verification_import_all.csv`
   - Import-ready CSV for your entire categorized footprint spreadsheet.
   - Columns match the Verification Entries data model:
     `id, category, organization, title, date, type, themes, highlight, metrics_label, metrics_value, link, status, asset_url`

2) `featured_top20.csv`
   - The Top 20 featured entries (recommended for Home highlights and Journey proof moments).

3) `featured_top20.md`
   - A clean, human-readable Top 20 list with IDs + links.

## How to use in Anti-Gravity (step-by-step)
1) Open Runway Studio → Content Library → Verification Entries → **Bulk Import**
2) Upload `verification_import_all.csv`
3) Map fields if prompted:
   - `id` → ID
   - `category` → Category
   - `organization` → Organization/Outlet
   - `title` → Title
   - `date` → Date
   - `type` → Type
   - `themes` → Themes/Tags
   - `highlight` → Highlight/Description
   - `metrics_label` → Metrics Label
   - `metrics_value` → Metrics Value
   - `link` → Source Link
   - `status` → Status (VERIFIED / VALIDATION_PENDING)
   - `asset_url` → Asset URL (optional)
4) After import:
   - Filter status = VALIDATION_PENDING to find missing links to fill later.
5) Mark featured:
   - Use `featured_top20.csv` to set those IDs to `FEATURED` and pin them on Home’s Verification Strip.

## Suggested display behavior
- If `link` exists → show **VIEW SOURCE**
- If link missing → show stamp **VALIDATION PENDING** and allow you to attach a link/asset later.
