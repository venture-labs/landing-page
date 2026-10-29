/**
 * 20261016-leistungen-funnel-booking-button-above-the-fold-
 *
 * Tester's additions: this task shipped no committed test for any of its own
 * acceptance criteria (the Implementer verified by hand with a throwaway
 * Chromium script, see its report). This spec proves:
 *
 *   criterion 1 — the quiz result's booking CTA reads the label, and (since
 *                 VL-11-S8, the quiz opens on question 1 and the result puts
 *                 the five-area breakdown first) renders AFTER the breakdown
 *                 in the DOM. It is visible without scrolling the dialog at
 *                 1440x900; at 390x844 the score is visible without scrolling
 *                 and the CTA is reachable by scrolling inside the dialog
 *                 (DE + EN).
 *   criterion 2 — `#pulse-score` (DE + EN) auto-opens the quiz dialog.
 *   criterion 3 — each Check/Build/Care step's CTA links to
 *                 `kontakt?topic=check|build|care`, and that preselects the
 *                 matching chip on the contact page.
 *   criterion 4 — `/de/does-not-exist` and `/en/does-not-exist` render the
 *                 Navbar, a heading, and a link back to `/{lang}/leistungen`.
 *   criterion 7 — a 50/100 score resolves to the lower band, never the top
 *                 one, and the weakest-area tiebreak is deterministic.
 *
 * Run exactly as `tests/e2e/playwright.config.ts` documents (a `pnpm build`
 * and a preview first). Nothing leaves the machine: the booking page and
 * plausible.io are aborted at context level.
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";
const OPTION_BUTTONS = '[role="dialog"] button.text-left';
const CTA_LABEL = { de: "Erstgespräch buchen", en: "Book an intro call" } as const;
const SAVE_LABEL = { de: "Ergebnis festhalten", en: "Save my result" } as const;
const QUIZ_META = { de: "10 Fragen, 5 Minuten", en: "10 questions, 5 minutes" } as const;
const BREAKDOWN_HEADING = { de: "Deine Auswertung nach fünf Bereichen", en: "Your five-dimension breakdown" } as const;
const START_CTA = { de: /Meinen Pulse Score prüfen/, en: /Check my Pulse Score/ } as const;
const FIRST_QUESTION = { de: "Frage 1 von 10", en: "Question 1 of 10" } as const;
const HERO_PULSE_CTA = { de: "Kostenlosen Pulse Score starten", en: "Start your free Pulse Score" } as const;
const QUIZ_HEADING = {
  de: "AI Pulse Score: Wie gesund ist dein KI-Einsatz?",
  en: "AI Pulse Score: how healthy is your AI use?",
} as const;

async function blockOutbound(context: BrowserContext): Promise<void> {
  await context.route("**://plausible.io/**", (route) => route.abort());
  await context.route(`**${BOOKING_URL}**`, (route) => route.abort());
}

/** Opens the quiz via `#pulse-score` and answers all 10 questions with a given option index. */
async function completeQuiz(page: Page, lang: "de" | "en", optionIndex: number): Promise<void> {
  await page.goto(`/${lang}/leistungen#pulse-score`);
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 10; i++) {
    const options = page.locator(OPTION_BUTTONS);
    await expect(options.nth(optionIndex)).toBeVisible();
    await options.nth(optionIndex).click();
  }
}

