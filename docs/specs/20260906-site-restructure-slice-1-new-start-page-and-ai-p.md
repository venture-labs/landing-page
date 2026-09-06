---
task: 20260906-site-restructure-slice-1-new-start-page-and-ai-p
company: venturelabs
status: ready
size: L
branch: feature/site-restructure-slice-1-new-start-page-and-ai-p
base: dev
design: needed (start page, /:lang; AI Pulse page, /:lang/ai-pulse)
---

# Site merge, slice 1: new start page + AI Pulse page, Figtree sitewide

## Goal

Rebuild the venturelabs.team start page (`/:lang`) with the nine sections of the team's
concept, in order, copy verbatim where the concept gives it, and add a new AI Pulse page
(`/:lang/ai-pulse`) that carries the sprint description, the Pulse Score quiz (moved 1:1 from
`pulse-landing-page`, same Netlify Form `pulse-score-leads` and field names), the Pulse Check /
Build / Care tiers with real prices, and a contact/booking block — so a visitor can convert on
that page. Replace Sofia Pro (Adobe Typekit, licence ends 2026-09-30) with Figtree (Google
Fonts) everywhere on the site. This is the first slice of ADR 0001 (merge pulse.venturelabs.team
into venturelabs.team); the four area pages, the `pulse.venturelabs.team` redirect, blog, Über
uns and the quiz-to-Twenty pipeline are explicitly out of scope here.

## Context found

- `landing-page/src/app/App.tsx` — the home route is built inline in `App.tsx`'s `HomePage()`
  (not a `pages/` file), rendering `Navbar, Hero, ProfileSection, Services, ProjectsFeatured,
  ProjectsMore, Footer`. `ProfileSection.tsx` already returns `null` (dead) and `ClientLogos.tsx`
  is defined but imported nowhere — both are already-dead code, confirmed by grep across `src/`.
  `Services`, `ProjectsFeatured`, `ProjectsMore` are used only here, nowhere else in the repo
  (also confirmed by grep) — safe to remove once the home page no longer renders them.
- `landing-page/src/app/pages/LeistungenDetail.tsx:522` — renders `<PulseSection accent={accent}
  />` only when `detail.slug === "ai-consulting"`. `StrengthSection` is also rendered here
  (`:106`) and stays — it is *not* dead, unlike `ProfileSection`.
- `landing-page/src/app/components/PulseSection.tsx` — today's transposed copy of the Pulse
  steps + quiz, with a documented gap: only two of the pulse site's four score bands are
  reproduced ("Erste Anzeichen" and "Stabiler Puls"), no lead form. This is the single place the
  Pulse offer exists on the main site today; it is superseded by the new AI Pulse page.
- `landing-page/content/site/home.md` / `home.en.md` — today's home content is five flat
  frontmatter keys (`heroHeadline`, `heroSubline`, `heroCta`, `heroCtaSecondary`,
  `clientLogosLabel`), compiled by `scripts/generate-content.ts` into `src/data/{de,en}/site.ts`.
  This is the pattern every new section's content extends (flat markdown frontmatter → typed
  `src/data/{de,en}/*.ts`, consumed through a `use*Data()` hook in `src/data/content.ts`).
- `landing-page/scripts/generate-content.ts` — one function per content shape
  (`site.ts`, `about.ts`, `services.ts`, `cases.ts`, `blog.ts`, `leistungen.ts`); adding a
  section means adding one more `writeFileSync` block, exactly like the existing ones.
- `landing-page/scripts/prerender.ts` — writes one `dist/<lang>/<route>/index.html` shell per
  route from a `PageMeta[]` built in `buildPagesForLocale()`; a new route needs one more
  `pages.push({...})` call, its content already imported the same way as `site`/`leistungen`/etc.
- `landing-page/src/data/content.ts` — the locale-lookup hook pattern (`useSiteData`,
  `useServicesData`, …) every new section's data will follow (`useHomeData`, `useAiPulseData`).
- `landing-page/src/styles/fonts.css` / `theme.css` / `index.html` — Sofia Pro loads via
  `<link href="https://use.typekit.net/nyh3brn.css">` in `index.html`; `theme.css`'s `body` rule
  reads `font-family: var(--font-sofia-pro)` (defined in `fonts.css`). Everywhere else — 13
  files, 148 occurrences (`grep -c sofia-pro`) — the font is hardcoded as a Tailwind arbitrary
  value `font-['sofia-pro',sans-serif]`, which does **not** read the CSS variable; renaming the
  variable alone would not change these. `fonts.css` also imports Plus Jakarta Sans and Inter,
  unused (`theme.css` never references them) — flagged in `design/CHECKLIST.md` as dead weight.
