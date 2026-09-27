---
task: 20260926-finish-the-figtree-swap-remove-every-sofia-pro-f
company: venturelabs
status: ready
size: S
branch: fix/finish-the-figtree-swap-remove-every-sofia-pro-f
base: dev
design: none
---

# Finish the Figtree swap: drop every `sofia-pro` font class so the quiz, the legal pages and the area pages inherit Figtree

## Goal

The Typekit `<link>` was removed when Sofia Pro was replaced by self-hosted Figtree, but the
Tailwind arbitrary class `font-['sofia-pro',sans-serif]` is still on a large number of elements.
`sofia-pro` never loads, so those elements fall back to the browser's default sans-serif (Arial)
while the rest of the page renders Figtree — measured live on `/de/leistungen/ai-automation`:
`body` computes to Figtree, an `h3` in the process list to `sofia-pro, sans-serif`. Remove every
one of those classes so each affected element inherits the project's Figtree token from `body`,
with no other visual change. Audit source: `knowledge-base/marketing/website-agency-topics-2026-09-26.md`,
finding F2 (section 1d) and task goal D3 (section 5).

## Assumptions

- **"The project's font token/utility" means deleting the class, not substituting another one.**
  The project's token is `--font-figtree`, applied once in `src/styles/theme.css` as
  `body { font-family: var(--font-figtree); }`. There is no `font-figtree` Tailwind utility today
  (`--font-figtree` is declared in a plain `:root` block in `src/styles/fonts.css`, not inside
  `@theme`, so Tailwind 4 generates no utility from it). Every component migrated in the Figtree
  swap — `Hero.tsx`, `Navbar.tsx`, `FinalCTA.tsx` — carries only weight utilities
  (`font-semibold`, `font-light`) and no font-family class at all. Deleting the stale class
  therefore *extends the existing pattern*; adding a new utility would introduce a second one.
- **The real scope is 129 occurrences across 11 files, not the "roughly twenty" in four files the
  brief names.** The brief names `PulseQuiz.tsx`, `PulseCheckModal.tsx`, `LegalPage.tsx` and
  `pages/LeistungenDetail.tsx` (37 of the 129). The audit's own acceptance — `git grep sofia-pro`
  returns nothing under `src/` — already requires all 11 files, so this is not a widening of the
  goal, only a correction of its count. Verified count per file in "Files to change".
- **Every one of the 129 occurrences is the byte-identical string `font-['sofia-pro',sans-serif]`.**
  Verified: a search for `font-\['sofia-pro[^\]]*\]` returns the same 129 hits as a search for
  `sofia-pro`, and every hit prints the identical class. This is a mechanical deletion, not 129
  judgement calls.
- **No occurrence is the sole class in its `className`.** Verified: a search for
  `="font-['sofia-pro',sans-serif]"` (the class alone, in either quote style, plain or in braces)
  returns no matches. So no deletion can leave an empty or invalid `className`.
- **`src/imports/**` is out of scope and does not violate the acceptance criterion.** Those
  Figma-exported `index.tsx` files carry ~300 `font-['Sofia_Pro:SemiBold']` / `font-['Sofia_Pro:Light']`
  classes, but (a) case-sensitive `sofia-pro` does not match `Sofia_Pro`, and (b) they are dead
  code: nothing in `src/app/` imports those `index.tsx` files — only the sibling
  `@/imports/🖌Homepage/svg-oa0apfkpzr` path data is imported (by `Footer.tsx`, `Navbar.tsx`,
  `ClientLogos.tsx`, `ProjectsFeatured.tsx`). They never render, so they cannot affect a computed
  font. A Tester running a case-insensitive `grep -i sofia` will see them and must not read that
  as a failure.
- **Nothing under `src/styles/` needs to change.** `public/fonts/figtree/Figtree-Variable.woff2`
  and `Figtree-Italic-Variable.woff2` exist, the `@font-face` rules are correct, `index.html`
  contains no Typekit link, and `body` already applies the token.
- **Only font-family changes.** Every touched line keeps its weight, size, colour, spacing,
  `style={{ fontSize: ... }}` and text content exactly as-is.
- **Both locales are covered automatically.** The same components render `de` and `en`; there is
  no locale-specific font class.
