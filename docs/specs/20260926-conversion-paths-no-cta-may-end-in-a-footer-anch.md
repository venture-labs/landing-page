---
task: 20260926-conversion-paths-no-cta-may-end-in-a-footer-anch
company: venturelabs
status: ready
size: M
branch: fix/conversion-paths-no-cta-may-end-in-a-footer-anch
base: dev
design: none
---

# Conversion paths: no CTA may end in a footer anchor

## Goal

Every call-to-action on venturelabs.team that today points at a page anchor (`/:lang#kontakt`,
`/:lang#projekte`) must point at a real destination: the contact page `/:lang/kontakt` or the live
Google booking page `https://calendar.app.google/SsabAjwxnbUjhoGo8`. The area pages' `Zum Case
ansehen` must open the case it just described. The booking link becomes the navbar's primary
action, reachable by keyboard. The broken public phone number `+49 148 74 18 f6` (linked
`tel:+491487418f6`) disappears from the site — without inventing digits. This is D1 / VL-2-S1 of
`knowledge-base/marketing/website-agency-topics-2026-09-26.md` (findings 1b.3–1b.7 and F1); it is
wiring and copy only, no new screen.

## Assumptions

- Which CTA gets which destination is my call, made per label and per intent, since the brief says
  "`/:lang/kontakt` **or** the booking URL" without a per-CTA mapping: labels that say *contact*
  (`Kontakt`, `Jetzt anfragen`, `Kontakt aufnehmen`, `Get in touch`) go to `/:lang/kontakt`; labels
  that mean *talk to us now* (`Talk to Venture Labs`, the quiz result's `Nächste Schritte ansehen →`,
  the area pages' bottom banner CTA `Find your automation opportunity` / `Build your product` /
  `Design your AI experience` / `Build a new venture`) go to the booking URL. The full mapping is the
  table under "Approach".
- "Add the booking link to the navbar as the primary action" means: the existing purple navbar button
  (today `nav.contact` → `/:lang/kontakt`) becomes the booking link, and `Kontakt` / `Contact` is
  added to the normal nav items (`src/data/navigation.ts`) so the contact page keeps a navbar entry.
  No new layout, no new component — one relabelled button and one more text link.
- The booking link opens in a new tab (`target="_blank" rel="noopener noreferrer"`), so a visitor who
  books does not lose the site.
- Every link whose destination is the booking URL fires the existing Plausible goal
  `EVENTS.callLinkClicked` ("Call Link Clicked"). No new goal name is introduced, so nothing has to
  be created in the Plausible UI.
- The footer's `Gespräch buchen` / `Book a call` link (today `/:lang/kontakt`, audit finding 1b.7:
  "there is no booking link anywhere on the main site") is repointed to the booking URL too, and
  keeps firing `Call Link Clicked`. Today `Footer.tsx`'s internal/external branch drops the `onClick`
  on the external branch, so this needs a one-line fix or the goal silently stops firing.
- No confirmed replacement for `+49 148 74 18 f6` exists in the repo or the knowledge base
  (`Impressum.tsx` has `+49 156 78 387064`, `Kontakt.tsx`'s `teamContacts` has `+49 156778 387064` —
  they contradict each other, and `Datenschutz.tsx`'s `+49 2102 3027 0` belongs to the external data
  protection officer, not to Venture Labs). So the brief's second option applies: the broken phone
  block is **removed**, in both places it is rendered (`Kontakt.tsx` `CtaStrip`,
  `LeistungenDetail.tsx` `ContactStrip`), and replaced by the booking link next to the existing
  mail link. If Christian names a confirmed number at gate 1, that number goes in instead.
- Christian's own mobile in `Kontakt.tsx`'s `DirectContact` (finding F8) is **not** touched — it is a
  separate finding with its own open question about the digits.
- Copy register stays as the live site has it today (`du`, German first) — ADR 0001's `ihr`/`euch`
  decision (D-g in the audit) is not settled and is not this task's job.
- The English labels (`Talk to Venture Labs`, `Find your automation opportunity`) stay as they are —
  whether English CTAs survive is audit decision D-h, not this task.
- Verified against the worktree's checkout: `caseSlug` already exists on every service
  (`ai-automation` → `machinemaster`, `ai-products` → `tap2link`, `ai-experience` → `brylliant`,
  `venture-building` → `moerschen`), is already carried through `scripts/generate-content.ts` into
  `ServiceDetail`, and all four slugs have a real case detail page. No content file needs a new field.
- Playwright stays a non-dependency, run ad hoc exactly as `tests/e2e/playwright.config.ts` documents.

Correct me at gate 1, otherwise I proceed with these.

**Gate 1 is closed — approved as written.** Christian approved this spec on 2026-09-26 (white_check_mark
reaction on the gate-1 post, ts `1790395283.397669` in `#dev-agent`, applied by the front desk at
19:05 because the Dev Manager did not pick the reaction up). Consequences for the assumptions above:

- No phone number was named, so the "removed" branch of the phone assumption is now a settled
  decision, not an assumption: the block is removed in both strips and replaced by the booking link.
- The navbar change (booking link as the primary purple button, `Kontakt` / `Contact` added to
  `src/data/navigation.ts`) is approved as described.
- The task runs **whole, not split** — no slicing, all fourteen mapping rows in one change and one PR.
- It runs as a **night run on 2026-09-26/27**: the run ends in a **PR against `dev`, not merged**, and
  its outcome is reported in the **morning list**. Nobody is awake to answer mid-run, so a stop
  condition ends the run and is written up in the morning list instead of waiting for an answer
  (see "Stop conditions").

## Context found

- `src/app/locale.tsx` — `localizedPath("/#kontakt", "de")` returns `/de#kontakt`; this is the helper
  that produces every broken CTA target today. Nine call sites across six files.
- `src/app/components/Footer.tsx` — renders `<footer id="kontakt">`: the anchor every CTA lands on.
  Also the one place that already fires `EVENTS.callLinkClicked`, via a `track` field on a footer
  link, and the repo's existing internal-`<Link>` / external-`<a>` branching pattern (lines 107-124).
- `src/app/components/ProjectsFeatured.tsx` — `<section id="projekte">` on the home page: what
  `Zum Case ansehen` points at today instead of the case.
- `src/app/components/ui/CtaButton.tsx` — the shared CTA button. Renders a plain `<a href>` and
  **ignores `onClick` when `href` is set**, and has no `target`/`rel`. Used by `FinalCTA`,
  `PulseQuiz`, `CaseDetail`, `LeistungenDetail`, `AboutTeaser`, `AIPulseTeaser`; every usage sits
  inside a routed page, so a react-router `<Link>` branch is safe.
- `src/app/components/Navbar.tsx` — desktop button (line 95) and mobile-menu button (line 129), both
  `<Link to={localizedPath("/kontakt")}>` with `t("nav.contact")`.
- `src/data/navigation.ts` — `navigationDE` / `navigationEN`, four items each, labels hardcoded per
  locale (not i18n). The pattern to extend for the Kontakt nav item.
- `src/app/components/Hero.tsx:140`, `src/app/components/FinalCTA.tsx:39`,
  `src/app/components/PulseQuiz.tsx:450`, `src/app/pages/CaseDetail.tsx:60` and `:282`,
  `src/app/pages/UeberUns.tsx:272`, `src/app/pages/LeistungenDetail.tsx:87`, `:301` and `:354` — the
  nine anchor CTAs.
- `src/app/pages/LeistungenDetail.tsx:300-307` — `Zum Case ansehen`, a `<Link to={localizedPath("/#projekte")}>`
  inside `CaseSection`, which already has `detail.caseSlug` in scope.
- `src/app/pages/Kontakt.tsx:410-425` (`CtaStrip`) and `src/app/pages/LeistungenDetail.tsx:462-477`
  (`ContactStrip`) — the two identical blocks carrying `tel:+491487418f6` / `+49 148 74 18 f6`.