- `pulse-landing-page/index.html` (reference only, this repo is not touched) — the source of
  truth for what moves 1:1: the hidden static form (`:286-293`, `name="pulse-score-leads"
  data-netlify="true" netlify-honeypot="bot-field"`, inputs `email, company, score, band,
  weakest, lang, bot-field`); the real quiz submits via `fetch("/", {method:"POST", headers:
  {"Content-Type":"application/x-www-form-urlencoded"}, body: encodeFormData({"form-name":
  "pulse-score-leads", email, company, score, band, weakest, lang})})` (`:973-977`); the full
  four-band scale in `BANDS` (`:795-820`): 80–100 "Starker Puls"/"Strong Pulse", 60–79 "Stabiler
  Puls"/"Steady Pulse", 40–59 "Unregelmäßiger Puls"/"Irregular Pulse", 0–39 "Erste
  Anzeichen"/"Early Signs" — `PulseSection.tsx` only ports the two extremes today; and the
  booking link `BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8"` (`:556`).
- `knowledge-base/domains/website-content.md` ("Target structure") and
  `knowledge-base/references/site-merge/*.md` — the verbatim start-page and AI-Pulse-page copy,
  the mapping from today's pages, and what is explicitly deferred ("Later improvements": the
  `/leistungen` overview, blog, Über uns, public proof-cases-as-narrative, the Twenty push).
  `konkrete-seiteninhalte.md` is the primary copy source used for the acceptance criteria below.
- `knowledge-base/architecture/decisions/0001-merge-pulse-into-main-site.md` — Accepted; register
  `ihr`/`euch` (never `Sie`), nine start-page sections with the hero video kept, the AI Pulse page
  carries quiz + offer + contact, font replaced by an open Google font (this task's brief fixes
  the pick to **Figtree**, closing the "pick pending" note in `design/PROJECT.md`/`CHECKLIST.md`).
- `design/PROJECT.md`, `STATUS.md`, `CHECKLIST.md` — nothing drafted yet (`draft/` and
  `handoff/` empty); both screens are listed as "to design, in this order: start page, then AI
  Pulse page" — this task cannot be implemented until a Designer round is approved for each.

## Approach

Extend the existing content-driven pattern (markdown frontmatter → `generate-content.ts` →
typed `src/data/{de,en}/*.ts` → a `use*Data()` hook → a component) for two new content shapes,
`home` (all nine start-page sections) and `aiPulse` (the new page), instead of inventing a new
content mechanism. Keep the flat-frontmatter style the repo already uses (lists for repeated
items — areas, process steps, use cases, pricing tiers — the same way `services[].tags` or
`cases[].stats` are already lists in frontmatter).

Rebuild `HomePage()` in `App.tsx` as nine section components under a new
`src/app/components/home/` folder, one per section, each reading `useHomeData()`. `Hero.tsx`
itself is kept and only re-pointed at new copy (it already reads `useSiteData()` for
headline/subline/CTAs and keeps the video background unconditionally) — no component rewrite
needed there beyond copy. `ProfileSection.tsx` (already dead), `Services.tsx`,
`ProjectsFeatured.tsx`, `ProjectsMore.tsx` and `ClientLogos.tsx` are deleted: confirmed (by grep)
to be used only by the home page being replaced, and superseded by the new section components.
`StrengthSection.tsx` is **not** touched — it is still rendered on `/leistungen/:slug`, out of
scope.

The Proof section reuses today's *featured cases* data (`content/cases/*`, the `featured` flag,
already compiled into `cases.ts`) with the same card treatment `ProjectsFeatured.tsx` used
(title, subtitle, stats, image, link to `/cases/:slug`) rather than authoring the full
"Ausgangsproblem → Lösung → Ergebnis → Kompetenzen" narrative per case: that upgrade is listed
under "Later improvements" in `website-content.md` (needs client consent per case, first
candidate Loop Studio) and is explicitly not attempted here — this is the smallest change that
still satisfies "Built for real business." without inventing case content nobody has approved
for public narrative use.

The four area cards' CTAs ("Explore AI Automation" etc.) have no destination yet — the area
pages (`/:lang/ai-automation`, …) are explicitly out of scope this slice. Decision: point every
card at the existing `/:lang/kontakt` page (a real, working destination) rather than a dead link
or an unstyled placeholder. This is a routing choice, not a content decision, so it does not
block the spec; flagged under "Risks" for Christian to confirm or override at gate 1.

