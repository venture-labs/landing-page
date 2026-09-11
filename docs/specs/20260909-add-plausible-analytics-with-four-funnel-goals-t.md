---
task: 20260909-add-plausible-analytics-with-four-funnel-goals-t
company: venturelabs
status: ready
size: M
branch: feature/add-plausible-analytics-with-four-funnel-goals-t
base: dev
design: none
---

# Add Plausible Analytics (cookieless, EU) with four funnel goals to venturelabs.team

## Goal

Load the hosted Plausible Analytics script on every prerendered route of venturelabs.team so
the site's funnel can be measured without cookies and without a consent banner. Fire four
custom events at the four funnel points (quiz start, quiz completion, contact form submit,
book-a-call click) so Christian can create the matching Goals in the Plausible UI. Add one
sentence naming Plausible to the Datenschutz page. No other tracking, no consent tool, no new
dependency in `package.json`.

## Assumptions

- **The contact form is not a Netlify Form.** `src/app/pages/Kontakt.tsx` `handleSubmit`
  builds a `mailto:` URL and assigns `window.location.href`; no data reaches any server (the
  Datenschutz page, section IV, describes exactly this). There is therefore no "successful
  submission" signal. `"Contact Sent"` fires when the submit handler runs after the browser's
  native `required` validation passes — i.e. "form completed, mail client handed off", not
  "mail sent". The name stays `"Contact Sent"` as instructed; renaming it (e.g.
  `"Contact Form Submitted"`) is Christian's call at gate 1.
- **There is no Calendly/booking widget on this site.** Grep for `calendly`, `cal.com`,
  `data-netlify`, `booking` finds only case-study copy. The only book-a-call element is the
  footer link `footer.bookCall` ("Gespräch buchen" / "Book a call",
  `src/app/components/Footer.tsx:68`), which points at `/:lang/kontakt`. Per the brief's own
  fallback, the fourth event is therefore named **`"Call Link Clicked"`**, not `"Call Booked"`.
- **The four events cover all quiz entry points via one component.** `PulseQuiz` is rendered
  only through `PulseCheckModal`, which is used by `Hero`, `AIPulseTeaser`, `PulseJourney`,
  `Leistungen` and `LeistungenDetail`. Instrumenting `PulseQuiz` alone covers all five.
- **Script variant filename is unverified.** This session has no web access, so
  https://plausible.io/docs could not be read. The spec fixes
  `https://plausible.io/js/script.file-downloads.outbound-links.js` (outbound links + file
  downloads, no `hash`, no `pageview-props`) from memory — **unverified**. The Implementer
  verifies it against the live docs; a different filename is a stop condition, not a silent
  substitution (see Stop conditions).
- **Production switch (the brief asks which way was chosen):** the tag is injected by a Vite
  plugin with `apply: 'build'` **and** a Netlify `CONTEXT` gate — injected when
  `process.env.CONTEXT` is unset (local `pnpm build`) or `"production"`, skipped when CONTEXT
  is `"deploy-preview"` / `"branch-deploy"`, never present in `pnpm dev`. Reason: Plausible
  attributes events by `data-domain`, and whether it really drops non-matching non-localhost
  hostnames is **unverified** — a preview deploy could otherwise pollute production stats.
  **This contradicts one line of the brief's verification list** ("the Netlify deploy preview
  URL with the script visible"): with this gate the deploy preview shows *no* tag, and that
  absence becomes the evidence instead. Flip at gate 1 if the preview should carry the tag.
  `process.env.CONTEXT` being set by Netlify is taken from Netlify's documented build
  environment — unverified here (`netlify.toml` is a denied path and was not read).
- **The Datenschutz page has no "analytics section".** The nearest is `V. Cookies` /
  `V. Cookies` (EN), one sentence: "Diese Seite setzt keine eigenen Analyse- oder
  Marketing-Cookies." The new sentence is appended as a second `<p>` inside that section, in
  **both** DE and EN (the EN page is a live route and would otherwise be wrong). Headings and
  section VII ("Weitergabe an Dritte") stay untouched per "nothing else changes".