- **There is no test framework in this repo** — `package.json` has `build`, `dev` and
  `check:analytics` only, and no vitest/jest dependency. Verification is a grep, `pnpm build`, and
  a human check on a local preview. Adding a test runner is not part of this fix.
- **Preview**: `pnpm dev` on `http://localhost:5173`. Whether Netlify builds a branch deploy for a
  `fix/*` branch on `vl-home` is *unverified* — the knowledge base documents branch deploys for
  `dev` (`https://dev--vl-home.netlify.app`) only. Gate 3 runs on the local preview unless a branch
  URL turns out to exist; since the branch is now pushed for the pull request, whether such a URL
  appeared is checked once and named on the morning list.

Correct me at gate 1, otherwise I proceed with these.

## Context found

- `src/styles/fonts.css`: self-hosted Figtree `@font-face` (variable + italic, `font-display: swap`,
  SIL OFL) replacing Adobe Typekit Sofia Pro; declares `:root { --font-figtree: 'Figtree',
  -apple-system, …, sans-serif; }`. Also carries two `@import url(https://fonts.googleapis.com/…)`
  lines for Plus Jakarta Sans and Inter that no file in `src/` references.
- `src/styles/theme.css`: `@layer base { body { font-family: var(--font-figtree); } }` — the single
  place the token is applied. Its `@theme inline` block defines colours and radii only, no
  `--font-*`. The base layer sets size/weight/line-height for `h1`–`h4`, `label`, `button`, `input`
  but **no** `font-family` on form controls; those inherit via Tailwind 4 preflight's
  `font: inherit` on `button, input, select, textarea`.
- `src/styles/index.css`: `@import './fonts.css'; @import './tailwind.css'; @import './theme.css';`
- `src/app/components/PulseQuiz.tsx` (17): the Pulse Score quiz — intro paragraph, start button,
  question label `span`, question `h3`, the four option `button`s, and the whole result screen
  (score, band label, narrative, per-area breakdown, CTA block, restart link).
- `src/app/components/PulseCheckModal.tsx` (1): the Radix `DialogTitle` of the quiz modal. Opened
  from `Hero.tsx` (homepage), `pages/Leistungen.tsx` and `pages/LeistungenDetail.tsx`.
- `src/app/components/LegalPage.tsx` (2): the shared shell for `/:lang/impressum` and
  `/:lang/datenschutz` — the `h1` and the prose wrapper whose `[&_h2]` selectors style the nested
  headings, so both stale classes affect the whole legal page.
- `src/app/components/ui/CtaButton.tsx` (1): one occurrence inside a template-literal `className`,
  shared by `FinalCTA.tsx`, `AboutTeaser.tsx`, `CaseDetail.tsx` and `LeistungenDetail.tsx` — one
  edit fixes the primary CTA on the homepage and on every area and case page.
- `src/app/pages/LeistungenDetail.tsx` (24): the page the audit measured, including the process
  accordion `h3`s.
- `src/app/pages/Kontakt.tsx` (21), `UeberUns.tsx` (15), `BlogDetail.tsx` (17), `CaseDetail.tsx` (17),
  `Blog.tsx` (12), `CasesOverview.tsx` (2): the same stale class throughout.
- `src/app/components/Hero.tsx`: the reference for the target state — `font-semibold`,
  `font-light`, `font-medium` on headings, body copy and buttons, and no font-family class.
- `scripts/prerender.ts`: writes an HTML shell per route per locale, including
  `/${lang}/impressum` and `/${lang}/datenschutz`; runs as the third step of `pnpm build`.

## Approach

