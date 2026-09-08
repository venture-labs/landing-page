---
task: 20260907-fix-mismatched-case-card-images-on-venturelabs-t
company: venturelabs
status: ready
size: M
branch: fix/fix-mismatched-case-card-images-on-venturelabs-t
base: dev
design: none
---

# Fix mismatched case-card thumbnail images under `public/uploads/cases/`

## Goal
Four files in `public/uploads/cases/` — `brylliant-card.png`, `machinemaster-card.png`,
`moerschen-card.png`, `tap2link-card.png` — currently hold the wrong image bytes: each shows a
different company's screenshot than the one its filename (and the markdown in `content/cases/`)
says it is. Fix this by replacing the byte content of each of the four files with the correct
image, reusing assets that already exist correctly elsewhere in the same folder wherever
possible, without renaming any file, without editing any markdown in `content/cases/`, and
without touching the generated `src/data/{de,en}/cases.ts` / `caseDetails.ts`.

## Assumptions
- I opened all four PNGs plus `laptop_moerschen_screen.jpg` visually (via the Read tool) and
  confirm the brief's description of what each currently shows is accurate: `brylliant-card.png`
  = Tap2Link phone mockup (org "MyWay", "Weston Hooper"); `machinemaster-card.png` = tap2link.com
  marketing homepage screenshot; `moerschen-card.png` = Brylliant briefing-tool laptop screenshot
  ("More efficiency and effectiveness for your marketing"); `tap2link-card.png` = MachineMaster
  mobile hero ("Absolute Pros at the big machines") on red.
- `content/cases/{brylliant,machinemaster,moerschen,tap2link}.{md,en.md}` already reference the
  correct filename for `image` (and, for brylliant only, also `heroImage`/`mockupImages`) — I
  read all four `.md` files (both locales for the four target cases) and confirm no frontmatter
  edit is needed; the fix is asset-content-only.
- `image` (`content/cases/*.md`) is rendered as the case-grid thumbnail by
  `CaseGridCard` in `src/app/pages/CasesOverview.tsx` (`<img src={c.image} ...>`,
  `object-cover` inside a fixed `h-[280px]` container) — so exact pixel dimensions of the
  replacement images do not need to match each other, `object-cover` crops/fills.
- For `machinemaster`, `moerschen`, and `tap2link`, `heroImage` (detail-page hero, rendered by
  `CaseHero` in `src/app/pages/CaseDetail.tsx`) and `mockupImages` (rendered by `ResultsSection`
  in the same file) already point at different, already-correct files (`hero-machinemaster.png`,
  `hero-moereschen.png`, `tap2link-hero.png`, `case-machinemaster-{1,2,3}.png`,
  `case-moerschen-pic{1,2,3}.png`, `tap2link-mockup-{1,3}.png`) that this task must not touch.
  Only `brylliant` uses the same file (`brylliant-card.png`) for `image`, `heroImage`, and
  `mockupImages[0]`, so fixing `brylliant-card.png`'s bytes fixes all three placements for
  brylliant at once.
- `public/` is served/copied verbatim by Vite (`vite.config.ts` has no image-processing plugin,
  only the `figma:asset/` resolver for `src/assets/`, and `assetsInclude` only adds `.svg`/`.csv`
  raw imports) — so a byte-for-byte swap of files already inside `public/uploads/cases/`
  requires no build config change and no code change.
- `moerschen-card.png` has no correct source among the four mismatched files, so it must be
  produced by converting `public/uploads/cases/laptop_moerschen_screen.jpg` (laptop showing the
  real Moerschen website — verified visually) into a valid PNG saved at the `moerschen-card.png`
  path. The conversion tool itself (e.g. ImageMagick, `sips`, a one-off Node/`sharp` script, or
  any other lossless JPEG→PNG converter) is an implementation detail the Implementer picks; it
  must not become a new `package.json` dependency or change `vite.config.ts` — only the resulting
  PNG bytes are committed. Re-compression/quality loss beyond the JPEG's own is out of scope;
  the PNG must render pixel-visually as the same laptop/Moerschen-website photo.
  Correct me at gate 1, otherwise I proceed with these.
