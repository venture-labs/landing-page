---
task: 20260926-the-real-prices-on-the-main-site-and-one-meaning
company: venturelabs
status: ready
size: M
branch: feature/the-real-prices-on-the-main-site-and-one-meaning
base: dev
design: none
---

# No prices on the site: one meaning for "Pulse Check", and every step ends in the sales conversation

## Goal
Christian reversed the original goal at gate 1 (2026-09-26, #dev-agent): no prices are to be shown
on the website, the price we do show is to be removed, and the sales conversation is what the site
offers instead. This task therefore delivers the half of the original brief that stands without
prices: the free 10-question self-test is called **Pulse Score** in every visitor-facing label and
in the quiz dialog heading, "Pulse Check" means only the paid diagnosis, the sentence *"Der Pulse
Check dauert fünf Minuten und kostet nichts."* disappears from the `/:lang/leistungen` closing
block, and the paid Pulse Check step stops opening the free quiz and leads into a conversation
instead. A mechanical check is added so no price string can come back onto the site unnoticed.

## Assumptions
- Christian's reply reverses the audit's own recommendation (`§1c`, `§2c`): the price anchor is
  **not** wanted. Nothing in this task publishes `2.900 €`, `15.000 €` or `2.500 €/Monat`, and no
  replacement number ("ab", "von–bis", "Tagessatz", budget range) appears anywhere.
- **Confirmed at gate 1 (Christian, 2026-09-27), no longer assumptions:** the price topic is ignored
  entirely — no prices anywhere; the free 10-question self-test is the **Pulse Score**; it is free;
  the **Pulse Check** is the paid diagnosis, and the paid step leads to `/:lang/kontakt`.
- **A free first conversation is fine; only its DURATION is undecided** (Christian, 2026-09-27,
  VL-5-S2 gate 1, answering the Tester's `spec` verdict). The site may keep saying the first
  conversation is free — the two pre-existing mentions in `content/services/ai-automation.md:47` and
  `content/services/venture-building.md:50` ("Im kostenlosen Erstgespräch …") predate this task and
  stay untouched, in `content/` and in their compiled copy in `dist/`. What this task must not
  introduce is (1) a duration for the first conversation ("30 Minuten", "halbe Stunde" — not fixed
  yet) and (2) any new free or price claim inside the strings this task changes (Approach §1 and §3).
  The strings shipped here therefore stay exactly the `Erstgespräch` / `first call` plus
  `unverbindlich` / `no obligation` copy written out in Approach §3, character for character. If he
  fixes a duration later, that is a follow-up copy change in its own task, not this one.
- **There is no price on venturelabs.team today.** Verified: the only `€` strings in this repo are
  in `src/theme.css` (a font-size token named `--text-price`) and in two Figma export files,
  `src/imports/🖌Homepage/index.tsx` and `src/imports/🖌Homepage-1/index.tsx`, which no module
  imports (only their `svg-*.ts` siblings are imported) and which therefore never render and never
  enter the bundle. The audit says the same in §1c ("No price anywhere on venturelabs.team"). So
  "remove the price that we have" has nothing to remove in this repo — it applies to
  `pulse.venturelabs.team`.
- **The live prices sit in the other repo** (`pulse-landing-page`, `PAGE_STRINGS.*.tier*Price`,
  section `#pricing`). No worktree or branch was provisioned for it in this task brief, so removing
  them there is a sibling task and not done here. Until it runs, the three prices stay live on
  pulse.venturelabs.team.
- "A clear path into the sales conversation" means the existing in-site contact route
  `/:lang/kontakt` — the same target the Pulse Build and Pulse Care cards already use (confirmed at
  gate 1). The Google Calendar booking URL is deliberately not introduced here; adding a booking
  link is task D1 of the audit.
- The free quiz keeps four entry points (home hero, home AI-Pulse teaser, `/leistungen` hero,
  `/leistungen` closing block). Its fifth, the Check card inside `#ablauf`, is dropped rather than
  relabelled: a free-quiz button on the card of the paid product is the confusion this task exists
  to end. On the home page the hero button sits directly above that section.
- Register stays `du`, as every string in `content/site/leistungen.md` uses today; ADR 0001's
  `ihr`/`euch` decision (audit D-g) is still open and is not resolved here.
- The exact German and English strings under "Approach" are the copy to ship; they are this task's
  actual deliverable and are Christian's to correct at gate 1.
- The repo has no test runner. Following the pattern the analytics task established
  (`scripts/check-analytics.ts` + `pnpm check:analytics`), the machine-checkable criteria are
  asserted by a new `scripts/check-pulse-naming.ts` run as `pnpm check:naming` — no new dependency
  (`tsx` is already a devDependency).
- The task id and branch name still say "the real prices". That is now a misnomer; the id is not
  renamed, because ids are never renumbered.
Correct me at gate 1, otherwise I proceed with these.

## Context found
- `src/app/components/PulseJourney.tsx`: the shared Check-Build-Care section (`<section id="ablauf">`),
  rendered `compact` on the home page (`src/app/App.tsx:59`) and full on `/leistungen`
  (`src/app/pages/Leistungen.tsx:234`). In `StepDetail` (`:223-242`) the `check` step renders a
  `<button onClick={onCheckCta}>` that opens `PulseCheckModal` — i.e. the paid step's CTA opens the
  free quiz — while `build` and `care` render a `<Link to={localizedPath("/kontakt")}>`. The modal,
  its `quizOpen` state (`:298`) and its import (`:8`) exist only for that one branch (`:344`, `:360`).
- `content/site/leistungen.md:59` / `leistungen.en.md:59` — `ctaBody`: *"Der Pulse Check dauert fünf
  Minuten und kostet nichts. …"* / *"The Pulse Check takes five minutes and costs nothing. …"*, the
  sentence the audit calls the most expensive finding in the document (§1a(b)): our paid entry
  product is advertised as free. Rendered by `PulseCallout` in `src/app/pages/Leistungen.tsx:103-159`,
  which already has exactly the two buttons this rewrite needs: the quiz (`leistungen.pulseCta`) and
  `/kontakt` (`leistungen.ctaContact`).
- `content/site/leistungen.md:23` `ctaLabel: 'Pulse Check machen'` / `.en.md:23` `'Take the Pulse
  Check'` — the label of that quiz-opening button on the paid card.
- `content/site/home.md:5` / `home.en.md:5` `heroCta` = `Jetzt AI Pulse Check machen` / `Take the AI
  Pulse Check now`, rendered by `src/app/components/Hero.tsx:136` on a button that opens the quiz.
- `src/locales/de.json:24` `aiPulse.cta` and `:86` `leistungen.pulseCta` (same lines in `en.json`):
  the other three quiz-opening labels — `AIPulseTeaser.tsx:50`, `Leistungen.tsx:84` (hero) and
  `:149` (closing block), `LeistungenDetail.tsx:351`. All four say "Pulse Check" today.
- `src/app/components/PulseCheckModal.tsx:24` renders `COPY[lang].quizHeading` from
  `src/app/components/PulseQuiz.tsx` (de `:56` "Wie gesund ist dein KI-Einsatz?", en `:187`) — the
  quiz's own copy store, not i18next; it is the dialog's accessible name.
- `src/app/components/PulseQuiz.tsx:64/81` and `:193/210`: the result copy already uses "Pulse Check"
  for the *paid* next step ("Genau hier würde ein Pulse Check ansetzen.") — correct after this
  change, left untouched.
- `content/services/ai-automation.md:47` and `content/services/venture-building.md:50`: both
  `ctaBody` strings say "Im kostenlosen Erstgespräch …". They belong to the service detail pages,
  predate this task, and are explicitly out of scope (Christian, 2026-09-27).
- `src/data/navigation.ts`: four nav items, no quiz entry — the brief's "nav" needs no change there.
- `tests/e2e/analytics.spec.ts:44` and `tests/e2e/analytics-noop.spec.ts:71` open the quiz via
  `getByRole("button", { name: "Jetzt AI Pulse Check machen" })`; both break on the rename.
- `scripts/check-analytics.ts` + `package.json:9` `check:analytics`: the repo's established
  stand-in for a test runner — a `tsx` script printing `PASS  [n] …` / `FAIL  [n] …` and exiting
  non-zero. `scripts/generate-content.ts:404-416` types `CoreService`; no field is added here.
- `C:\code\venturelabs\knowledge-base\marketing\website-agency-topics-2026-09-26.md` §1a(b), §1c,
  §2d and §5 D2: the naming collision, the (now reversed) price-anchor recommendation, and the
  original task goal.

## Approach
Copy and one CTA target change, inside the existing content pipeline; no new component, no layout
change, no design round.

**1 — one name for the free quiz.** Every visitor-facing label that opens `PulseCheckModal` becomes
`Kostenlosen Pulse Score starten` / `Start your free Pulse Score`: `heroCta` in `content/site/home.md`
and `home.en.md`, `aiPulse.cta` and `leistungen.pulseCta` in `src/locales/{de,en}.json`. The dialog
heading (`PulseQuiz.tsx` `COPY.de.quizHeading` / `COPY.en.quizHeading`) becomes
`AI Pulse Score: Wie gesund ist dein KI-Einsatz?` / `AI Pulse Score: how healthy is your AI use?`.

**2 — the paid card leads into the conversation.** In `PulseJourney.tsx` `StepDetail`, delete the
`step.key === "check"` branch so all three steps render the same `<Link to={localizedPath("/kontakt")}>`;
remove the now-unused `onCheckCta` prop, the `quizOpen` state, the `PulseCheckModal` import and its
render. The Check card's label comes from content and becomes `Über den Pulse Check sprechen` /
`Talk about a Pulse Check`, matching the existing `Über einen Build sprechen` / `Betreuung besprechen`.

**3 — the copy (this is the deliverable; ship these strings verbatim).** The duration of the first
conversation is not fixed, so these strings say `Erstgespräch` / `first call` and
`unverbindlich` / `no obligation` and name no duration and no price for that call — ship them
exactly as written here.

`content/site/leistungen.md` (de):
- `coreIntro`: `Jeder Schritt baut auf dem vorherigen auf. Nach jedem entscheidest du, ob es weitergeht – ohne Verpflichtung zum nächsten. Was ein Schritt bei dir kostet, besprechen wir im Erstgespräch: konkret auf deinen Umfang gerechnet, unverbindlich.`
- check `ctaLabel`: `Über den Pulse Check sprechen`
- `ctaHeading` unchanged (`Noch unklar, wo du stehst?`)
- `ctaBody`: `Der AI Pulse Score dauert fünf Minuten und kostet nichts: 10 Fragen, sofort ein Ergebnis über fünf Bereiche. Willst du danach genau wissen, wo dein größter Hebel liegt, ist der Pulse Check der nächste Schritt – was er bei dir umfasst, besprechen wir im Erstgespräch.`

`content/site/leistungen.en.md` (en):
- `coreIntro`: `Each step builds on the one before. After each, you decide whether to continue — no obligation to take the next one. What a step costs in your case is something we work out in a first call: based on your actual scope, with no obligation.`
- check `ctaLabel`: `Talk about a Pulse Check`
- `ctaBody`: `The AI Pulse Score takes five minutes and costs nothing: 10 questions, an instant result across five areas. If you then want to know exactly where your biggest lever is, the Pulse Check is the next step — what it covers in your case is something we work out in a first call.`

Note the free/paid split in that block: "kostet nichts" now attaches to the **Pulse Score**, which is
free, and the Pulse Check is named as the paid next step without a number. `build` and `care` content
is untouched.

**4 — a guard against prices coming back.** New `scripts/check-pulse-naming.ts`, modelled on
`scripts/check-analytics.ts` (same `PASS`/`FAIL` output, same non-zero exit), wired as
`"check:naming": "tsx scripts/check-pulse-naming.ts"` in `package.json`. It asserts, over
`content/**`, `src/locales/*.json`, `src/data/{de,en}/**` and — when `dist/` exists — over
`dist/**/*.js` and `dist/**/index.html`: no currency amount matching `/\d[\d.,]*\s*(€|EUR|Euro)\b/`;
no quiz-opening label containing "Pulse Check"; neither forbidden sentence anywhere; and that
`src/app/components/PulseJourney.tsx` no longer imports `PulseCheckModal`.

For the first conversation it asserts two narrow things instead of one repo-wide ban on the word
"kostenlos" (Christian, 2026-09-27, VL-5-S2 gate 1):
- (a) **no duration claim, repo-wide** — over `content/`, `src/` and, when it exists, `dist/`: no
  match of `/30\s*-?\s*min|halbe\s+stunde|half\s+an\s+hour/i`, and no line that pairs a
  digits-and-minutes phrase (`/\d{1,3}\s*(min|minuten|minutes)\b/i`) with `Gespräch` or `call`. The
  spelled-out "dauert fünf Minuten" / "takes five minutes" about the free Pulse Score is not a
  first-conversation duration and must keep passing.
- (b) **exact strings, this task's own scope only** — both `coreIntro`, both `ctaBody` and both
  check `ctaLabel` values in `content/site/leistungen.md` and `content/site/leistungen.en.md` equal
  the strings in §3 character for character, so no new free or price claim can be slipped into them.

The word `kostenlos` is deliberately **not** banned repo-wide: `content/services/ai-automation.md:47`
and `content/services/venture-building.md:50` said "Im kostenlosen Erstgespräch …" before this task,
they stay untouched, and so does their compiled copy in `dist/`.

**Rejected:** (a) keeping a secondary "Kostenlosen Pulse Score starten" link on the Check card — a
free-quiz link on the paid product's card is a smaller version of the same collision, and four
entry points remain; (b) deleting the two unused Figma export files that contain `0 €`, `3.000 €`
and `15.000 €` — they never render and never reach the bundle, so deleting ~5.000 lines of export
would be unrelated churn (see Out of scope); (c) renaming `PulseCheckModal.tsx` to
`PulseScoreModal.tsx` and the i18n key `leistungen.pulseCta` — developer-facing only, five import
sites, no visitor-visible gain; (d) adding the booking URL as the new sales path — that is audit
task D1 and would collide with it; (e) naming a duration for the first conversation ("30 Minuten",
"halbe Stunde") — not fixed yet (gate 1, 2026-09-27), so the site keeps the `Erstgespräch` /
`unverbindlich` wording; (f) banning "kostenlos" repo-wide — that would rewrite two service-page
strings this task does not own (Christian, 2026-09-27).

## Files to change
| File | Change | Why |
|---|---|---|
| `content/site/leistungen.md` | `coreIntro` gains the "cost in a first call" sentence; check `ctaLabel` → `Über den Pulse Check sprechen`; `ctaBody` rewritten around the free Pulse Score | deletes the "Pulse Check is free" claim, offers the conversation instead of a price |
| `content/site/leistungen.en.md` | the same three fields with the English strings above | English carries the same meaning |
| `content/site/home.md` | `heroCta` → `Kostenlosen Pulse Score starten` | the hero button opens the free quiz |
| `content/site/home.en.md` | `heroCta` → `Start your free Pulse Score` | same, English |
| `src/locales/de.json` | `aiPulse.cta` and `leistungen.pulseCta` → `Kostenlosen Pulse Score starten` | the other three quiz buttons |
| `src/locales/en.json` | the same two keys → `Start your free Pulse Score` | same, English |
| `src/app/components/PulseQuiz.tsx` | `COPY.de.quizHeading` / `COPY.en.quizHeading` name the Pulse Score | the dialog's accessible name must not say "Pulse Check" |
| `src/app/components/PulseJourney.tsx` | drop the `check` CTA branch (all three link to `/:lang/kontakt`); remove `onCheckCta`, `quizOpen`, the `PulseCheckModal` import and render | the paid step must not open the free quiz |
| `tests/e2e/analytics.spec.ts` | `openQuiz()` selector → the new hero label | the label it selects is renamed |
| `tests/e2e/analytics-noop.spec.ts` | same selector change (line 71) | same |
| `scripts/check-pulse-naming.ts` (new) | the mechanical assertions listed in Approach §4: the price, label, sentence and journey checks, plus (a) the repo-wide no-duration check and (b) the exact-string check over this task's own six strings — no repo-wide "kostenlos" ban | the repo has no test runner; this is its established substitute |
| `package.json` | add `"check:naming": "tsx scripts/check-pulse-naming.ts"` | how the Tester runs the assertions |

## Acceptance criteria
1. No currency amount (regex `/\d[\d.,]*\s*(€|EUR|Euro)\b/`) exists in any file under `content/`, `src/locales/`, or `src/data/de/` and `src/data/en/`.
2. After `pnpm build`, no file under `dist/` (neither `dist/**/*.js` nor `dist/**/index.html`) contains a currency amount matching that regex.
3. `pnpm check:naming` exits 0 and prints one `PASS` line per assertion; it exits non-zero with a `FAIL` line naming the offending file when a price string, a forbidden label, a duration claim for the first conversation, or a deviation from one of the six strings this task owns is introduced.
4. The home hero button that opens the quiz is labelled `Kostenlosen Pulse Score starten` on `/de` and `Start your free Pulse Score` on `/en`.
5. The home AI-Pulse teaser button, the `/leistungen` hero button and the `/leistungen` closing-block button that open the quiz carry those same two labels in their locale.
6. The quiz dialog's accessible name contains `Pulse Score` and does not contain `Pulse Check`, in both locales.
7. `rg -n "Pulse Check" content/site/home.md content/site/home.en.md src/locales/de.json src/locales/en.json` returns no match.
8. `rg -n "Der Pulse Check dauert fünf Minuten" content src` and `rg -n "The Pulse Check takes five minutes" content src` both return no match.
9. On `/de/leistungen` and `/en/leistungen` the closing paragraph names the free AI Pulse Score first ("kostet nichts" / "costs nothing" attached to the Score) and names the Pulse Check as the next step, with no number, no currency and no "ab".
10. In the `#ablauf` section, on `/de`, `/en`, `/de/leistungen` and `/en/leistungen`, selecting `Pulse Check` shows a CTA labelled `Über den Pulse Check sprechen` / `Talk about a Pulse Check` that is a link to `/de/kontakt` / `/en/kontakt`; clicking it navigates there and opens no dialog.
11. No element inside the `#ablauf` section opens the quiz dialog on any route, and `src/app/components/PulseJourney.tsx` contains no reference to `PulseCheckModal`.
12. The quiz is still reachable and completable from all four remaining entry points (home hero, home AI-Pulse teaser, `/leistungen` hero, `/leistungen` closing block) and still renders its result screen.
13. The `#ablauf` intro paragraph on both pages ends with the "first call" sentence given in Approach §3, in its locale.
14. No visitor-facing German or English string introduced or changed by this task is hardcoded in a file under `src/app/`, except in the `COPY` object of `PulseQuiz.tsx`, which is that quiz's established copy store.
15. `pnpm install --prefer-offline && pnpm build` exits 0 with no new TypeScript error and no unused-import or unused-variable error in `PulseJourney.tsx`.
16. Both Playwright specs in `tests/e2e/` pass against a local preview, including `Quiz Started` firing exactly once from the home-hero path after the label rename, and the run still records zero cookies.
17. No file under `src/data/de/` or `src/data/en/` is edited by hand; every change there comes from `pnpm build` regenerating them from `content/`.
18. No file outside this repository and this worktree is changed — in particular nothing under `C:\code\venturelabs\pulse-landing-page`.
19. No string added or changed by this task states a duration or a price for the first conversation; the two pre-existing "kostenlosen Erstgespräch" mentions in `content/services/ai-automation.md:47` and `content/services/venture-building.md:50` are out of scope and unchanged (`git diff --name-only` for this branch lists neither file). Mechanically: `pnpm check:naming` fails when any file under `content/`, `src/` or — when it exists — `dist/` carries a first-conversation duration claim (`/30\s*-?\s*min|halbe\s+stunde|half\s+an\s+hour/i`, or a line pairing `/\d{1,3}\s*(min|minuten|minutes)\b/i` with `Gespräch`/`call`), and it passes on the spelled-out "dauert fünf Minuten" / "takes five minutes" that describes the free Pulse Score.
20. `coreIntro`, `ctaBody` and the check `ctaLabel` in `content/site/leistungen.md` and `content/site/leistungen.en.md` match the strings in Approach §3 character for character — the first conversation is `Erstgespräch` / `a first call` with `unverbindlich` / `no obligation`, with no duration and no price or free claim added — and `pnpm check:naming` asserts that equality for all six strings.

## Test plan
The repo has no test runner; its checks are `pnpm build` (content generation → `vite build` →
prerender of every route), the `tsx` assertion scripts (`pnpm check:analytics`, and the new
`pnpm check:naming`), and the two ad-hoc Playwright specs in `tests/e2e/` run as documented in
`tests/e2e/playwright.config.ts`. The Test Writer owns the assertions inside
`scripts/check-pulse-naming.ts` — including the repo-wide no-duration assertion and the
exact-string assertion over this task's own six strings — and any selector updates in the two specs.

Windows — Git Bash:
```
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-the-real-prices-on-the-main-site-and-one-meaning && pnpm install --prefer-offline && pnpm build
```
```
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-the-real-prices-on-the-main-site-and-one-meaning && pnpm check:naming && pnpm check:analytics
```
```
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-the-real-prices-on-the-main-site-and-one-meaning && pnpm exec vite preview --port 4173
```
```
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-the-real-prices-on-the-main-site-and-one-meaning && pnpm dlx --package @playwright/test playwright test --config tests/e2e/playwright.config.ts
```
macOS — Terminal (zsh): not available (this worktree exists only on the Windows PC).

What it does: the first builds the site and regenerates `src/data/{de,en}/` from `content/`; the
second prints a PASS/FAIL line per assertion for the naming, no-price, no-duration and
exact-string criteria plus the existing analytics criteria, and exits non-zero on any FAIL; the
third serves the production build on http://localhost:4173; the fourth runs the funnel and
cookieless specs against it with the `list` reporter.

The Tester then verifies end to end in the browser at :4173, at 1440 px and 390 px, on `/de`, `/en`,
`/de/leistungen`, `/en/leistungen`: the four quiz buttons' labels, the dialog heading, the Check
card's link target, that `#ablauf` opens no dialog anywhere, the rewritten closing block, and that
no price is visible on any of the four routes.

## What to click
1. On `/de`, click the hero button: it must read "Kostenlosen Pulse Score starten" and the dialog that opens must be headed "AI Pulse Score: Wie gesund ist dein KI-Einsatz?".
2. Scroll to "Check. Build. Care." on `/de` and click the Pulse Check card's button: it must land on `/de/kontakt` — no dialog, no footer jump.
3. Read the `#ablauf` intro on `/de/leistungen`: it must answer the cost question with the Erstgespräch, and no price, "ab", €, or call duration ("30 Minuten", "halbe Stunde") may appear anywhere on that page; a "kostenloses Erstgespräch" on a service detail page is pre-existing and not a defect.
4. Read the closing block on `/de/leistungen` and `/en/leistungen`: "kostet nichts" / "costs nothing" must sit on the Pulse Score, and the Pulse Check must be named as the next step.
5. On `/en`, complete the quiz once from the teaser button to the result screen: the flow still works and no screen calls the paid Pulse Check free.

## Verification and evidence
- Criteria 1-3, 7, 8, 11: paste the full `pnpm check:naming` output (every `PASS` line, exit code 0)
  and the two empty `rg` outputs into the close-out.
- Criteria 4-6, 9, 10, 13: screenshots of the `/de` hero, the open quiz dialog, the `#ablauf` Pulse
  Check card on `/de/leistungen` and the `/en/leistungen` closing block.
- Criterion 10 additionally: the browser URL after clicking the Check card's CTA, shown as
  `/de/kontakt`.
- Criterion 12: the Playwright run covers the home hero path; the other three entry points are
  covered by the click-list plus one screenshot of the result screen reached from `/en`.
- Criterion 15: the tail of the `pnpm build` output with its exit code.
- Criterion 16: the Playwright `list` reporter output, all specs passing, pasted.
- Criteria 17-18: `git status --porcelain` from this worktree (only the files in the table, plus
  build-regenerated `src/data/**`) and `git -C C:\code\venturelabs\pulse-landing-page status
  --porcelain` showing a clean tree.
- Criterion 19: paste the empty output of the duration search
  (`rg -ni "30\s*-?\s*min|halbe\s+stunde|half\s+an\s+hour" content src dist`), the
  `check:naming` PASS line that asserts it, and `git diff --name-only` for this branch showing that
  `content/services/ai-automation.md` and `content/services/venture-building.md` are not in the list.
- Criterion 20: paste the six shipped strings (`coreIntro`, `ctaBody` and the check `ctaLabel`, both
  locales) from the diff so they can be compared to Approach §3 word for word, plus the
  `check:naming` PASS lines for the exact-string assertion.

## Will not do
- No push, no merge, no PR, no branch other than the one already checked out; `dev` and `main` are
  untouched.
- No change in `pulse-landing-page`, in `C:\code\venturelabs` or in any other repo — the knowledge
  base and the audit doc are read-only here.
- No edit to `netlify.toml`, `.github/workflows/`, or by hand to `src/data/de/` and `src/data/en/`.
- No new runtime or dev dependency; no test runner added; Playwright stays a `pnpm dlx` runner.
- No price, discount, budget range, day rate or funding claim added anywhere, in any locale.
- No duration for the first conversation anywhere ("30 Minuten", "halbe Stunde", "30-minute call")
  and no new free or price claim inside the six strings this task ships — the duration is not fixed
  yet (Christian, 2026-09-27).
- No edit to `content/services/ai-automation.md` or `content/services/venture-building.md`: their
  pre-existing "kostenlosen Erstgespräch" lines stay exactly as they are, and so does their compiled
  copy in `dist/`.
- No fix to the phone number, the footer anchors (`/#kontakt`, `/#projekte`), the `sofia-pro`
  classes, the hero video or the process accordion — those are audit tasks D1, D3, D4 and D5.
- No deploy, no restart, nothing sent to a customer or posted outside the task's own thread.

## Stop conditions
- The change would remove the last quiz entry point on a route (e.g. a route renders `PulseJourney`
  without a hero or closing-block quiz button) → stop and ask before shipping it.
- Any copy beyond the strings listed in Approach §3 and §1 appears to need changing → stop and ask;
  the copy is the deliverable and is Christian's call.
- The copy seems to need a duration for the first conversation to read well → stop and ask; the
  duration is not fixed and is never an Implementer's choice. (A free first conversation as such is
  decided and fine; only the duration is open.)
- A price string turns out to be rendered somewhere this spec did not find (a case study, a blog
  post, a meta description) → stop, report where, and ask before rewriting content this task did
  not scope.
- `pnpm build` fails for a reason outside these files (lockfile, native build) → stop and report; do
  not touch `pnpm-workspace.yaml` or the lockfile to get past it.
- The Playwright run needs anything beyond `pnpm dlx` (a blocked browser download, a new
  dependency) → report the specs as not run, with the reason, instead of adding a dependency.

## Risks and open questions
- **The duration of the first conversation is still open** (Christian, 2026-09-27): a free first
  conversation is decided and may be said on the site, a "30 minutes" is not. If he fixes a
  duration later, the `coreIntro`, `ctaBody` and `/kontakt` copy get a follow-up copy task, and the
  no-duration assertion in `check:naming` is relaxed there, not here. Nothing in this spec blocks
  that later change.
- The no-duration assertion is a regex over prose: a duration written in words ("eine halbe Stunde"
  is covered, "dreißig Minuten" is not) can slip past it. The click-list line 3 is the backstop.
- **The prices stay live on pulse.venturelabs.team** until a sibling task runs in
  `pulse-landing-page` (`PAGE_STRINGS.*.tier1Price/tier2Price/tier3Price`, `tier1Note`, the
  `#pricing` section). This spec cannot cover it: no worktree or branch for that repo was
  provisioned. Recommendation: the Dev Manager files it as its own task, otherwise "we show no
  prices" is only half true and the subdomain is the half that is indexed.
- Two unused Figma export files (`src/imports/🖌Homepage/index.tsx`, `src/imports/🖌Homepage-1/index.tsx`)
  still contain `0 €`, `3.000 €` and `15.000 €`. They are dead code — no module imports them, so
  they never render and never reach `dist/` (criterion 2 proves the bundle stays clean). A `git grep €`
  will still find them until a cleanup task deletes them.
- The audit argued the opposite of this decision (§1c: for a Händler comparing us to an agency that
  quotes on request, the published price is the differentiator; §2e: "Die Preise stehen auf der
  Seite" was the prepared answer to "Was kostet das am Ende wirklich?"). Christian decided against
  it on 2026-09-26 and reconfirmed on 2026-09-27 ("ignore the price topic entirely"); recorded here
  so the trade-off is not silently lost, not to reopen it.
- With no price, the `coreIntro` sentence is effectively "on request". That is the weaker sales
  position the audit warned about; the mitigation in this spec is that the conversation is offered
  explicitly and unconditionally rather than left implicit.
- Criteria 4-6, 9, 10, 12 and 13 are proven in a browser plus the string-level assertions in
  `check-pulse-naming.ts`, not by a committed browser test, because the repo has no test runner and
  `scripts/prerender.ts` emits head tags only (the body is client-rendered). The manual check is the
  "What to click" list plus the Tester's viewport pass.
- Register stays inconsistent across the two sites (`du` here, `Sie` on the subdomain, `ihr`/`euch`
  in ADR 0001). Audit decision D-g is open and untouched by this task.
- The pending design round for the AI Pulse page (audit T1, `design/STATUS.md`) may later replace
  the `#ablauf` section entirely; the copy shipped here survives that, the component does not.

## Out of scope
- Publishing the three real prices anywhere — reversed by Christian at gate 1; the original brief's
  price half, the `pricingLede`/`tier*Bullets` transfer and the "was es nicht ist" lines are dropped,
  not deferred into this task.
- Naming a duration for the first conversation ("30 Minuten", "halbe Stunde", a 30-minute video
  call) — not fixed at gate 1; a follow-up copy task once Christian fixes it.
- The two pre-existing "kostenlosen Erstgespräch" mentions in `content/services/ai-automation.md:47`
  and `content/services/venture-building.md:50`, and their compiled copy in `dist/` — they stay as
  they are (Christian, 2026-09-27).
- Removing the prices from `pulse-landing-page` / pulse.venturelabs.team (other repo, needs its own
  task and worktree).
- Deleting the two unused Figma export files that contain old prices.
- Renaming `PulseCheckModal.tsx` → `PulseScoreModal.tsx` and the i18n key `leistungen.pulseCta` →
  `pulseScoreCta` (developer-facing only).
- The booking link in the navbar, the footer/hero anchor CTAs, `LeistungenDetail.tsx:354`'s
  `/#kontakt`, and quiz lead capture (audit D1 and the quiz-leads topic).
- Updating `knowledge-base/domains/website-content.md`, the glossary or `design/CHECKLIST.md`
  (different repo; audit D7).


## Review answers (Christian, 2026-09-27)

Question from the Tester round:
still a `spec` verdict after the Architect's amend round
• criterion: No duration/free claim for the first conversation under `content/`, `src/locales/`, `src/app/` **or** `dist/`
  test: spec's own `rg` → **2 matches** + 1 in `dist/assets/index-*.js`
  result: fail
  Tester's verdict: spec

Answer: A - the spec is wrong: criterion 19 is scoped too wide. Decision (front desk on Christian's words of 2026-09-27, VL-5-S2 gate 1): the site may keep saying the first conversation is free - `content/services/ai-automation.md:47` and `content/services/venture-building.md:50` ("Im kostenlosen Erstgespräch …") predate this task and stay untouched, and so does their compiled copy in dist/. What this task must NOT introduce is (1) a DURATION for the first conversation ("30 Minuten", "halbe Stunde" - Christian has not fixed that yet) and (2) any NEW free/price claim in the strings this task changes (Approach 1 and 3). Rewrite criterion 19 to: "No string added or changed by this task states a duration or a price for the first conversation; the two pre-existing 'kostenlosen Erstgespräch' mentions in content/services/*.md are out of scope and unchanged." Adjust scripts/check-pulse-naming.ts accordingly (assert on the task's own strings and on the absence of a duration claim repo-wide, not on the word kostenlos repo-wide).

Folded into the spec on 2026-09-27: criterion 19 rewritten as instructed, criterion 20 extended to the
six owned strings and made mechanically asserted, criterion 3 reworded, Approach §4 split into a
repo-wide no-duration assertion and an exact-string assertion over this task's own strings (no
repo-wide "kostenlos" ban), and the assumption, files table, test plan, click list, evidence,
"Will not do", stop conditions, risks and out-of-scope lines that restated the old wide scope
updated to match. Everything else is unchanged; status stays `ready`.