For the AI Pulse page, port `PulseSection.tsx`'s already-working pricing-card and quiz-stepper
UI into two new components (`src/app/components/pulse/PulsePricing.tsx`,
`src/app/components/pulse/PulseQuizForm.tsx`) rather than writing new UI from scratch — the
Figma-Make-exported look already matches the brand tokens. The port fixes the one known
correctness gap (two bands → all four bands, verified against `pulse-landing-page/index.html`)
and adds the missing piece: the actual Netlify Form submission, copied verbatim from the pulse
site's `fetch()` call (same form name, same field names, same honeypot). Netlify Forms detects
forms by scanning built HTML at deploy time; because this is a client-rendered SPA, the same
"hidden static form" trick the pulse site itself doesn't need (it's static HTML already) is
required here — a plain HTML file with the exact hidden form markup goes into `public/`, so Vite
copies it byte-for-byte into `dist/` where Netlify's scanner finds it, while the real UI
component submits via `fetch()` exactly like today's pulse site. No `netlify.toml` change is
needed (Netlify Forms detection is a build-time HTML scan, not a config option), and that file is
out of bounds for this task in any case.

`PulseSection.tsx` and its embed on `/:lang/leistungen/ai-consulting` are retired: the mapping in
`website-content.md` ("Start · AI Pulse teaser" row) is explicit that "the embed goes; the teaser
links to the AI Pulse page", and keeping two quiz implementations (one correct, one with a known
two-band gap) is exactly the duplication ADR 0001 exists to remove. The `ai-consulting` detail
page keeps its own content (unchanged) but the `<PulseSection accent={accent} />` line is
replaced with a short text link to `/:lang/ai-pulse`.

