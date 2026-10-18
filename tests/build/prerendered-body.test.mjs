/**
 * 20261017-seo-the-full-page-content-is-in-the-html-before-
 *
 * Proves acceptance criteria 1-3 and 5 of the spec against the files
 * `pnpm build` actually writes under dist/ — not a mock, the real output of
 * scripts/prerender.ts's SSR injection:
 *
 *   1. every one of the 50 routes' raw HTML has a real <h1> and a full
 *      sentence (>80 chars) of its own body copy inside #root, AND —
 *      Reviewer finding 2 (fix round) — that copy is the ROUTE'S OWN
 *      heading and a route-specific excerpt, not merely "some long enough
 *      text" (a renderer bug that always rendered, say, the homepage for
 *      every path would still pass a pure length/h1-presence check);
 *   2. the booking CTA (BOOKING_URL) and at least 5 real <a href> links
 *      appear in that same raw HTML, for every route;
 *   3. the i18next-driven chrome strings match the route's own locale
 *      segment (German "Gespräch buchen" on every /de/ route, English
 *      "Book a call" on every /en/ route, never the other way round);
 *   5. the written #root is never the empty SPA shell (<div id="root"></div>)
 *      — the behavioural half of the build guard this task adds to
 *      prerender.ts itself (the guard's exit-code/break-restore half is
 *      exercised manually by the Tester, see the task report, since flipping
 *      prerender.ts's own render call from a test would just be re-running
 *      the build, not testing it).
 *
 * The per-route heading/excerpt fixtures (ROUTE_FIXTURES below) are read
 * straight from content/*.md (gray-matter frontmatter) and src/locales/{de,en}.json
 * — never from src/data/{de,en}/* (generated, and a denied path for this task)
 * and never from scripts/prerender.ts's own PageMeta-building code — so a bug
 * in the renderer (wrong route rendered, wrong locale, stale content) cannot
 * also be "proven correct" by a fixture that shares its source with the bug.
 *
 * Run (after `pnpm build`, so dist/ exists):
 *   pnpm exec tsx --test tests/build/prerendered-body.test.mjs
 * (needs the tsx loader because this file now reads content/*.md through
 * gray-matter, same dependency scripts/generate-content.ts already uses —
 * no new devDependency.)
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST = join(REPO_ROOT, "dist");
const CONTENT_DIR = join(REPO_ROOT, "content");

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";

const LOCALE_UI = {
  de: JSON.parse(readFileSync(join(REPO_ROOT, "src/locales/de.json"), "utf-8")),
  en: JSON.parse(readFileSync(join(REPO_ROOT, "src/locales/en.json"), "utf-8")),
};

/** Frontmatter of content/<relNoExt>.md (de) or content/<relNoExt>.en.md (en). */
function frontmatter(lang, relNoExt) {
  const file = join(CONTENT_DIR, `${relNoExt}${lang === "de" ? "" : ".en"}.md`);
  return matter(readFileSync(file, "utf-8")).data;
}

/** A dotted-path lookup into src/locales/<lang>.json, e.g. "cases.heroTitle". */
function chrome(lang, path) {
  return path.split(".").reduce((v, k) => v[k], LOCALE_UI[lang]);
}

/**
 * React's react-dom/server escaping of text/attribute content (confirmed
 * empirically against this build's own dist/ output: "&" -> "&amp;", "'" ->
 * "&#x27;"), applied to an expected fixture string before it is compared
 * against raw rendered HTML, which has already been through that escaping.
 */
function reactEscape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const services = ["ai-automation", "ai-experience", "ai-products", "venture-building"];
const cases = [
  "brylliant",
  "creator-studios",
  "machinemaster",
  "moerschen",
  "neuer-look",
  "scanservice",
  "tap2link",
];
const blogs = [
  "design-systems-hebel",
  "ki-agenten-use-cases",
  "no-code-vs-custom",
  "pitch-zu-produkt",
  "user-research-schnell",
  "warum-mvps-floppen",
];

/**
 * One entry per route (lang-agnostic "suffix" — the path with its /de or /en
 * segment stripped, "" for the home route). `heading`/`excerpt` are
 * functions of lang so each locale's own fixture is read independently.
 */
