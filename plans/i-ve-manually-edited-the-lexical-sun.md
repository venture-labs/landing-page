# Plan: Typography, Layout & Animation Fixes

## Context
Multiple visual deviations from the Figma design have been identified by the user:
- Headlines are too heavy (`font-extrabold`/800 weight vs. Figma's SemiBold/600)
- Font sizes feel too small — Figma's max-viewport is 1600px with fixed sizes (92px heading, 40px subtitle/card title, 17.8px card description); the clamp min values need lifting
- Services section renders 4 cards in one row instead of a 2×2 grid
- Client logos section is a static overflow-x scroll, not an auto-scrolling marquee band
- Projects (featured) section is too wide — needs a tighter max-width

---

## Changes

### 1. `src/styles/theme.css` — Recalibrate fluid typography

Figma canvas is 1600px. At 1600px: heading = 92px (5.75rem), subtitle = 40px (2.5rem), card title = 40px, card desc = 17.8px (~1.1rem). Raise min values and increase the vw multipliers so sizes feel closer to Figma at desktop widths:

```css
--text-hero:  clamp(3rem,    5.75vw, 5.75rem);
--text-h2:    clamp(2rem,    2.5vw,  2.5rem);
--text-card:  clamp(1.25rem, 2.5vw,  2.5rem);
--text-body:  clamp(1rem,    1.1vw,  1.1rem);
--text-small: clamp(0.875rem,1.1vw,  1.1rem);
```

### 2. `src/app/components/Hero.tsx` — Reduce headline weight

Change `font-extrabold` → `font-semibold` on the `<h1>`. Figma uses Sofia Pro SemiBold (600 weight).

### 3. `src/app/components/Services.tsx` — 2×2 grid

Replace the `flex flex-wrap` card container with a CSS grid:
```
grid grid-cols-1 sm:grid-cols-2 gap-6
```
Each card loses `flex-1 min-w-[260px]` and becomes a normal grid cell. This gives exactly 2 columns on desktop (2×2 for 4 cards), stacking to 1 on mobile.

Also change section heading weight: `font-extrabold` → `font-semibold`.

### 4. `src/app/components/ClientLogos.tsx` — Infinite marquee

Replace the static `overflow-x-auto` row with a CSS marquee animation:
- Render the logos list **twice** side-by-side in a `flex` row (for seamless looping)
- Wrap in an `overflow-hidden` container
- Add a `@keyframes marquee` in a `<style>` tag (or inline CSS) that translates X from `0` to `-50%` over ~30s linear infinite
- No scroll bar, no snap points — purely animated

Logo cards: keep `bg-[#272530] rounded-lg` with fixed size `w-[220px] h-[140px]`.

### 5. `src/app/components/ProjectsFeatured.tsx` — Narrower container

Change the inner content max-width from `max-w-[1400px]` to `max-w-[1100px]` so the alternating image+text rows feel less stretched. The outer section stays full-width.

---

## Files to modify
- `src/styles/theme.css`
- `src/app/components/Hero.tsx`
- `src/app/components/Services.tsx`
- `src/app/components/ClientLogos.tsx`
- `src/app/components/ProjectsFeatured.tsx`

---

## Verification
1. At ~1600px viewport, hero headline should be ~92px, feel medium-weight (not ultra-bold)
2. Services section: exactly 2 cards per row (2×2 layout)
3. Client logos: smooth auto-scrolling band, no manual scroll needed
4. Projects section: content visibly narrower/less stretched than before