test.describe("criterion 1: the result CTA is relabelled and reordered", () => {
  for (const lang of ["de", "en"] as const) {
    test(`criterion 1: /${lang}/leistungen quiz result — CTA label and DOM order`, async ({ page }) => {
      await blockOutbound(page.context());
      await completeQuiz(page, lang, 0);

      const cta = page.getByRole("link", { name: CTA_LABEL[lang] });
      await expect(cta, "the booking CTA must read the new label").toBeVisible();

      // DOM order: the breakdown heading must precede the CTA (Martin's
      // feedback L5: score and breakdown first, then the one box).
      const order = await page.evaluate(
        ([ctaText, breakdownText]) => {
          const all = Array.from(document.querySelectorAll('[role="dialog"] a, [role="dialog"] h4'));
          const ctaIndex = all.findIndex((el) => el.textContent?.includes(ctaText as string));
          const breakdownIndex = all.findIndex((el) => el.textContent?.includes(breakdownText as string));
          return { ctaIndex, breakdownIndex };
        },
        [CTA_LABEL[lang], BREAKDOWN_HEADING[lang]]
      );
      expect(order.ctaIndex, "the CTA must be found in the DOM").toBeGreaterThanOrEqual(0);
      expect(order.breakdownIndex, "the breakdown heading must be found in the DOM").toBeGreaterThanOrEqual(0);
      expect(order.breakdownIndex, "the breakdown block must render before the CTA").toBeLessThan(order.ctaIndex);
    });

    test(`criterion 1: /${lang}/leistungen quiz result — both buttons visible without scrolling at 1440x900`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await blockOutbound(page.context());
      await completeQuiz(page, lang, 0);

      const dialog = page.locator('[role="dialog"]');
      const dialogBox = await dialog.boundingBox();
      expect(dialogBox, "dialog must have a bounding box").not.toBeNull();
      const dialogVisibleBottom = dialogBox!.y + dialogBox!.height;
      for (const control of [
        page.getByRole("link", { name: CTA_LABEL[lang] }),
        page.getByRole("button", { name: SAVE_LABEL[lang] }),
      ]) {
        const box = await control.boundingBox();
        expect(box, "control must have a bounding box").not.toBeNull();
        const bottom = box!.y + box!.height;
        expect(
          bottom,
          `control bottom (${bottom}) must be within the dialog's visible area (ends at ${dialogVisibleBottom}) ` +
            `and the viewport (900) — no scrolling required`
        ).toBeLessThanOrEqual(Math.min(dialogVisibleBottom, 900));
        expect(box!.y, "control must start inside the dialog").toBeGreaterThanOrEqual(dialogBox!.y);
        // The dialog itself is not scrolled.
        expect(await dialog.evaluate((el) => el.scrollTop)).toBe(0);
      }
    });

    test(`criterion 1: /${lang}/leistungen quiz result — score visible, buttons reachable inside the dialog at 390x844`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await blockOutbound(page.context());
      await completeQuiz(page, lang, 0);

      const dialog = page.locator('[role="dialog"]');
      const dialogBox = (await dialog.boundingBox())!;
      const scoreBox = (await page.getByText("/ 100 Pulse Score").boundingBox())!;
      expect(scoreBox.y + scoreBox.height, "the score is visible without scrolling").toBeLessThanOrEqual(
        Math.min(dialogBox.y + dialogBox.height, 844)
      );
      for (const control of [
        page.getByRole("link", { name: CTA_LABEL[lang] }),
        page.getByRole("button", { name: SAVE_LABEL[lang] }),
      ]) {
        await control.scrollIntoViewIfNeeded();
        await expect(control).toBeInViewport();
        const box = (await control.boundingBox())!;
        expect(box.height, "tap target at least 44 px").toBeGreaterThanOrEqual(44);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  }
});

test.describe("regression: the result step's hidden title does not survive close/reopen", () => {
  // Reviewer finding (reviewer-r1.md #1, blocking): PulseCheckModal's own
  // `step` state is lifted from PulseQuiz but PulseCheckModal itself stays
  // mounted across opens/closes — only the Dialog's content unmounts. Without
  // resetting `step` back to "question" on close, a dialog reopened after
  // completing the quiz once still thinks it is on the result step, so the
  // (sr-only-for-result-only) DialogTitle stays hidden on the freshly
  // reopened question 1.
  for (const lang of ["de", "en"] as const) {
    test(`regression: /${lang}/leistungen — closing and reopening the quiz after completing it restores the visible title`, async ({
      page,
    }) => {
      await blockOutbound(page.context());
      await completeQuiz(page, lang, 0);

      // Still on the result step: the title is the sr-only accessible name,
      // not visibly rendered.
      const dialogTitle = page.locator('[data-slot="dialog-title"]');
      await expect(dialogTitle).toHaveClass(/sr-only/);

      // Close the dialog (the Radix-provided close button).
      await page.getByRole("button", { name: "Close" }).click();
      await expect(page.locator('[role="dialog"]')).toHaveCount(0);

      // Reopen it from the page's own hero CTA (not the #pulse-score hash,
      // which only fires its auto-open effect once per hash value). The
      // page carries two buttons with this label (hero + closing callout);
      // either opens the same modal, so the first one is enough.
      await page.getByRole("button", { name: HERO_PULSE_CTA[lang] }).first().click();
      const reopenedDialog = page.locator('[role="dialog"]');
      await expect(reopenedDialog).toBeVisible();

      // Back on question 1: the title must be visible again, not sr-only.
      await expect(dialogTitle).not.toHaveClass(/sr-only/);
      await expect(dialogTitle).toBeVisible();
      await expect(dialogTitle).toHaveText(QUIZ_HEADING[lang]);
      // And question 1 with its one-line meta confirms the step really is "question".
      await expect(reopenedDialog.getByText(FIRST_QUESTION[lang])).toBeVisible();
      // The one-line meta sits above the question label on the reopened dialog.
      const reopenedText = (await reopenedDialog.innerText()).replace(/\s+/g, " ").toLowerCase();
      const metaAt = reopenedText.indexOf(QUIZ_META[lang].toLowerCase());
      const labelAt = reopenedText.indexOf(FIRST_QUESTION[lang].toLowerCase());
      expect(metaAt).toBeGreaterThanOrEqual(0);
      expect(metaAt).toBeLessThan(labelAt);
      await expect(reopenedDialog.getByRole("button", { name: START_CTA[lang] })).toHaveCount(0);
    });
  }
});

test.describe("criterion 2: #pulse-score opens the quiz on load", () => {
  for (const lang of ["de", "en"] as const) {
    test(`criterion 2: /${lang}/leistungen#pulse-score auto-opens the quiz dialog`, async ({ page }) => {
      await page.goto(`/${lang}/leistungen#pulse-score`);
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  }
});

test.describe("criterion 3: Check/Build/Care CTAs carry their topic", () => {
  const STEPS = ["check", "build", "care"] as const;

  test("criterion 3: each step's rail button links to kontakt?topic=<step>", async ({ page }) => {
    await page.goto("/de/leistungen#ablauf");
    const rail = page.locator('button[aria-pressed]');
    for (let i = 0; i < STEPS.length; i++) {
      await rail.nth(i).click();
      // StepDetail is swapped under AnimatePresence mode="wait" (a 0.35s exit
      // animation), so the previous step's link briefly remains the only
      // match in the DOM. Use an auto-retrying assertion instead of a single
      // getAttribute() read so the test waits out the transition.
      await expect(page.locator('a[href*="/kontakt?topic="]').first()).toHaveAttribute(
        "href",
        `/de/kontakt?topic=${STEPS[i]}`
      );
    }
  });

  for (const topic of STEPS) {
    test(`criterion 3: /de/kontakt?topic=${topic} preselects the matching chip`, async ({ page }) => {
      await page.goto(`/de/kontakt?topic=${topic}`);
      // The preselection is applied by a useEffect (Kontakt.tsx) that reads
      // the ?topic= query param after mount, and the chip's background
      // transitions in via a CSS "transition-all" class — so a single
      // synchronous read right after goto() can race both the effect and the
      // transition and observe zero active chips even though the app is
      // correct a moment later. expect.poll() retries instead of a one-shot
      // read, the same fix already applied twice above in this file.
      await expect
        .poll(
          async () =>
            page.$$eval("button", (btns) =>
              btns
                .filter((b) => {
                  const bg = getComputedStyle(b).backgroundColor;
                  return bg !== "rgba(0, 0, 0, 0)" && b.className.includes("rounded-full");
                })
                .map((b) => b.textContent?.trim())
            ),
          `exactly one chip must be preselected for ?topic=${topic}`
        )
        .toHaveLength(1);
    });
  }
});

test.describe("criterion 4: an unmatched path renders a real not-found page", () => {
  for (const lang of ["de", "en"] as const) {
    test(`criterion 4: /${lang}/does-not-exist renders Navbar + message + link to /${lang}/leistungen`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/does-not-exist`);
      await expect(page.locator("nav").first()).toBeVisible();
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator(`a[href="/${lang}/leistungen"]`).first()).toBeVisible();
    });
  }
});

test.describe("criterion 7: a 50/100 score never returns the top band", () => {
  test("criterion 7: answers summing to 15/30 (score 50) resolve to the lower band", async ({ page }) => {
    await blockOutbound(page.context());
    await page.goto("/de/leistungen#pulse-score");
    const dialog = page.locator('[role="dialog"]');
    // 10 questions, 0-3 each; alternate 1 and 2 to sum to exactly 15.
    const pattern = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    for (const idx of pattern) {
      const options = page.locator(OPTION_BUTTONS);
      await expect(options.nth(idx)).toBeVisible();
      await options.nth(idx).click();
    }
    await expect(page.getByText("/ 100 Pulse Score")).toBeVisible();
    await expect(page.getByText("50", { exact: true })).toBeVisible();
    await expect(page.getByText("Stabiler Puls")).toHaveCount(0);
    await expect(page.getByText("Erste Anzeichen")).toBeVisible();
  });

  test("criterion 7: tied areas resolve to AREA_ORDER position, not sort order", async ({ page }) => {
    await blockOutbound(page.context());
    await page.goto("/de/leistungen#pulse-score");
    const dialog = page.locator('[role="dialog"]');
    // All areas tied at the same per-question answer -> weakest two are the
    // first two in AREA_ORDER ("data", "process") deterministically.
    for (let i = 0; i < 10; i++) {
      const options = page.locator(OPTION_BUTTONS);
      await expect(options.nth(0)).toBeVisible();
      await options.nth(0).click();
    }
    // Scope to the "weakest areas" narrative sentence specifically — a plain
    // getByText(/Datenbasis.+Prozesse/) also matches the area-breakdown list
    // below it, which names every area and triggers a strict-mode violation.
    const weakestSentence = page.locator("p", { hasText: "schwächsten" });
    await expect(weakestSentence).toBeVisible();
    await expect(weakestSentence).toHaveText(/Datenbasis.+Prozesse|Prozesse.+Datenbasis/);
  });
});