- `src/app/analytics.ts` — `EVENTS` (four goal names) and `trackEvent()`, a safe no-op when the
  Plausible stub is absent. `vite.config.ts`'s `plausiblePlugin()` injects the
  `file-downloads.outbound-links` script at build only.
- `src/locales/{de,en}.json` — `nav.contact`, `footer.bookCall` ("Gespräch buchen" / "Book a call"),
  `leistungen.requestNow` / `viewCase` / `ctaContact` / `contactQuestion`, `cases.requestNow` /
  `contactButton`, `kontakt.ctaQuestion` (the only touched string that tells the visitor to *call*:
  "Ruf einfach an oder schreib uns").
- `src/app/pages/BlogDetail.tsx:157` — legitimate in-page anchors (`href={`#${h.id}`}`, table of
  contents). Any check must not forbid these.
- `scripts/prerender.ts` — writes one HTML shell per route plus `dist/sitemap.xml` with every URL:
  the route list a rendered-DOM check can crawl. `dist/**/index.html` bodies are `<div id="root">`,
  so a static scan of the build proves nothing about hrefs — the check must run in a browser.
- `tests/e2e/analytics.spec.ts` — the four funnel-goal tests. Its last two tests click the footer
  `Gespräch buchen` link and assert `toHaveURL(/\/de\/kontakt$/)`; repointing that link makes this
  assertion wrong and it must be updated in the same change.
- `tests/assets/case-card-images.test.mjs` (`node --test`) and `scripts/check-seo.ts` /
  `scripts/check-analytics.ts` (`tsx`, dependency-free, exit-code gated) — the repo's two existing
  "mechanical proof of the acceptance criteria" patterns.

## Approach

Introduce one constant and reuse everything else.

`src/app/links.ts` (new, three lines) exports
`export const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";`. Every booking CTA
imports it, so there is exactly one place the URL lives and exactly one string a check can pin.

