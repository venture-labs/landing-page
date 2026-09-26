---
task: 20260926-case-facts-remove-the-contradictions-source-the-
company: venturelabs
status: blocked
size: M
branch: fix/case-facts-remove-the-contradictions-source-the-
base: dev
design: none
---

# Case facts: remove the contradictions in `content/cases/`, source every rendered number

## Goal

The seven case studies in `content/cases/` contradict each other and themselves: Moerschen's card
`subtitle` is Tap2Link's copy, Tap2Link claims both 8 and 16 weeks on the same screen, `+230%
Nutzerinteraktion(en)` is the headline number of two unrelated cases, and Tap2Link's card stat
(`+230%`) is a different metric from its own detail stats (`+300%`). Fix each contradiction, give
Moerschen a subtitle that describes Moerschen, pick the one true Tap2Link timeline, and give every
number that stays on screen a recorded source in a new, unrendered `statsSource` frontmatter field
— a number with no confirmed source is deleted, never invented, never softened. This is D6 of
`knowledge-base/marketing/website-agency-topics-2026-09-26.md`, and the audit's finding 1c is the
source document.

## Assumptions

- The rule "no confirmed source → delete the number" applies to every digit-bearing stat in
  `content/cases/`, not only to the four contradictions the audit names — the acceptance line is
  "every rendered stat has a `statsSource`". That pulls in `creator-studios`, `neuer-look` and
  `scanservice`, which the audit never looked at.
- "Rendered stat" means an entry of `stats:` (rendered on the home page by
  `ProjectsFeatured.tsx:125` and, via `detailStats`, on the cases overview card by
  `CasesOverview.tsx:154-166`) or an entry of `detailStats:` (rendered on the case detail page by
  `CaseDetail.tsx:208-232`) that contains a digit. Prose fields (`subtitle`, `heroSubline`,
  `description`, `solution`) are not stats, but must not contradict a stat that stays.
- `statsSource` is a new frontmatter field that no component reads. `scripts/generate-content.ts`
  copies only named fields into `src/data/{de,en}/`, so an unknown key is silently ignored —
  verified by reading the `cases.ts` and `caseDetails.ts` writers (lines 245-347): no generator
  change is needed for the field to exist and not render.
- Project durations ("8 Wochen", "4 Wo.", "12 Wochen") are facts about our own projects, not proof
  metrics, so two cases may legitimately carry the same duration; the "no two cases share a
  headline number for the same metric" rule is enforced for outcome metrics only. Without this
  reading, `creator-studios` and `neuer-look` (both `4 Wo.` `von Konzept bis Livegang`) would force
  a true fact off one of the two pages.
- A duration still needs a `statsSource` (e.g. "launch date from the project records") — it is a
  digit-bearing stat like any other.
- The mechanical check for this repo is a standalone `scripts/check-*.ts` checker run by the
  Tester, following the existing `check-analytics.ts` / `check-seo.ts` pattern (PASS/FAIL lines,
  exit 1), not a throw inside the build: the repo has no test runner and no test directory.
- German is authoritative; the `.en.md` file of a case carries the same set of metrics as its
  German twin, translated — a number deleted in German is deleted in English.
- Deleting stats may leave a case with fewer than three or with zero stats; that is acceptable
  copy-wise, and the detail page's results section is hidden when a case has no stats left.
- Moerschen's framing as a co-founded venture (audit T17) is not touched here; the new subtitle
  describes the work, not the ownership.
- The live site is not re-deployed by this task; verification happens on the branch preview
  `https://fix-case-facts-remove-the-contradictions-source-the---vl-home.netlify.app` (URL pattern
  unverified — the Tester uses whatever branch-deploy URL Netlify reports) and on a local
  `pnpm dev`.

Correct me at gate 1, otherwise I proceed with these.

## Open questions

1. Which Tap2Link timeline is true — 8 weeks or 16 weeks?
   - The file says both: `subtitle` and `heroSubline` say "in nur 8 Wochen", `stats` says "Launch
     in 16 Wochen" (same in `tap2link.en.md`). Nothing in either repo decides it, and the audit
     lists it as missing for T15 as well. I cannot pick without inventing a fact.
   - Whichever you name becomes the single number in `subtitle`, `heroSubline` and `stats` in both
     locales; the other disappears from the file.
