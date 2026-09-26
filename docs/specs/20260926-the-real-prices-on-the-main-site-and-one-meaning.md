---
task: 20260926-the-real-prices-on-the-main-site-and-one-meaning
company: venturelabs
status: ready
size: M
branch: feature/the-real-prices-on-the-main-site-and-one-meaning
base: dev
design: none
---

# The three real Pulse prices in the shared Check-Build-Care section, and one meaning for "Pulse Check"

## Goal
Put the three already-published prices (`Pulse Check ab 2.900 €`, `Pulse Build ab 15.000 €`,
`Pulse Care ab 2.500 €/Monat`) into the Check-Build-Care section (`PulseJourney`, id `#ablauf`)
that the home page and `/:lang/leistungen` share, together with the framing lines that already
exist on `pulse.venturelabs.team` (`pricingLede`, `tier1Note`, `tier*Bullets`) and one
"was es nicht ist" line per step. In the same change, end the naming collision: the free
10-question self-test is called **Pulse Score** in every visitor-facing label and in the quiz
dialog title, "Pulse Check" means only the paid 2-day diagnosis, and the `/leistungen` closing
block is rewritten around the free Pulse Score with the paid Pulse Check as the next step. All
copy stays in `content/` and `src/locales/{de,en}.json`; German first, English alongside with the
same numbers.

## Assumptions
- The offer is unchanged: exactly the three prices above, no "Erster Hebel ab 9.900 €" and no
  "Care Light ab 890 €/Monat" (audit 2c part 2 / decision D-b is explicitly not part of this task).
- Register stays `du`, as every string in `content/site/leistungen.md` uses today. The subdomain's
  `Sie` lines are transposed to `du` when they move over. ADR 0001's `ihr`/`euch` decision (audit
  D-g) is still unsettled and is not resolved here.
- "Sees all three prices without a click" means the price sits on the **step rail** (all three
  tiles are always rendered, on the home page and on `/leistungen`), not only in the detail panel
  of the active step.
- The paid Check card must no longer send a visitor to the free quiz as its primary action: its
  primary CTA becomes `/:lang/kontakt` like Build and Care, with a secondary text link that opens
  the Pulse Score quiz, so the quiz entry point in `#ablauf` is kept, not deleted.
- The exact German and English strings listed under "Approach" are the copy to ship. They are
  taken verbatim from `pulse-landing-page/index.html` `PAGE_STRINGS` where such a line exists, and
  register-adjusted only where that file says `Sie`.
- The home page keeps `<PulseJourney compact />`: bullets and Input/Output stay hidden there; the
  price, the price note and the "was es nicht ist" line render in the always-visible left column,
  so they show on both pages.
- No new dependency. Playwright stays a `pnpm dlx` ad-hoc runner as `tests/e2e/playwright.config.ts`
  documents; the two existing specs are updated only where they select the renamed hero button.
- `scripts/prerender.ts` writes head tags only (no SSR of the body), so a price criterion cannot be
  proven by grepping `dist/**/index.html`; it is proven in a browser and in the built JS bundle.
- Christian's OK to publish 2.900 € under his own name (audit topic "NOTES") is assumed given —
  the number is already public on `pulse.venturelabs.team`; this task only moves it, unverified as
  an explicit approval.
Correct me at gate 1, otherwise I proceed with these.

## Context found
- `src/app/components/PulseJourney.tsx`: the shared Check-Build-Care section (`<section id="ablauf">`).
  `StepRail` renders all three step tiles (`step` · `label` + `title`); `StepDetail` renders only the
  active step (meta pill, tagline, description, CTA; Input/Output + bullets only when `compact` is
  false). `compact` is true on the home page (`src/app/App.tsx:59`) and false on `/leistungen`
  (`src/app/pages/Leistungen.tsx:234`). The Check step's CTA calls `onCheckCta`, which opens
  `PulseCheckModal` — i.e. the paid step's button opens the free quiz today.
- `content/site/leistungen.md` / `.en.md`: `coreHeading`, `coreIntro`, `coreServices[]`
  (`key, step, label, title, tagline, meta, description, input, output, bullets, ctaLabel`), plus
  the closing block `ctaHeading` / `ctaBody`. `ctaBody` (de:59, en:59) carries the sentence to
  delete: *"Der Pulse Check dauert fünf Minuten und kostet nichts."*
