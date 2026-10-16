/**
 * 20261016-leistungen-funnel-capture-leads-that-do-not-book
 *
 * Criteria 10, 11, 12: no font request to fonts.googleapis.com/fonts.gstatic.com
 * on load, and no third-party request at all beyond plausible.io (and, only
 * after an explicit click, calendar.app.google) across the routes criterion
 * 12 names.
 *
 * Run instructions: see tests/e2e/playwright.config.ts (needs `pnpm build`
 * then `vite preview --port 4173`). plausible.io and calendar.app.google are
 * aborted at the context level so nothing actually leaves the machine; this
 * spec records every outgoing request's hostname before aborting it.
 */
import { test, expect, type Page } from "@playwright/test";

const OWN_HOST = "localhost";
const ALLOWED_THIRD_PARTY = new Set(["plausible.io"]);

/**
 * Criterion 12's twelve named routes. The spec's own list of what they are
 * ("/de, /en, /de/kontakt, /en/kontakt, one service detail page per locale,
 * one case detail page per locale, /de/datenschutz, /en/datenschutz")
 * enumerates ten distinct paths; see this spec's own note below criterion 12
 * for the "twelve" vs. "ten" mismatch — tested as the spec's explicit list.
 */
const ROUTES = [
  "/de",
  "/en",
  "/de/kontakt",
  "/en/kontakt",
  "/de/leistungen/ai-automation",
  "/en/leistungen/ai-automation",
  "/de/cases/brylliant",
  "/en/cases/brylliant",
  "/de/datenschutz",
  "/en/datenschutz",
];

/** Records every request's hostname, aborting plausible.io/calendar.app.google
 * so nothing actually leaves the machine (same convention as the other specs
 * in this directory), while still letting the test see they were attempted. */
async function recordHosts(page: Page): Promise<string[]> {
  const hosts: string[] = [];
  // Context-level so a booking link's new tab (target="_blank") is caught too.
  await page.context().route("**/*", async (route) => {
    const url = new URL(route.request().url());
    hosts.push(url.hostname);
    if (url.hostname === "plausible.io" || url.hostname === "calendar.app.google") {
      await route.abort();
    } else {
      await route.continue();
    }
  });
  return hosts;
}

test.describe("criteria 10-12: no third-party request beyond plausible.io on load", () => {
  for (const path of ROUTES) {
    test(`${path} makes no request to fonts.googleapis.com/fonts.gstatic.com or any other third party`, async ({
      page,
    }) => {
      const hosts = await recordHosts(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const thirdParty = hosts.filter((h) => h !== OWN_HOST && h !== "127.0.0.1");
      const fontHosts = thirdParty.filter(
        (h) => h === "fonts.googleapis.com" || h === "fonts.gstatic.com"
      );
      expect(fontHosts, `${path} requested a Google Fonts host: ${fontHosts.join(", ")}`).toEqual([]);

      const unexpected = thirdParty.filter((h) => !ALLOWED_THIRD_PARTY.has(h));
      expect(
        unexpected,
        `${path} requested a third-party host beyond plausible.io: ${unexpected.join(", ")}`
      ).toEqual([]);
    });
  }

  test("calendar.app.google is requested only after an explicit click on a booking link, never on load", async ({
    page,
  }) => {
    const hosts = await recordHosts(page);
    await page.goto("/de");
    await page.waitForLoadState("networkidle");

    expect(hosts).not.toContain("calendar.app.google");

    const popupPromise = page.waitForEvent("popup").catch(() => null);
    await page
      .locator('header a[href="https://calendar.app.google/SsabAjwxnbUjhoGo8"]')
      .first()
      .click();
    const popup = await popupPromise;
    if (popup) await popup.close();

    expect(hosts).toContain("calendar.app.google");
  });
});
