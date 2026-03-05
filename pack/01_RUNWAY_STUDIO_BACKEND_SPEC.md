# Runway Studio Backend Spec (No-Code Control)

## Admin
Route: /studio
Modes:
1) Visual Edit Mode (click-to-edit, drag modules, replace media, preview/publish, version history)
2) Content Library Mode (Chapters, Verification Entries, Speaking, Press Kit, Assets)
3) Theme + Motion Mode (palette, typography, sparkle density, flashbulb intensity, strobe transitions, calm mode)
4) Cursor Mode (enable, size, tint color)

## Content Types
- Assets (image/video/audio/pdf/embed)
- Chapters (Journey)
- Verification Entries (archive with filters + search)
- Speaking Topics (cards)
- Press Kit Assets (downloads)
- Site Settings (emails, socials, hero copy)
- Theme Settings
- Cursor Settings

## Bulk Import
- Import Verification entries from CSV/XLSX with field mapping
- Auto-flag missing links as VALIDATION PENDING

## Autoplay
- Videos autoplay muted on scroll (IntersectionObserver)
- Audio only after Sound toggle ON (user interaction)

## Cursor
- Use /assets/hml-cursor.png
- Cursor image must never disappear when tint changes (tint overlay + mask)
- Runway Studio controls call window.HMLCursor.setColor(), setSize(), enable(), disable()
