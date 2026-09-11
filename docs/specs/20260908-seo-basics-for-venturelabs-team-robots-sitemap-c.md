---
task: 20260908-seo-basics-for-venturelabs-team-robots-sitemap-c
company: venturelabs
status: ready
size: M
branch: feature/seo-basics-for-venturelabs-team-robots-sitemap-c
base: dev
design: none
---

# Build-time SEO artefacts for venturelabs.team: robots.txt, sitemap.xml, canonical and hreflang in every prerendered shell

## Goal

Make venturelabs.team crawlable and indexable so Google Search Console reports real coverage
instead of errors. `pnpm build` must emit a real `/robots.txt` (text/plain, allow all, pointing
at the absolute sitemap URL) and a real `/sitemap.xml` (application/xml, generated from the same
route list `scripts/prerender.ts` already walks, with `xhtml:link` hreflang pairs and absolute
`https://venturelabs.team` URLs), and every prerendered route shell must carry a self-referencing
absolute `<link rel="canonical">` plus `de`/`en`/`x-default` hreflang alternates alongside the
unique title and description it already gets. Nothing the visitor sees changes: no copy, no
components, no styles, no route gains or loses existence.

## Assumptions

- `venturelabs.team` is the one canonical origin; `www.venturelabs.team` and
  `pulse.venturelabs.team` are not emitted in the sitemap and are not touched here (unverified —
  I could not curl from this session; the origin constant is a single `SITE_ORIGIN` in
  `scripts/prerender.ts` so a correction is one line).
- Netlify's redirect and header configuration for this site lives in `netlify.toml`, which is a
  **denied path** for every agent role on this task — no role reads or edits it. Everything I know
  about it comes from `knowledge-base/architecture/deployment.md`: it redirects `/` → `/de` (302)
  and has a non-forced SPA fallback `/* → /index.html` (200). Because the fallback is not forced,
  a real static `dist/robots.txt` and `dist/sitemap.xml` will win over it — that is why both files
  today return the empty SPA shell: they simply do not exist.
- Netlify serves `.txt` as `text/plain` and `.xml` as `application/xml` or `text/xml` (unverified —
  the Tester records the exact header it observes; either XML type passes).
- The trailing-slash form Netlify serves is **unverified**. The Implementer determines it with a
  live `curl -sI` before writing the generator (see Approach); the whole build reads it from one
  `TRAILING_SLASH` constant.
- The requester's `/en/ai-pulse -> /en/services` is read as "the English services page". There is
  no `/en/services` route in this repo today — `src/app/App.tsx` routes both locales under
  `/:lang/leistungen`. The redirect target is therefore taken from the prerendered route list at
  implementation time (`/en/services` if it exists by then, otherwise `/en/leistungen`).
- "The route no longer exists" for `/ai-pulse` means: no page component renders for it. On this
  branch as cut from `dev`, `src/app/App.tsx:141` maps `/:lang/ai-pulse` to `LegacyRedirect` and
  `scripts/prerender.ts` writes no shell for it — i.e. the page is already gone and the condition
  for adding the server-side 301 is met today.
- hreflang values are the bare language codes `de` and `en` (not `de-DE`/`en-US`), and `x-default`
  points at the German URL, `de` being the default locale (`DEFAULT_LOCALE` in `src/app/locale.tsx`).
- "Unique title and description per page" is scoped **per locale**. A German page and its English
  twin may share a title (today: `/de/blog` and `/en/blog` are both "Blog – VentureLabs";
  `/de/cases/creator-studios` and `/en/cases/creator-studios` both "Turning ideas into trends"),
  which hreflang is exactly there to disambiguate. Those cross-locale duplicates are listed in the
  report, not fixed here.
- Every prerendered route already has a non-empty, content-derived title and description (verified
  by reading `scripts/prerender.ts` against `content/` and `src/locales/{de,en}.json`), so
  requirement 3's "fallback to the site default" case does not arise today. The pages whose text
  does **not** come from content frontmatter — `/{lang}/cases`, `/{lang}/blog`, `/{lang}/kontakt`
  (from `src/locales/*.json`) and `/{lang}/impressum`, `/{lang}/datenschutz` (literals in
  `scripts/prerender.ts`) — are listed in the report as required.