- **The German sentence is written pronoun-free**, so the KB's `ihr`/`euch` register does not
  collide with the legal page's consistent `Sie` form (which stays as it is).
- **Size is M, not the requested S.** Seven repo files plus two test artifacts; still one
  focused change, no new dependency, no split needed. The goal is not reduced.
- **The repo has no test runner, no `tsconfig.json`, and no test file** (verified: `pnpm build`
  = `tsx generate-content && vite build && tsx prerender`; no `*.test.*`/`*.spec.*` anywhere).
  Mechanical checks therefore run on `tsx`, which is already a devDependency; Playwright is
  invoked ad-hoc with `pnpm dlx` and is **not** added to `package.json`, so "no new
  dependencies" holds for the shipped site. The committed Playwright files are inert for the
  build (nothing imports them, nothing type-checks them).
- **Re-taking the quiz re-fires `"Quiz Started"`.** Plausible counts unique conversions per
  visitor for goal conversion rate, so this is accepted rather than de-duplicated in app code.
- The SEO head mechanism to reuse is `index.html` → `dist/index.html` → `scripts/prerender.ts`
  (which clones the built shell per route). There is no runtime head helper (no react-helmet)
  in the repo, so "reuse the head helper" means injecting into that one shell.

Correct me at gate 1, otherwise I proceed with these.

## Context found

- `index.html` — the single source shell (title, description, og:* tags, Adobe Fonts link).
  The only `<head>` the app has.
- `vite.config.ts` — `figmaAssetResolver`, `react()`, `tailwindcss()`, `@` alias. No
  `transformIndexHtml` plugin yet; this is where the tag gets injected at build time.
- `scripts/prerender.ts` — reads `dist/index.html` as the shell and writes one
  `dist/<lang>/<route>/index.html` per route (all locales, all service/case/blog slugs,
  impressum, datenschutz). Anything in the built shell's `<head>` propagates to every route
  automatically; `renderHtml` only rewrites `<title>`, `description` and three `og:` tags, so
  an injected `<script>` passes through untouched.
- `src/app/components/PulseQuiz.tsx` — the whole quiz. State machine
  `intro → question(index) → result`. Start transition at line 342
  (`onClick={() => setState({ step: "question", index: 0, answers: [] })}`); completion
  transition in `selectOption` (`setState({ step: "result", answers })`, line 331).
- `src/app/components/PulseCheckModal.tsx` — the only consumer of `PulseQuiz`; itself used by
  `Hero`, `AIPulseTeaser`, `PulseJourney`, `Leistungen`, `LeistungenDetail`.
- `src/app/pages/Kontakt.tsx` — `ContactForm.handleSubmit` (line 165): `preventDefault`, build
  body, `window.location.href = "mailto:contact@venturelabs.team?…"`. Native `required` on
  message/name/email/consent gates the handler.
- `src/app/components/Footer.tsx` — `footer.bookCall` link, rendered as a react-router `<Link>`
  because the href starts with `/` and has no `#` (line 99).
- `src/app/pages/Datenschutz.tsx` — two sibling components `DatenschutzDe` / `DatenschutzEn`,
  sections I–IX each in a `<div>`; section V is Cookies.
- `src/app/locale.tsx` — the precedent for a small app-level cross-cutting module living
  directly under `src/app/`; there is no `src/lib/`.
- `src/locales/{de,en}.json` — UI chrome strings (`footer.bookCall`). Not touched: event names
  are code constants, never translated.

## Approach

**One injection point, one helper module, four call sites, one legal sentence.**