**Font.** Sofia Pro is referenced two ways: the CSS variable `--font-sofia-pro` (one place,
`theme.css`'s `body` rule) and the literal string `'sofia-pro'` inside 148 Tailwind arbitrary
font classes across 13 files (which do not read the variable). Both must change for "replace
the font across the site" to be true. Rejected alternative: leave the 148 occurrences and only
swap the variable — this would leave `body`'s inherited font correct but every component that
explicitly sets `font-['sofia-pro',...]` (which is most visible text on the site) still asking
the browser for a font family that no longer loads, silently falling back to the browser
default, not Figtree. The mechanical fix (rename `--font-sofia-pro` → `--font-figtree`, replace
the literal string in all 148 occurrences, swap the Typekit `<link>` for a Figtree Google Fonts
`<link>`/`@import`, drop the two already-unused Google Fonts imports) is a same-day, low-risk,
easily diffed change and is proposed as its own first slice (see "Proposed split" below) so the
2026-09-30 Adobe-licence deadline is not coupled to the design rounds for the two new screens.

Rejected: building the four sub-pages, the pulse.venturelabs.team redirect, or the Twenty push in
this task — all explicitly out of scope per the brief and per ADR 0001's "first slice: start page
+ AI Pulse page" framing.

## Files to change

| File | Change | Why |
|---|---|---|
| `index.html` | remove the Typekit `<link>` | Sofia Pro / Typekit licence ends 2026-09-30 |
| `src/styles/fonts.css` | replace the Sofia Pro stack comment/variable with a Figtree Google Fonts `@import` and `--font-figtree`; drop the unused Plus Jakarta Sans / Inter imports | font swap + CHECKLIST housekeeping item, same file |
| `src/styles/theme.css` | `body { font-family: var(--font-sofia-pro); }` → `var(--font-figtree)` | keep the body default in sync with the new variable name |
| `src/app/components/ui/CtaButton.tsx` | `font-['sofia-pro',sans-serif]` → `font-['Figtree',sans-serif]` | sitewide font swap (1 occurrence) |
| `src/app/components/PulseSection.tsx` | deleted (see below) — not edited for the font | superseded, not kept |
| `src/app/components/LegalPage.tsx` | same literal replacement (2 occurrences) | sitewide font swap |
| `src/app/pages/Kontakt.tsx` | same literal replacement (21 occurrences) | sitewide font swap |
| `src/app/pages/Leistungen.tsx` | same literal replacement (9 occurrences) | sitewide font swap |
| `src/app/pages/LeistungenDetail.tsx` | same literal replacement (23 occurrences) **and** remove the `<PulseSection accent={accent} />` embed, replaced by a text link to `/:lang/ai-pulse` | sitewide font swap; retire the duplicated Pulse embed |
| `src/app/pages/CasesOverview.tsx` | same literal replacement (2 occurrences) | sitewide font swap |
| `src/app/pages/CaseDetail.tsx` | same literal replacement (17 occurrences) | sitewide font swap |
| `src/app/pages/Blog.tsx` | same literal replacement (12 occurrences) | sitewide font swap |
| `src/app/pages/BlogDetail.tsx` | same literal replacement (17 occurrences) | sitewide font swap |
| `src/app/pages/UeberUns.tsx` | same literal replacement (15 occurrences) | sitewide font swap |
| `content/site/home.md`, `content/site/home.en.md` | rewrite frontmatter: hero copy + eight more sections' fields (see Acceptance criteria) | source of the new start page's editorial content |
| `content/site/ai-pulse.md`, `content/site/ai-pulse.en.md` | new files: hero, problem, process, output, sprint contents, pricing tiers, contact/booking copy | source of the new AI Pulse page's editorial content |
| `scripts/generate-content.ts` | add a `home.ts` and an `aiPulse.ts` output block, each following the existing `writeFileSync` pattern | compiles the two new content files, same mechanism as every existing one |
| `src/data/content.ts` | add `useHomeData()` and `useAiPulseData()` hooks | same locale-lookup pattern as `useSiteData`/`useServicesData` |
| `src/app/App.tsx` | rewrite `HomePage()` to render the nine new sections in order; remove `ProfileSection`/`Services`/`ProjectsFeatured`/`ProjectsMore` imports; add the `/:lang/ai-pulse` route | the start page's new structure; the new page's route |
| `src/app/components/home/ProblemSection.tsx` | new | section 2 |
| `src/app/components/home/PulseTeaser.tsx` | new | section 3 |
| `src/app/components/home/AreasSection.tsx` | new (four cards) | section 4 |
| `src/app/components/home/HowWeWork.tsx` | new | section 5 |
| `src/app/components/home/UseCases.tsx` | new | section 6 |
| `src/app/components/home/Proof.tsx` | new (reuses `useCasesData().featuredCases`) | section 7 |
| `src/app/components/home/WhyVentureLabs.tsx` | new | section 8 |
| `src/app/components/home/FinalCta.tsx` | new | section 9 |
| `src/app/components/ProfileSection.tsx` | deleted | dead (returns `null`), superseded |
| `src/app/components/Services.tsx` | deleted | used only by the old home page |
| `src/app/components/ProjectsFeatured.tsx` | deleted | used only by the old home page (its card pattern is inlined into `Proof.tsx`) |
| `src/app/components/ProjectsMore.tsx` | deleted | used only by the old home page |
| `src/app/components/ClientLogos.tsx` | deleted | already unused anywhere in `src/` |
| `src/app/components/PulseSection.tsx` | deleted | superseded by `pages/AiPulse.tsx` + `components/pulse/*` |
| `src/app/pages/AiPulse.tsx` | new | the AI Pulse page |
| `src/app/components/pulse/PulseQuizForm.tsx` | new (ported from `PulseSection.tsx`'s `PulseQuiz`, four bands, Netlify submit) | the quiz + lead form |
| `src/app/components/pulse/pulseQuizContent.ts` | new (ported from `PulseSection.tsx`'s `COPY`, four bands) | quiz copy is a fixed product feature, not editorial content — kept as code per the existing convention documented in `PulseSection.tsx` |
| `src/app/components/pulse/PulsePricing.tsx` | new (ported from `PulseSection.tsx`'s `PulsePricing`, reads `AiPulseData.tiers`) | the offer block |
| `public/netlify-forms.html` | new: the hidden static `pulse-score-leads` form, same markup as `pulse-landing-page/index.html:286-293` | so Netlify's deploy-time HTML scan registers the form (Vite copies `public/` verbatim into `dist/`) |
| `src/data/navigation.ts` | add `{ label: "AI Pulse" / "AI Pulse", href: "/ai-pulse" }` to `navigationDE`/`navigationEN` | makes the new entry point reachable from the main nav |
| `scripts/prerender.ts` | add a `pages.push({...})` entry for `/:lang/ai-pulse`; the `/:lang` entry keeps working off the same `siteData` fields | one shell per route, same mechanism as every existing route |

## Acceptance criteria

**Font (Figtree, sitewide)**
1. `index.html` contains no `<link>` to `use.typekit.net`.
2. `src/styles/fonts.css` loads Figtree from Google Fonts and no longer imports Plus Jakarta
   Sans or Inter.
3. `grep -rIn "sofia-pro" src/ index.html` (case-insensitive) returns zero matches.
4. `src/styles/theme.css`'s `body` rule resolves a font-family via a CSS variable that points at
   Figtree (no unstyled-text regression).
5. A local preview of `/de`, `/de/kontakt`, `/de/leistungen/ai-consulting`, `/de/blog`,
   `/de/cases`, `/de/ai-pulse` renders body text in Figtree, not the browser default and not
   Sofia Pro (manual visual check — no automated font assertion exists in this repo).

**Start page (`/:lang`)**
6. `pnpm build` produces `src/data/de/home.ts` and `src/data/en/home.ts` exporting `homeData`
   populated from `content/site/home.md` / `home.en.md`.
7. `/:lang` renders exactly nine sections in this order: Hero, Problem/Context, AI Pulse teaser,
   four area cards, How we work, Use Cases/Outcomes, Proof, Why Venture Labs, Final CTA.
8. The Hero section keeps the existing background video (`src/assets/venturelabs reel.mp4`)
   behind the headline/subline/CTAs.
9. Hero: headline "We build what's next.", subline "AI-powered products, automated businesses
   and new ventures.", primary CTA "Start with AI Pulse" → `/:lang/ai-pulse`, secondary CTA
   "Talk to us" → `/:lang/kontakt` — identical text in `de` and `en` (brand-layer English claim).
10. Problem/Context: headline "AI is changing how businesses work." with the German body text
    from `references/site-merge/neustrukturierung-startseite.md`.
11. AI Pulse teaser: headline "Find your AI opportunities.", the given German body text, CTA
    "Explore AI Pulse" → `/:lang/ai-pulse`.
12. Four area cards, in order AI Automation / AI Products / AI Experience / Venture Building,
    each with the exact headline + teaser text + CTA label from `konkrete-seiteninhalte.md`
    section 1 ("Bestehende Prozesse neu denken." / "Neue digitale Produkte bauen." / "Die
    Zusammenarbeit von Mensch und AI gestalten." / "Aus Chancen neue Geschäfte machen."); every
    CTA links to `/:lang/kontakt` (the area pages don't exist yet this slice — see Approach).
13. How we work: headline "Discover. Prioritize. Build. Scale." with the four numbered steps'
    text verbatim (Discover/Prioritize/Build/Scale).
14. Use Cases/Outcomes: lists the five outcomes from the Startseite doc (weniger manuelle
    Arbeit, schnellere Angebote, bessere Wissenssuche, automatisierte Dokumentenprozesse, neue
    digitale Produkte).
15. Proof: headline "Built for real business."; shows the site's existing featured cases (same
    data `ProjectsFeatured` used: title, subtitle, stats, image), each linking to its
    `/:lang/cases/:slug` page.
16. Why Venture Labs: headline "One team. From business to AI." with the given body text.
17. Final CTA: headline "Have an AI opportunity in mind?", text "Let's turn it into something
    that works.", primary CTA "Start with AI Pulse" → `/:lang/ai-pulse`, secondary CTA "Talk to
    Venture Labs" → `/:lang/kontakt`.
18. `src/app/components/{ProfileSection,Services,ProjectsFeatured,ProjectsMore,ClientLogos}.tsx`
    are deleted and `grep -rn "ProfileSection\|from \"./components/Services\"\|ProjectsFeatured\|ProjectsMore\|ClientLogos" src/`
    returns no import of them.
19. `StrengthSection.tsx` and its use in `LeistungenDetail.tsx` are unchanged.
20. Neither `content/site/home.md` nor `content/site/home.en.md` contains the literal word
    "Sie" (register check).

**AI Pulse page (`/:lang/ai-pulse`)**
21. The route exists for both `de` and `en`, and is reachable from `src/data/navigation.ts`, the
    start-page Hero/teaser/Final-CTA buttons.
22. Hero: "Find the AI opportunities that matter." with subline "In einem fokussierten Sprint
    identifizieren wir die AI-Hebel mit dem größten wirtschaftlichen Potenzial in eurem
    Unternehmen."
23. Problem text "Ihr wisst, dass AI wichtig ist. Aber nicht, welche Prozesse sich wirklich
    lohnen?" is present.
24. Process section shows, in order: Understand → Discover → Prioritize → Pilot.
25. Output section lists: AI Opportunity Map, priorisierte Use Cases, Business Case, technische
    Machbarkeit, Pilot-Roadmap.
26. A "what the sprint contains" list is present with the six items from `website-content.md`
    (Prozess- und Systemanalyse, AI Opportunity Discovery, Priorisierung von 3–5 Use Cases,
    Business-Case- und Potenzialbewertung, technische Machbarkeitsprüfung, konkreter Plan für
    einen produktiven Pilot).
27. The Pulse Score quiz renders the same 10 questions across five areas (data, process, team,
    tools, governance) as `PulseSection.tsx`/`pulse-landing-page`, computes a 0–100 score and one
    of **four** bands: 0–39 "Erste Anzeichen"/"Early Signs", 40–59 "Unregelmäßiger Puls"/
    "Irregular Pulse", 60–79 "Stabiler Puls"/"Steady Pulse", 80–100 "Starker Puls"/"Strong
    Pulse" (verified against `pulse-landing-page/index.html`'s `BANDS`).
28. On completing the quiz (email step submitted), the page issues `fetch("/", {method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: <urlencoded
    form-name=pulse-score-leads, email, company, score, band, weakest, lang>})` — same mechanism,
    same field names as `pulse-landing-page`.
29. `public/netlify-forms.html` (or equivalent) contains a hidden `<form name="pulse-score-leads"
    data-netlify="true" netlify-honeypot="bot-field">` with inputs `email, company, score, band,
    weakest, lang, bot-field`, and after `pnpm build` the same file exists verbatim under `dist/`.
30. The offer block shows Pulse Check (from €2,900, marked as the only tier bookable directly),
    Pulse Build (from €15,000), Pulse Care (from €2,500/month), with the same
    description/input/output/bullets/footnote copy as today's `PulseSection.tsx` `COPY.steps`.
31. A contact/booking block shows a mailto to `contact@venturelabs.team` and the booking link
    `https://calendar.app.google/SsabAjwxnbUjhoGo8`.
32. Quiz, offer and contact/booking all render on `/:lang/ai-pulse` in one page (a visitor
    converts without navigating away).
33. `/:lang/leistungen/ai-consulting` no longer renders `<PulseSection>`; it shows a short text
    link to `/:lang/ai-pulse` instead. `src/app/components/PulseSection.tsx` is deleted and
    nothing imports it.
34. `scripts/prerender.ts` writes `dist/de/ai-pulse/index.html` and `dist/en/ai-pulse/index.html`
    with their own `<title>`/`<meta description>` (not copies of the home page's).
35. Neither `content/site/ai-pulse.md` nor `content/site/ai-pulse.en.md` contains the literal
    word "Sie".

**Cross-cutting**
36. `pnpm build` completes with no errors and prerenders every route for both locales, including
    the new `/de/ai-pulse` and `/en/ai-pulse`.
37. `/leistungen`, `/leistungen/:slug` (content unchanged beyond the `PulseSection` removal),
    `/blog`, `/blog/:slug`, `/ueber-uns`, `/impressum`, `/datenschutz`, `/cases`, `/cases/:slug`
    all still resolve exactly as before — no route removed, no redirect added.
38. `git -C <pulse-landing-page worktree> status` (or equivalent) shows no changes — this task
    does not touch `pulse-landing-page`.
39. None of the denied paths are touched: `.env*`, `netlify.toml`, `.github/workflows/`,
    `src/data/(de|en)/*` hand-edited directly (only regenerated by `generate-content.ts`),
    `secrets/`, `.claude/`.

## Scope addendum (Christian, 2026-09-06): scroll reveal on the start page

Requested after Designer round 1, via the board (front desk folded it in before the Implementer
starts). Reference: loopstudio.app's landing page (loop-studio landing-page PR #5 preview). Checked
source: it is a normal scrolling page, no viewport-snap slides — each section fades and slides up
(~24 px) into place when it scrolls into view (Webflow IX2), plus one card slider for its four-step
block. This repo is React/Vite/Tailwind, so the equivalent is:

- **A1.** One reusable scroll-reveal wrapper (`src/components/ScrollReveal.tsx`: a small
  IntersectionObserver hook, or Framer Motion `whileInView` if a dependency is preferred —
  Implementer's call, keep it to one approach), applied to every start-page section below the hero:
  opacity 0 → 1 and translateY 24 px → 0, ~500 ms ease-out, once (no replay on scroll-up),
  threshold ~15 %, optional per-child stagger inside card grids (areas, proof cases).
- **A2.** `prefers-reduced-motion: reduce` disables the transform and shows content immediately;
  content is never hidden without JS (SSR/prerender output must render visible; the reveal only
  adds the transition once mounted) — the prerendered HTML shells must not ship opacity 0.
- **A3.** No new carousel unless the approved design round contains a step-slider block; if it
  does, use the `embla-carousel-react` already in package.json.
- **A4.** Scope: the start page only in this slice. The AI Pulse page and the other pages get the
  same wrapper later (board item 20260906-scroll-reveal-rollout), so the wrapper must not be tied
  to home-page data.
- Not a port of the Webflow/GSAP files; no scroll-jacking, no full-page slides.

## Test plan

This repo has no automated test runner (no `vitest`/`jest`/`@testing-library` in
`package.json`), and the Test Writer step is skipped for `venturelabs` by config. Verification
is mechanical where possible (`grep`, reading `dist/`) and manual otherwise, exactly as the
company's `test` command for this repo specifies:

1. `pnpm install --prefer-offline && pnpm build` — must succeed; confirms `generate-content.ts`
   compiles the two new content files without error, `vite build` compiles every new/changed
   component, and `prerender.ts` writes a shell for every route including the two `ai-pulse`
   ones (criteria 6, 20, 29, 34, 35, 36).
2. `grep` checks for criteria 3, 18, 20, 33 (second half), 35, 39 — deterministic, run from the
   repo root.
3. `pnpm dev` (http://localhost:5173) — manually walk `/de`, `/en`, `/de/ai-pulse`,
   `/en/ai-pulse`, `/de/leistungen/ai-consulting`, and one each of `/blog/:slug`, `/cases/:slug`,
   `/impressum`, `/datenschutz` to confirm layout, the nine-section order, the AI Pulse page's
   three blocks, the quiz's four-band result, and Figtree rendering everywhere (criteria 4, 5,
   7–17, 19, 21–28, 30–32, 37).
4. Link check: every CTA added or changed in this task resolves (no 404, no dead `#anchor`) —
   Hero, teaser, four area cards, Final CTA, nav, footer are unaffected except the new nav entry.
5. Once deployed to the `feature/site-restructure-slice-1-new-start-page-and-ai-p` branch
   preview: submit the quiz once end to end and confirm the submission appears under the
   `vl-home` Netlify site's Forms tab as `pulse-score-leads` with all seven fields populated
   (criteria 27–29) — this step needs a live Netlify deploy, not just `pnpm build`, and is the
   Tester's job, not the Implementer's local check.

## Tests to write

No test framework exists in this repo (Test Writer skipped by config); every row below is a
manual/mechanical check the Tester runs per the Test Plan, not a file that gets executed by a
runner.

| # | Kind | File | Under test | Fixtures / mocks |
|---|---|---|---|---|
| 1 | manual | `grep -rIn "sofia-pro" src/ index.html` (repo root) | font swap completeness | none |
| 2 | manual | local preview, `/de` and `/en` | start page: nine sections, order, copy (criteria 7–17) | none |
| 3 | manual | local preview, `/de/ai-pulse` and `/en/ai-pulse` | AI Pulse page: hero/problem/process/output/sprint list (criteria 21–26) | none |
| 4 | manual | local preview, `/de/ai-pulse` quiz flow | Pulse Score quiz: 10 questions, 4 bands, score calc (criterion 27) | none — answer all 10 questions manually, both extremes and one mid-range path |
| 5 | manual | browser devtools Network tab, `/de/ai-pulse` quiz completion | Netlify Form POST body (form-name, all 7 fields) (criterion 28) | none |
| 6 | manual | `pnpm build` then inspect `dist/netlify-forms.html` (or wherever it lands) | static hidden form present verbatim in the build output (criterion 29) | none |
| 7 | manual | local preview, `/de/leistungen/ai-consulting` | `PulseSection` embed removed, link to `/ai-pulse` present (criterion 33) | none |
| 8 | manual | `pnpm build` console output + `dist/` listing | prerender shells for every route incl. the two new ones (criteria 34, 36) | none |
| 9 | manual | click-through of every route in `App.tsx`'s `<Routes>` | no route regression (criterion 37) | none |
| 10 | manual | `grep -c "Sie\b" content/site/home.md content/site/home.en.md content/site/ai-pulse.md content/site/ai-pulse.en.md` | register check (criteria 20, 35) | none |
| 11 | manual | Netlify UI, Forms tab, on the branch preview after one real submission | end-to-end lead capture parity with `pulse-score-leads` on `vl-pulse` | a disposable test submission; note it for cleanup, don't leave test leads in production data |

## Risks and open questions

- **Design not yet drafted.** `design/draft/` and `design/handoff/` are empty for both screens
  (`design/STATUS.md`, 2026-09-06). This spec fixes the copy, section order, and testable
  behavior; the Designer's handoff (`design/handoff/home/`, `design/handoff/ai-pulse/`) fixes
  layout, spacing, imagery and the quiz/offer/contact block order on the AI Pulse page (an open
  design call per `design/CHECKLIST.md`). The Implementer builds from spec + handoff together;
  this task cannot start until Christian approves a round for each screen. Not blocking this
  spec, but blocking implementation.
- **Four area-card CTAs point at `/:lang/kontakt`.** An Architect routing decision (Approach),
  not a product decision — the four area pages are out of scope this slice and a dead link or
  unstyled card felt worse than a working, if generic, destination. Flag for Christian to
  confirm or override at gate 1; changing it later is a one-line edit per card, not a spec
  change.
- **Base branch.** The knowledge base (`CLAUDE.md`, `design/PROJECT.md`) says every task's base
  is `dev`; this task's brief explicitly sets `base: feature/restructure`. Followed the task
  brief (more specific/current for this task) — flagging the discrepancy in case
  `feature/restructure` was meant to itself be rebased onto `dev` before this branch was cut.
  Non-blocking. **Resolved at gate 1 (Christian, 2026-09-06): base is `dev`; the work runs on
  this feature branch and the PR targets `dev`.** Both branches pointed at the same commit
  (87bd24df) when this branch was cut, so nothing needs rebasing. Christian approved the whole
  slice with only that change; implement in the recommended order of the split (font swap, start
  page, AI Pulse page) as separate commits on this branch.
- **Quiz band copy is read, not owned, from `pulse-landing-page/index.html`** (reference only,
  per the task's own instruction not to touch that repo). If the live pulse site's quiz copy has
  changed since this read (2026-09-06), the ported bands will be stale — worth a byte-for-byte
  diff against the live site right before merging, not just this repo snapshot.
- **No automated tests.** Every criterion above is verified by `pnpm build`, a local preview,
  and `grep` — a known, pre-existing constraint of this repo (no test runner in `package.json`),
  not something this task introduces or can fix within its own scope.
- **148-occurrence mechanical font edit.** Purely a literal-string replace
  (`'sofia-pro'` → `'Figtree'`) across 13 files; recommend the Implementer do this as one
  isolated commit (or even its own slice, see below) so the Reviewer can diff it separately from
  the content/structure changes.
- **Proof section keeps today's featured-case teaser format** (stats/title/subtitle), not the
  concept's fuller problem→solution→result narrative — that upgrade is explicitly a "Later
  improvement" in `website-content.md` pending per-case client consent. Confirmed not a scope
  gap, just deferred.

## Out of scope

- The four area pages (AI Automation, AI Products, AI Experience, Venture Building) and their
  routes.
- The `pulse.venturelabs.team` → `/:lang/ai-pulse` redirect and any `pulse-landing-page` /
  `vl-pulse` change (that repo is not touched by this task at all).
- Blog and Über uns (kicked out by the redesign; content stays in `content/` untouched).
- The Pulse Score quiz's push into Twenty CRM (separate n8n work; today's Netlify e-mail
  notification is the only hook, and this task keeps it that way).
- Proof cases as full problem → solution → result narratives (needs client consent per case).
- Hero video compression, `og:image`/canonical URLs, the Datenschutz lawyer review, the
  "Wir suchen Verstärkung" hiring-badge check, and the "Venture Labs" vs "VentureLabs" spelling
  cleanup — all pre-existing `design/CHECKLIST.md` items unrelated to this task's goal.
- Absorbing the pulse site's founder "trust" section into Why Venture Labs (mentioned as a
  possibility in `website-content.md`'s mapping table, not required by the brief).
- Any change to `Kontakt.tsx`'s topic-picker chips to reflect the new four areas (it still uses
  the old four Leistungen slugs) — the area cards route to `/kontakt` generically, per Approach.

## Proposed split (Christian decides)

Sized L as requested — the goal is not shrunk. Three independently mergeable slices, in the
order recommended:

1. **Font swap (Figtree, sitewide)** — `index.html`, `fonts.css`, `theme.css`, and the 148
   literal-string replacements across 13 files. No design dependency, no content model change,
   fully mechanical and easy to diff/revert. Do this first: it's decoupled from the two design
   rounds and de-risks the 2026-09-30 Adobe-licence deadline independently of them.
2. **Start page rebuild** — the `home` content model (`content/site/home*.md`,
   `generate-content.ts`, `content.ts`, `home.ts`), the nine new section components, `App.tsx`'s
   `HomePage()` rewrite, and the five component deletions. Needs the Designer's approved round
   for `design/handoff/home/` first.
3. **AI Pulse page** — the `aiPulse` content model, `pages/AiPulse.tsx`, the ported
   `pulse/PulseQuizForm.tsx` / `PulsePricing.tsx` / `pulseQuizContent.ts`, the hidden static
   form, the `PulseSection.tsx` retirement (including its embed on `/leistungen/ai-consulting`),
   `prerender.ts`'s new route, and the nav entry. Needs the Designer's approved round for
   `design/handoff/ai-pulse/` first; otherwise independent of slice 2 (only the start page's
   teaser/Hero/Final-CTA buttons link into it, which is a one-line `href` each way).

Recommended first: slice 1, in parallel with kicking off the Designer on slice 2's screen — it
ships value (licence compliance) immediately and needs no sign-off beyond "does it look right".