- `card_tap2link.png` (a fifth, differently-named file already in the folder) is not referenced
  anywhere in `content/` or `src/` (confirmed by repo-wide search) — it is an unused orphan and
  is out of scope for this task.
  Correct me at gate 1, otherwise I proceed with these.
- No `alt`-text or caption frontmatter field in any of the four cases' `.md`/`.en.md` describes
  image *content* in a way that would need updating (`CaseGridCard` uses `c.title` as `alt`,
  `CaseHero` uses `detail.heroHeadline`) — confirmed by reading all four files.
  Correct me at gate 1, otherwise I proceed with these.
- **Amended after the Tester's `spec` verdict (2026-09-08):** at least one of the three rotated
  card files does not carry the PNG file signature despite its `.png` name — the Tester's run of
  `criterion 2: machinemaster-card.png is a valid PNG` failed while its byte-identity test
  passed, i.e. the pre-fix `tap2link-card.png` bytes that now sit in `machinemaster-card.png` do
  not start with `89 50 4E 47 0D 0A 1A 0A`. I could not re-read the raw bytes myself in this pass
  (no shell available to this role; ripgrep skips binaries), so the *format* of those source
  bytes is **unverified** beyond "not PNG-signed" — the fix does not depend on knowing which
  format it actually is. Those exact bytes are already served under a `.png` filename on the live
  site today (they are the wrong-but-visibly-rendering image this task fixes), so mislabeled
  container bytes demonstrably render in the browser and this fix introduces no new risk class.
  Consequence, and the single reading of criteria 1–3 below: **byte-identity to the named source
  wins over container format for the three rotated files**; the PNG-signature requirement applies
  only to `moerschen-card.png` (criterion 4), which is newly encoded and therefore under our
  control. Normalising the other three to real PNGs would contradict the byte-identity mechanism
  this whole fix rests on and is out of scope (see Out of scope).

## Context found
- `public/uploads/cases/`: static, unprocessed image folder served by Vite as-is; contains the
  four mismatched `-card.png` files plus the already-correct `hero-*.png`, `case-*-pic*.png` /
  `case-*-1..3.png`, `tap2link-mockup-*.png`, `tap2link-hero.png`, and
  `laptop_moerschen_screen.jpg`.
- `content/cases/{brylliant,machinemaster,moerschen,tap2link}.md` (+ `.en.md`): frontmatter
  fields `image`, `heroImage`, `mockupImages` — all already point at the *correct* filenames for
  their own case; verified line-by-line for all four cases, both locales.
- `src/app/pages/CasesOverview.tsx` `CaseGridCard` (line ~109): renders `c.image` as the
  list-page thumbnail (`<img src={c.image} className="w-full h-full object-cover ...">`).
- `src/app/pages/CaseDetail.tsx` `CaseHero` (line ~74) and `ResultsSection` (line ~243): render
  `detail.heroImage` and `detail.mockupImages[]` respectively.
- `scripts/generate-content.ts` compiles `content/cases/*.md` into `src/data/{de,en}/cases.ts`
  and `caseDetails.ts` (denied path, never hand-edited) — since the markdown already has correct
  filenames, no regeneration-affecting change is needed beyond the swapped image bytes.
- `vite.config.ts`: no image-processing/optimization plugin; `public/` assets are copied through
  untouched, so the fix is a pure filesystem content replacement.