- `scripts/generate-content.ts:404-416`: declares the `CoreService` interface written into
  `src/data/{de,en}/leistungen.ts`; line 444 emits `coreServices` with `JSON.stringify` of the raw
  frontmatter, so new frontmatter fields are carried through automatically but must be added to
  that interface to be typed.
- `content/site/home.md:5` / `home.en.md:5`: `heroCta` = `Jetzt AI Pulse Check machen` /
  `Take the AI Pulse Check now` — the free quiz button in `src/app/components/Hero.tsx:136`.
- `src/locales/de.json:24` `aiPulse.cta` and `:86` `leistungen.pulseCta` (en.json same lines):
  the other three free-quiz buttons — `AIPulseTeaser.tsx:50`, `Leistungen.tsx:84` and `:149`,
  `LeistungenDetail.tsx:351`. All open `PulseCheckModal`.
- `src/app/components/PulseCheckModal.tsx:24`: the dialog title renders `COPY[lang].quizHeading`
  from `src/app/components/PulseQuiz.tsx` (de:56 "Wie gesund ist dein KI-Einsatz?", en:186 "How
  healthy is your AI use?") — the quiz's own copy store, not i18next.
- `src/app/components/PulseQuiz.tsx:64/81` and `:193/210`: "Pulse Check" already means the *paid*
  next step in the result copy — correct after this change, left as is.
- `src/data/navigation.ts`: the navbar has no quiz item, so "nav" in the brief needs no change
  there; the navbar's only action is `nav.contact`.
- `tests/e2e/analytics.spec.ts:44` and `tests/e2e/analytics-noop.spec.ts:71`: both open the quiz via
  `getByRole("button", { name: "Jetzt AI Pulse Check machen" })` — they break on the rename.
- `C:\code\venturelabs\pulse-landing-page\index.html:591-613` (de) and `:656-678` (en): the source
  of `pricingLede`, `tier1Price/tier2Price/tier3Price`, `tier1Note` and `tier*Bullets`.
- `C:\code\venturelabs\knowledge-base\marketing\website-agency-topics-2026-09-26.md` §1a(b), §2c
  part 1 and §2d: the finding (the paid product is advertised as free), the "put what exists on the
  main site, unchanged" decision, and the "was es nicht ist" lines.

## Approach
Extend the existing content-driven pattern; no new component, no layout invention.

**1 — three new per-step content fields.** Add `price` (required), `priceNote` (optional) and
`notIncluded` (required) to each entry of `coreServices` in both `content/site/leistungen.md` and
`content/site/leistungen.en.md`, and add them to the `CoreService` interface in
`scripts/generate-content.ts` (`price: string; priceNote?: string; notIncluded: string;`). The
emitter already passes unknown frontmatter keys through, so only the interface changes.

**2 — render in `PulseJourney.tsx`.** In `StepRail`, add the price under the step title in every
tile (so all three prices are on screen with no click, on both pages, in both `compact` modes). In
`StepDetail`'s left column — which renders in `compact` too — show the price next to the `meta`
pill, `priceNote` beneath it when present, and the `notIncluded` line as one muted line with the
existing `Check`-icon row pattern inverted (an `X` icon from `lucide-react`, already a dependency).
The strings themselves start with "Kein …" / "Not …", so no extra UI label string is needed.

**3 — the copy (this is the deliverable; ship these strings verbatim).**

`content/site/leistungen.md` (de):
- `coreIntro`: `Jeder Schritt baut auf dem vorherigen auf. Nach jedem entscheidest du, ob es weitergeht – ganz ohne Verpflichtung zum nächsten. Und die Preise unten sind die echten Preise – nicht „auf Anfrage".`
- check: `price: 'ab 2.900 €'`, `priceNote: 'Der einzige Schritt, den du direkt buchst.'`,
  `notIncluded: 'Kein 40-seitiger Bericht, den niemand liest.'`,
  `bullets: ['AI Vital Signs Report', 'Priorisierter Opportunity-Backlog']`,
  `ctaLabel: 'Pulse Check anfragen'`
- build: `price: 'ab 15.000 €'`, `notIncluded: 'Kein Prototyp für die Schublade.'`,
  `bullets: ['4 Wochen Standardumfang, erweiterbar auf 8', 'Dedizierter Entwickler, feste Ansprechperson während der gesamten Umsetzung', 'Festpreis mit klar definiertem Umfang – keine versteckten Kosten']`;
  `description` ends `… Fester Umfang, feste Leute, echtes Produktivsystem.` (the trailing "statt
  Prototyp für die Schublade" moves into `notIncluded`, so the card says it once); `ctaLabel` unchanged
- care: `price: 'ab 2.500 €/Monat'`, `notIncluded: 'Kein Retainer für Meetings.'`,
  `bullets: ['Monatliches Dashboard-Tracking', 'Vierteljährliches Deep-Review', 'Jährlicher Pulse-Check-Refresh']`;
  `ctaLabel` unchanged
- `ctaHeading` unchanged (`Noch unklar, wo du stehst?`); `ctaBody`:
  `Der AI Pulse Score dauert fünf Minuten und kostet nichts: 10 Fragen, sofort ein Ergebnis über fünf Bereiche. Willst du danach genau wissen, wo der größte Hebel liegt, ist der Pulse Check ab 2.900 € der nächste Schritt.`

`content/site/leistungen.en.md` (en), same structure:
- `coreIntro`: `Each step builds on the one before. After each, you decide whether to continue — no obligation to take the next one. And the prices below are the real prices — not "available on request".`
- check: `price: 'from €2,900'`, `priceNote: 'The only step you book directly.'`,
  `notIncluded: 'Not a 40-page report nobody reads.'`,
  `bullets: ['AI Vital Signs Report', 'Prioritised opportunity backlog']`,
  `ctaLabel: 'Request the Pulse Check'`
- build: `price: 'from €15,000'`, `notIncluded: 'Not a prototype for the drawer.'`,
  `bullets: ['4-week standard scope, extendable to 8', 'A dedicated developer and a single point of contact throughout', 'Fixed price with a clearly defined scope — no hidden costs']`;
  `description` ends `… Fixed scope, dedicated people, a real production system.`
- care: `price: 'from €2,500/month'`, `notIncluded: 'Not a retainer for meetings.'`,
  `bullets: ['Monthly dashboard tracking', 'Quarterly deep review', 'Annual Pulse Check refresh']`
- `ctaBody`: `The AI Pulse Score takes five minutes and costs nothing: 10 questions, an instant result across five areas. When you then want to know exactly where your biggest lever is, the Pulse Check from €2,900 is the next step.`

**4 — one name for the free quiz.** Every visitor-facing label that opens `PulseCheckModal` becomes
`Kostenlosen Pulse Score starten` (de) / `Start your free Pulse Score` (en): `heroCta` in
`content/site/home.md` and `home.en.md`, `aiPulse.cta` and `leistungen.pulseCta` in
`src/locales/{de,en}.json`. The dialog title (`PulseQuiz.tsx` `COPY.*.quizHeading`) becomes
`AI Pulse Score: Wie gesund ist dein KI-Einsatz?` / `AI Pulse Score: how healthy is your AI use?`.
The Check card's primary CTA becomes a `Link` to `localizedPath("/kontakt")` (same pattern as Build
and Care) and a secondary text link below it, labelled `t("leistungen.pulseCta")`, opens the quiz —
so `onCheckCta` and `PulseCheckModal` stay in `PulseJourney`, only the roles swap.

**Rejected:** (a) leaving the Check card's button on the quiz and only renaming it — a
"Kostenlosen Pulse Score starten" button under a card that says `ab 2.900 €` reintroduces the same
free/paid confusion one level down; (b) adding a new pricing section or component — the section
already exists on both pages and a new one needs a design round; (c) a top-level `pricingLede`
field — `coreIntro` already renders in that exact place, so it is rewritten instead of duplicated;
(d) renaming `PulseCheckModal.tsx` → `PulseScoreModal.tsx` — five import sites for no visitor-visible
gain (see Out of scope).

## Files to change
| File | Change | Why |
|---|---|---|
| `content/site/leistungen.md` | `coreIntro` rewritten to the pricing lede; `price`/`priceNote`/`notIncluded` added per step; `bullets` replaced with the pulse-site tier bullets; build `description` trimmed; check `ctaLabel` → `Pulse Check anfragen`; `ctaBody` rewritten | German prices and framing, closing block around the free Pulse Score |
| `content/site/leistungen.en.md` | the same fields with the English strings above | English carries the same numbers |
| `content/site/home.md` | `heroCta` → `Kostenlosen Pulse Score starten` | the hero button opens the free quiz |
| `content/site/home.en.md` | `heroCta` → `Start your free Pulse Score` | same, English |
| `src/locales/de.json` | `aiPulse.cta` and `leistungen.pulseCta` → `Kostenlosen Pulse Score starten` | the other three quiz buttons |
| `src/locales/en.json` | the same two keys → `Start your free Pulse Score` | same, English |
| `scripts/generate-content.ts` | `CoreService` gains `price: string; priceNote?: string; notIncluded: string;` | the generated data must be typed for the component |
| `src/app/components/PulseJourney.tsx` | price in every `StepRail` tile; price + `priceNote` + `notIncluded` in `StepDetail`'s left column; Check CTA → `/:lang/kontakt`, secondary quiz link added | three prices without a click, one meaning per name |
| `src/app/components/PulseQuiz.tsx` | `COPY.de.quizHeading` / `COPY.en.quizHeading` name the Pulse Score | the modal heading must not imply the paid Check |
| `tests/e2e/analytics.spec.ts` | `openQuiz()` selector → the new hero label | the label it selects is renamed |
| `tests/e2e/analytics-noop.spec.ts` | same selector change (line 71) | same |

## Acceptance criteria
1. On `/de` and on `/de/leistungen`, with no click, hover or scroll interaction with the step rail, the rendered text of the `#ablauf` section contains `ab 2.900 €`, `ab 15.000 €` and `ab 2.500 €/Monat`, each inside the tile of `Pulse Check`, `Pulse Build` and `Pulse Care` respectively.
2. On `/en` and on `/en/leistungen`, the same three tiles contain `from €2,900`, `from €15,000` and `from €2,500/month`.
3. The `#ablauf` intro paragraph on both pages ends with `Und die Preise unten sind die echten Preise – nicht „auf Anfrage".` (de) / `And the prices below are the real prices — not "available on request".` (en).
4. With `Pulse Check` selected (the default), the detail panel on `/de` **and** on `/de/leistungen` shows `ab 2.900 €`, the note `Der einzige Schritt, den du direkt buchst.` and the line `Kein 40-seitiger Bericht, den niemand liest.`
5. Selecting `Pulse Build` shows the line `Kein Prototyp für die Schublade.` and selecting `Pulse Care` shows `Kein Retainer für Meetings.`; the English pages show the three English equivalents from the Approach section.
6. On `/de/leistungen` the three bullet lists equal, string for string, the `bullets` arrays given in the Approach section (2 items for Check, 3 for Build, 3 for Care); on `/en/leistungen` their English equivalents.
7. The Check card's primary CTA is a link to `/de/kontakt` (`/en/kontakt` on the English page) labelled `Pulse Check anfragen` / `Request the Pulse Check`, and no longer opens the quiz dialog.
8. A secondary text link inside the Check card, labelled `Kostenlosen Pulse Score starten` / `Start your free Pulse Score`, opens the quiz dialog.
9. Every button that opens the quiz dialog — home hero, home AI-Pulse teaser, `/leistungen` hero, `/leistungen` closing block, `/leistungen/:slug` closing block, and the Check-card link from criterion 8 — is labelled `Kostenlosen Pulse Score starten` on `de` and `Start your free Pulse Score` on `en`.
10. The quiz dialog's title contains the string `Pulse Score` and does not contain `Pulse Check`, in both locales.
11. `rg -n "Pulse Check" content/site/home.md content/site/home.en.md src/locales/de.json src/locales/en.json` returns no match.
12. `rg -n "Der Pulse Check dauert fünf Minuten" content src` and `rg -n "The Pulse Check takes five minutes" content src` both return no match.
13. The `/leistungen` closing paragraph names the free AI Pulse Score first and the paid `Pulse Check ab 2.900 €` / `Pulse Check from €2,900` as the next step, in both locales.
14. No visitor-facing German or English string introduced or changed by this task is hardcoded in a file under `src/app/`, except in the `COPY` object of `PulseQuiz.tsx`, which is that quiz's established copy store.
15. `pnpm install --prefer-offline && pnpm build` exits 0 with no new TypeScript error, and `PulseJourney.tsx` reads `price`, `priceNote` and `notIncluded` off the generated `CoreService` type without a cast to `any`.
16. Both Playwright specs in `tests/e2e/` pass against a local preview, including `Quiz Started` firing exactly once from the home-hero path after the label rename.
17. No file under `src/data/de/` or `src/data/en/` is edited by hand (they are regenerated by the build), and no price other than the three named above appears anywhere in `content/` or `src/`.

## Test plan
The repo has no test runner in `package.json`; the checks that exist are `pnpm build` (content
generation → `vite build` → prerender of every route) and the two ad-hoc Playwright specs in
`tests/e2e/`, run as documented in `tests/e2e/playwright.config.ts`.

Windows — Git Bash:
```
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-the-real-prices-on-the-main-site-and-one-meaning && pnpm install --prefer-offline && pnpm build
```
```
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-the-real-prices-on-the-main-site-and-one-meaning && pnpm exec vite preview --port 4173
```
```
cd /c/ai/dev-worktrees/venturelabs/landing/20260926-the-real-prices-on-the-main-site-and-one-meaning && pnpm dlx --package @playwright/test playwright test --config tests/e2e/playwright.config.ts
```
macOS — Terminal (zsh): not applicable (this worktree only exists on the Windows PC).

What it does: the first builds the site (regenerating `src/data/{de,en}/` from `content/`); the
second serves the production build on http://localhost:4173; the third runs the four funnel specs
plus the cookieless check against it and prints a pass/fail list.

The Tester then verifies end to end in the browser at :4173 on a 1440-wide and a 390-wide viewport:
`/de`, `/en`, `/de/leistungen`, `/en/leistungen` — the three prices on the rail without a click,
each step's "was es nicht ist" line after selecting that step, the Check card's two actions, the
quiz dialog title, and the rewritten closing block.

## What to click
1. Open `/de` on the preview, scroll to "Check. Build. Care." and read the three tiles without clicking: all three prices must be legible at 390 px too (they must not be truncated or wrapped into the step title).
2. Click `Pulse Build`, then `Pulse Care` in the step rail: each shows exactly one "Kein …" line, and the price above it matches the tile.
3. In the Check card, click the secondary link "Kostenlosen Pulse Score starten": the quiz dialog opens and its heading names the Pulse Score, not a Pulse Check.
4. Click the Check card's primary button: it lands on `/de/kontakt`, not on the quiz.
5. Switch to `/en/leistungen` and read the closing block: the free Pulse Score is offered first and the paid Pulse Check from €2,900 is named as the next step — no sentence says the Pulse Check is free.

## Verification and evidence
- Criteria 1-6, 13: a screenshot of `#ablauf` on `/de` and on `/de/leistungen` at 1440 px with all
  three prices visible, plus one of `/en/leistungen`'s closing block, in the close-out.
- Criteria 1-2 mechanically: after `pnpm build`, `rg -o "ab 2\.900 €|ab 15\.000 €|ab 2\.500 €/Monat|from €2,900|from €15,000|from €2,500/month" dist/assets/*.js | sort -u` lists all six strings
  (the prerendered HTML carries head tags only, so the bundle is where the strings are provable).
- Criteria 11-12: paste the exact `rg` commands and their empty output into the close-out.
- Criterion 14: `git diff --stat` plus a read of the `src/app/` hunks — the only literal copy in
  them is inside `PulseQuiz.tsx`'s `COPY`.
- Criterion 15: the tail of the `pnpm build` output, exit code shown.
- Criterion 16: the Playwright `list` reporter output, all specs passing, pasted.
- Criterion 17: `git status --porcelain src/data` shows only generated-file changes from the build,
  and `git diff` on those paths is not committed by hand as a copy edit.

## Will not do
- No push, no merge, no PR to `dev` or `main`; no branch other than the one already checked out.
- No edit to `netlify.toml`, `.github/workflows/`, or anything under `src/data/de/` and `src/data/en/`
  by hand.
- No change in the `pulse-landing-page` repo or in `C:\code\venturelabs` (the knowledge base and the
  audit doc are read-only here).
- No new dependency, no new npm script, no Playwright in `package.json`.
- No new price, discount, package or funding claim beyond the three prices and the lines quoted
  above; nothing is sent to a customer or published live.
- No fix to the phone number, the footer anchors, the `sofia-pro` classes, the hero video or the
  accordion — those are tasks D1, D3, D4 and D5.

## Stop conditions
- A framing line the brief names (`pricingLede`, `tier1Note`, a `tier*Bullets` entry) cannot be found
  verbatim in `pulse-landing-page/index.html` → stop and ask rather than paraphrase.
- The Check card's CTA change turns out to remove the only quiz entry point on a route (e.g. a page
  that renders `PulseJourney` without a hero button) → stop and ask before shipping a route with no
  way into the quiz.