- The current route count is 50 (25 per locale: home, leistungen, 4 services, cases, 7 case
  details, kontakt, blog, 6 posts, ueber-uns, impressum, datenschutz). The brief said ~46; nothing
  in the change depends on the number, the checks compare counts against each other.
- There is no test framework in this repo and adding one is out of scope, so the "test" artefact is
  a dependency-free `tsx` check script over the built `dist/` (see Tests to write).
- `package.json` is deliberately **not** touched: three branches (this one, PR #3, feature/restructure)
  are open on this repo and it is the highest-collision file. Every command is spelled out in full.
- Netlify PR deploy previews are assumed on but unconfirmed (`knowledge-base/architecture/deployment.md`
  says so explicitly); if the preview URL 401s or does not exist, the Tester reports that and the
  local `dist/` evidence stands. No Netlify setting is changed to make it work.

Correct me at gate 1, otherwise I proceed with these.

## Context found

- `scripts/prerender.ts` — the post-`vite build` step. `buildPagesForLocale(lang)` returns the full
  `PageMeta[]` (path, lang, title, description) for one locale from the generated content, and
  `main()` writes `dist/<lang>/<route>/index.html` per page by string-replacing `<title>`,
  `<meta name="description">` and the `og:*` tags in the built shell. **This is the single route
  list the sitemap must reuse** — it is already a plain function returning an array, so no
  refactoring is needed to call it twice.
- `index.html` — the shell. Has `<title>`, `<meta name="description">`, `og:type/site_name/locale/title/description`
  and `twitter:card`. It has **no** `<link rel="canonical">`, no hreflang, no `og:url` — matching
  the "no canonical URLs" note in `knowledge-base/architecture/deployment.md`.
- `vite.config.ts` — default `publicDir: "public"` and default `outDir: "dist"`, so anything in
  `public/` is copied verbatim to the publish root (`public/uploads/**` already proves this). A
  static `public/robots.txt` is therefore served at `/robots.txt`.
- `src/app/App.tsx` — every route is locale-prefixed; `/:lang/ai-pulse` (line 141) and six
  `/:lang/leistungen/<old-slug>` paths are `LegacyRedirect` elements, i.e. client-side only. The
  prerender writes no shell for any of them, which is why they currently fall into the SPA fallback.
- `src/app/locale.tsx` — `LOCALES = ["de","en"]`, `DEFAULT_LOCALE = "de"`; both locales use the
  same path segments and the same slugs.
- `content/` + `scripts/generate-content.ts` — the markdown/frontmatter source. Slugs are identical
  across `x.md` and `x.en.md` for all services (4), cases (7) and blog posts (6), so a de/en page
  pair is identifiable by the path with the locale segment stripped.
- `knowledge-base/architecture/deployment.md` — Netlify site `vl-home`, production from `main`,
  branch deploy `https://dev--vl-home.netlify.app`; records the `/` → `/de` 302 and the
  non-forced `/* → /index.html` 200 fallback in `netlify.toml`; lists "no canonical URLs" as a
  known gap; flags PR deploy previews as unconfirmed.

## Approach

Extend the existing prerender step rather than adding a second one. `scripts/prerender.ts` already
walks every route with its metadata; it gains three things and stays the only place that knows the
route list:

1. **Absolute-URL helpers and two constants.** `const SITE_ORIGIN = "https://venturelabs.team"` and
   `const TRAILING_SLASH: boolean`, plus `absoluteUrl(path)` which applies both. Every `<loc>`,
   every `href` and every canonical goes through that one function, so the trailing-slash decision
   is made once.
2. **A cross-locale page index.** `main()` builds `pagesByLocale = { de: [...], en: [...] }` once,
   then an index keyed by the path with the locale segment stripped (`/leistungen/ai-experience`)
   mapping to the locales in which that key exists. `alternatesFor(key)` returns the
   `{hreflang, href}` list — one entry per existing locale plus `x-default` → the `de` URL (or, if
   a page exists only in `en`, the `en` URL). Nothing assumes de/en symmetry.
3. **Head injection and sitemap writing.** `renderHtml` gains an `alternates` argument and inserts
   the canonical plus the alternate links immediately before the first `</head>` of the shell —
   `index.html` itself is **not** modified, so `dist/index.html` (the SPA fallback for unmatched
   URLs) keeps no canonical and cannot canonicalise arbitrary 200-shell URLs onto the home page.
   After the shell loop, `main()` writes `dist/sitemap.xml` from the same `pagesByLocale` data.

`lastmod` comes from a new optional `sourceFile` on `PageMeta` (`content/site/home.md`,
`content/services/<slug>.md`, `content/cases/<slug>.md`, `content/blog/<slug>.md`,
`content/about/about.md`, `content/site/leistungen.md`, and the `.en.md` twins for `en`). It is
resolved with `git log -1 --format=%cs -- <file>` via `child_process.execFileSync`, wrapped so that
a non-zero exit, an empty result or a missing git binary falls back to the build date — Netlify's
clone depth is unknown and the build must never fail on this. Pages with no backing content file
(`/kontakt`, `/impressum`, `/datenschutz`, and the `/cases`, `/blog` listings) use the build date.

`robots.txt` is a static `public/robots.txt` rather than generated output: it has no per-build
content, and Vite copies `public/` to the publish root already.

The `/ai-pulse` 301 goes into a new `public/_redirects`. **This is expected to be inert** (see
Risks R1): `netlify.toml` rules are applied before `_redirects` rules, so its `/* → /index.html`
fallback will most likely match `/de/ai-pulse` first and return the SPA shell. The rule is still
written, because it is one file the agents are allowed to touch, it costs three lines, it becomes
correct the moment the catch-all is narrowed, and the Tester's deploy-preview curl turns the
question into a recorded fact instead of a guess. The exact `netlify.toml` rules are written out in
"Verification and evidence" so Christian can paste them if he wants the redirect live now.

Rejected: (a) a separate `scripts/generate-sitemap.ts` that re-derives the routes — that is the
second hand-maintained list the requester explicitly ruled out; (b) extracting `buildPagesForLocale`
into a shared `scripts/routes.ts` — a pure refactor of the file PR #3 and `feature/restructure` are
most likely to touch, and the stop condition says not to refactor the route list; (c) a
`react-helmet`-style runtime head component — canonical tags must exist before JS runs, and it
would mean a new dependency and component edits; (d) adding `vitest` for the checks — a new
dependency for a repo that has no test suite, and the acceptance criteria are all assertions over
static build output.

**Trailing slash, decided empirically before coding.** The Implementer first runs, against the live
site, `curl -sI https://venturelabs.team/de/leistungen` and `curl -sI https://venturelabs.team/de/leistungen/`
(and the same pair for `/de`), and pastes the status lines into the report:
- no-slash → 301/308 → slash form: `TRAILING_SLASH = true`;
- slash → 301/308 → no-slash form: `TRAILING_SLASH = false`;
- both return 200 with no redirect: **stop and ask** — that is a duplicate-URL decision plus
  possibly a Netlify setting, and it is Christian's.

## Files to change

| File | Change | Why |
|---|---|---|
| `scripts/prerender.ts` | modify | `SITE_ORIGIN`/`TRAILING_SLASH`/`absoluteUrl`; `sourceFile` on `PageMeta`; cross-locale alternates index; canonical + hreflang injected before `</head>` in `renderHtml`; write `dist/sitemap.xml`; `lastmod` from git with build-date fallback |
| `public/robots.txt` | new | real `/robots.txt` (text/plain) with allow-all and the absolute `Sitemap:` line |
| `public/_redirects` | new, conditional (criterion 13) | server-side 301 `/de/ai-pulse` and `/en/ai-pulse` to the services page; omitted entirely if the route still renders a page |
| `scripts/check-seo.ts` | new, written by the Test Writer | dependency-free `tsx` assertions over `dist/` that mechanically prove criteria 1–13 |

Not touched: `index.html`, `package.json`, anything under `src/`, `content/`, `src/locales/`,
`src/data/`, and `netlify.toml` (denied path).

## Acceptance criteria

1. After `pnpm build`, `dist/robots.txt` exists, is non-empty, and contains a `User-agent: *` line, an `Allow: /` line, and the line `Sitemap: https://venturelabs.team/sitemap.xml`; it contains no `Disallow:` line with a non-empty path.
2. After `pnpm build`, `dist/sitemap.xml` exists, is non-empty and is well-formed XML whose root element is `<urlset>` declaring `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"` and `xmlns:xhtml="http://www.w3.org/1999/xhtml"`.
3. The multiset of `<loc>` values in `dist/sitemap.xml` equals exactly the set of absolute URLs of the prerendered routes — one per `dist/**/index.html` excluding `dist/index.html` — with no duplicates, no extra entries and no missing entries.
4. Every `<url>` element carries one `<xhtml:link rel="alternate" hreflang="X" href="…"/>` for each locale in which that path exists (including a self-referencing one) plus exactly one `hreflang="x-default"` whose href is the `de` URL of that path, or the only existing locale's URL when the page exists in one locale only.
5. Every `<loc>` and every alternate `href` in the sitemap and in the shells starts with `https://venturelabs.team/` and uses the trailing-slash form determined by the live check; the curl output that determined it is in the report.
6. Every `<url>` has exactly one `<lastmod>` matching `^\d{4}-\d{2}-\d{2}$`; for a route backed by a content markdown file it is that file's last git commit date when git history is available, and the build date otherwise; `pnpm build` still exits 0 when `git` is unavailable or returns nothing (verifiable by running the build with `PATH` stripped of git, or by asserting the fallback branch is reached for `/de/kontakt`, which has no content file).
7. Every prerendered `dist/<lang>/**/index.html` contains exactly one `<link rel="canonical" href="…">`, and its href is the absolute self URL of that route.
8. Every prerendered shell contains the same set of `hreflang`/`href` pairs as its `<url>` entry in the sitemap, as `<link rel="alternate" hreflang="…" href="…">` tags in `<head>` — same count, same values, including the self-reference and `x-default`.
9. Every prerendered shell has a non-empty `<title>` and a non-empty `<meta name="description" content="…">`; within one locale every title is unique and every description is unique. Cross-locale duplicates are permitted and are listed by the check script's output and in the report.
10. `dist/index.html` contains no `<link rel="canonical">` and no `<link rel="alternate" hreflang=…>`, and its `<title>` is still the shell default.
11. `pnpm build` exits 0 and its prerender log line reports a count equal to both the number of prerendered `dist/**/index.html` files (excluding `dist/index.html`) and the number of `<url>` elements in the sitemap; that count is unchanged from a build of the base branch (50 at the time of writing).
12. `git diff --name-only` against the branch point lists only the files in "Files to change" (plus this spec); no file under `src/`, `content/`, `src/locales/`, `src/data/`, and neither `index.html`, `package.json` nor `netlify.toml`, is modified.
13. Conditional `/ai-pulse` 301: if at implementation time `src/app/App.tsx` renders no page component for `/:lang/ai-pulse` (a `LegacyRedirect` or no route at all) **and** the prerender writes no `dist/de/ai-pulse/index.html`, then `dist/_redirects` exists after the build and contains exactly the two rules `/de/ai-pulse  <de services path>  301` and `/en/ai-pulse  <en services path>  301`, with each target path present in the prerendered route list. If instead `/:lang/ai-pulse` renders a real page, `public/_redirects` is not created and the report states that the redirect is deferred as a follow-up. Either way the report records the HTTP status the deploy preview actually returns for `/de/ai-pulse`.
14. No visible change: the built JS/CSS bundle filenames and sizes under `dist/assets/` are identical to a base-branch build, and the `<body>` of every prerendered shell is byte-identical to the base-branch build's `dist/index.html` body.

## Test plan

There is no test suite in this repository and adding a framework is out of scope. The mechanical
proof is `scripts/check-seo.ts` — a dependency-free TypeScript script run with the already-present
`tsx`, which reads the built `dist/` directory and asserts criteria 1–14. The Test Writer writes it
**before** the implementation; on the unchanged branch it must fail with "no dist/robots.txt",
"no dist/sitemap.xml" and "0 of 50 shells carry a canonical", which is the red state.

Commands (Windows shell, from the worktree root):

```
pnpm install --prefer-offline
pnpm build
pnpm exec tsx scripts/check-seo.ts
```

`check-seo.ts` exits 0 when every check passes, exits 1 and prints the failing check names with the
offending route otherwise, and exits 2 with "run pnpm build first" when `dist/` is absent. It prints
two informational lists that the report must carry: the cross-locale duplicate titles (criterion 9)
and the routes whose description does not come from content frontmatter.

The Tester additionally does what a script cannot: serve the build and check real HTTP headers, and
check the Netlify deploy preview (see below).

## Tests to write

| # | Kind | File | Under test | Fixtures / mocks |
|---|---|---|---|---|
| 1 | integration (build output) | `scripts/check-seo.ts` → `checkRobots(dist)` | `dist/robots.txt` produced from `public/robots.txt` | real `dist/` from `pnpm build`; none |
| 2 | integration | `scripts/check-seo.ts` → `checkSitemapWellFormed(dist)` | `dist/sitemap.xml` written by `main()` in `scripts/prerender.ts` | real `dist/`; a minimal hand-rolled XML tag scanner (no parser dependency) |
| 3 | integration | `scripts/check-seo.ts` → `checkSitemapCoversAllRoutes(dist)` | `<loc>` set vs. the `dist/**/index.html` walk | real `dist/`; none |
| 4 | integration | `scripts/check-seo.ts` → `checkSitemapAlternates(dist)` | `alternatesFor()` output as serialised into `<xhtml:link>` | real `dist/`; none |
| 5 | integration | `scripts/check-seo.ts` → `checkAbsoluteUrlForm(dist)` | `absoluteUrl()` in `scripts/prerender.ts`, via every `<loc>`/`href` | real `dist/`; the `TRAILING_SLASH` value read from `scripts/prerender.ts` is **not** re-derived — the script takes the expected form from its own constant so a silent flip fails the check |
| 6 | integration | `scripts/check-seo.ts` → `checkLastmod(dist)` | `lastmod` resolution (git date with build-date fallback) in `scripts/prerender.ts` | real `dist/`; format assertion only, plus one run of `pnpm build` with `git` made unavailable to prove the fallback (manual, recorded in the report) |
| 7 | integration | `scripts/check-seo.ts` → `checkCanonicalPerShell(dist)` | canonical injection in `renderHtml()` | real `dist/`; none |
| 8 | integration | `scripts/check-seo.ts` → `checkShellAlternatesMatchSitemap(dist)` | `renderHtml()` alternates vs. sitemap alternates | real `dist/`; none |
| 9 | integration | `scripts/check-seo.ts` → `checkTitlesAndDescriptions(dist)` | `buildPagesForLocale()` output as rendered into each shell | real `dist/`; none. Also prints the cross-locale duplicate list |
| 10 | integration | `scripts/check-seo.ts` → `checkFallbackShellClean(dist)` | `dist/index.html` (must stay untouched by `main()`) | real `dist/`; none |
| 11 | integration | `scripts/check-seo.ts` → `checkCounts(dist, expectedCount?)` | prerender count vs. shell count vs. `<url>` count | real `dist/`; the base-branch count passed as an optional argv, else only the three-way equality is asserted |
| 12 | manual | — | working tree | `git diff --name-only <branch-point>..HEAD`, read by the Reviewer |
| 13 | integration + manual | `scripts/check-seo.ts` → `checkAiPulseRedirect(dist)` for the file contents; manual for the HTTP status | `dist/_redirects`; `/:lang/ai-pulse` in `src/app/App.tsx` | real `dist/`; the script reads `src/app/App.tsx` to decide whether the rule is expected at all, so it passes in both branches of the condition. HTTP status is a deploy-preview curl |
| 14 | manual | — | `dist/assets/**` and shell `<body>` vs. a base-branch build | two `dist/` folders (base build kept aside before the change); a directory listing diff |

## Verification and evidence

The close-out must show, verbatim:

1. **Build.** The full tail of `pnpm build`, showing exit 0 and the `prerender: wrote N route-specific HTML shells` line (N = 50 today).
2. **Checks.** The full output of `pnpm exec tsx scripts/check-seo.ts`, including its two informational lists (cross-locale duplicate titles; routes whose description is not from content frontmatter — expected today: `/{de,en}/cases`, `/{de,en}/blog`, `/{de,en}/kontakt`, `/{de,en}/impressum`, `/{de,en}/datenschutz`).
3. **XML validity, independent of the check script.** `powershell -NoProfile -Command "[xml](Get-Content -Raw dist/sitemap.xml) | Out-Null; 'XML OK'"` → `XML OK`.
4. **Local HTTP headers.** `pnpm exec vite preview --port 4173` in one shell, then `curl.exe -sI http://localhost:4173/robots.txt` and `curl.exe -sI http://localhost:4173/sitemap.xml` — paste both header blocks, showing 200, a `content-type` of `text/plain` and `application/xml`/`text/xml`, and a non-zero `content-length`. Then `curl.exe -s http://localhost:4173/robots.txt` to show the body is not the SPA shell. If `vite preview` does not resolve directory indexes for `/de/leistungen`, say so and fall back to reading the `dist/` files directly — the deploy preview is the authoritative HTTP evidence.
5. **Trailing-slash decision.** The `curl -sI` status lines from the live site for `https://venturelabs.team/de`, `/de/`, `/de/leistungen`, `/de/leistungen/`, and the resulting `TRAILING_SLASH` value.
6. **Six sample pages.** For `/de`, `/de/leistungen`, one blog post and their `/en` twins: the `<head>` excerpt from the served HTML showing `<title>`, `<meta name="description">`, `<link rel="canonical">` and all three hreflang links, e.g. `curl.exe -s <preview>/de/leistungen | findstr /i "canonical hreflang <title> description"`.
7. **Deploy preview.** The Netlify deploy preview URL for the PR plus the same `curl.exe -sI` output for `/robots.txt`, `/sitemap.xml` and one route shell taken against that URL — this is what proves Netlify serves the artefacts rather than the SPA fallback. If previews are off or password-protected, say exactly that and hand it to Christian; do not change Netlify settings.
8. **`/de/ai-pulse` status.** `curl.exe -sI <preview>/de/ai-pulse` output. If it is not a 301, the report says so plainly and records the follow-up with the exact rules to add to `netlify.toml` **above** the `/*` fallback (a human edit — the file is a denied path for agents):

   ```
   [[redirects]]
     from = "/de/ai-pulse"
     to = "/de/leistungen"
     status = 301
     force = true

   [[redirects]]
     from = "/en/ai-pulse"
     to = "/en/leistungen"
     status = 301
     force = true
   ```
9. **No collateral change.** `git diff --name-only` against the branch point, plus a listing of `dist/assets/` from a base-branch build next to the new one (criterion 14).

## Will not do

- Edit, read or quote `netlify.toml` (denied path) — including for the `/ai-pulse` 301 and for the `/` → `/de` 302.
- Change any Netlify site setting, environment variable, domain, build hook, or preview/password configuration.
- Touch site copy, `content/**`, `src/locales/**`, any component, page, style, the quiz, or the contact form.
- Add, remove or rename a route, or change any route's client-side behaviour.
- Hand-edit `src/data/{de,en}/**` (generated) or commit `dist/`.
- Add a dependency, a test framework, or a new `package.json` script.
- Add analytics or Plausible instrumentation (separate task).
- Touch the `pulse-landing-page` repo, or `main`/`dev` in this one: no checkout, rebase onto, merge into, or push to either.
- Add `og:url`, `og:image`, JSON-LD, a 404 page, or a sitemap index (see Out of scope).

## Stop conditions

- Both `/de/leistungen` and `/de/leistungen/` return 200 with no redirect on the live site → the canonical form is a duplicate-URL decision for Christian. Stop and ask; do not pick one.
- After a rebase, `scripts/prerender.ts` no longer exposes the route list as a single callable list (e.g. it has been split or inlined by `feature/restructure`) so that reusing it would mean refactoring it → stop and ask; do not build a second route list.
- `/:lang/ai-pulse` renders a real page on the branch at implementation time → do not add `public/_redirects`; finish the rest and report the redirect as a follow-up.
- `index.html` or a rebased `scripts/prerender.ts` already contains a canonical or hreflang tag → someone else did this work; stop and ask before layering a second implementation on top.
- `pnpm build` fails, or the prerender count differs from the base-branch build → stop; that is either a content problem or a regression, not something to work around.
- A `dist/` route shell would need a canonical that is not its own URL (e.g. two routes resolving to the same file) → stop and ask.
- The branch cannot be rebased onto `dev` without conflicts in files outside "Files to change" → stop; merge order between this branch, PR #3 and `feature/restructure` is Christian's decision (see the board).
- The Netlify deploy preview is unavailable or returns 401 → report it; do not enable previews or change site settings to get the evidence.

## Risks and open questions

- **R1 — the `/ai-pulse` 301 probably cannot be delivered by an agent (blocks criterion 13's HTTP half, not the spec).** Netlify applies `netlify.toml` redirect rules before `_redirects` rules, and per `knowledge-base/architecture/deployment.md` the toml carries a `/* → /index.html` 200 fallback. A 301 in `public/_redirects` will therefore most likely never fire for `/de/ai-pulse`, and `netlify.toml` is a denied path that no role on this task may open. **Question for Christian at gate 1:** (a) he adds the two rules above to `netlify.toml` himself, (b) he lifts the denied-path rule for `netlify.toml` for this one task, or (c) the redirect stays a follow-up and this task only ships the `_redirects` rule plus the recorded evidence of what Netlify does with it. If he does not answer, I proceed with (c).
- **R2 — trailing-slash form unverified (does not block).** No session here can curl. Handled by the live check in Approach and the stop condition; the whole build reads one constant.
- **R3 — `lastmod` may degrade to the build date on Netlify (does not block).** Netlify's clone depth is unknown; `git log` per file may return nothing there, so a production sitemap could carry the build date for every URL. Acceptable — `lastmod` is a hint, and the fallback keeps the build green. Worth revisiting only if Search Console complains.
- **R4 — deploy previews unconfirmed (does not block).** `knowledge-base/architecture/deployment.md` explicitly lists PR previews and `non_production` password protection as unverified. If the preview is unavailable, evidence item 7 becomes "reported, not obtained".
- **R5 — merge order with PR #3 and `feature/restructure` (does not block, decision is Christian's).** The only file this task shares with them is `scripts/prerender.ts`, and only in the head-rendering and route-list areas; both other branches are likely to add or remove routes there. A conflict resolves by keeping their route list and re-applying this task's three additions. Which branch merges first is on the board, not here.
- **R6 — Netlify's `.xml` content type (does not block).** `application/xml` vs `text/xml` is unverified; both satisfy Google. The Tester records the observed value.
- **R7 — branch and deploy previews will serve the new `robots.txt`/`sitemap.xml` with production absolute URLs (does not block).** Harmless for indexation of the previews themselves (the URLs point at production), but the preview hosts' own crawlability is unchanged by this task and unverified. Follow-up, not scope.

## Out of scope

- `og:url`, `og:image`, `twitter:*` beyond what exists, and JSON-LD / structured data.
- Turning the `/` → `/de` 302 into a 301, and any other `netlify.toml` change.
- A real 404 page or `noindex` on the SPA fallback shell — today an unmatched URL returns the 200 shell; fixing that needs `netlify.toml`.
- Per-page `seo:` frontmatter fields (a `seoTitle`/`seoDescription` override in `content/**`). Today's titles and descriptions are derived from existing content fields and are all non-empty; introducing an override layer is a content-model change.
- De-duplicating the two cross-locale title collisions (`Blog`, `Turning ideas into trends`) — a copy change, and copy is explicitly untouched here.
- Sitemap index files, image/video sitemaps, `changefreq`, `priority`.
- Extracting the route list into a shared `scripts/routes.ts` module, and any other refactor of `scripts/prerender.ts` beyond the three additions.
- Analytics/Plausible, Search Console submission of the sitemap (Christian does that in the GSC UI once the URL is live on `main`), and anything on `pulse-landing-page`.
