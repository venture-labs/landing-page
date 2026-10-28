/**
 * 20261021-cta-tracking-every-call-to-action-fires-a-plausi
 *
 * End-to-end coverage beyond scripts/check-placements.ts's static regex
 * guard: a mailto:/tel: click fires "Contact Sent" with the right `cta`; the
 * Hero secondary button and a PulseJourney step CTA fire "Contact Sent" with
 * `cta: "contact"`; opening the quiz from two different buttons fires
 * "Quiz Started" with two different `placement` values for the same event;
 * and the existing booking-link flow still carries `cta: "book-call"`.
 *
 * Run instructions: see tests/e2e/playwright.config.ts. Same recorder
 * pattern as tests/e2e/analytics.spec.ts (window.plausible replaced before
 * any page script runs; plausible.io/calendar.app.google aborted at the
 * context level, so nothing leaves the machine).
 */
import { test, expect, type Page } from "@playwright/test";

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
  }
}

type Props = Record<string, string>;

async function withRecorder(page: Page): Promise<void> {
  await page.context().route("**://calendar.app.google/**", (route) => route.abort());
  await page.route("**://plausible.io/**", (route) => route.abort());
  await page.addInitScript(() => {
    window.__plausibleCalls = [];
    window.plausible = (...args: unknown[]) => {
      window.__plausibleCalls!.push(args);
    };
  });
}

/** Every recorded call's `props` object for one event name, in call order. */
async function propsFor(page: Page, eventName: string): Promise<Props[]> {
  return page.evaluate(
    (name) =>
      (window.__plausibleCalls ?? [])
        .filter((args) => args[0] === name)
        .map((args) => ((args[1] as { props?: Props } | undefined)?.props ?? {}) as Props),
    eventName
  );
}

async function clickBookingLink(page: Page, link: ReturnType<Page["locator"]>): Promise<void> {
  const popupPromise = page.waitForEvent("popup").catch(() => null);
  await link.click();
  const popup = await popupPromise;
  if (popup) await popup.close();
}

// DE copy for the quiz result step (src/app/components/PulseQuiz.tsx's
// resultReady). Clicking through to this text is how the two tests below
// reach Quiz Completed, not just Quiz Started.
const QUIZ_RESULT_READY_TEXT = "Dein Pulse Score ist bereit.";

/**
 * Clicks the dialog's first button (the current question's first option)
 * repeatedly until the result step's own text is visible. Bounded well
 * above PulseQuiz's real question count (10) so a regression that adds a
 * question fails loudly instead of hanging. DialogContent renders its own
 * children (the quiz's option buttons) before the Radix close ("X") button
 * in DOM order, so `.first()` is always the quiz's own next option, never
 * the dialog's close control.
 */
async function answerAllQuestions(page: Page): Promise<void> {
  const dialog = page.locator('[role="dialog"]');
  for (let i = 0; i < 20; i++) {
    if (await dialog.getByText(QUIZ_RESULT_READY_TEXT).isVisible().catch(() => false)) return;
    await dialog.getByRole("button").first().click();
  }
}

/**
 * Opens the quiz from the `nth` button named `openerName` (it opens on
 * question 1, which is when Quiz Started fires), answers every question through to the result step, then closes it —
 * one full Quiz Started -> Quiz Completed cycle for one opener.
 */