- `pnpm build` fails for a reason outside these files (a lockfile or native-build issue) → stop and
  report; do not change `pnpm-workspace.yaml` or the lockfile to get past it.
- The Playwright run needs anything beyond `pnpm dlx` (a browser download that is blocked, a new
  dependency) → report the specs as not run, with the reason, instead of adding a dependency.
- Any copy change beyond the strings listed in Approach appears necessary → stop and ask; the copy
  is the deliverable and is Christian's call.

## Risks and open questions
- Replacing the Check bullets with the pulse-site ones drops `AI Opportunity Map statt Buzzword-Bingo`
  and `3–5 Use Cases, sortiert nach Wirkung` from the main site. The two sites also disagree on the
  count (main: "3–5 Use Cases"; subdomain: "1–3 Anwendungsfälle mit dem größten Hebel"). This task
  removes the conflicting main-site claim rather than deciding the true number — if Christian wants
  a use-case count on the card, he should name it at gate 1.
- The design round for the AI Pulse page (audit T1, `design/STATUS.md`: variants 1a/1b/1c drafted,
  awaiting Christian) may replace this section later; the content fields added here survive that,
  the `PulseJourney` layout may not.
- Register: `du` here, `Sie` on the subdomain, `ihr`/`euch` in ADR 0001. Audit decision D-g is open;
  this task does not resolve it, so the two sites stay inconsistent in register.