*Script tag.* A ~15-line Vite plugin `plausiblePlugin()` in `vite.config.ts` with
`apply: 'build'` and a `transformIndexHtml` hook returning two `injectTo: 'head'` tags: the
Plausible loader (`defer`, `data-domain="venturelabs.team"`, the variant `src`) and the
documented queue stub. Because `apply: 'build'` excludes the dev server, `pnpm dev` never gets
the tag; because `prerender.ts` clones the built shell, every route shell gets it exactly once
without touching `prerender.ts` at all. The Netlify `CONTEXT` check inside the hook adds the
deploy-preview gate.

Rejected: (a) putting the tags statically in `index.html` — present in `pnpm dev`, no switch;
(b) injecting inside `scripts/prerender.ts` — it writes route shells but never rewrites
`dist/index.html`, so the root document served at `/` would miss the tag, and it would add a
second head mechanism beside the one the SEO task established; (c) a React `useEffect` that
appends the script — no tag in the served HTML, which criterion 1 of the brief explicitly asks
for, and it would run before hydration on no route.

*Events.* A new `src/app/analytics.ts` (next to `locale.tsx`, matching that pattern) exporting
a frozen `EVENTS` map with the four literal names and `trackEvent(name)`, a thin guard around
`window.plausible?.(name)`. The queueing is Plausible's documented stub in the injected HTML,
so the guard stays a one-liner and safely no-ops in dev where no stub exists. Four call sites
add one line each; no quiz or form logic changes.

Rejected: an `useAnalytics()` hook or a provider — nothing here needs React context; a plain
function keeps the call sites one line and testable from a Playwright stub.

*Legal.* One `<p>` added inside section V of `DatenschutzDe` and of `DatenschutzEn`. Wording is
flagged "lawyer to confirm" in the PR, not final.

## Files to change

| File | Change | Why |
|---|---|---|
| `vite.config.ts` | Add `plausiblePlugin()` (`apply: 'build'`, `transformIndexHtml` → loader tag + queue stub, skipped when `process.env.CONTEXT` is `deploy-preview`/`branch-deploy`) and register it in `plugins` | Single injection point; reuses the existing shell → prerender head mechanism |
| `src/app/analytics.ts` *(new)* | `EVENTS` (four literals) + `trackEvent(name: string): void` + `Window.plausible` type declaration | One source of truth for the goal names; safe no-op when the script is absent |
| `src/app/components/PulseQuiz.tsx` | `trackEvent(EVENTS.quizStarted)` in the intro start-button handler; `trackEvent(EVENTS.quizCompleted)` on the `step: "result"` transition in `selectOption` | The two quiz funnel points, covering all five entry points at once |
| `src/app/pages/Kontakt.tsx` | `trackEvent(EVENTS.contactSent)` in `ContactForm.handleSubmit`, before `window.location.href = mailto…` | Fires after native validation passes, before the page can be navigated away |
| `src/app/components/Footer.tsx` | `onClick={() => trackEvent(EVENTS.callLinkClicked)}` on the `footer.bookCall` link only | The site's only book-a-call element |
| `src/app/pages/Datenschutz.tsx` | One new `<p>` in section V of `DatenschutzDe` and one in section V of `DatenschutzEn` | Names Plausible; nothing else on the legal pages changes |
| `scripts/check-analytics.ts` *(new)* | Node/`tsx` script asserting the built output and the source invariants (see Tests to write) | Mechanical evidence for criteria 1–6, 12, 13 without a test runner |
| `package.json` | Add `"check:analytics": "tsx scripts/check-analytics.ts"` to `scripts` only | One command for the Tester; no dependency added |
| `tests/e2e/analytics.spec.ts` *(new)* | Playwright spec for the four events + the cookie assertion | Mechanical evidence for criteria 7–11 |
| `tests/e2e/playwright.config.ts` *(new)* | `testDir: '.'`, `baseURL: 'http://localhost:4173'`, chromium only; header comment with the `pnpm dlx` run command | Makes the ad-hoc run reproducible without installing Playwright |

