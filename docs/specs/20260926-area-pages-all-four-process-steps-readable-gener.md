---
task: 20260926-area-pages-all-four-process-steps-readable-gener
company: venturelabs
status: ready
size: S
branch: fix/area-pages-all-four-process-steps-readable-gener
base: dev
design: none
---

# Area pages: every process step readable without a click, generic strength block removed

## Goal
On `/:lang/leistungen/:slug` the process list is a fake accordion: `ProcessStep` opens only the
first row (`useState(index === 0)`) and its toggle is a `div` with an `onClick`, so every later
step renders as a title with no text and no keyboard route to its content — although the
descriptions exist in `content/services/*.md` for both locales. Make every step's description
visible at page load by turning the row into plain, non-interactive markup (the simpler of the two
options the requester offered — no accordion, therefore no `button`/`aria-expanded` needed).
Separately, remove the `StrengthSection` block (`Unsere Stärke: Digitale Produktentwicklung`) from
the four area pages, because it promises generic product development on pages about AI Automation,
AI Products, AI Experience and Venture Building — which the site concept forbids ("Nicht
generische Softwareentwicklung als Hauptversprechen").

## Assumptions
- "All four step descriptions" means *every* step in that page's own `process` list, not literally
  four: the content files carry 4 steps (`ai-automation`), 3 (`ai-products`), 5 (`ai-experience`)
  and 5 (`venture-building`) in both locales — read in `content/services/*.md`. Normalising the
  step counts is a content task, not this one.
- The simpler option is chosen: a static, always-visible list. Nothing toggles, so no `button`, no
  `aria-expanded`, and no focus affordance is introduced in the process section at all.
- The circular arrow indicator on each row goes away with the toggle: kept on a non-clickable row
  it would be a false affordance.
- The now-unused `src/app/components/StrengthSection.tsx` is deleted as part of the fix (the area
  page is its only consumer, verified by grep). `design/STATUS.md` names the "StrengthSection bar"
  as *visual* anatomy for design round 1 — git history keeps the markup if a later round wants it.
  Say the word at gate 1 if you prefer the file kept in place, unused.
- The `strength*` frontmatter in `content/site/leistungen.md` / `leistungen.en.md` and the matching
  fields in `scripts/generate-content.ts` stay as they are: unrendered after this change, and
  removing them would mean touching the generator's types and both locale content files for no
  rendered effect.
- `/:lang/ueber-uns` keeps its own sentence "…eine Agentur für digitale Produktentwicklung"
  (`content/about/about.md`); the acceptance criterion is about area pages.
- Hero spacing after the removal: the signature block's existing `py-16` is the closing spacing of
  the hero section. No new spacing value is invented.
- No test runner is added. Mechanical assertions follow the repo's own precedent,
  `scripts/check-analytics.ts` + a `check:*` script in `package.json` (tsx is already a devDep).
- Verification happens on a local preview (`pnpm dev`, :5173) and, if it exists, the branch deploy
  of this branch on Netlify `vl-home` — *unverified*: `netlify.toml` and the Netlify config are a
  denied path for this session, so I cannot confirm a preview URL for this branch name.
- Both locales get the identical structural change; no copy is written, translated or rewritten in
  this task.
- The existing `motion` scroll-in animations and the `font-['sofia-pro',…]` classes in
  `LeistungenDetail.tsx` stay exactly as they are (the font classes belong to task D3).

Correct me at gate 1, otherwise I proceed with these.

## Context found
- `src/app/pages/LeistungenDetail.tsx:125-188` — `ProcessStep`: `const [open, setOpen] =
  useState(index === 0)`, `onClick` + `cursor-pointer` on the outer `motion.div`, the description
  behind `{open && …}`, and a rotating circle with an `ArrowRight` as the only "affordance". This is
  finding F4 of the audit doc.
- `src/app/pages/LeistungenDetail.tsx:190-222` — `ProcessSection` maps `detail.process` and renders
  one `ProcessStep` per entry, keyed by `step.number`; heading from `t("leistungen.processHeading")`.
- `src/app/pages/LeistungenDetail.tsx:41-121` — `DetailHero`; lines 109-117 are the wrapper
  `motion.div` whose only child is `<StrengthSection />`, and line 6 is the import.
- `src/app/components/StrengthSection.tsx` — renders `leistungenData.strengthHeadline` /
  `strengthDescription` / `strengthFeatures`. Grep over the repo: the only import is
  `LeistungenDetail.tsx`, so after the removal the component has no consumer.
- `content/site/leistungen.md:61-75` (and `.en.md:61-…`) — the forbidden copy itself:
  `strengthHeadline: "Unsere Stärke:\nDigitale Produktentwicklung"` plus the four generic features.
  This is finding F5.
- `content/services/{ai-automation,ai-products,ai-experience,venture-building}.md` and their
  `.en.md` twins — every `process` entry has a non-empty `description` today; step counts 4 / 3 / 5
  / 5 per area, same in both locales.
- `scripts/prerender.ts:1-18` — deliberately writes `<head>` tags only; the built HTML body stays
  `<div id="root"></div>`. A grep over `dist/**/index.html` can therefore neither prove nor
  disprove that a string is on the rendered page.
- `scripts/check-analytics.ts` — the repo's established "no test runner, so a tsx assertion script"
  pattern, with `PASS  [n] …` / `FAIL  [n] …` lines and a non-zero exit. `package.json:9` exposes it
  as `check:analytics`.
- `src/app/components/ui/CtaButton.tsx`, `Navbar.tsx`, `Footer.tsx`, `PulseQuiz.tsx` — all
  interactive elements are native `<a>` / `<button>`; nothing on this page sets `focus:outline-none`.
  So once the step row stops being a click target, the area page has no non-native control left.
- `C:\code\venturelabs\knowledge-base\marketing\website-agency-topics-2026-09-26.md` — F4 (line 156),
  F5 (line 157), priority row 5 (line 881) and the D5 task entry (lines 995-1006).
- `C:\code\venturelabs\design\STATUS.md:71-84` — round 1 covers start page + AI Pulse page; the
  "Area page template" round is explicitly *later*, so this bug fix lands inside today's layout.

## Approach
Keep the existing component structure and remove state instead of adding controls.

`ProcessStep` loses its `open` state, its `onClick`, its `cursor-pointer` and its
`{open && …}` conditional. The row stays the same `motion.div` with the same scroll-in animation,
the same three-part layout (number, title, description) and the same typography classes; the step
number takes the accent colour unconditionally (it previously did so only when open), the circular
arrow indicator is deleted, and the description paragraph is rendered as a normal sibling block
with the `pl-20 pb-8` indent it already used. `ProcessSection` is untouched — it already maps every
entry of `detail.process`, so all steps of every area, in both locales, render their text.

Why not the accordion-with-a-real-button variant: it is strictly more work (a `button` wrapping a
heading, `aria-expanded`, `aria-controls`, an id per panel, focus styling, a visible affordance) and
it still hides the text a visitor came for. The requester asked for the simpler of the two; the
simpler one is also the one that fixes the actual complaint ("the page promises four steps and
explains one"). Accordion semantics are out; if a later area-page design round wants a collapsible
list, it will come with a handoff.

For the strength block: delete the import (line 6) and the wrapper `motion.div` with its
`<StrengthSection />` child (lines 109-117) from `DetailHero`, and delete
`src/app/components/StrengthSection.tsx`, which then has no consumer. The hero ends with the
`PulseLines` signature block, whose existing `py-16` supplies the bottom spacing before the dark
process section — no new spacing token, no layout decision, nothing a designer must draft. The
content frontmatter and the generator fields stay untouched (see Assumptions).

Because the repo has no test runner and `prerender.ts` writes head tags only, the mechanically
provable part of the acceptance is asserted by a new `scripts/check-area-pages.ts` on `tsx`,
modelled line-for-line on `scripts/check-analytics.ts` (same `PASS`/`FAIL` output, same non-zero
exit), wired as `pnpm check:area-pages`. It asserts the content-side facts (every `process` entry in
all eight service files has a non-empty `description`) and the source-side facts (no per-step state,
no click target in the process markup, no `StrengthSection` reference anywhere under `src/`). The
DOM-level criteria stay human checks on the preview — see "What to click".

## Files to change
| File | Change | Why |
|---|---|---|
| `src/app/pages/LeistungenDetail.tsx` | `ProcessStep`: drop `open` state, `onClick`, `cursor-pointer`, the `{open && …}` wrapper and the circular arrow indicator; render the description unconditionally; number always in `accent`. `DetailHero`: drop the `StrengthSection` import (line 6) and the wrapper `motion.div` (lines 109-117). | F4 and F5, both on this one page |
| `src/app/components/StrengthSection.tsx` | Delete | No consumer left; keeps the forbidden claim out of the page and the bundle |
| `scripts/check-area-pages.ts` | New tsx assertion script (`PASS`/`FAIL` lines, non-zero exit), same shape as `scripts/check-analytics.ts` | The repo has no test runner; this is its established substitute |
| `package.json` | Add `"check:area-pages": "tsx scripts/check-area-pages.ts"` to `scripts` | Makes the check runnable and re-runnable by the Tester and Reviewer |

## Acceptance criteria
1. On each of the eight area-page routes (`/de` and `/en` × `ai-automation`, `ai-products`, `ai-experience`, `venture-building`), the process section shows the title **and** the full `description` text of every entry of that locale's `process` list at page load, with no click, hover or keyboard interaction (today's counts: 4, 3, 5, 5).
2. `src/app/pages/LeistungenDetail.tsx` contains no per-step open/closed state: no `useState(index === 0)`, no `open`/`setOpen` in `ProcessStep`, no `cursor-pointer` on the step row, and the description paragraph is not wrapped in a conditional.
3. The process section renders no interactive element: inside the step rows there is no `<button>`, no `<a>`, no `role="button"`, no `tabIndex`, no click handler, and no circular arrow indicator.
4. Keyboard-only on `/de/leistungen/ai-automation`: tabbing from the top of the document reaches every interactive element of the page in DOM order — navbar links and the mobile menu button, the hero CTA, both CTA-banner buttons (Pulse and contact), the "case" link, the three other-service links, the phone and mail links, the footer links — each with a visible focus indicator, and Tab never stops on a process step row.
5. No route under `/:lang/leistungen` (overview or any of the four detail pages, either locale) renders the string `Digitale Produktentwicklung`, its EN twin `Digital product development`, or the headline `Unsere Stärke` / `Our strength`.
6. `src/app/components/StrengthSection.tsx` no longer exists, and no file under `src/` references `StrengthSection`, `strengthHeadline`, `strengthDescription` or `strengthFeatures`.
7. `pnpm build` exits 0 and `prerender.ts` still writes one HTML shell per route including the four area pages per locale (the printed shell count is unchanged from the pre-change build).
8. `pnpm check:area-pages` exits 0 and prints one `PASS` line per mechanically asserted criterion (content side of 1, plus 2, 3 and 6); breaking any one of those assertions makes it print a `FAIL` line and exit non-zero.
9. Nothing else on the area page changes: hero text and CTA, the case section, the CTA banner, the other-services grid, the contact strip and the footer keep their current copy and markup, and no `font-['sofia-pro',…]` class in this file is touched (that is task D3).
10. No file under `content/`, `src/data/`, `src/locales/` or `scripts/generate-content.ts` is modified by this task.

## Test plan
The repo has no test suite and none is added. What runs:

```
Windows — PowerShell:
cd C:\ai\dev-worktrees\venturelabs\landing\20260926-area-pages-all-four-process-steps-readable-gener; pnpm install --prefer-offline; pnpm build; pnpm check:area-pages

macOS — Terminal (zsh): not available (this worktree lives on the Windows PC)

What it does: installs deps, regenerates src/data from content/, builds with Vite, prerenders every
route shell, then runs the mechanical assertions. Expect "prerender: wrote N route-specific HTML
shells" and "check-area-pages: all checks passed", exit code 0 both times.
```

Then the preview:

```
Windows — PowerShell:
cd C:\ai\dev-worktrees\venturelabs\landing\20260926-area-pages-all-four-process-steps-readable-gener; pnpm dev

What it does: serves the site on http://localhost:5173 . Open /de/leistungen/ai-automation,
/de/leistungen/ai-products, /de/leistungen/ai-experience, /de/leistungen/venture-building and the
four /en/… twins, scroll the process section on each (the rows fade in on scroll), and work through
"What to click".
```

The Tester walks all eight routes, scrolls each process section to the bottom, compares the visible
step texts against the `description` values in the matching `content/services/*.md`, runs the
tab-through of criterion 4 on one German and one English page, and does a Ctrl+F for
`Digitale Produktentwicklung` / `Unsere Stärke` on all eight plus `/de/leistungen` and
`/en/leistungen`. Every one of those checks is reported explicitly, pass or fail, with the route
named — "looks fine" is not a report.

## What to click
1. `/de/leistungen/ai-automation` — all four steps show a headline *and* a paragraph at once; nothing needs clicking; step 04 "Begleitung" has its text ("monatliche Check-ins…") visible.
2. `/en/leistungen/ai-experience` — five steps, all with English text, no leftover circle/plus icons and no hand cursor on the rows.
3. `/de/leistungen/ai-automation`, keyboard only — Tab from the address bar: focus visibly walks navbar → hero CTA → CTA-banner buttons → case link → the three other-service cards → phone/mail → footer, and never stops on a step row.
4. Hero of any area page — the page goes waveform → "Unser Prozess" with sensible spacing, no empty band where the `Unsere Stärke` bar used to be; Ctrl+F for `Unsere Stärke` finds nothing.
5. `/de/leistungen/venture-building` at 390 px width — the five step blocks read top-to-bottom without horizontal overflow and the number column does not crush the title.

## Verification and evidence
- Criteria 2, 3, 6 and the content side of 1: `pnpm check:area-pages` output pasted into the
  close-out, showing a `PASS` line per assertion and exit code 0.
- Criterion 6 additionally: `git grep -n "StrengthSection" -- src` and
  `git grep -n "strengthHeadline\|strengthDescription\|strengthFeatures" -- src` both print nothing
  (exit 1); paste both commands and their empty output.
- Criterion 7: the tail of `pnpm build`, showing exit 0 and the `prerender: wrote N …` line, with N
  stated and compared against a build of the base branch (same N).
- Criteria 1, 4, 5: no automated proof exists in this repo (no test runner; the built HTML body is
  `<div id="root"></div>`, so grepping `dist/` proves nothing) — proven by the "What to click" list
  on the preview. The close-out must show one full-height screenshot of the process section of
  `/de/leistungen/ai-automation` (all four steps with text) and one of `/en/leistungen/ai-products`,
  plus the tab order actually observed in criterion 4 written out as a list.
- Criteria 9 and 10: `git diff --stat` in the close-out, showing exactly the four files of the table
  (one of them a deletion) and nothing under `content/`, `src/data/`, `src/locales/`.

## Will not do
- No push, no PR, no merge, no rebase; `main` and `dev` are not touched.
- No new dependency — no test runner, no headless browser, no accessibility-audit package.
- No edit to `netlify.toml`, `.github/workflows/`, or anything under `src/data/{de,en}/` (generated).
- No copy change: no rewriting, translating or shortening of a single `description`, headline or CTA
  string, and no removal of the `strength*` frontmatter from `content/site/leistungen*.md`.
- No font/`sofia-pro` cleanup (D3), no phone-number fix (D1/F1), no hero-video work (D4).
- No restart of any service, no deploy, nothing posted outside this repo.
- No work in `pulse-landing-page/` or any other repo.

## Stop conditions
- A `process` entry in any `content/services/*.md` turns out to have an empty or missing
  `description`: stop and report which file — writing one would be inventing copy.
- Grep finds another consumer of `StrengthSection` (a page, a barrel, a test): stop before deleting
  the file and report it.
- `pnpm build` fails for a reason not caused by this diff (install, generator, unrelated type
  error): report the exact error, do not "fix" the build by widening the change.
- Removing the strength block leaves a gap that clearly needs a layout decision rather than the
  existing `py-16` (e.g. the hero collapsing onto the process heading): stop and ask; do not invent
  spacing, and do not open a design round on your own.
- A criterion turns out to need a headless browser to prove: say so, leave it to the click list, do
  not add a dependency.

## Risks and open questions
- Making step 02 of `ai-automation` visible surfaces `"Sie erhalten eine priorisierte Roadmap…"`
  (`content/services/ai-automation.md:27`) — the only `Sie` left in the service content, while
  ADR 0001 decided `ihr`/`euch`. Not blocking and deliberately out of scope here (the register
  rewrite is its own task); if you want the one-line fix folded in at gate 1, say so and I add a
  criterion for it.
- Criteria 1, 4 and 5 are DOM-level and have no mechanical proof in this repo — they are
  click-checks. That is a real gap: a later regression that re-hides a step would not fail any
  command. Closing it would mean a headless-browser dependency, which is a decision, not an S task.
- `ai-experience` and `venture-building` carry five steps, `ai-products` three. The audit's "all
  four" refers to descriptions, not a step count; if you want exactly four steps per area, that is a
  content task.
- Each step row keeps its `motion` `useInView` fade-in, so its text is `opacity: 0` until scrolled
  into view. Unchanged behaviour, but it is why the preview check must scroll rather than skim.
- `src/imports/Frame1618868195/index.tsx` also contains the string `Digitale Produktentwicklung`; it
  is imported by nothing (verified by grep) and is left alone. If a future check greps the whole
  `src/` tree for that string it will hit this dead Figma export.
- Deleting `StrengthSection.tsx` removes the only code copy of the "bar" layout that
  `design/STATUS.md` lists as existing anatomy for design round 1; git history keeps it.

## Out of scope
- Any other finding of the audit doc: F1 phone number, F2 `sofia-pro` fallbacks, F3 hero video, F6
  register/language mix, F9 pulse site, F10 body prerendering.
- Prerendering page content into the HTML body (F10) — the reason criteria 1 and 5 cannot be grepped.
- Rewriting, renumbering or shortening the process steps, and writing a replacement block for the
  removed strength section (the area pages simply have one section less).
- The `digitale Produktentwicklung` sentence on `/:lang/ueber-uns`.
- Removing the `strength*` fields from `content/site/leistungen*.md` and
  `scripts/generate-content.ts`, and deleting `src/imports/Frame1618868195/`.
- The planned area-page design round, and any accordion/collapsible re-design of the process list.
