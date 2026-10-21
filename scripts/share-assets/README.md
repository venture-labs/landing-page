# Share images (og:image)

`og-venturelabs-en.html` is the 1200x630 template of the link-preview image
(VL-16-S1). One template, one line per language: `?lang=en` (default) or `?lang=de`.
The finished PNGs live in `public/` (`og-venturelabs.png` for /de,
`og-venturelabs-en.png` for /en), each at most 300 KB, and are checked by
`pnpm check:meta` on every build.

## Centre-square rule

Messengers (WhatsApp first) crop the centre square of the image: 630x630 px,
x 285-915. The mark sits fully inside that square; every line of text sits in the
side bands (x < 285 or x > 915), so a crop never cuts a word.

## Render a PNG

macOS - Terminal (zsh):

```
pnpm dlx playwright screenshot --viewport-size=1200,630 "file://$PWD/scripts/share-assets/og-venturelabs-en.html?lang=en" public/og-venturelabs-en.png
cd /Users/chris/ai/dev-worktrees/venturelabs/landing/20261021-link-previews-meta-data-for-venturelabs-team-og- && pnpm dlx playwright screenshot --viewport-size=1200,630 "file://$PWD/scripts/share-assets/og-venturelabs-en.html?lang=de" public/og-venturelabs.png
```

(Another checkout: replace the `cd` path with its root.) What it does: renders the template in headless Chromium and writes the PNG into
`public/`. Windows - PowerShell: not available (the cluster and this workflow run on macOS).
`pnpm dlx` fetches Playwright on demand; it is not a dependency of the project.

## Look at the centre crop

macOS - Terminal (zsh):

```
sips -c 630 630 /Users/chris/ai/dev-worktrees/venturelabs/landing/20261021-link-previews-meta-data-for-venturelabs-team-og-/public/og-venturelabs-en.png --out /tmp/og-en-centre.png
```

What it does: cuts the centre 630x630 square, the part WhatsApp shows. Open the file and check that no
text is cut.
