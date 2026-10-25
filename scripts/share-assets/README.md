# Share images and icons (VL-16-S1)

Everything here is rendered, not drawn by hand, so the set can be regenerated. The
finished files live in `public/`; `pnpm check:meta` verifies them on every build
(PNG signature, IHDR size, at most 300 KB for the share images).

| File | Source | Size |
|---|---|---|
| `public/og-venturelabs.png` (/de) | `og-venturelabs-en.html?lang=de`, line "KI im Mittelstand, die sich rechnet." | 1200x630 |
| `public/og-venturelabs-en.png` (/en) | `og-venturelabs-en.html?lang=en`, line "AI for mid-sized companies, that pays off." | 1200x630 |
| `public/icon-192.png` | `public/favicon.svg` | 192x192 |
| `public/icon-512.png` | `public/favicon.svg` | 512x512 |

`og-venturelabs-en.html` is the one template: `?lang=en` (default) or `?lang=de`
picks the line. `public/favicon.svg` has a `viewBox` but no width/height, so the
browser scales it to fill the viewport - the viewport size is the icon size.
`public/favicon.ico`, `favicon-32x32.png` and `apple-touch-icon.png` are not
rendered here (they come from VL-10-S2) and `site.webmanifest` is hand-written;
`pnpm check:meta` checks their structure.

## Centre-square rule

Messengers (WhatsApp first) crop the centre square of the share image: 630x630 px,
x 285-915. The mark sits fully inside that square (bounding box within x 325-875,
y 40-590); every line of text sits in the side bands (x < 285 or x > 915), so a crop
never cuts a word. The rule is checked by eye on the two crops below, not by
`check:meta`.

## Render the PNGs

All commands: macOS - Terminal (zsh). Windows - PowerShell: not available (this
workflow runs on the Mac). `pnpm dlx` fetches Playwright on demand and its Chromium
comes from Playwright's own browser cache (`pnpm dlx playwright install chromium`
once, if it is missing); Playwright is not a dependency of the project. Run each
line from the repo root; the `cd` is part of the line.

German share image - renders the template with the German line into `public/og-venturelabs.png`:

```
cd /Users/chris/ai/dev-worktrees/venturelabs/landing/20261021-link-previews-meta-data-for-venturelabs-team-og- && pnpm dlx playwright screenshot --viewport-size=1200,630 "file://$PWD/scripts/share-assets/og-venturelabs-en.html?lang=de" public/og-venturelabs.png
```

English share image - renders the template with the English line into `public/og-venturelabs-en.png`:

```
cd /Users/chris/ai/dev-worktrees/venturelabs/landing/20261021-link-previews-meta-data-for-venturelabs-team-og- && pnpm dlx playwright screenshot --viewport-size=1200,630 "file://$PWD/scripts/share-assets/og-venturelabs-en.html?lang=en" public/og-venturelabs-en.png
```

Icon 192 - renders the mark of `public/favicon.svg` on `#0e0d13` at 192x192 into `public/icon-192.png`:

```
cd /Users/chris/ai/dev-worktrees/venturelabs/landing/20261021-link-previews-meta-data-for-venturelabs-team-og- && pnpm dlx playwright screenshot --viewport-size=192,192 "file://$PWD/public/favicon.svg" public/icon-192.png
```

Icon 512 - the same at 512x512 into `public/icon-512.png`:

```
cd /Users/chris/ai/dev-worktrees/venturelabs/landing/20261021-link-previews-meta-data-for-venturelabs-team-og- && pnpm dlx playwright screenshot --viewport-size=512,512 "file://$PWD/public/favicon.svg" public/icon-512.png
```

(Another checkout: replace the `cd` path with its root.) The four renders are
byte-identical on a re-run (checked 2026-10-22), so `git status` stays clean after
regenerating. If a share image ever exceeds 300 KB, quantise it to a 256-colour
indexed PNG (the personal site's `tools/png-quant.mjs` approach: median cut with
dithering, `node:fs` + `node:zlib` only) before considering JPEG; today both are
about 30 KB and no quantiser is needed.

## Look at the centre crops

`sips` ships with macOS and crops about the centre. Each command cuts the centre
630x630 square - the part WhatsApp shows - to a file in `/tmp`; open it and check the
whole mark is there and no text is cut.

```
sips -c 630 630 /Users/chris/ai/dev-worktrees/venturelabs/landing/20261021-link-previews-meta-data-for-venturelabs-team-og-/public/og-venturelabs.png --out /tmp/og-de-centre.png
```

```
sips -c 630 630 /Users/chris/ai/dev-worktrees/venturelabs/landing/20261021-link-previews-meta-data-for-venturelabs-team-og-/public/og-venturelabs-en.png --out /tmp/og-en-centre.png
```