2. Which of the numbers below have a confirmed source, and what is it (one short line each)?
   - Everything you do not name is deleted from the case — that is the rule from your own brief,
     and the audit found no source in any repo for the first group.
   - Tap2Link: `+230% Nutzerinteraktion` (card) · `95% Kundenzufriedenheit` (card) · `+300% mehr
     App-Installationen nach Launch` · `5 Sek bis zum Profil-Upload via NFC` · `+60% Conversion bei
     Messegesprächsterminen` · the timeline from Q1.
   - MachineMaster: `+230 % Nutzerinteraktionen` · `+10% Verkaufssteigerung` · `5/5
     Kundenbewertungen` · `12 Wochen bis MVP`.
   - Moerschen: `+45% mehr Kontaktanfragen` · `2× schnellere Ansprechpartner-Suche` · `8 Wochen vom
     Kickoff bis Livegang`.
   - Brylliant: `2× schnellere Briefing-Freigaben` · `95% weniger Rückfragen von Agenturen` ·
     `+60% höhere Nutzerzufriedenheit`.
   - Creator Studio: `-60% weniger manuelle Anfragen per E-Mail` · `4 Wo. von Konzept bis
     Livegang` · `100% der Buchungen direkt online`.
   - Neuer Look: `4 Wo. von Konzept bis Livegang` · `+40% längere Verweildauer` · `100% der Inhalte
     neu strukturiert`.
   - ScanService: `-70% weniger Rückfragen per Telefon` · `24/7 Auftragsstatus einsehbar` · `6 Wo.
     von Konzept bis Launch`.
   - A source is a sentence naming where the number comes from and who confirmed it, e.g. "Matomo,
     Moerschen, Kontaktanfragen Q3/2024 vs Q1/2025; bestätigt von <Name>, 2026-09-26". It is never
     rendered; it exists so the number can be defended in a sales call.
   - If the answer is "replace them with fewer, defensible facts" (decision D-c of the audit), say
     that and the unsourced numbers simply go.
3. Do the copies of the same numbers on the four area pages fall under this fix, or stay as they
   are for now?
   - `content/services/ai-automation.md` + `.en.md` carry MachineMaster's `+230%` / `+10%` / `5/5`
     as `caseStats`, `ai-experience.md` carries `95%`, `venture-building.md` carries `+45%`,
     `ai-products.md` carries a "Mehr Nutzerinteraktionen" stat — all rendered on
     `/:lang/leistungen/<slug>`.
   - Recommendation: include them. If a number is deleted from a case but survives on the area
     page that advertises that same case, the site still contradicts itself — one page down from
     where the audit looked.

## Context found

- `content/cases/*.md` (+ `*.en.md`), 7 cases × 2 locales: all editorial content is YAML
  frontmatter, no markdown body. Fields that matter here: `subtitle`, `heroSubline`, `stats`
  (string list, card), `detailStats` (`value` + `label`, detail page).
