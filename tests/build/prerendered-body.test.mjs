/**
 * 20261017-seo-the-full-page-content-is-in-the-html-before-
 *
 * Proves acceptance criteria 1-3 and 5 of the spec against the files
 * `pnpm build` actually writes under dist/ — not a mock, the real output of
 * scripts/prerender.ts's SSR injection:
 *
 *   1. every one of the 50 routes' raw HTML has a real <h1> and a full
 *      sentence (>80 chars) of its own body copy inside #root;
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
 * Run (after `pnpm build`, so dist/ exists):
 *   node --test tests/build/prerendered-body.test.mjs
 *
 * Dependency-free on purpose, like tests/build/supported-architectures.test.mjs
 * and tests/links/no-anchor-ctas.test.mjs: no new devDependency, no browser.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST = join(REPO_ROOT, "dist");

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";

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
