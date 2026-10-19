/**
 * 20261017-seo-the-full-page-content-is-in-the-html-before-
 *
 * Criterion 4: opening a prerendered route with JavaScript enabled must not
 * log a React hydration-mismatch warning ("Hydration failed", "did not match
 * server rendering", "Text content does not match") or an uncaught React
 * error, in either locale — the risk this task's `hydrateRoot` switch in
 * src/main.tsx introduces.
 *
 * Criterion 6: `/` -> `/de`, an unknown locale segment -> its `/de`
 * equivalent, and an unknown path under a known locale renders the branch's
 * own NotFound page (never another route's prerendered body) — unchanged
 * from `dev`, but at risk from this task's #root injection (criterion 6's
 * own wording: "never another route's prerendered body").
 *
 * Run instructions: see tests/e2e/playwright.config.ts (needs a built +
 * `vite preview`d dist/, since these criteria are about the PRERENDERED
 * output, not the dev server).
 *
 *   pnpm build
 *   pnpm exec vite preview --port 4173
 *   pnpm dlx --package @playwright/test playwright test --config tests/e2e/playwright.config.ts tests/e2e/prerender-hydration-and-routing.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";

const HYDRATION_PATTERNS = [
  /hydration failed/i,
  /did not match server rendering/i,
  /text content does not match/i,
  /hydrating/i,
];

// A representative set of routes, both locales, across every route "shape"
// (home, listing, detail, static legal page) rather than all 50 — the
// per-route raw-HTML content itself (criteria 1-3) is already proven
// exhaustively by tests/build/prerendered-body.test.mjs; this file is about
// the browser's *hydration* behaviour, which only needs enough variety to
// catch a systematic mismatch.
const ROUTES = [
  "/de", "/en",
  "/de/leistungen", "/en/leistungen",
  "/de/leistungen/development", "/en/leistungen/development",
  "/de/cases", "/en/cases",
  "/de/cases/moerschen", "/en/cases/moerschen",
  "/de/kontakt", "/en/kontakt",
  "/de/blog", "/en/blog",
  "/de/ueber-uns", "/en/ueber-uns",
  "/de/impressum", "/en/impressum",
  "/de/datenschutz", "/en/datenschutz",
];

async function collectConsole(page: Page) {
  const warnings: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (HYDRATION_PATTERNS.some((p) => p.test(msg.text()))) warnings.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  return { warnings, pageErrors };
}

for (const route of ROUTES) {
  test(`${route}: hydrates with no mismatch warning and no uncaught error`, async ({ page }) => {
    const { warnings, pageErrors } = await collectConsole(page);
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    expect(warnings, `hydration warning(s) on ${route}`).toEqual([]);
    expect(pageErrors, `uncaught error(s) on ${route}`).toEqual([]);
  });
}

test("/ redirects to /de", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  expect(page.url()).toMatch(/\/de\/?$/);
});

test("an unknown locale segment (/fr/leistungen) redirects to its /de equivalent", async ({ page }) => {
  await page.goto("/fr/leistungen", { waitUntil: "networkidle" });
  expect(page.url()).toMatch(/\/de\/leistungen\/?$/);
});

test("an unknown path under /de renders the German NotFound page, not another route's body", async ({ page }) => {
  await page.goto("/de/this-does-not-exist", { waitUntil: "networkidle" });
  const h1 = await page.locator("h1").first().textContent();
  expect(h1 ?? "").toMatch(/nicht gefunden/i);
});

test("an unknown path under /en renders the English NotFound page, not another route's body", async ({ page }) => {
  await page.goto("/en/this-does-not-exist", { waitUntil: "networkidle" });
  const h1 = await page.locator("h1").first().textContent();
  expect(h1 ?? "").toMatch(/not found/i);
});