Exact tag the build must emit (single line each, attribute order not asserted):

```html
<script defer data-domain="venturelabs.team" src="https://plausible.io/js/script.file-downloads.outbound-links.js"></script>
<script>window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}</script>
```

Exact event names (for the PR description — Christian creates these four Goals in the
Plausible UI, type "Custom event"): `Quiz Started`, `Quiz Completed`, `Contact Sent`,
`Call Link Clicked`.

## Acceptance criteria

1. The source `index.html` contains no occurrence of `plausible`, and a `pnpm dev` document
   contains no Plausible script tag.
2. After `pnpm build` with `CONTEXT` unset, `dist/index.html` contains exactly one script tag
   whose `src` is `https://plausible.io/js/script.file-downloads.outbound-links.js`, carrying
   the `defer` attribute and `data-domain="venturelabs.team"`.
3. After the same build, **every** file matching `dist/**/index.html` (all prerendered route
   shells for both locales, including `/de`, `/de/kontakt`, `/en/cases`, `/de/datenschutz`)
   contains exactly one such tag with the same three attributes.
4. Each of those files contains exactly one queue-stub script whose body assigns
   `window.plausible = window.plausible || …` and pushes `arguments` onto `window.plausible.q`.
5. A build run with `CONTEXT=deploy-preview` produces `dist/index.html` and all route shells
   with **zero** occurrences of `plausible.io`.
6. `src/app/analytics.ts` exports `EVENTS` whose values are exactly the four strings
   `Quiz Started`, `Quiz Completed`, `Contact Sent`, `Call Link Clicked`, and a `trackEvent`
   function; calling `trackEvent("X")` when `window.plausible` is undefined does not throw.
7. Opening the Pulse quiz and starting it (intro → question 1) calls `window.plausible` exactly
   once with `"Quiz Started"`; merely opening the modal without starting calls it zero times.
8. Answering all ten questions (reaching the result step) calls `window.plausible` exactly once
   with `"Quiz Completed"`.
9. Submitting the contact form on `/de/kontakt` with all required fields filled calls
   `window.plausible` exactly once with `"Contact Sent"`; submitting with a required field
   empty (native validation blocks) calls it zero times.
10. Clicking the footer link labelled "Gespräch buchen" (de) / "Book a call" (en) calls
    `window.plausible` exactly once with `"Call Link Clicked"`.
11. After performing interactions 7–10 in one browser context, `context.cookies()` is empty —
    the site sets no cookies.
12. `src/app/pages/Datenschutz.tsx` contains exactly two new sentences naming Plausible, one in
    the DE section V and one in the EN section V; the DE sentence uses no personal pronoun; no
    other text on `Datenschutz.tsx` or `Impressum.tsx` differs from `dev`.
13. `package.json` `dependencies` and `devDependencies` are byte-identical to `dev` (only the
    `scripts` block gains `check:analytics`), and the repo contains no occurrence of `gtag`,
    `googletagmanager`, `google-analytics`, or any consent/cookie-banner library.

## Test plan

The repo has no test runner and adding one is out of scope (explicit "no new dependencies"
constraint). Two mechanical harnesses replace it, neither adding a package to `package.json`:

- `pnpm check:analytics` (runs on `tsx`, already a devDependency) — asserts the built output
  and the source invariants. Exits non-zero with a per-criterion line on the first failure.