## Approach
This is a static-asset content fix, not a code change: extend nothing, add nothing — just make
the bytes under four existing filenames match what those filenames (and the markdown that
already references them) claim they are. Do the replacement in the exact order given in the
brief so no needed source is overwritten before it is copied out, using a temp file to carry the
one value (`brylliant-card.png`'s current Tap2Link screenshot) that both needs to survive past
step 2 and is needed again at step 4. Steps 1–5 are verbatim byte copies: the source bytes are
moved unchanged, never re-encoded, converted, or stripped of metadata, so each destination file
inherits its source's container format exactly.

1. Copy current `brylliant-card.png` → `tmp-original-brylliant-card.png` (temp holder, not
   referenced by any markdown, deleted at the end).
2. Overwrite `brylliant-card.png` with the current bytes of `moerschen-card.png` (the Brylliant
   laptop screenshot — correct for Brylliant).
3. Overwrite `machinemaster-card.png` with the current bytes of `tap2link-card.png` (the
   MachineMaster phone screenshot — correct for MachineMaster; the old `machinemaster-card.png`
   content, a duplicate tap2link.com homepage screenshot, is discarded — it duplicates
   `tap2link-hero.png`/`tap2link-mockup-*.png` which stay untouched).
4. Overwrite `tap2link-card.png` with `tmp-original-brylliant-card.png`'s bytes (the Tap2Link app
   screenshot from step 1 — correct for Tap2Link).
5. Delete `tmp-original-brylliant-card.png`.
6. Overwrite `moerschen-card.png` with a PNG re-encoding of
   `public/uploads/cases/laptop_moerschen_screen.jpg` (already correctly shows the real Moerschen
   website on a laptop) — must remain named `moerschen-card.png` and stay a valid PNG file (magic
   bytes `89 50 4E 47 0D 0A 1A 0A`), since `<img>` usage does not care about extension-vs-format
   but the filename must not change.

Rejected alternative: renaming files to match content and updating the four markdown files'
`image`/`heroImage`/`mockupImages` pointers instead of swapping bytes. Rejected because the
brief is explicit that filenames must stay exactly as-is (including `.png`) and the markdown
already points at the *correct* filename per case — renaming would require editing
`content/cases/*.md` for no benefit and risks touching the generated `src/data/` output
indirectly through `scripts/generate-content.ts`, which is explicitly denied.
Rejected alternative: leaving `moerschen-card.png` as a `.jpg` renamed to `.png` without
re-encoding (i.e. just relabeling the extension). Rejected because the file must be a *valid*
PNG at that path, not a JPEG wearing a `.png` extension — browsers may still render a mislabeled
JPEG via content-sniffing, but that is not "a valid PNG" and is explicitly ruled out by the
brief. This PNG-validity requirement is scoped to `moerschen-card.png` only — it is the one file
this task *encodes*, so its format is ours to choose; the three files this task only *moves*
(steps 1–5) keep their source bytes verbatim and are not format-normalised (see Assumptions and
criteria 1–3).