Delete all 129 occurrences of the literal class `font-['sofia-pro',sans-serif]` from the 11 files
that carry it, collapsing the whitespace the deletion leaves so no `className` gains a double
space and none becomes empty. Nothing else on any of those lines changes. Each affected element
then inherits `font-family: var(--font-figtree)` from `body` — the same way `Hero.tsx`,
`Navbar.tsx` and `FinalCTA.tsx` already do since the Figtree swap. Form controls (the quiz option
`<button>`s, the start button, `CtaButton`'s `<button>`/`<a>`) inherit through Tailwind 4
preflight's `font: inherit`; the evidence that this holds in this project is that Hero's CTA
buttons carry no font-family class and the audit measured the homepage as Figtree.

No CSS file is touched, no Tailwind config changes, no dependency is added, no markup structure
or copy moves.

Gate 1 (Christian, 2026-09-26, reaction on the gate-1 post in `#dev-agent`) approved this spec as
written and decided the task runs **whole, not split**: all 129 occurrences in the 11 files in one
change, on one branch, in one pull request — no per-file or per-page slicing. It runs as the night
run of 2026-09-26/27 and lands as a **pull request against `dev` that is left unmerged**; the merge
is gate 3, a human on GitHub. The result is reported on the morning list.

**Rejected: promoting `--font-figtree` into a `@theme` block and replacing the 129 classes with a
new `font-figtree` utility.** It would work — Tailwind 4 emits `@theme` custom properties into
`:root`, so `body { font-family: var(--font-figtree) }` would keep resolving — but it adds a CSS
change, introduces a second way of saying the same thing, and leaves the site with a mix of
components that state the family and components that inherit it. Inheritance from `body` is the
pattern the swap already established. Gate 1 did not flip this; the deletion approach stands.

**Rejected: a scripted repo-wide find-and-replace across `src/`.** It would also hit
`src/imports/**` (different string, dead code) and risks collapsing whitespace inside unrelated
strings. The edit is confined to the 11 files listed.

**Rejected: also removing the two unused Google Fonts `@import`s in `fonts.css`.** Real dead
weight (two render-blocking requests for families nothing uses), but a separate change with its
own performance evidence — noted under Out of scope.

## Files to change

| File | Change | Why |
|---|---|---|
| `src/app/pages/LeistungenDetail.tsx` | remove 24 × `font-['sofia-pro',sans-serif]` | the page the audit measured; process-list `h3`s render in Arial |
| `src/app/pages/Kontakt.tsx` | remove 21 × | contact page headings and body in Arial |
| `src/app/components/PulseQuiz.tsx` | remove 17 × | the conversion flow: questions, options, result screen |
| `src/app/pages/BlogDetail.tsx` | remove 17 × | blog post body and headings |
| `src/app/pages/CaseDetail.tsx` | remove 17 × | case study body and headings |
| `src/app/pages/UeberUns.tsx` | remove 15 × | about page |
| `src/app/pages/Blog.tsx` | remove 12 × | blog index |
| `src/app/components/LegalPage.tsx` | remove 2 × | `/impressum` + `/datenschutz`, incl. the `[&_h2]` prose wrapper |
| `src/app/pages/CasesOverview.tsx` | remove 2 × | cases index |
| `src/app/components/PulseCheckModal.tsx` | remove 1 × | the quiz modal title |
| `src/app/components/ui/CtaButton.tsx` | remove 1 × (inside the template literal on line 24) | shared CTA on home, area pages and case pages |
| `docs/specs/20260926-…-f.md` | new (this file) | the spec |

No other file is touched. In particular: no file under `src/styles/`, `src/imports/`, `content/`,
`src/locales/`, `src/data/`, `public/`, and no config.

## Acceptance criteria

1. `git grep -n "sofia-pro" -- src/` (case-sensitive) produces no output and exits non-zero.
2. `git grep -n "font-\[" -- src/app` produces no output — verified today to have exactly the same
   129 hits, so this also proves no replacement arbitrary font class was introduced.
3. The count of `font-['sofia-pro',sans-serif]` is zero in each of these 11 files:
   `src/app/pages/LeistungenDetail.tsx`, `Kontakt.tsx`, `BlogDetail.tsx`, `CaseDetail.tsx`,
   `UeberUns.tsx`, `Blog.tsx`, `CasesOverview.tsx`, `src/app/components/PulseQuiz.tsx`,
   `PulseCheckModal.tsx`, `LegalPage.tsx`, `src/app/components/ui/CtaButton.tsx`.
4. `git diff --name-only` lists exactly those 11 source files plus this spec file — no file under
   `src/styles/`, `src/imports/`, `content/`, `src/locales/`, `src/data/`, `public/`, and no config
   file appears.
5. For every changed line, the removed line and the added line are identical once
   `font-['sofia-pro',sans-serif]` is deleted from the removed line and runs of spaces are
   collapsed to one — i.e. no text, weight, size, colour, spacing, `style` prop or attribute
   changed anywhere in the diff.
6. No `className` in the diff contains two consecutive spaces, and no `className` in the diff is
   empty (`className=""` or `className={""}`).
7. `pnpm build` exits 0 (content generation, `vite build`, and prerender of every route all
   succeed).
8. After `pnpm build`, a case-sensitive recursive search for `sofia-pro` under `dist/` returns no
   matches (no bundled JS, CSS or prerendered HTML carries the string).
9. On `/de/leistungen/ai-automation` in the preview, the computed `font-family` of the process-list
   `h3` begins with `Figtree` (this is the exact element the audit measured as `sofia-pro, sans-serif`).
10. With the Pulse Score quiz modal open (homepage hero button), the computed `font-family` of the
    modal title, the question `h3`, the question-number `span`, the intro/body paragraphs and every
    option `<button>` begins with `Figtree`.
11. On the quiz result screen (after answering all questions), the computed `font-family` of the
    score number, the band label, the narrative paragraph, every per-area breakdown row, the CTA
    heading/body and the restart link begins with `Figtree`.
12. On `/de/impressum` and `/de/datenschutz`, the computed `font-family` of the `h1`, every nested
    `h2` and the body prose begins with `Figtree`; the same holds on `/en/impressum` and
    `/en/datenschutz`.
13. On `/de`, `/de/leistungen`, `/de/kontakt`, `/de/ueber-uns`, `/de/cases`, `/de/blog` and one
    case and one blog detail page, no element renders in the browser default sans-serif — every
    `h1`–`h4`, `p`, `span`, `a`, `button`, `li` and `label` computes a `font-family` beginning with
    `Figtree`.
14. Apart from the typeface (and the reflow that a different typeface necessarily causes), nothing
    on the touched pages changes: no heading, label or button text, no colour, no weight, no
    element appears or disappears.
15. `src/imports/**` is byte-identical to `dev`.
16. All 129 deletions ship as one change on the branch `fix/finish-the-figtree-swap-remove-every-sofia-pro-f`
    (whole, not split), every commit message starting with
    `20260926-finish-the-figtree-swap-remove-every-sofia-pro-f: ` and ending its body with
    `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
17. That branch is pushed to `origin` with an explicit refspec, and exactly one pull request exists
    with base `dev` and head `fix/finish-the-figtree-swap-remove-every-sofia-pro-f`, in state open
    and unmerged, whose URL is named in the close-out and on the morning list.
18. `dev` and `main` carry no commit from this task: after a `git fetch origin`, `origin/dev` and
    `origin/main` point at the same SHAs as the ones recorded before the push, and the pull request
    from criterion 17 is not merged.

## Test plan

There is no automated test suite in this repo (`package.json` has no `test` script and no test
runner dependency), and this fix does not add one. What runs:

1. **The grep gate** — criteria 1–6, run from the worktree root, before and after the change.
2. **The build** — `pnpm install --prefer-offline && pnpm build`, which runs
   `scripts/generate-content.ts`, `vite build` and `scripts/prerender.ts` for every route in both
   locales. Criteria 7–8.
3. **The preview** — `pnpm dev` on `http://localhost:5173`; the Tester walks the routes in criteria
   9–13 in both locales and reads back computed styles with the console snippet in "Verification
   and evidence". The quiz has to be opened and played through to the result screen — the result
   screen is the single densest cluster of stale classes and is not reachable without answering
   the questions.
4. **Link check** — the routes above are opened directly (not only via in-app navigation) so the
   prerendered shells are exercised too.
5. **The branch and PR check** — criteria 16–18: commit-message format, the push with an explicit
   refspec, the open unmerged pull request against `dev`, and the unchanged `origin/dev` /
   `origin/main` SHAs.

The Tester reports each of the five explicitly, per the repo's testing note, and those reports are
what the morning list carries.

## What to click

1. Homepage `/de` → the hero's Pulse Score button → the modal opens: the title, the question and
   the four answer buttons are all in Figtree (rounded, geometric), none in Arial — with the
   modal open, nothing inside it should look like a different typeface from the page behind it.
2. Play the quiz to the end → the result screen: the big score number, the band label, the
   breakdown rows and the CTA block are all Figtree.
3. `/de/leistungen/ai-automation` → scroll to the process list: the step headings match the
   typeface of the section heading above them (this is the exact mismatch the audit photographed).
4. `/de/impressum` and `/de/datenschutz` → the page title, the sub-headings and the prose are all
   Figtree, and the text still wraps sensibly at 390 px width (Figtree's metrics differ from
   Arial's, so line breaks will move).
5. `/de/kontakt`, `/de/ueber-uns`, `/de/cases` and `/de/blog` → one scroll each: nothing left in
   Arial, and no heading now overflows its container or collides with a neighbouring element
   because of the new metrics.

## Verification and evidence

Run all commands from the worktree root.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && git grep -n "sofia-pro" -- src/ ; echo "exit=$?"

macOS — Terminal (zsh): not applicable (this worktree exists on the Windows PC only)
```
What it does: searches every tracked file under `src/` for the case-sensitive string `sofia-pro`.
Expect **no output** and `exit=1`. Criterion 1. Paste the whole output, including the `exit=` line,
into the close-out.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && git grep -n "font-\[" -- src/app ; echo "exit=$?"
```
What it does: proves no arbitrary font class of any kind is left in the app code, so nothing was
swapped for another family. Expect no output and `exit=1`. Criterion 2.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && git diff --stat
```
What it does: lists the changed files and line counts. Expect exactly the 11 source files from
"Files to change" plus `docs/specs/…`, with added and removed line counts equal per file (129
lines changed in total across the 11 files, no net additions). Criteria 4–5. Paste the output.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && git diff -U0 -- src | grep -nE '^\+.*(  |className=""|className=\{""\})' ; echo "exit=$?"
```
What it does: looks for a double space or an emptied `className` in any added line. Expect no
output and `exit=1`. Criterion 6.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && pnpm install --prefer-offline && pnpm build ; echo "exit=$?"
```
What it does: generates `src/data/{de,en}/` from `content/`, builds with Vite, then prerenders one
HTML shell per route per locale. Expect `exit=0` and the prerender step listing the routes,
including `/de/impressum` and `/de/datenschutz`. Criterion 7. Paste the last ~20 lines.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && grep -rc "sofia-pro" dist/ ; echo "exit=$?"
```
What it does: searches the build output for the string. Expect no match line with a non-zero count
(criterion 8). Paste the output.

```
Windows — PowerShell:
cd C:\ai\dev-worktrees\venturelabs\landing\20260926-finish-the-figtree-swap-remove-every-sofia-pro-f; pnpm dev
```
What it does: starts the dev server on http://localhost:5173 after regenerating content. Leave it
running for the preview checks; stop it with Ctrl+C.

**Computed-style read-back** (criteria 9–13). On each route, and with the quiz modal open, paste
this into the browser DevTools console:

```js
[...new Set([...document.querySelectorAll('h1,h2,h3,h4,p,span,a,button,li,label')]
  .map(e => getComputedStyle(e).fontFamily))]
```

Expect every entry in the returned array to start with `Figtree`. A `sofia-pro, sans-serif` entry
is a straight failure of criterion 1's intent; any other family (e.g. an icon font on an MUI icon
element) must be named in the close-out with the element it came from. Run it on: `/de`, `/de` with
the quiz modal open, the quiz result screen, `/de/leistungen/ai-automation`, `/de/impressum`,
`/de/datenschutz`, `/en/impressum`, `/en/datenschutz`, `/de/kontakt`, `/de/ueber-uns`, `/de/cases`,
`/de/blog` and one case and one blog detail page.

**Branch, push and pull request** (criteria 16–18). Record the base SHAs *before* pushing, so
criterion 18 has a number to compare against:

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && git fetch origin && git rev-parse origin/dev origin/main && git log --format='%H %s%n%b' -1
```
What it does: fetches, prints the current `origin/dev` and `origin/main` SHAs (paste both into the
close-out) and prints this task's commit so the message format in criterion 16 can be read.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && git push origin HEAD:refs/heads/fix/finish-the-figtree-swap-remove-every-sofia-pro-f ; echo "exit=$?"
```
What it does: pushes this branch only, with an explicit refspec, to `origin`. Expect `exit=0`. No
other ref is pushed; `dev` and `main` are never a push target.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && gh pr create --base dev --head fix/finish-the-figtree-swap-remove-every-sofia-pro-f --title "20260926-finish-the-figtree-swap-remove-every-sofia-pro-f: remove every sofia-pro font class so elements inherit Figtree" --body "Spec: docs/specs/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f.md. Removes 129 stale font-['sofia-pro',sans-serif] classes in 11 files. Do not merge without gate 3." ; echo "exit=$?"
```
What it does: opens the pull request against `dev` and prints its URL. Whether the GitHub CLI is
installed and authenticated on this machine is *unverified*; if it is not, open the PR in the
browser on GitHub with the same base, head, title and body instead, and record the URL either way.

```
Windows — Git Bash:
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-finish-the-figtree-swap-remove-every-sofia-pro-f && git fetch origin && git rev-parse origin/dev origin/main
```
What it does: re-reads the base SHAs after the push. Expect the exact same two SHAs as before
(criterion 18). The pull request stays open and unmerged — nobody merges it as part of this task.

**Screenshots the close-out must show** (before/after pairs, same viewport):
- the quiz modal, question step, at 1440 px — the audit's primary complaint;
- the quiz result screen at 1440 px;
- `/de/impressum` at 390 px — the narrow width is where changed metrics would show as a wrapping
  or overflow problem;
- the process list on `/de/leistungen/ai-automation` at 1440 px, showing the `h3`s now matching the
  section heading.

The Reviewer additionally confirms criterion 15 by checking `src/imports/` is absent from
`git diff --name-only`, and reads three of the 129 removed-line/added-line pairs in full to confirm
criterion 5 by eye.

**The morning list entry** (this is a night run, 2026-09-26/27, so the report is read hours later
without the session present) names, in this order: the pull request URL and that it is open and
unmerged, the `exit=` lines of the two greps, the `pnpm build` exit code, the `dist/` grep result,
which of the computed-style read-backs came back all-Figtree and which did not, the screenshot set,
and the before/after `origin/dev` SHA.

## Will not do

- No merge of the pull request, and no direct commit or push to `dev` or `main`: the only push is
  the feature branch `fix/finish-the-figtree-swap-remove-every-sofia-pro-f` to `origin`, with an
  explicit refspec. Merging into `dev` is gate 3, a human on GitHub, after the morning list.
- No branch switch, no rebase, no force-push, no rewriting of commits already pushed.
- No splitting of the change into several branches or pull requests — gate 1 decided it runs whole.
- No change to `netlify.toml`, `.github/workflows/`, or any deploy configuration.
- No change to any file under `src/styles/` — no new `@theme` block, no new Tailwind utility, no
  `tailwind.config` file added.
- No hand-edit of `src/data/de/` or `src/data/en/` (generated), and no change to `content/` or
  `src/locales/{de,en}.json`.
- No change to `src/imports/**`, even though it contains `Sofia_Pro` strings.
- No new dependency, no test runner, no lockfile change beyond what `pnpm install` does on its own.
- No copy, wording, register (`du`/`ihr`) or price change of any kind.
- No work on the audit's other findings (F1 phone number, F3 hero video, F4 process accordion,
  F5 StrengthSection, F7 Jobs link) — each is its own task.
- No restart of any supervised process; nothing posted outside except the pull request against
  `dev` and this task's own entry on the morning list.

## Stop conditions

- A `sofia-pro` occurrence turns up outside the 11 files listed in "Files to change" → stop and
  report the file before editing it.
- An occurrence turns out not to be the byte-identical string `font-['sofia-pro',sans-serif]`, or
  is the sole class in its `className` → stop; the "pure deletion" assumption no longer holds for
  that line.
- After the change, the computed `font-family` of the quiz option `<button>`s or of `CtaButton`'s
  `<button>` is **not** Figtree → stop and ask. That would mean form controls do not inherit here,
  and the fix needs the explicit `font-figtree` utility instead (the rejected alternative in
  "Approach") — do not add it unilaterally.
- Removing a class visibly changes an element's weight, size, colour or position rather than only
  its typeface → stop; the class was doing more than declaring a family.
- `pnpm build` fails for a reason not plainly caused by these edits (a content-generation or
  prerender error, a missing dependency) → stop and report; do not "fix" the build as part of this
  task.
- The push is rejected, or the branch already exists on `origin` with commits this worktree does
  not have → stop and report; never force-push and never resolve it by touching `dev`.
- The pull request cannot be created (no GitHub CLI, no auth, a branch-protection or permission
  error) → stop after the push, report the branch name and the exact error, and leave the PR for a
  human to open. A pushed branch without a PR is a reportable partial result, not a failure to hide.
- Anything suggests merging, or `origin/dev` / `origin/main` moved during the run → stop and ask;
  the merge is gate 3 and never this task's.
- Any urge to also remove the unused Google Fonts `@import`s, compress the hero video, or fix
  another audit finding while in the file → stop, note it, leave it.

## Risks and open questions

- **Reflow, not regression.** Figtree's metrics differ from Arial's, so line breaks, heading wraps
  and block heights will move on every affected page. That is the intended outcome of the fix, but
  it is also the one way this "invisible" change can look broken — the 390 px legal-page and the
  area-page process-list checks in "What to click" exist for exactly that. Criterion 14 cannot be
  proved mechanically in this repo (no visual-regression tooling); it is covered by the before/after
  screenshot pairs named in "Verification and evidence" plus the click checks, and nothing else.
- **Form-control inheritance is relied on, not asserted in CSS.** The quiz option buttons and
  `CtaButton` inherit Figtree only through Tailwind 4 preflight's `font: inherit`. Evidence it holds
  here: `Hero.tsx`'s CTA buttons carry no font-family class and the audit measured the homepage as
  Figtree. Criterion 10 checks it directly and a stop condition covers the failure case.
- **The audit undercounts.** F2 and D3 both say "~20 places" in four files; the real figure is 129
  in 11. Worth correcting in `knowledge-base/marketing/website-agency-topics-2026-09-26.md` after
  this ships, but that is a knowledge-base edit, not part of this fix.
- **Case-insensitive greps will look like a failure.** `src/imports/**` holds ~300
  `font-['Sofia_Pro:SemiBold']` classes in unimported Figma exports. Criterion 1 is deliberately
  case-sensitive. Anyone running `grep -i sofia` will see hits and must read this bullet before
  filing a defect.
- **Preview URL unverified.** Whether Netlify builds a branch deploy for `fix/*` on `vl-home` is not
  something I could check from the repo. The push for the pull request is the first chance to see
  one; if a branch URL exists, it goes on the morning list, and if it does not, the gate-3 walk of
  "What to click" runs on `pnpm dev` at `http://localhost:5173` — which, for a night run, means the
  click checks happen in the morning, not before the PR is opened.
- **Night run, no one watching.** The PR is opened and left open; the 14 computed-style read-backs
  and the click checks are what a human sees in the morning. The morning list therefore has to carry
  the evidence in full (see "Verification and evidence"), because nobody will re-run the session to
  ask what it saw.
- **129 hand edits, no type safety.** TypeScript will not catch a mangled class string; only the
  grep gate (criteria 2, 6) and the eye will. That is the main reason criteria 5 and 6 are written
  as mechanical checks on the diff rather than as "looks fine".

## Out of scope

- Introducing a `font-figtree` Tailwind utility (moving `--font-figtree` into a `@theme` block).
  Offered as a gate-1 flip and not taken; not done.
- Removing the two unused Google Fonts `@import`s (Plus Jakarta Sans, Inter) at the top of
  `src/styles/fonts.css` — nothing in `src/` references either family, so they are two
  render-blocking requests for nothing, but that is a performance change with its own measurement.
- Cleaning up or deleting the dead Figma exports in `src/imports/*/index.tsx`.
- Any other finding from the 2026-09-26 audit (F1, F3, F4, F5, F7, F9, F10 and the section-5 task
  goals other than D3).
- The `pulse-landing-page` repo, which still renders in Poppins — a separate site and a separate
  task (F9).
- Updating the audit document's count from ~20 to 129.
- Merging the pull request or deploying to `vl-home` — gate 3, a human on GitHub.