- `tests/e2e/analytics.spec.ts` — Playwright, invoked ad-hoc:
  `pnpm dlx --package @playwright/test playwright test --config tests/e2e/playwright.config.ts`
  against `pnpm exec vite preview --port 4173` serving the local production build. The spec
  installs a recorder via `page.addInitScript` that sets
  `window.plausible = (...args) => (window.__plausibleCalls ||= []).push(args)` **before** the
  injected stub runs (the stub's `window.plausible || …` then keeps the recorder), so the
  assertions test our call sites deterministically and offline — no request ever leaves the
  machine and no real submission is sent (the contact form is `mailto:`-only anyway).

The Tester runs, in order: `pnpm install --prefer-offline && pnpm build`, `pnpm check:analytics`,
the `CONTEXT=deploy-preview` build + a second `check:analytics` invocation in "expect absent"
mode, `vite preview` + the Playwright run, then the manual checks in Verification and evidence.

## Tests to write

| # | Kind | File | Under test | Fixtures / mocks |
|---|---|---|---|---|
| 1 | integration (build-output assert) | `scripts/check-analytics.ts` | source `index.html` — no `plausible` substring | none (reads repo file) |
| 2 | integration (build-output assert) | `scripts/check-analytics.ts` | `dist/index.html` — exactly one loader tag, `defer` + `data-domain="venturelabs.team"` + the variant `src` | requires a prior `pnpm build` with `CONTEXT` unset |
| 3 | integration (build-output assert) | `scripts/check-analytics.ts` | every `dist/**/index.html` (recursive walk) — same single-tag assertion; must find > 40 shells and explicitly report `/de`, `/de/kontakt`, `/de/datenschutz`, `/en/cases` | same build |
| 4 | integration (build-output assert) | `scripts/check-analytics.ts` | every `dist/**/index.html` — exactly one queue stub matching `/window\.plausible\s*=\s*window\.plausible\s*\|\|/` | same build |
| 5 | integration (build-output assert) | `scripts/check-analytics.ts` (flag `--expect-absent`) | `dist/**/index.html` — zero `plausible.io` occurrences after a `CONTEXT=deploy-preview` build | env var set by the Tester, not by the script |
| 6 | unit (static assert) | `scripts/check-analytics.ts` | `src/app/analytics.ts` source — contains the four exact quoted literals and exports `trackEvent`; `trackEvent` body guards on `window.plausible` | none. The "does not throw" half is covered by the dev-mode manual check in Verification |
| 7 | component (e2e) | `tests/e2e/analytics.spec.ts` | `PulseQuiz` start transition, reached via `/de` → hero button "Jetzt AI Pulse Check machen" → modal → "Meinen Pulse Score prüfen →" | `page.addInitScript` recorder on `window.plausible`; assert `__plausibleCalls` filtered to `"Quiz Started"` has length 1, and 0 before the start click |
| 8 | component (e2e) | `tests/e2e/analytics.spec.ts` | `PulseQuiz.selectOption` result transition — click the first option ten times | same recorder; assert one `"Quiz Completed"` |
| 9 | component (e2e) | `tests/e2e/analytics.spec.ts` | `ContactForm.handleSubmit` on `/de/kontakt` | same recorder; fill message/name/email + check the consent checkbox, click submit → one `"Contact Sent"`. Second case: submit with empty message → zero calls |
| 10 | component (e2e) | `tests/e2e/analytics.spec.ts` | `Footer` `footer.bookCall` link on `/de` (`getByRole('link', { name: 'Gespräch buchen' })`) | same recorder; one `"Call Link Clicked"` |
| 11 | component (e2e) | `tests/e2e/analytics.spec.ts` | browser context after the quiz + contact + footer interactions | `context.cookies()` → `[]` |
| 12 | unit (static assert) | `scripts/check-analytics.ts` | `src/app/pages/Datenschutz.tsx` — exactly two `Plausible` occurrences, one inside the DE section V block and one inside the EN section V block; the DE sentence matches none of `/\b(Sie|Ihre|Ihr|ihr|euch)\b/` | none |
| 13 | **manual** (no mechanical test) | — | `package.json` dependency blocks unchanged; no GA/GTM/consent library | Reviewer runs `git diff dev -- package.json` and confirms only `scripts` changed, plus a repo grep for `gtag\|googletagmanager\|google-analytics`. Not automated because asserting "identical to another branch" from inside the working tree is circular |

## Verification and evidence

The close-out must show, in this order:

1. `pnpm install --prefer-offline && pnpm build` — exit 0, ending with the existing
   `prerender: wrote <N> route-specific HTML shells` line. Paste the last 10 lines.
2. `pnpm check:analytics` — exit 0, one `PASS` line per criterion 1–4, 6, 12, including the
   shell count and the four explicitly named routes. Paste the full output.
3. `pnpm exec tsx -e "…"` not needed — instead paste the raw `<head>` grep for three routes as
   a human-readable read-back:
   `pnpm exec node -e "for (const f of ['dist/de/index.html','dist/de/kontakt/index.html','dist/en/cases/index.html']) console.log(f, require('fs').readFileSync(f,'utf8').match(/<script[^>]*plausible[^>]*>/g))"`
   — expected: each line shows exactly one matching tag.
4. Deploy-preview gate: PowerShell `$env:CONTEXT="deploy-preview"; pnpm build; pnpm exec tsx scripts/check-analytics.ts --expect-absent`
   (bash: `CONTEXT=deploy-preview pnpm build && pnpm exec tsx scripts/check-analytics.ts --expect-absent`)
   — exit 0, "PASS: 0 plausible.io occurrences in N shells". **Then rebuild without the env var**
   so the working `dist/` matches production before the Playwright run.
5. `pnpm exec vite preview --port 4173` in one shell, then
   `pnpm dlx --package @playwright/test playwright install chromium` and
   `pnpm dlx --package @playwright/test playwright test --config tests/e2e/playwright.config.ts`
   — 6 passing tests (criteria 7–11). Paste the summary line. *(The exact `pnpm dlx` bin
   resolution is unverified; if it fails, `npx --yes @playwright/test@latest test --config …`
   is the fallback — report which form was used.)*
6. Cookie evidence beyond the assertion: screenshot of DevTools → Application → Cookies on
   `http://localhost:4173/de` after completing the quiz — empty list.
7. Dev-mode check: `pnpm dev`, open `http://localhost:5173/de`, view source — no `plausible`
   in the document; complete the quiz and submit the contact form; browser console shows **no
   error** (proves `trackEvent` no-ops safely without the stub). Report both explicitly.
8. Datenschutz read-back: screenshot of `/de/datenschutz` and `/en/datenschutz` section V
   showing the new sentence, with the PR flagging the wording "lawyer to confirm".
9. Netlify: the branch-deploy / deploy-preview URL Netlify reports on the PR, with a
   view-source read-back showing **no** Plausible tag — the evidence that the CONTEXT gate
   works. (Per the assumption above this replaces the brief's "deploy preview with the script
   visible"; if Christian flips the gate at gate 1, swap this for the presence check.)
10. PR description lists the four goal names verbatim for Christian to create in the Plausible
    UI, and states that "Contact Sent" fires on the `mailto:` handoff and that the fourth event
    is `Call Link Clicked`, not `Call Booked`.

## Will not do

- No cookie/consent banner, no consent-management library, no GA, no GTM, no second analytics
  tool.
- No server-side or Netlify-Edge proxying of the Plausible script.
- No creation of the four Goals via the Plausible API — Christian creates them in the UI.
- No change to quiz scoring, quiz copy, contact-form fields or submission mechanism beyond the
  single `trackEvent` call in each handler.
- No change to `netlify.toml`, `.env*`, or any CI workflow (all denied paths); no Netlify
  environment variable is created or required by this task.
- No edits to `src/data/{de,en}/` (generated) or to `content/` markdown.
- No new entry in `package.json` `dependencies` / `devDependencies` (Playwright stays
  `pnpm dlx`-only).
- No changes in the `pulse-landing-page` repo.
- No `git checkout`, rebase, merge or push; no commit to `dev` or `main`; no service restarts.

## Stop conditions

- **The live Plausible docs name a different script filename or a different recommended
  variant** than `script.file-downloads.outbound-links.js` (e.g. a unified `script.js` with
  attribute-based config): stop, report the exact documented tag, and let the spec be amended —
  criteria 2 and 3 and the test assertions all quote the literal.
- The documented safe wrapper differs from
  `window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`:
  stop and report.
- `process.env.CONTEXT` turns out not to be readable in the Netlify build (or the gate cannot
  be verified from the deploy preview): stop before shipping the gate; do not substitute a
  different env var or a hardcoded hostname check.
- Any criterion would require adding a package to `package.json`: stop and ask.
- Christian's goal-name decision is needed (renaming `"Contact Sent"`, or `"Call Booked"` vs
  `"Call Link Clicked"`): stop rather than shipping a name that will not match the Goals he
  creates.
- A booking widget is found or added on `dev` before implementation: stop — the fourth event
  becomes `"Call Booked"` on `calendly.event_scheduled` and the spec needs amending.
- The Datenschutz wording is questioned on substance (not style): stop; it is a lawyer's call,
  not an Implementer's.

## Risks and open questions

- **Script variant filename is unverified** (no web access in this session). Does not block:
  the Implementer verifies against https://plausible.io/docs and stops if it differs.
- **`"Contact Sent"` measures a `mailto:` handoff, not a delivered mail.** The goal will
  over-count relative to inbox reality (a user can abandon the mail client). Does not block;
  the name follows the brief and the semantics are stated in the PR. Renaming is Christian's.
- **`"Call Link Clicked"` is a footer link to `/kontakt`**, not a booking. It measures footer
  CTA interest only. Does not block, but the metric is weak until a real booking widget exists
  — worth revisiting when one is added.
- **Deploy previews will not carry the script** under the chosen gate, contradicting one line
  of the brief's verification list. Does not block; flagged for gate 1. The underlying fact
  (whether Plausible drops events from non-matching, non-localhost hostnames) is unverified —
  the gate is the conservative choice for production data quality.
- **Section VII "Weitergabe an Dritte" is not updated** to mention Plausible, per "nothing else
  on legal pages changes". The policy is therefore internally incomplete. Does not block;
  flagged in the PR for the lawyer alongside the wording.
- **The Plausible sentence sits under the heading "V. Cookies"**, which reads oddly for a
  service that sets none. Does not block; renaming the heading would exceed "nothing else
  changes".
- **Register conflict:** the KB requires `ihr`/`euch` on the merged site, but `Datenschutz.tsx`
  uses `Sie` throughout. Resolved by writing the new sentence pronoun-free. Does not block.
- **Committed Playwright files without the dependency** will show unresolved-import squiggles
  in editors. Does not block (no `tsconfig.json`, no typecheck in the build). If Christian
  prefers, the two files can live in the scratchpad instead and only the run output is
  evidence — a gate-1 preference, not a correctness issue.
- **Base drift:** the brief warns PR #5 (SEO basics) may still be open. Verified present on
  this branch (`scripts/prerender.ts` and the `og:` tags in `index.html` both exist), so the
  head mechanism this spec reuses is real. If `dev` is rebased under the branch, re-run
  `pnpm build` before re-verifying.

## Out of scope

- Adding a test runner (Vitest/Jest) or a CI test job to the repo.
- Any Plausible feature beyond pageviews and the four custom events: no revenue tracking, no
  `pageview-props`, no `hash` routing variant, no custom properties on the events, no
  `tagged-events`.
- The Plausible dashboard itself: goal creation, funnel configuration, sharing links, the
  weekly digest that consumes `PLAUSIBLE_API_KEY` in agent-cluster.
- Refactoring `Kontakt.tsx` to a real server-side form (Netlify Forms), which would change what
  `"Contact Sent"` means — a separate product decision.
- Extending the same instrumentation to `pulse-landing-page` (pulse.venturelabs.team).
- Rewriting the Datenschutz page into `ihr`/`euch`, or restructuring its sections.