async function openCompleteAndClose(page: Page, openerName: string, nth: number): Promise<void> {
  const dialog = page.locator('[role="dialog"]');
  await page.getByRole("button", { name: openerName }).nth(nth).click();
  await expect(dialog).toBeVisible();
  await answerAllQuestions(page);
  await expect(dialog.getByText(QUIZ_RESULT_READY_TEXT)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

test.describe("CTA tracking — cta and placement coverage", () => {
  test.beforeEach(async ({ page }) => {
    await withRecorder(page);
  });

  test('a mailto: link fires "Contact Sent" with cta: "mail"', async ({ page }) => {
    await page.goto("/de/kontakt");
    // Kontakt.tsx's team-member email link.
    const mailLink = page.locator('a[href^="mailto:"]').first();
    await mailLink.click();

    const calls = await propsFor(page, "Contact Sent");
    expect(calls).toHaveLength(1);
    expect(calls[0].cta).toBe("mail");
    expect(calls[0].placement).toBeTruthy();
  });

  test('a tel: link fires "Contact Sent" with cta: "phone"', async ({ page }) => {
    await page.goto("/de/kontakt");
    const telLink = page.locator('a[href^="tel:"]').first();
    await telLink.click();

    const calls = await propsFor(page, "Contact Sent");
    expect(calls).toHaveLength(1);
    expect(calls[0].cta).toBe("phone");
  });

  test('the Hero secondary "Kontakt" button fires "Contact Sent" with cta: "contact" and navigates to /kontakt', async ({
    page,
  }) => {
    await page.goto("/de");
    // Scoped to Hero's own <section> (the first on the home page) so this
    // never matches the Navbar's own "Kontakt" nav-menu item, same label.
    const heroSection = page.locator("section").first();
    await heroSection.getByRole("link", { name: "Kontakt", exact: true }).click();

    await expect(page).toHaveURL(/\/de\/kontakt$/);
    const calls = await propsFor(page, "Contact Sent");
    expect(calls).toHaveLength(1);
    expect(calls[0].cta).toBe("contact");
    expect(calls[0].placement).toBe("hero-contact");
  });

  test('a PulseJourney step CTA on /leistungen fires "Contact Sent" with cta: "contact"', async ({ page }) => {
    await page.goto("/de/leistungen");
    // The "Check. Build. Care." journey's per-step CTA, inside #ablauf.
    await page.locator("#ablauf").scrollIntoViewIfNeeded();
    const stepCta = page.locator('#ablauf a[href*="topic="]').first();
    await stepCta.click();

    await expect(page).toHaveURL(/\/de\/kontakt\?topic=/);
    const calls = await propsFor(page, "Contact Sent");
    expect(calls).toHaveLength(1);
    expect(calls[0].cta).toBe("contact");
    expect(calls[0].placement).toBe("pulse-journey");
  });

  test("opening the quiz from two different buttons fires \"Quiz Started\" with two different placements", async ({
    page,
  }) => {
    await page.goto("/de");

    await page.getByRole("button", { name: "Kostenlosen Pulse Score starten" }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    // The Radix close button: an Escape in the first milliseconds after the
    // dialog renders can beat Radix's key listener (the dialog now opens on
    // question 1, so there is no start click in between any more).
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.locator('[role="dialog"]')).toBeHidden();

    await page.getByRole("button", { name: "Kostenlosen Pulse Score starten" }).nth(1).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const calls = await propsFor(page, "Quiz Started");
    expect(calls).toHaveLength(2);
    expect(calls[0].cta).toBe("quiz");
    expect(calls[1].cta).toBe("quiz");
    expect(calls[0].placement).toBeTruthy();
    expect(calls[1].placement).toBeTruthy();
    expect(calls[0].placement).not.toBe(calls[1].placement);
  });

  test("both Leistungen quiz openers fire Quiz Started and Quiz Completed with their own exact placement", async ({
    page,
  }) => {
    // Round 5, Reviewer finding 2 (should-fix): the test above only covers
    // the home page's two modals; Leistungen.tsx has its OWN shared-modal
    // wiring (LeistungenHero / PulseCallout, see Leistungen.tsx), and no
    // existing test exercised Quiz Completed's placement at all.
    await page.goto("/de/leistungen");

    await openCompleteAndClose(page, "Kostenlosen Pulse Score starten", 0);
    await openCompleteAndClose(page, "Kostenlosen Pulse Score starten", 1);

    const started = await propsFor(page, "Quiz Started");
    const completed = await propsFor(page, "Quiz Completed");

    expect(started).toHaveLength(2);
    expect(completed).toHaveLength(2);
    for (const calls of [started, completed]) {
      expect(calls[0].cta).toBe("quiz");
      expect(calls[1].cta).toBe("quiz");
    }

    // LeistungenHero's opener (PLACEMENTS.leistungenHero) vs PulseCallout's
    // opener (PLACEMENTS.leistungenPulseCallout) — exact values, not just
    // "truthy and different", so hardcoding one opener's placement onto the
    // other fails this test.
    expect(started[0].placement).toBe("leistungen-hero");
    expect(started[1].placement).toBe("leistungen-pulse-callout");
    expect(completed[0].placement).toBe("leistungen-hero");
    expect(completed[1].placement).toBe("leistungen-pulse-callout");
  });

  test('criterion 11 regression: the footer booking link still fires "Call Link Clicked" once, now carrying cta: "book-call"', async ({
    page,
  }) => {
    await page.goto("/de");
    const footerLink = page.locator(`footer a[href="${BOOKING_URL}"]`);
    await expect(footerLink).toHaveCount(1);

    await clickBookingLink(page, footerLink);

    // target="_blank" still opens a new tab without blocking the assertions
    // (clickBookingLink already closed it); venturelabs.team stays open.
    await expect(page).toHaveURL(/\/de$/);
    const calls = await propsFor(page, "Call Link Clicked");
    expect(calls).toHaveLength(1);
    expect(calls[0].cta).toBe("book-call");
  });
});