- `pulse.venturelabs.team` keeps showing the same offer with the same prices, indexable (audit D8).
  Publishing prices on the main site makes that duplicate more visible, not less.
- Criteria 1-10 are verified in a browser (Playwright ad hoc or the click-list), not by a committed
  automated test, because the repo has no test runner and prerender emits head tags only. The
  manual check is the "What to click" list plus the Tester's viewport pass described in the Test plan.
- Claim risk is reduced, not eliminated: the quiz result copy still says a Pulse Check "würde
  ansetzen" without naming its price. That is accurate but unpriced; naming the price there is out
  of scope.

## Out of scope
- Renaming `PulseCheckModal.tsx` to `PulseScoreModal.tsx` and its five import sites (developer-facing
  only; worth a follow-up task).
- The retailer price ladder (`Erster Hebel ab 9.900 €`, `Care Light ab 890 €/Monat`) and the
  Forschungszulage note — both need Christian's decision (audit D-b, 2c part 2).
- `tier2Note` / `tier3Note` from the pulse site; the brief names `tier1Note` only.
- A new `/:lang/ai-pulse` page, the `pulse.venturelabs.team` redirect and the subdomain's `noindex`
  (ADR 0001, audit D8).
- Lead capture in the quiz, the booking link in the navbar, and every CTA that ends in a footer
  anchor (audit D1) — including `LeistungenDetail.tsx:354`'s `/#kontakt`, which this task leaves
  untouched.
- Updating `knowledge-base/domains/website-content.md` or the design `CHECKLIST.md` (audit D7, a
  different repo).