const ROUTE_FIXTURES = [
  {
    suffix: "",
    heading: (lang) => frontmatter(lang, "site/home").heroHeadline,
    excerpt: (lang) => frontmatter(lang, "site/home").heroSubline,
  },
  {
    suffix: "/leistungen",
    heading: (lang) => {
      const fm = frontmatter(lang, "site/leistungen");
      return `${fm.heroTitlePrefix} ${fm.heroTitleHighlight}`;
    },
    excerpt: (lang) => frontmatter(lang, "site/leistungen").heroSubheading,
  },
  ...services.map((slug) => ({
    suffix: `/leistungen/${slug}`,
    heading: (lang) => frontmatter(lang, `services/${slug}`).heroHeadline,
    excerpt: (lang) => frontmatter(lang, `services/${slug}`).heroSubline,
  })),
  {
    suffix: "/cases",
    heading: (lang) => chrome(lang, "cases.heroTitle"),
    excerpt: (lang) => chrome(lang, "cases.heroSubheading"),
  },
  ...cases.map((slug) => ({
    suffix: `/cases/${slug}`,
    heading: (lang) => frontmatter(lang, `cases/${slug}`).heroHeadline,
    excerpt: (lang) => frontmatter(lang, `cases/${slug}`).heroSubline,
  })),
  {
    suffix: "/kontakt",
    heading: (lang) => chrome(lang, "kontakt.heroTitle"),
    excerpt: (lang) => chrome(lang, "kontakt.heroSubtitle"),
  },
  {
    suffix: "/blog",
    heading: (lang) => chrome(lang, "blog.heroTitle"),
    excerpt: (lang) => chrome(lang, "blog.heroSubtitle"),
  },
  ...blogs.map((slug) => ({
    suffix: `/blog/${slug}`,
    heading: (lang) => frontmatter(lang, `blog/${slug}`).title,
    excerpt: (lang) => frontmatter(lang, `blog/${slug}`).excerpt,
  })),
  {
    suffix: "/ueber-uns",
    heading: (lang) => frontmatter(lang, "about/about").heroTitle,
    excerpt: (lang) => frontmatter(lang, "about/about").heroSubheading,
  },
  {
    // Impressum.tsx hardcodes both the page title and this line — no
    // content/*.md or locales.json source exists for a legal page.
    suffix: "/impressum",
    heading: (lang) => (lang === "de" ? "Impressum" : "Imprint"),
    excerpt: (lang) =>
      lang === "de"
        ? "Vertreten durch den Geschäftsführer: Christian Wenzel"
        : "Represented by the managing director: Christian Wenzel",
  },
  {
    // Datenschutz.tsx hardcodes both the page title and this line, same reason.
    suffix: "/datenschutz",
    heading: (lang) => (lang === "de" ? "Datenschutzerklärung" : "Privacy Policy"),
    excerpt: (lang) =>
      lang === "de"
        ? "Diese Erklärung gilt für die Website venturelabs.team."
        : "This policy covers the website venturelabs.team.",
  },
];

if (ROUTE_FIXTURES.length !== 25) {
  throw new Error(`ROUTE_FIXTURES has ${ROUTE_FIXTURES.length} entries, expected exactly 25`);
}

const FIXTURE_BY_SUFFIX = new Map(ROUTE_FIXTURES.map((f) => [f.suffix, f]));

/** The lang-agnostic suffix for a dist file's repo-relative path, e.g.
 * "/de/leistungen/ai-automation/index.html" -> "/leistungen/ai-automation",
 * "/de/index.html" -> "". */
function suffixOf(lang, rel) {
  return rel.replace(new RegExp(`^/${lang}`), "").replace(/\/index\.html$/, "");
}

/**
 * Walk dist/de and dist/en for every index.html that sits under a real
 * route directory (skips the top-level dist/index.html SPA fallback, which
 * is deliberately NOT part of the 50-route list and deliberately keeps an
 * empty #root per the spec's Assumptions).
 */
function findRouteFiles(lang) {
  const localeDir = join(DIST, lang);
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "index.html") files.push(full);
    }
  }
  if (existsSync(localeDir)) walk(localeDir);
  return files;
}

function rootContentOf(html) {
  const match = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/);
  return match ? match[1] : "";
}

/** Tags stripped with NO inserted whitespace, so text split across sibling
 * inline elements (e.g. the homepage h1's highlighted-word <span>) still
 * reconstructs into one contiguous string to search in. */
function textNoTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

test("dist/ exists (run `pnpm build` first)", () => {
  assert.ok(existsSync(DIST), `${DIST} is missing — run pnpm build before this test`);
});

const deFiles = existsSync(DIST) ? findRouteFiles("de") : [];
const enFiles = existsSync(DIST) ? findRouteFiles("en") : [];

test("exactly 25 de routes and 25 en routes were written (50 total)", () => {
  assert.equal(deFiles.length, 25, `expected 25 de routes, found ${deFiles.length}`);
  assert.equal(enFiles.length, 25, `expected 25 en routes, found ${enFiles.length}`);
});

for (const [lang, files] of [["de", deFiles], ["en", enFiles]]) {
  for (const file of files) {
    const rel = file.slice(DIST.length);
    const suffix = suffixOf(lang, rel);

    test(`${rel}: #root has a real <h1> and a full sentence of body copy (criterion 1)`, () => {
      const html = readFileSync(file, "utf-8");
      const rootHtml = rootContentOf(html);
      assert.notEqual(rootHtml.trim(), "", `#root is empty in ${rel} — body not prerendered`);
      assert.match(rootHtml, /<h1[\s>]/, `no <h1> inside #root in ${rel}`);
      // Strip tags to count real prose length, not markup length.
      const text = rootHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      assert.ok(
        text.length > 80,
        `#root text in ${rel} is only ${text.length} chars — not a full sentence of main copy`
      );
    });

    test(`${rel}: #root's heading and main-copy excerpt are THIS ROUTE's own content, not another route's (criterion 1, route-specific)`, () => {
      const fixture = FIXTURE_BY_SUFFIX.get(suffix);
      assert.ok(fixture, `no ROUTE_FIXTURES entry for suffix "${suffix}" (from ${rel}) — add one`);

      const html = readFileSync(file, "utf-8");
      const rootHtml = rootContentOf(html);
      const flatText = textNoTags(rootHtml);

      const expectedHeading = reactEscape(fixture.heading(lang));
      const expectedExcerpt = reactEscape(fixture.excerpt(lang));

      assert.ok(
        flatText.includes(expectedHeading),
        `${rel}: expected this route's own heading "${fixture.heading(lang)}" inside #root, not found (route suffix "${suffix}")`
      );
      assert.ok(
        flatText.includes(expectedExcerpt),
        `${rel}: expected this route's own excerpt "${fixture.excerpt(lang)}" inside #root, not found (route suffix "${suffix}")`
      );
    });

    test(`${rel}: booking CTA + at least 5 real <a href> links are in the raw HTML (criterion 2)`, () => {
      const html = readFileSync(file, "utf-8");
      const rootHtml = rootContentOf(html);
      assert.ok(rootHtml.includes(BOOKING_URL), `booking CTA (${BOOKING_URL}) missing in ${rel}`);
      const hrefCount = (rootHtml.match(/<a[^>]+href="/g) ?? []).length;
      assert.ok(hrefCount >= 5, `only ${hrefCount} <a href> links in ${rel}, expected >= 5`);
    });

    test(`${rel}: chrome strings match the route's own locale (criterion 3)`, () => {
      const html = readFileSync(file, "utf-8");
      const rootHtml = rootContentOf(html);
      if (lang === "de") {
        assert.ok(rootHtml.includes("Gespräch buchen"), `${rel} (de) is missing "Gespräch buchen"`);
        assert.ok(!rootHtml.includes("Book a call"), `${rel} (de) leaked English chrome "Book a call"`);
      } else {
        assert.ok(rootHtml.includes("Book a call"), `${rel} (en) is missing "Book a call"`);
        assert.ok(!rootHtml.includes("Gespräch buchen"), `${rel} (en) leaked German chrome "Gespräch buchen"`);
      }
    });
  }
}

test("the SPA fallback dist/index.html keeps an empty #root (unchanged fallback behaviour)", () => {
  const fallback = join(DIST, "index.html");
  assert.ok(existsSync(fallback), "dist/index.html (SPA fallback) is missing");
  const html = readFileSync(fallback, "utf-8");
  assert.match(html, /<div id="root"><\/div>/, "SPA fallback #root is not the expected empty shell");
});