- `content/cases/moerschen.md:6`: `subtitle` is verbatim Tap2Link copy ("Ein digitales
  Serviceportal für komplexe B2B-Prozesse in nur 8 Wochen."); `moerschen.en.md:6` the same in
  English. The case's own `heroSubline`, `description` and `detailStats` describe the relaunch
  correctly, so the subtitle is the only wrong field.
- `content/cases/tap2link.md:6,11,16`: `subtitle`/`heroSubline` say 8 weeks, `stats[1]` says
  "Launch in 16 Wochen"; `stats[0]` is `+230% Nutzerinteraktion` while `detailStats[0]` is `+300%
  mehr App-Installationen`. Identical in `tap2link.en.md`.
- `content/cases/machinemaster.md:10,23`: `+230 % Nutzerinteraktionen` in `stats` and `+230% mehr
  Nutzerinteraktionen` in `detailStats` — the same metric as Tap2Link's card number.
- `content/cases/creator-studios.md:20` and `content/cases/neuer-look.md:18`: both claim `4 Wo.`
  `von Konzept bis Livegang` — a fifth same-number collision the audit did not list (covered by the
  duration assumption above).
- `scripts/generate-content.ts:245-347`: writes `cases.ts` (`featuredCases.stats`, `gridCases`) and
  `caseDetails.ts` (`CaseDetail.stats` from `detailStats`). Only the named fields are copied;
  unknown frontmatter keys never reach `src/data/`.
- `src/app/components/ProjectsFeatured.tsx:124-136`: renders `c.stats` as a checkmark list on the
  home page; an empty list renders an empty `<ul>` and nothing else.
- `src/app/pages/CasesOverview.tsx:154-166`: renders the first three `detailStats` per card, already
  guarded with `detail?.stats && detail.stats.length > 0`.
- `src/app/pages/CaseDetail.tsx:195-232`: the results section renders the `t("cases.resultsHeading")`
  headline unconditionally and maps `detail.stats` below it — with zero stats, the page shows a
  results heading over nothing. The mockup gallery (lines 234-249) lives in the same `<section>`.
- `scripts/check-analytics.ts`, `scripts/check-analytics-extra.ts`, `scripts/check-seo.ts`: the
  repo's established verification pattern — a standalone `tsx` script printing `PASS`/`FAIL  [id]`
  lines and exiting 1 on failure; `check:analytics` is wired as an npm script, none of them run
  inside `pnpm build`.
- `package.json:6-10`: scripts are `build` (generate-content → vite build → prerender), `dev`,
  `check:analytics`. No test runner, no test directory.
- `knowledge-base/marketing/website-agency-topics-2026-09-26.md:133-147` (finding 1c) and
  `:1008-1019` (D6): the source document. Line 143-145 states plainly that **no source exists in
  any repo** for `+230%`, `+10%`, `5/5`, `95%`, `+45%`; line 925-927 lists D-c ("the source behind
  those numbers — or the decision to replace them with fewer, defensible facts") as an open
  decision that D6 depends on. That is why this spec is blocked.

## Approach

Content-first, with one small checker and one small render guard.

**1. Content.** Every case file gets a new top-level `statsSource` list. One entry per digit-bearing
stat, matched to it by the exact string:

```yaml
statsSource:
  - stat: "45 % mehr Kontaktanfragen über die Website"   # exactly as written under stats:
    metric: contact-requests
    source: "<where the number comes from, who confirmed it, when>"
  - stat: "+45%"                                          # exactly as written as a detailStats value
    metric: contact-requests
    source: "<same source>"
```

`metric` is a lowercase slug naming *what* is measured, shared by the card and detail wording of the
same fact (`user-interaction`, `sales-uplift`, `rating`, `contact-requests`, `contact-speed`,
`approval-speed`, `follow-up-questions`, `app-installs`, `duration`, …). It is what makes "no two
cases share a headline number for the same metric" mechanically decidable instead of a matter of
reading two German labels and judging. `duration` is the one metric exempt from the cross-case
uniqueness rule (see Assumptions).

A stat whose source Christian does not name in Q2 is removed from `stats` / `detailStats` in both
locales — no rounding, no "deutlich mehr", no replacement number.

**2. Moerschen's subtitle**, derived from the case's own `description`, no new facts:
- de: `"Ein Website-Relaunch, der komplexe Industrieleistungen verständlich macht und Besucher direkt zum richtigen Ansprechpartner führt."`
- en: `"A website relaunch that makes complex industrial services understandable and guides visitors straight to the right contact."`

**3. Tap2Link's timeline**: the number from Q1 replaces the other in `subtitle`, `heroSubline` and
`stats` in both locales, so exactly one week count appears in the file.

**4. The checker** `scripts/check-case-facts.ts`, wired as `"check:cases": "tsx
scripts/check-case-facts.ts"`, reading `content/cases/*.md` with gray-matter (the same dependency
`generate-content.ts` uses), printing one PASS/FAIL line per rule per file and exiting 1 on any
FAIL. Rules:
- R1 coverage — every `stats` entry containing a digit and every `detailStats[].value` containing a
  digit has a `statsSource` entry whose `stat` matches it exactly, with non-empty `metric` and
  non-empty `source`.
- R2 no orphans — every `statsSource.stat` matches an existing `stats` entry or `detailStats` value
  in that file.
- R3 within-case agreement — two entries of one file that share a `metric` carry the same numeric
  token (`+230%` vs `+300%` under one metric is a FAIL).
- R4 timeline agreement — across all string values of one case file, every mention matching
  `<number> Wochen|Wo.|weeks|wks` names the same number (this is the Tap2Link 8-vs-16 bug).
- R5 cross-case uniqueness — for every metric except `duration`, no (metric, numeric token) pair
  appears in two different case slugs of the same locale.
- R6 locale parity — a case's `de` and `en` file carry `statsSource` entries for the same set of
  `metric` values.

The numeric token is the first match of roughly `[+-]?\d+([.,]\d+)?\s*(%|×|x|/5)?` in the stat
string; exact regex is the Implementer's call, the rules above are what must hold.

**5. The render guard**: wrap `CaseDetail.tsx`'s results heading and stats grid (lines 197-232) in
`detail.stats.length > 0`, leaving the mockup gallery in the same section untouched, so a case whose
numbers were all deleted does not show an empty "Ergebnisse" headline.

Rejected: (a) validating inside `scripts/generate-content.ts` so `pnpm build` fails — stronger, but
it breaks the repo's own separation between generation and the `check-*` scripts and would make an
unrelated content edit unbuildable; noted as a follow-up under Risks. (b) changing `stats:` from a
string list to objects with a `metric` field — cleaner data, but it changes `FeaturedCase.stats` in
the generator and `ProjectsFeatured.tsx`, i.e. a public data shape, for no rendering gain. (c)
keeping the unsourced numbers with hedged wording ("deutlich mehr") — explicitly forbidden by the
brief. (d) writing replacement numbers from the case bodies — that is inventing facts.

## Files to change

| File | Change | Why |
|---|---|---|
| `content/cases/moerschen.md` | New `subtitle`; add `statsSource`; delete any stat unsourced per Q2 | The subtitle is Tap2Link's copy; numbers need sources |
| `content/cases/moerschen.en.md` | Same, English | Locale parity |
| `content/cases/tap2link.md` | One timeline per Q1 in `subtitle`/`heroSubline`/`stats`; add `statsSource`; delete unsourced stats (incl. the `+230%` card stat unless sourced) | 8-vs-16 weeks, card-vs-detail mismatch, duplicated `+230%` |
| `content/cases/tap2link.en.md` | Same, English | Locale parity |
| `content/cases/machinemaster.md` | Add `statsSource`; delete unsourced stats (`+230%`, `+10%`, `5/5` unless sourced per Q2) | Duplicated `+230%`, no source on record |
| `content/cases/machinemaster.en.md` | Same, English | Locale parity |
| `content/cases/brylliant.md` | Add `statsSource`; delete unsourced stats | "every rendered stat has a `statsSource`" |
| `content/cases/brylliant.en.md` | Same, English | Locale parity |
| `content/cases/creator-studios.md` | Add `statsSource`; delete unsourced stats | Same rule; also the `4 Wo.` collision with `neuer-look` |
| `content/cases/creator-studios.en.md` | Same, English | Locale parity |
| `content/cases/neuer-look.md` | Add `statsSource`; delete unsourced stats | Same rule |
| `content/cases/neuer-look.en.md` | Same, English | Locale parity |
| `content/cases/scanservice.md` | Add `statsSource`; delete unsourced stats | Same rule |
| `content/cases/scanservice.en.md` | Same, English | Locale parity |
| `scripts/check-case-facts.ts` | New checker, rules R1-R6, PASS/FAIL lines, exit 1 | The only mechanical proof available in this repo |
| `package.json` | Add `"check:cases": "tsx scripts/check-case-facts.ts"` | Runnable by the Tester, same pattern as `check:analytics` |
| `src/app/pages/CaseDetail.tsx` | Guard the results heading + stats grid on `detail.stats.length > 0` | A case with no stats left must not show an empty results section |
| `content/services/ai-automation.md` + `.en.md`, `ai-experience.md` + `.en.md`, `ai-products.md` + `.en.md`, `venture-building.md` + `.en.md` | **Only if Q3 is answered "include them"**: remove or re-source the `caseStats` copies of the same numbers | Otherwise the area pages keep showing a number deleted from its case |

`scripts/generate-content.ts` is deliberately not changed: it ignores unknown frontmatter keys, so
`statsSource` is unrendered by construction.

## Acceptance criteria

1. `pnpm check:cases` exits 0 and prints no `FAIL` line.
2. Every entry of `stats:` containing a digit, and every `detailStats[].value` containing a digit,
   in all 14 files under `content/cases/`, has a `statsSource` entry with the identical `stat`
   string, a non-empty `metric` and a non-empty `source`.
3. Every `statsSource` entry refers to a `stats` entry or `detailStats` value that exists in the
   same file (no orphan sources).
4. Every number named in the Q2 answer as unsourced no longer appears anywhere in
   `content/cases/` — not in `stats`, not in `detailStats`, not in prose.
5. No number was changed in value or wording to make it defensible: for every number still present,
   its numeric token is byte-identical to the one on `origin/dev` (deletions and Q1's timeline
   choice are the only permitted numeric differences).
6. Across all cases of one locale, no two different slugs carry the same (metric, numeric token)
   pair for any metric other than `duration`; specifically, `+230%` for user interaction appears on
   at most one case.
7. Within a single case file, all entries sharing a `metric` carry the same numeric token.
8. `content/cases/tap2link.md` and `tap2link.en.md` mention exactly one week count, the one named in
   the Q1 answer, and it is the same in `subtitle`, `heroSubline` and `stats`.
9. `content/cases/moerschen.md` `subtitle` is the German string given under Approach and contains
   neither "Serviceportal" nor "B2B-Prozesse"; `moerschen.en.md` `subtitle` is its English
   counterpart and contains neither "service portal" nor "B2B processes".
10. A `de` case file and its `en` counterpart carry `statsSource` entries for the same set of
    `metric` values.
11. `pnpm build` completes successfully (content generation, vite build, prerender of every route).
12. No field named `statsSource` appears anywhere under `src/data/` after `pnpm build`, and no
    `source` text from a `statsSource` entry appears in any file under `dist/`.
13. On the preview, a case detail page whose `detailStats` is empty renders no results heading and
    no empty stats grid; a case with stats renders them unchanged in layout.
14. The home page (`/de`, `/en`), the cases overview (`/de/cases`, `/en/cases`) and every case
    detail page render without a console error and without an empty stat row.

## Test plan

There is no test suite in this repo (`package.json` has no test script and there is no test
directory), so verification is the new checker plus the build plus a manual pass, each reported
explicitly:

- `pnpm install --prefer-offline` then `pnpm check:cases` — the mechanical proof of criteria 1-3,
  6-8, 10 (and of 9 via the substring rules, which the checker also asserts for the two Moerschen
  subtitles).
- `pnpm build` — criterion 11; then `grep -r "statsSource" src/data dist` must return nothing
  (criterion 12).
- `git diff origin/dev -- content/cases` reviewed line by line for criterion 5: every `-` line is a
  deletion or a Q1 timeline change, no `-`/`+` pair changes a number's value.
- `pnpm dev` on http://localhost:5173 and the Netlify branch preview: `/de`, `/en`, `/de/cases`,
  `/en/cases` and all seven case detail routes in both locales — criteria 13, 14.
- The Tester reports each of the three commands and their exit status separately; "build is green"
  alone is not a report.

## What to click

1. `/de` home page, Proof section: each of the four featured cases — the subtitle under Moerschen
   describes a website relaunch, not a B2B service portal, and no two cases show the same headline
   percentage.
2. `/de/cases/tap2link`: the week count in the hero subline is the same number the card promised on
   the home page, and appears nowhere else in a different form.
3. `/de/cases/<any case whose stats were all deleted>`: the page goes from the problem/solution
   block straight to the mockups, with no "Ergebnisse" heading hanging over empty space.
4. `/en/cases` and `/en`: the English cards carry exactly the same numbers as the German ones, none
   more, none fewer.
5. `/de/leistungen/ai-automation` (only if Q3 says include): the MachineMaster stats block matches
   what `/de/cases/machinemaster` now shows.

## Verification and evidence

- Criteria 1-3, 6-10: paste the full `pnpm check:cases` output (every PASS line and the exit code)
  into the close-out.
- Criterion 4: `grep -rn "<number>" content/` for each number the Q2 answer left unsourced, output
  empty, one line per number in the close-out.
- Criterion 5: the close-out shows `git diff --stat origin/dev -- content/cases` plus a one-line
  statement per changed number saying "deleted" or "Q1 timeline"; a reviewer must be able to see
  that no number was edited into a different number.
- Criteria 11-12: the tail of `pnpm build` (exit 0) and the empty result of
  `grep -r "statsSource" src/data dist`.
- Criteria 13-14: two screenshots from the preview — one case detail page with stats, one without —
  plus the browser console showing no errors on `/de` and `/de/cases`.
- The Reviewer additionally confirms that every `source:` line names a where and a who, not a
  placeholder like "tbd" or "internal".

## Will not do

- Invent, round, re-word, average or extrapolate any number, and do not replace a deleted number
  with a qualitative claim ("deutlich mehr", "vielfach schneller").
- Edit `src/data/de/` or `src/data/en/` (generated) or any denied path.
- Touch `content/services/*` unless Q3 is answered "include them".
- Change the case layout, imagery, categories, ordering, `featured` flags or any copy other than
  Moerschen's `subtitle` and Tap2Link's timeline strings.
- Change `scripts/generate-content.ts`, `scripts/prerender.ts` or the build pipeline; the checker
  stays out of `pnpm build`.
- Add a test runner or a new dependency (`gray-matter` and `tsx` are already present).
- Checkout, rebase, merge or push; no deploy, no touching `main` or `dev`, no edits in the other
  Venture Labs repos or the knowledge base.

## Stop conditions

- A number Christian sources in Q2 differs in value from the one currently in the file — stop and
  ask; changing a live number is a new decision, not a correction.
- Applying the rules would empty a case of every stat *and* leave its card with no content besides
  title and subtitle — report it and ask before deleting the last stat of a case.
- The checker's rules conflict with the answered questions (e.g. two cases legitimately share an
  outcome metric and value) — stop, do not weaken a rule to make the checker pass.
- The Q2 answer arrives for only part of the list — stop; a half-answered list makes "delete the
  rest" a guess.
- `pnpm build` fails for a reason unrelated to this change — report, do not fix it here.

## Risks and open questions

- The likely outcome of Q2 is that most percentages disappear, leaving the home page's proof
  section thin. That is a deliberate, visible copy consequence of D-c and should be seen on the
  preview at gate 3 before it is merged; a follow-up task to write the remaining cases' proof as
  qualitative outcomes is not part of this fix.
- `95%` appears on Tap2Link (Kundenzufriedenheit) and Brylliant (weniger Rückfragen), `+60%` on
  Tap2Link (Messe-Conversion) and Brylliant (Nutzerzufriedenheit), `2×` on Moerschen and Brylliant:
  different metrics under the rule, so the checker allows them, but a sceptical reader may still
  notice the repetition. Christian's call at gate 1 if he wants them treated as collisions.
- The checker is not wired into `pnpm build`, so a later content edit can reintroduce an unsourced
  number without anything failing. Follow-up candidate: call it from `build` or from CI.
- Criterion 5 ("no number was silently edited") is proven by a human reading `git diff`, not by a
  machine — that is the manual check, and it is the one criterion neither the checker nor the click
  list covers.
- `statsSource` is invented by this spec; no other Venture Labs repo uses the field, and if the CMS
  side of the site is ever replaced, the field must be carried over deliberately.

## Out of scope

- The other audit findings (F1 phone number, F2 sofia-pro, F3 hero video, F4 accordion, F5
  StrengthSection, F7 Jobs link) — separate D-tasks.
- Adding a testimonial, a customer logo or a new AI case (findings 1c, first three bullets).
- The claim "Zu unseren Kunden zählen Start-ups wie Großkonzerne" in the Proof intro.
- The blog-post drafts T15-T17 that reuse these numbers.
- Any change to the pulse subdomain or to `knowledge-base/` (D7, D8).
- Refactoring `stats` into a structured type, or reconciling the card stat and detail stat shapes.
