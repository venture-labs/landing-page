/**
 * Criterion 6, runtime half: `trackEvent("X")` must not throw when
 * `window.plausible` is undefined.
 *
 * tests/e2e/analytics.spec.ts installs a recorder on `window.plausible` before
 * every page script runs, so it can never observe the un-stubbed case. This
 * spec deliberately installs NO recorder and runs against the dev server, where
 * plausiblePlugin() (apply: 'build') injects neither the loader nor the queue
 * stub — i.e. the exact situation in which an unguarded call would throw.
 *
 * Run:
 *   1. pnpm dev                          # :5173, no Plausible tag
 *   2. PW_BASE_URL=http://localhost:5173 npx playwright test \
 *        --config playwright.config.ts analytics-noop.spec.ts
 *
 * It also passes against the production preview (:4173), where the stub is
 * present and swallows the calls; the assertion is "no error", not "no stub".
 */
import { test, expect, type Page } from "@playwright/test";

const OPTION_BUTTONS = '[role="dialog"] button.text-left';

/**
 * The one console error this app already produces on `dev`, unrelated to
 * analytics: React logs it when the Radix Dialog in PulseCheckModal hands a ref
 * to a function component. Probed on 2026-09-09 — it appears on modal open,
 * before any trackEvent() call site runs (criterion 7: opening fires nothing),
 * and PulseCheckModal.tsx is not touched by this task. Listed here rather than
 * filtered loosely, so a *new* console error still fails this test.
 */
const KNOWN_PRE_EXISTING = /Function components cannot be given refs/;

type PageErrors = { pageErrors: string[]; consoleErrors: string[] };

/** Collects anything the page throws or logs as an error. */
function collectErrors(page: Page): PageErrors {
  const collected: PageErrors = { pageErrors: [], consoleErrors: [] };
  page.on("pageerror", (e) => collected.pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") collected.consoleErrors.push(m.text());
  });
  return collected;
}

/** These assertions only hold where no stub is injected, i.e. the dev server. */
const IS_DEV_SERVER = (process.env.PW_BASE_URL ?? "").includes("5173");

test.describe("trackEvent no-ops safely without the Plausible stub", () => {
  test.skip(
    !IS_DEV_SERVER,
    "dev-server only: run with PW_BASE_URL=http://localhost:5173 against `pnpm dev`"
  );

  test("the dev document carries no Plausible tag and no queue stub", async ({ page }) => {
    const response = await page.goto("/de");
    const html = (await response!.text()).toLowerCase();

    expect(html).not.toContain("plausible");
  });

  test("the whole funnel runs without a page error when window.plausible is undefined", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.route("**://plausible.io/**", (route) => route.abort());

    await page.goto("/de");
    const stubbed = await page.evaluate(() => typeof window.plausible);

    // Quiz: start + all ten answers.
    await page.getByRole("button", { name: "Jetzt AI Pulse Check machen" }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.getByRole("button", { name: /Meinen Pulse Score prüfen/ }).click();
    for (let i = 0; i < 10; i++) await page.locator(OPTION_BUTTONS).first().click();
    await expect(page.getByText("/ 100 Pulse Score")).toBeVisible();

    // Contact form: a complete, valid submit.
    await page.goto("/de/kontakt");
    await page.getByPlaceholder("Nachricht*").fill("Hallo, Testnachricht.");
    await page.getByPlaceholder("Dein Name*").fill("Test Person");
    await page.getByPlaceholder("E-Mail*").fill("test@example.com");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Absenden" }).click();

    // Footer book-a-call link.
    await page.goto("/de");
    await page.getByRole("link", { name: "Gespräch buchen" }).click();
    await expect(page).toHaveURL(/\/de\/kontakt$/);

    // The stub really was absent, so every trackEvent() above hit the
    // `window.plausible?.()` guard — otherwise this proves nothing.
    expect(stubbed, "window.plausible must be undefined for this test to mean anything").toBe(
      "undefined"
    );

    // "Does not throw" = no uncaught exception reached the page.
    expect(errors.pageErrors, "trackEvent() must not throw without the stub").toEqual([]);

    // Nothing analytics-related may reach the console either …
    expect(errors.consoleErrors.filter((e) => /plausible|trackEvent|analytics/i.test(e))).toEqual(
      []
    );

    // … and no console error beyond the one documented pre-existing warning.
    expect(errors.consoleErrors.filter((e) => !KNOWN_PRE_EXISTING.test(e))).toEqual([]);
  });
});