## Files to change
| File | Change | Why |
|---|---|---|
| `public/uploads/cases/brylliant-card.png` | Replace bytes with current `moerschen-card.png` content (captured before it's itself overwritten) | Brylliant's card/hero/mockup image must show the Brylliant briefing tool |
| `public/uploads/cases/machinemaster-card.png` | Replace bytes with current `tap2link-card.png` content (captured before it's itself overwritten) | MachineMaster's card thumbnail must show the MachineMaster phone screenshot |
| `public/uploads/cases/tap2link-card.png` | Replace bytes with the *original* `brylliant-card.png` content, captured via temp file before step 2 | Tap2Link's card thumbnail must show the Tap2Link app screenshot |
| `public/uploads/cases/moerschen-card.png` | Replace bytes with a PNG re-encoding of `laptop_moerschen_screen.jpg` | Moerschen's card thumbnail must show the real Moerschen website; no correct source exists among the other three `-card.png` files |
| `public/uploads/cases/tmp-original-brylliant-card.png` | Create in step 1, delete in step 5 | Temp carrier so the original Tap2Link screenshot survives past the moment `brylliant-card.png` is overwritten |

No file under `content/`, `src/data/`, `src/app/`, or `vite.config.ts` changes.

## Acceptance criteria
1. `public/uploads/cases/brylliant-card.png` is byte-for-byte identical to the bytes
   `moerschen-card.png` held immediately before this fix (the Brylliant laptop-briefing-tool
   screenshot, "More efficiency and effectiveness for your marketing"). The bytes are copied
   verbatim — no re-encoding, no format conversion, no metadata rewriting — so the file's
   container format is whatever the source's was. **No PNG-signature (magic-byte) assertion is
   made for this file**; format is asserted only for `moerschen-card.png` (criterion 4). The
   filename keeps its `.png` extension unchanged.
2. `public/uploads/cases/machinemaster-card.png` is byte-for-byte identical to the bytes
   `tap2link-card.png` held immediately before this fix (the MachineMaster mobile hero,
   "Absolute Pros at the big machines", red background). Those source bytes are known **not** to
   carry the PNG file signature; byte-identity is the requirement and it takes precedence — the
   Implementer must **not** re-encode, convert, or otherwise alter them to make the content match
   the `.png` extension. **No PNG-signature (magic-byte) assertion is made for this file.** The
   filename keeps its `.png` extension unchanged.
3. `public/uploads/cases/tap2link-card.png` is byte-for-byte identical to the bytes
   `brylliant-card.png` held immediately before this fix (the Tap2Link phone mockup, org "MyWay",
   user "Weston Hooper", t2i logo). The bytes are copied verbatim — no re-encoding, no format
   conversion, no metadata rewriting. **No PNG-signature (magic-byte) assertion is made for this
   file.** The filename keeps its `.png` extension unchanged.
4. `public/uploads/cases/moerschen-card.png` is a valid PNG (first 8 bytes exactly
   `89 50 4E 47 0D 0A 1A 0A`) — this is the **only** file in this task whose container format is
   asserted, because it is the only one this task encodes rather than copies. It is not
   byte-identical to any of `brylliant-card.png`, `machinemaster-card.png`, or `tap2link-card.png`
   (old or new content), and is not byte-identical to its own pre-fix content; opening it shows
   the same laptop-with-Moerschen-website photo as `laptop_moerschen_screen.jpg`.
5. No file under `content/cases/`, `src/data/de/`, `src/data/en/`, `src/app/`, or
   `vite.config.ts` is modified by this fix.
6. `laptop_moerschen_screen.jpg` and the temp file `tmp-original-brylliant-card.png` do not exist
   in the final `public/uploads/cases/` tree changes beyond: `laptop_moerschen_screen.jpg`
   unchanged in place (source, not deleted), `tmp-original-brylliant-card.png` absent (created
   and deleted during the fix, never committed).
7. `hero-machinemaster.png`, `hero-moereschen.png`, `tap2link-hero.png`,
   `case-machinemaster-1.png`, `case-machinemaster-2.png`, `case-machinemaster-3.png`,
   `case-moerschen-pic1.png`, `case-moerschen-pic2.png`, `case-moerschen-pic3.png`,
   `tap2link-mockup-1.png`, `tap2link-mockup-3.png`, `card_tap2link.png`, `animation-card.png`,
   `neuer-look-card.png`, and `scanservice-card.png` are all byte-identical to their pre-fix
   content (untouched).
8. `pnpm build` completes without error (content generation, `vite build`, and
   `scripts/prerender.ts` all succeed) after the asset swap.
9. Visually, in a local preview (`pnpm dev`, port 5173), `/de/cases` and `/en/cases` list
   thumbnails show: Brylliant card → laptop briefing-tool screenshot; MachineMaster card → red
   phone-hero screenshot; Tap2Link card → phone/MyWay mockup; Moerschen card → laptop with the
   real Moerschen website. (Manual visual check — not mechanically assertable beyond criteria 1–4
   which pin down the exact bytes/format.)
10. `/de/cases/brylliant`, `/en/cases/brylliant` detail-page hero also shows the corrected
    Brylliant laptop screenshot (since `heroImage` for brylliant is the same file as `image`).
    (Manual visual check.)
11. `/de/cases/machinemaster`, `/de/cases/moerschen`, `/de/cases/tap2link` (and `en` equivalents)
    detail-page heroes are unchanged (still `hero-machinemaster.png`, `hero-moereschen.png`,
    `tap2link-hero.png` respectively) and still show their own, already-correct company image.
    (Manual visual check — confirms criterion 7 at the rendered-page level.)

## Test plan
There is no automated test framework in this repo (`package.json` has no `test` script, no
`vitest`/`jest`/Playwright dependency, and no `*.test.*`/`*.spec.*` files exist anywhere in the
tree — confirmed by search). Per the repo's own test guidance, verification for this task is:
1. A deterministic, scriptable file-content check (criteria 1–7) — see "Tests to write" below;
   this is the part the Test Writer can turn into a real, failing-then-passing check without any
   new dependency (Node's built-in `node:test` + `node:assert` + `node:crypto`, already available
   since the repo requires Node to run `pnpm`).
2. `pnpm build` (criterion 8) — content generation, `vite build`, prerender of every route must
   all succeed with no errors.
3. `pnpm dev` local preview at `:5173` plus opening each of `/de/cases`, `/en/cases`,
   `/de/cases/{brylliant,machinemaster,moerschen,tap2link}`, and the `en` equivalents, to
   visually confirm criteria 9–11. Report each route's result explicitly (this repo has no
   automated visual/link-check tooling to fall back on).

## Tests to write
| # | Kind | File | Under test | Fixtures / mocks |
|---|---|---|---|---|
| 1 | unit (file-content, `node --test`) | `tests/assets/case-card-images.test.mjs` (new file/dir — no existing test folder in this repo) | Byte-for-byte identity of `public/uploads/cases/brylliant-card.png` vs. the pre-fix content of `moerschen-card.png`, using a SHA-256 hash the Test Writer computes and hardcodes from the *current* (pre-fix) repo state before the Implementer runs. Assert the hash only — **do not** assert PNG magic bytes for this file (criterion 1) | none — reads real files under `public/uploads/cases/` via `node:fs` + `node:crypto`, no mocks |
| 2 | unit (file-content, `node --test`) | `tests/assets/case-card-images.test.mjs` | Byte-for-byte identity of `machinemaster-card.png` vs. pre-fix `tap2link-card.png` (hash hardcoded from current state). Assert the hash only — **do not** assert PNG magic bytes for this file; its source bytes are not PNG-signed and byte-identity is the requirement (criterion 2) | none |
| 3 | unit (file-content, `node --test`) | `tests/assets/case-card-images.test.mjs` | Byte-for-byte identity of `tap2link-card.png` vs. pre-fix `brylliant-card.png` (hash hardcoded from current state). Assert the hash only — **do not** assert PNG magic bytes for this file (criterion 3) | none |
| 4 | unit (file-content, `node --test`) | `tests/assets/case-card-images.test.mjs` | `moerschen-card.png` — the **only** file with a format assertion: PNG magic-byte check (first 8 bytes == `89 50 4E 47 0D 0A 1A 0A`); hash differs from its own pre-fix hash and from the other three cards' post-fix hashes; PNG `IHDR` width/height equal the frame dimensions of `laptop_moerschen_screen.jpg` | none |
| 5 | unit (file-content, `node --test`) | `tests/assets/case-card-images.test.mjs` | Untouched-file guard: hashes of `hero-machinemaster.png`, `hero-moereschen.png`, `tap2link-hero.png`, `case-machinemaster-{1,2,3}.png`, `case-moerschen-pic{1,2,3}.png`, `tap2link-mockup-{1,3}.png`, `card_tap2link.png`, `animation-card.png`, `neuer-look-card.png`, `scanservice-card.png` match hashes hardcoded from the current (pre-fix) state | none |
| 6 | unit (file-content, `node --test`) | `tests/assets/case-card-images.test.mjs` | `tmp-original-brylliant-card.png` does not exist at `public/uploads/cases/` after the fix; `laptop_moerschen_screen.jpg` still exists and is byte-identical to its pre-fix content | none |
| 7 | manual | n/a | `pnpm build` exits 0; `pnpm dev` + visual check of the 8 routes listed in Test plan step 3 | none — Tester runs commands and reports pass/fail per route explicitly |

Run the automated ones with `node --test tests/assets/case-card-images.test.mjs` (no new
`package.json` script strictly required, but the Test Writer may add
`"test": "node --test tests/**/*.test.mjs"` to `package.json` `scripts` if that fits the repo's
conventions better — this is a Test Writer decision, not an Implementer one).

## Risks and open questions
- The exact tool used to re-encode `laptop_moerschen_screen.jpg` to PNG is left to the
  Implementer (see Assumptions) since none is currently a project dependency; this does not
  block the spec but the Implementer must not add a new `package.json` dependency or npm/pnpm
  package for a one-off conversion — use an OS-level tool or a throwaway script. Not a blocker.
- Because this is a pure binary-content swap with no automated test suite in the repo today, the
  "Tests to write" rows above introduce a new `tests/` directory and rely on the Test Writer
  hardcoding SHA-256 hashes read from the *current* (pre-fix) file bytes; if the Dev Manager
  prefers zero new test infrastructure for a single asset fix, criteria 1–7 can instead be
  verified manually by the Tester via `sha256sum`/`Get-FileHash` and reported explicitly, dropping
  the `tests/assets/case-card-images.test.mjs` file entirely. Not a blocker — flagging as a
  process choice, not a fact I'm unsure of.
- At least one rotated card file (`machinemaster-card.png`, i.e. the pre-fix `tap2link-card.png`
  bytes) carries a `.png` name over non-PNG bytes. Criteria 1–3 deliberately keep it that way:
  the alternative reading — normalise the three rotated files to real PNGs so extension and
  format agree — would break the byte-identity the whole fix is built on, change asset content
  the requester never asked to change, and grow a one-line asset fix into a re-encoding pass. It
  is therefore recorded under Out of scope as a separate follow-up, not folded into this task.
  Not a blocker.
- Whether the Netlify response headers for `public/` assets include `X-Content-Type-Options:
  nosniff` is **unverified** — `netlify.toml` is a denied path for this role. This does not block:
  browsers decode `<img>` payloads by content regardless of the declared subtype, and these exact
  bytes are already served under a `.png` filename in production today and render (that visible
  rendering is precisely the mismatched-image bug being fixed), so the fix changes which image is
  served, not whether a mislabeled one can be displayed. The Tester's manual check of criteria
  9–11 covers rendering end to end. Not a blocker.

## Out of scope
- Renaming any file or editing any frontmatter in `content/cases/*.md`.
- Regenerating or hand-editing `src/data/{de,en}/cases.ts` / `caseDetails.ts`.
- Cleaning up the unused, unreferenced `card_tap2link.png` orphan asset.
- Normalising the container format of the three rotated card files (`brylliant-card.png`,
  `machinemaster-card.png`, `tap2link-card.png`) so their bytes match their `.png` extension —
  including re-encoding the known non-PNG-signed `machinemaster-card.png` bytes. These files are
  moved verbatim by this task; a format/extension audit of `public/uploads/` is a separate task.
- Any change to `hero-*.png`, `case-*-pic*.png` / `case-*-1..3.png`, `tap2link-mockup-*.png`, or
  `tap2link-hero.png` — these already correctly represent their company and are spot-checked as
  untouched (criterion 7), not modified.
- Adding a permanent, general-purpose automated test framework (Vitest/Jest/Playwright) to the
  repo; the minimal `node --test` file proposed here is scoped to this fix only.