`CtaButton` is extended, not replaced, along the branching pattern `Footer.tsx` already uses: when
`href` starts with `/` it renders a react-router `<Link to={href}>` (SPA navigation instead of
today's full page reload), otherwise an `<a href>` with `target="_blank" rel="noopener noreferrer"`;
`onClick` is passed through in **both** branches so a booking CTA can fire its Plausible goal. Its
props gain nothing else. Rejected: a new `BookingButton` component (the brief says existing
components only, and the CTA styling is already centralised here); rejected: leaving `CtaButton` as
a plain `<a>` and wrapping each call site (five call sites would each need the same three lines).

The nine anchor CTAs are repointed per the mapping below. `localizedPath()` itself is left alone —
its `/#` branch stops being used but content markdown may still author such a path.

| Where | Element / label | Today | New destination |
|---|---|---|---|
| `Navbar.tsx` desktop + mobile | primary purple button | `/:lang/kontakt`, `nav.contact` | `BOOKING_URL`, new label key `nav.bookCall`, fires `callLinkClicked` |
| `src/data/navigation.ts` | new nav item `Kontakt` / `Contact` | — | `/kontakt` |
| `Hero.tsx:140` | hero secondary, `heroCtaSecondary` ("Kontakt") | `/:lang#kontakt` | `/:lang/kontakt` (react-router `Link`) |
| `FinalCTA.tsx:39` | `finalCta.secondaryCta` ("Talk to Venture Labs") | `/:lang#kontakt` | `BOOKING_URL` + `callLinkClicked` |
| `PulseQuiz.tsx:450` | result CTA (`copy.ctaButton`) | `/:lang#kontakt` | `BOOKING_URL` + `callLinkClicked` |
| `Footer.tsx:76` | `footer.bookCall` | `/:lang/kontakt` | `BOOKING_URL` + `callLinkClicked` (keep the `track` firing on the external branch) |
| `LeistungenDetail.tsx:87` | `leistungen.requestNow` ("Jetzt anfragen") | `/:lang#kontakt` | `/:lang/kontakt` |
| `LeistungenDetail.tsx:301` | `leistungen.viewCase` ("Zum Case ansehen") | `/:lang#projekte` | `/:lang/cases/${detail.caseSlug}` |
| `LeistungenDetail.tsx:354` | `detail.ctaButtonLabel \|\| leistungen.ctaContact` | `/:lang#kontakt` | `BOOKING_URL` + `callLinkClicked` |
| `LeistungenDetail.tsx:463` | `tel:+491487418f6` | dead `tel:` link | booking link (`nav.bookCall`) + `callLinkClicked`; mail link stays |
| `CaseDetail.tsx:60` | `cases.requestNow` | `/:lang#kontakt` | `/:lang/kontakt` |
| `CaseDetail.tsx:282` | `cases.contactButton` | `/:lang#kontakt` | `/:lang/kontakt` |
| `UeberUns.tsx:272` | hardcoded "Kontakt aufnehmen" | `/:lang#kontakt` | `/:lang/kontakt`, label from `t("nav.contact")` so `/en` stops showing German |
| `Kontakt.tsx:411` | `tel:+491487418f6` | dead `tel:` link | booking link (`nav.bookCall`) + `callLinkClicked`; mail link stays |

Copy: `src/locales/{de,en}.json` gain `nav.bookCall` (same wording as the existing `footer.bookCall`:
"Gespräch buchen" / "Book a call"), and `kontakt.ctaQuestion` is rewritten so it no longer tells the
visitor to call a number that is gone ("Ruf einfach an oder schreib uns …" / "Just call or write to
us …"), German first, same meaning in both locales. `leistungen.contactQuestion` does not mention
calling and stays word for word.

Proof is split in two, matching the repo's two existing patterns. A dependency-free `node --test`
file scans the source for the forbidden strings (fast, runs anywhere, catches a regression in a diff)
and a Playwright spec crawls every URL in `dist/sitemap.xml` in a real browser and asserts no
rendered `href` matches `^/(de|en)#(kontakt|projekte)$` — the criterion as the requester wrote it.
Rejected: asserting against `dist/**/index.html` (the prerender writes head tags only; the body is
an empty root div, so a static scan would pass on a fully broken site).

Gate 1 approved the task whole, so all fourteen rows above land in one change, on one branch, in one
PR against `dev`. The run stops at the PR: it is opened and left unmerged for Christian to read in the
morning (gate 3 is his merge on GitHub, no agent involved).

## Files to change

| File | Change | Why |
|---|---|---|
| `src/app/links.ts` | new: `BOOKING_URL` constant | one place for the booking URL, one string to pin |
| `src/app/components/ui/CtaButton.tsx` | internal `<Link>` / external `<a target="_blank" rel="noopener noreferrer">` branch; `onClick` honoured with `href` | booking CTAs must fire a goal and internal CTAs must not full-reload |
| `src/app/components/Navbar.tsx` | primary button → `BOOKING_URL` + `nav.bookCall` + `callLinkClicked`, desktop and mobile menu | the booking link becomes the navbar's primary action |
| `src/data/navigation.ts` | add `{ label: "Kontakt", href: "/kontakt" }` / `{ label: "Contact", … }` | contact page keeps a navbar entry |
| `src/app/components/Hero.tsx` | secondary CTA → `/:lang/kontakt` | no footer anchor |
| `src/app/components/FinalCTA.tsx` | secondary CTA → `BOOKING_URL` + goal | no footer anchor |
| `src/app/components/PulseQuiz.tsx` | result CTA → `BOOKING_URL` + goal | the highest-intent moment gets a real next step |
| `src/app/components/Footer.tsx` | `bookCall` → `BOOKING_URL`; fire `track` on the external branch too | a link labelled "book a call" must book a call; keeps the goal alive |
| `src/app/pages/LeistungenDetail.tsx` | four edits: hero CTA, `viewCase` → `/:lang/cases/${detail.caseSlug}`, banner CTA, `ContactStrip` phone → booking link | four of the eight broken CTAs plus F1's second rendering site |
| `src/app/pages/CaseDetail.tsx` | two CTAs → `/:lang/kontakt` | criterion: no anchor href on any route |
| `src/app/pages/UeberUns.tsx` | CTA → `/:lang/kontakt`, label via `t("nav.contact")` | same, plus a German string on an English route |
| `src/app/pages/Kontakt.tsx` | `CtaStrip` phone block → booking link | F1: the broken public phone number |
| `src/locales/de.json` | add `nav.bookCall`; rewrite `kontakt.ctaQuestion` | new label; copy must not ask for a call that is gone |
| `src/locales/en.json` | same two, English | locale parity |
| `tests/links/no-anchor-ctas.test.mjs` | new `node --test` file: source-level scan | mechanical, dependency-free gate |
| `tests/e2e/conversion-paths.spec.ts` | new Playwright spec: rendered hrefs over every sitemap URL, keyboard reach, booking goals | the criteria as written, proven in a browser |
| `tests/e2e/analytics.spec.ts` | update the two tests that click the footer `Gespräch buchen` link and assert `/de/kontakt` | the link's destination changed; the goal must still fire once |

## Acceptance criteria

1. `node --test tests/links/no-anchor-ctas.test.mjs` exits 0.
2. No file under `src/` except `src/imports/` and `src/data/` contains the substring `/#kontakt` or
   `/#projekte`.
3. Neither the string `+49 148 74 18 f6` nor `tel:+491487418f6` appears anywhere under `src/`, and no
   `tel:` href under `src/` contains a character other than `+` and digits.
4. The literal `https://calendar.app.google/SsabAjwxnbUjhoGo8` appears exactly once under `src/`, in
   `src/app/links.ts`; every other booking CTA imports `BOOKING_URL` from there.
5. After `pnpm build`, for every URL in `dist/sitemap.xml` rendered in a browser, no `<a>` element has
   an `href` matching `^/(de|en)#(kontakt|projekte)$`.
6. In-page anchors that are not those two still exist and still work: on a blog post with a table of
   contents, its links still carry `href="#<heading-id>"` and clicking one moves the viewport.
7. On every route, in both locales, the navbar contains a link whose `href` is exactly
   `https://calendar.app.google/SsabAjwxnbUjhoGo8`, with `target="_blank"` and a `rel` containing
   `noopener`, labelled "Gespräch buchen" on `/de` and "Book a call" on `/en`.
8. On every route, in both locales, the navbar still contains a link to `/:lang/kontakt`.
9. From a fresh load of `/de` with no pointer interaction, pressing Tab repeatedly makes the navbar
   booking link `document.activeElement`, and a focus indicator is visible on it.
10. At 390 px width, opening the navbar menu with the keyboard and continuing to Tab also reaches the
    booking link in the open menu.
11. On `/de` the hero secondary CTA's `href` is `/de/kontakt` (and `/en/kontakt` on `/en`); clicking it
    lands on the contact page (URL ends `/kontakt`, the contact form is visible).
12. On `/de` the final CTA "Talk to Venture Labs" has `href` = `BOOKING_URL` and clicking it fires
    `Call Link Clicked` exactly once.
13. Completing the quiz and clicking its result CTA: `href` = `BOOKING_URL`, fires `Call Link Clicked`
    exactly once, and no navigation to `/de#kontakt` happens.
14. On each of `/de/leistungen/{ai-automation,ai-products,ai-experience,venture-building}`: the hero
    CTA's `href` is `/de/kontakt`, and the bottom banner CTA's `href` is `BOOKING_URL` and fires
    `Call Link Clicked` once.
15. On each of those four pages, `Zum Case ansehen` has `href` `/de/cases/machinemaster`,
    `/de/cases/tap2link`, `/de/cases/brylliant`, `/de/cases/moerschen` respectively; clicking it lands
    on that case's detail page and its `h1` is that case's `heroHeadline`. The same holds under `/en`.
16. On `/de/cases/tap2link`, both CTAs (hero and closing) have `href` `/de/kontakt`.
17. On `/de/ueber-uns` the closing CTA has `href` `/de/kontakt`; on `/en/ueber-uns` its label is the
    English `nav.contact` string, not "Kontakt aufnehmen".
18. `/de/kontakt` and each of the four area pages render a booking link (to `BOOKING_URL`) where the
    phone link used to be, and still render the `mailto:contact@venturelabs.team` link next to it.
19. `kontakt.ctaQuestion` in `de.json` and `en.json` no longer asks the visitor to phone, and the two
    carry the same meaning.
20. All four Plausible goals still fire exactly once each in the documented e2e run: `Quiz Started`,
    `Quiz Completed`, `Contact Sent`, `Call Link Clicked`; `tests/e2e/analytics.spec.ts` and
    `tests/e2e/analytics-noop.spec.ts` pass.
21. The site sets no cookies across the whole funnel (the existing cookieless assertion still passes).
22. `pnpm build` exits 0 and prerenders the same number of URLs as before the change;
    `pnpm exec tsx scripts/check-seo.ts` exits 0.
23. `package.json` gains no runtime or dev dependency.
24. When the run ends, one PR exists from `fix/conversion-paths-no-cta-may-end-in-a-footer-anch` into
    `dev`, state **open** and **not merged**, containing every change above in one branch (the task ran
    whole, so no partial PR and no second branch). `dev` and `main` are unchanged apart from that PR's
    source branch existing on the remote.

## Test plan

Existing: `tests/e2e/analytics.spec.ts` (four funnel goals + cookieless), `tests/e2e/analytics-noop.spec.ts`
(trackEvent no-ops without the stub), `tests/assets/case-card-images.test.mjs` (`node --test`),
`scripts/check-seo.ts` and `scripts/check-analytics.ts` (`tsx`, exit-code gated).

New: `tests/links/no-anchor-ctas.test.mjs` (`node --test`, no dependency) for criteria 2-4, and
`tests/e2e/conversion-paths.spec.ts` (Playwright, ad hoc) for criteria 5-19, reading the route list
from `dist/sitemap.xml` and reusing the `withRecorder` / `callsFor` helpers' approach from
`analytics.spec.ts` for the goal assertions. Updated: the two footer-link tests in
`analytics.spec.ts`.

Commands (Git Bash, from the worktree root):

```
pnpm install --prefer-offline && pnpm build
node --test tests/links/no-anchor-ctas.test.mjs
pnpm exec tsx scripts/check-seo.ts
pnpm exec vite preview --port 4173
# in a second shell:
npx --yes @playwright/test@latest test --config tests/e2e/playwright.config.ts
```

The Tester verifies end to end on the preview: home → quiz → result CTA → booking page; home →
navbar booking button → booking page; area page → `Zum Case ansehen` → the matching case page; area
page → `Jetzt anfragen` → contact form. Every Playwright run must abort requests to
`**://plausible.io/**` and `**://calendar.app.google/**` (the same `page.route` pattern already used
for Plausible), so nothing leaves the machine and no real booking page is hit.

Because this is a night run, the full command list above runs unattended before the PR is opened, and
every exit code lands in the morning list; a red command is a stop condition, not something to retry
past (see "Stop conditions").

## What to click

1. `/de`, navbar: "Gespräch buchen" opens the Google booking page in a **new tab** and venturelabs.team
   is still open behind it; "Kontakt" next to it still opens the contact page.
2. `/de`, run the quiz to the result and click `Nächste Schritte ansehen →`: the booking page opens —
   not a scroll to the footer.
3. `/de/leistungen/ai-automation`: `Zum Case ansehen` lands on the MachineMaster case page (headline
   "KI im Vertrieb von Landmaschinen"), not on the home page's project section.
4. `/de/kontakt`, bottom strip: no phone number is shown there any more, the booking link reads
   correctly in German next to the mail address, and the sentence above it no longer says "Ruf
   einfach an".
5. `/de` with the keyboard only (Tab from the top of the page): the navbar booking button takes focus
   with a visible ring before any page content.

Christian works this list on the deploy preview in the morning, from the PR — the run does not wait
for it.

## Verification and evidence

- `pnpm install --prefer-offline && pnpm build` → exit 0; paste the prerender line
  `prerender: wrote sitemap.xml with N urls` and confirm `N` equals the value from a build of the base
  commit (record both numbers).
- `node --test tests/links/no-anchor-ctas.test.mjs` → exit 0; paste the pass/fail summary.
- `git grep -n -e "/#kontakt" -e "/#projekte" -- src` → no output (paste the empty result and the exit
  code). `git grep -n "74 18 f6" -- src` and `git grep -n "tel:+491487418f6" -- src` → no output.
- `git grep -n "calendar.app.google" -- src` → exactly one hit, `src/app/links.ts`.
- `pnpm exec tsx scripts/check-seo.ts` → exit 0; paste the `ok` lines summary.
- Playwright run (command above) → every spec in `tests/e2e/` green; paste the reporter summary
  including the new `conversion-paths` spec and the updated `analytics` spec.
- Two screenshots from the preview: the navbar at 1440 px with the booking button focused via Tab
  (focus ring visible), and at 390 px with the menu open showing the booking link.
- One screenshot of `/de/kontakt`'s bottom strip showing the booking link and the mail link, no phone.
- The PR (criterion 24): paste the PR URL, its base (`dev`) and head branch, its state (`open`), and
  `merged: false` as read back from GitHub after opening it — not from the command that created it.
  The branch is pushed with an explicit refspec
  (`git push origin fix/conversion-paths-no-cta-may-end-in-a-footer-anch:fix/conversion-paths-no-cta-may-end-in-a-footer-anch`);
  confirm `git log origin/dev -1` is the same commit before and after.
- The close-out states, in one line each: the sitemap URL count before/after, the number of `<a>`
  elements checked across all sitemap URLs by the new spec, and the four goal counts observed.
- **Morning list** (the night run's report, one short block): the PR link; one line per command above
  with its exit code; the three screenshots; the "What to click" list carried over as Christian's
  remaining gate-3 check; and any stop condition that fired, named, with what was left undone. If no
  stop condition fired, the morning list says so explicitly.

## Will not do

- No merge and no `checkout`/`rebase`; `main` and `dev` are never written to. The single exception the
  gate-1 note authorises is pushing the already-checked-out branch
  `fix/conversion-paths-no-cta-may-end-in-a-footer-anch` to `origin` with an explicit refspec and
  opening one PR against `dev`. The PR is left open — merging it is Christian's, on GitHub, at gate 3.
- No edit to `netlify.toml`, `.github/workflows/`, `.env*` or `src/data/{de,en}/` (denied paths /
  generated output).
- No invented phone digits, and no change to the numbers in `Impressum.tsx`, `Datenschutz.tsx` or
  `Kontakt.tsx`'s `DirectContact`.
- No new dependency in `package.json`, and no `pnpm add`. Playwright stays ad hoc via `npx`/`pnpm dlx`.
- No real network request to `calendar.app.google` or `plausible.io` from any test or script.
- No new Plausible goal name, and no change to `src/app/analytics.ts`'s `EVENTS` values.
- No work from the other audit slices: no prices (D2), no `sofia-pro` removal (D3), no hero video
  (D4), no process accordion or `StrengthSection` (D5), no case-fact edits (D6), no knowledge-base
  re-derivation (D7), no pulse subdomain (D8).
- No lead capture added to the quiz and no server-side contact form — both are known gaps, neither is
  in this task.
- No register rewrite (`du` → `ihr`), no translation of the English CTA labels.
- No overnight message to Christian expecting an answer, and no waiting on one: the night run either
  finishes at the open PR or stops and writes the reason into the morning list.

## Stop conditions

Gate 1 settled the questions these first three used to guard, so they now read as facts to hold to
rather than answers to wait for; the remaining ones end the night run. Because nobody is awake,
"stop" means: leave the work as it stands (commit what is coherent, or nothing), do **not** work
around it, and name it in the morning list.

- The phone block is removed in both strips — gate 1 named no number. If a confirmed number turns up
  in the repo or knowledge base during the work, do not use it: stop and put it in the morning list.
- The booking URL `https://calendar.app.google/SsabAjwxnbUjhoGo8` is his, as approved. If it turns out
  to be wrong or replaced, stop; it is a single constant but not the Implementer's to change.
- The navbar change is approved as described (booking button primary, `Kontakt` added to
  `src/data/navigation.ts`). If it cannot be done without a new component or a layout change, stop —
  that would be a design question, and this task is `design: none`.
- Any service's `caseSlug` is missing, empty, or resolves to a case with no detail page → stop; do not
  fall back to `/:lang/cases` or leave the anchor in place.
- Making `tests/e2e/analytics.spec.ts` pass would require weakening what a goal asserts (fewer than
  one fire, or a goal removed) → stop; the goals are the acceptance, not the obstacle.
- The new `CtaButton` `<Link>` branch breaks any existing call site (`AboutTeaser`, `AIPulseTeaser`)
  → stop and report rather than reverting to `<a>` silently for internal links.
- `pnpm build` or `scripts/check-seo.ts` exits non-zero and the cause is not in this change's files →
  stop; do not push or open the PR on a red build.
- The push or the PR against `dev` fails, or opening it would target anything other than `dev` → stop;
  the branch stays local and the morning list says the PR is missing and why. Never retry against
  another base.

## Risks and open questions

- Finding F8 stays live: `Kontakt.tsx`'s `DirectContact` publishes `+49 156778 387064` while
  `Impressum.tsx` publishes `+49 156 78 387064` — the same person, two different numbers, one of them
  certainly wrong. No criterion here covers it and no automated check will catch it; it needs
  Christian to name the digits, then a one-line follow-up task.
- The audit's observation that `FinalCTA`'s *primary* (purple) styling sits on the softer CTA
  ("Leistungen ansehen") while "Talk to Venture Labs" is the secondary is **not** fixed here — only
  the destination changes. Gate 1 approved the spec as written and did not pull the style swap in, so
  it stays out; it remains a one-line change for a later task if he wants it.
- `content/site/leistungen.md`'s `contactCallout` ("Ruf uns an oder schreib uns") still invites a call
  on `/:lang/leistungen`, a page that has no phone link either before or after this change. It is
  copy, it belongs to the D2 slice, and it is left alone.
- Plausible's loader is the `outbound-links` build, so clicks on the booking link will additionally be
  recorded as "Outbound Link: Click" beside the custom goal. That is extra data, not a changed goal —
  but whether an outbound-link goal exists in his Plausible account is unverified.
- `Call Link Clicked` will fire from five places instead of one after this change, so its rate jumps
  and comparisons against history are not like-for-like. Worth one line in the close-out so the number
  is not read as a conversion spike.
- Criterion 9/10 (keyboard reach and a *visible* focus indicator) is asserted mechanically only as
  "the element becomes `document.activeElement`"; that the ring is actually visible against the dark
  navbar is checked by a human on the preview (click-check 5) and by the screenshot in the evidence.
- The two `tel:` strings are removed from the rendered site, but `src/imports/` (Figma exports) still
  contains `+49 156 78 387064` in unrendered code. Left untouched on purpose; noted so a later grep
  does not read as a regression.
- The night run means the five "What to click" checks happen after the PR is open, not before, so the
  PR can be open with a visual detail still unconfirmed. That is the intended shape of this run
  (whole, PR against `dev`, no merge, morning list), not a gap — but the morning list must carry the
  click list forward so it is not silently skipped.

## Out of scope

- The `/#` branch of `localizedPath()` in `src/app/locale.tsx` stays, unused by components, because
  content markdown may still author such a path.
- Converting the remaining internal `<a href>` links elsewhere in the app to react-router `<Link>` —
  only `CtaButton` and the CTAs listed above change.
- Any change to the four Plausible goal names, to `vite.config.ts`, or to the analytics wiring beyond
  adding `callLinkClicked` call sites.
- A booking widget embedded on the site; the Google Calendar page stays an outbound link.
- Anything on `pulse.venturelabs.team` / the `pulse-landing-page` repo.
- Merging the PR, deploying, or touching the Netlify site `vl-home` — gate 3 is Christian's merge on
  GitHub.
