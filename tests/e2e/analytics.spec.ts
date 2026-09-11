/**
 * The four Plausible funnel events, plus the cookieless assertion.
 * Run instructions: see tests/e2e/playwright.config.ts.
 *
 * The recorder replaces window.plausible before any page script runs. The
 * injected queue stub is `window.plausible = window.plausible || …`, so it
 * keeps the recorder instead of overwriting it. The real plausible.io script
 * would overwrite window.plausible when it loads (it ends with
 * `window.plausible = g`), so the request is aborted: the assertions then test
 * our own call sites only, and nothing leaves the machine.
 */
import { test, expect, type Page } from "@playwright/test";

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
  }
}

/** Option buttons inside the quiz dialog (excludes the Radix close button). */
const OPTION_BUTTONS = '[role="dialog"] button.text-left';

async function withRecorder(page: Page): Promise<void> {
  await page.route("**://plausible.io/**", (route) => route.abort());
  await page.addInitScript(() => {
    window.__plausibleCalls = [];
    window.plausible = (...args: unknown[]) => {
      window.__plausibleCalls!.push(args);
    };
  });
}

async function callsFor(page: Page, eventName: string): Promise<number> {
  return page.evaluate(
    (name) => (window.__plausibleCalls ?? []).filter((args) => args[0] === name).length,
    eventName
  );
}

async function openQuiz(page: Page): Promise<void> {
  await page.goto("/de");
  // The home page has two buttons with this label (Hero and AIPulseTeaser);
  // both open the same PulseCheckModal, so the first one is enough.
  await page.getByRole("button", { name: "Jetzt AI Pulse Check machen" }).first().click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
}

async function fillContactForm(page: Page, { message }: { message: string }): Promise<void> {
  await page.goto("/de/kontakt");
  if (message) await page.getByPlaceholder("Nachricht*").fill(message);
  await page.getByPlaceholder("Dein Name*").fill("Test Person");
  await page.getByPlaceholder("E-Mail*").fill("test@example.com");
  await page.locator('input[type="checkbox"]').check();
}

test.describe("Plausible funnel events", () => {
  test.beforeEach(async ({ page }) => {
    await withRecorder(page);
  });

  test('opening the quiz modal fires nothing; starting it fires "Quiz Started" once', async ({ page }) => {
    await openQuiz(page);
    expect(await callsFor(page, "Quiz Started")).toBe(0);

    await page.getByRole("button", { name: /Meinen Pulse Score prüfen/ }).click();
    await expect(page.locator(OPTION_BUTTONS).first()).toBeVisible();

    expect(await callsFor(page, "Quiz Started")).toBe(1);
  });

  test('answering all ten questions fires "Quiz Completed" once', async ({ page }) => {
    await openQuiz(page);
    await page.getByRole("button", { name: /Meinen Pulse Score prüfen/ }).click();

    for (let i = 0; i < 10; i++) {
      await page.locator(OPTION_BUTTONS).first().click();
    }

    await expect(page.getByText("/ 100 Pulse Score")).toBeVisible();
    expect(await callsFor(page, "Quiz Completed")).toBe(1);
    expect(await callsFor(page, "Quiz Started")).toBe(1);
  });

  test('submitting the contact form fires "Contact Sent" once', async ({ page }) => {
    await fillContactForm(page, { message: "Hallo, Testnachricht." });
    await page.getByRole("button", { name: "Absenden" }).click();

    expect(await callsFor(page, "Contact Sent")).toBe(1);
  });

  test("submitting with an empty required field fires nothing", async ({ page }) => {
    await fillContactForm(page, { message: "" });
    await page.getByRole("button", { name: "Absenden" }).click();

    // Native `required` validation blocks the submit handler.
    expect(await callsFor(page, "Contact Sent")).toBe(0);
  });

  test('the footer book-a-call link fires "Call Link Clicked" once', async ({ page }) => {
    await page.goto("/de");
    await page.getByRole("link", { name: "Gespräch buchen" }).click();

    await expect(page).toHaveURL(/\/de\/kontakt$/);
    expect(await callsFor(page, "Call Link Clicked")).toBe(1);
  });

  test("the site sets no cookies across the whole funnel", async ({ page, context }) => {
    await openQuiz(page);
    await page.getByRole("button", { name: /Meinen Pulse Score prüfen/ }).click();
    for (let i = 0; i < 10; i++) {
      await page.locator(OPTION_BUTTONS).first().click();
    }

    await fillContactForm(page, { message: "Hallo, Testnachricht." });
    await page.getByRole("button", { name: "Absenden" }).click();

    await page.goto("/de");
    await page.getByRole("link", { name: "Gespräch buchen" }).click();

    expect(await context.cookies()).toEqual([]);
  });
});
