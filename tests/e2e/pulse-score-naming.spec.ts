/**
 * 20260926-the-real-prices-on-the-main-site-and-one-meaning
 *
 * The rendered half of the spec, which no existing test covered: criteria 4, 5,
 * 6, 9, 10, 11 (rendered side), 12 and 13.
 *
 * `scripts/check-pulse-naming.ts` asserts these strings in the SOURCE, and that
 * is where it stops: `scripts/prerender.ts` writes head tags only, the body is
 * client-rendered, so a source or dist scan cannot show which element carries a
 * label, whether the Check card's CTA is a link or a button, where it lands, or
 * that nothing inside `#ablauf` still opens the quiz. That is what this spec
 * proves, in a real browser, on all four affected routes in both locales.
 *
 * Run instructions: see tests/e2e/playwright.config.ts (needs `pnpm build` and a
 * `vite preview` on :4173). Nothing leaves the machine: plausible.io and
 * calendar.app.google are aborted at the context level.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";

type Lang = "de" | "en";

/** Criteria 4 and 5 — the one label every quiz-opening control carries. */
const FREE_QUIZ_LABEL: Record<Lang, string> = {
  de: "Kostenlosen Pulse Score starten",
  en: "Start your free Pulse Score",
};

/** Criterion 10 — the Check card's CTA in `#ablauf`. */
const CHECK_CARD_LABEL: Record<Lang, string> = {
  de: "Über den Pulse Check sprechen",
  en: "Talk about a Pulse Check",
};

/** Criterion 6 — the dialog's accessible name. */
const DIALOG_NAME: Record<Lang, string> = {
  de: "AI Pulse Score: Wie gesund ist dein KI-Einsatz?",
  en: "AI Pulse Score: how healthy is your AI use?",
};

/** The quiz's start button and its result screen, per locale. */
const START_CTA: Record<Lang, RegExp> = {
  de: /Meinen Pulse Score prüfen/,
  en: /Check my Pulse Score/,
};
const RESULT_READY: Record<Lang, string> = {
  de: "Dein Pulse Score ist bereit.",
  en: "Your Pulse Score is ready.",
};

/** Criterion 13 — the sentence the `#ablauf` intro must end with. */
const FIRST_CALL_SENTENCE: Record<Lang, string> = {
  de: "Was ein Schritt bei dir kostet, besprechen wir im Erstgespräch: konkret auf deinen Umfang gerechnet, unverbindlich.",
  en: "What a step costs in your case is something we work out in a first call: based on your actual scope, with no obligation.",
};

/** Criterion 9 — the rewritten closing paragraph, verbatim. */
const CTA_BODY: Record<Lang, string> = {
  de: "Der AI Pulse Score dauert fünf Minuten und kostet nichts: 10 Fragen, sofort ein Ergebnis über fünf Bereiche. Willst du danach genau wissen, wo dein größter Hebel liegt, ist der Pulse Check der nächste Schritt – was er bei dir umfasst, besprechen wir im Erstgespräch.",
  en: "The AI Pulse Score takes five minutes and costs nothing: 10 questions, an instant result across five areas. If you then want to know exactly where your biggest lever is, the Pulse Check is the next step — what it covers in your case is something we work out in a first call.",
};

/** The rail button that selects the paid Check step, per locale. */
const CHECK_STEP_RAIL: Record<Lang, RegExp> = {
  de: /01 · Verstehen/,
  en: /01 · Understand/,
};

/** Option buttons inside the quiz dialog (excludes the Radix close button). */
const OPTION_BUTTONS = '[role="dialog"] button.text-left';

const DIALOG = '[role="dialog"]';

const LANGS: Lang[] = ["de", "en"];

async function blockOutbound(context: BrowserContext): Promise<void> {
  await context.route("**://plausible.io/**", (route) => route.abort());
  await context.route("**://calendar.app.google/**", (route) => route.abort());
}

/** Select the paid Check step in the `#ablauf` rail and return that section. */
async function selectCheckStep(page: Page, lang: Lang) {
  const ablauf = page.locator("#ablauf");
  await expect(ablauf).toBeVisible();
  await ablauf.getByRole("button", { name: CHECK_STEP_RAIL[lang] }).click();
  return ablauf;
}

/** Answer all ten questions from an already-open dialog. */
async function completeQuiz(page: Page, lang: Lang): Promise<void> {
  await page.getByRole("button", { name: START_CTA[lang] }).click();
  for (let i = 0; i < 10; i++) {
    await page.locator(OPTION_BUTTONS).first().click();
  }
}

test.beforeEach(async ({ context }) => {
  await blockOutbound(context);
});

/* ─── criteria 4 and 5: one label on all four quiz entry points ─────────── */

test.describe("every quiz entry point is labelled with the free Pulse Score", () => {
  for (const lang of LANGS) {
    test(`criterion 4: the home hero button on /${lang} reads "${FREE_QUIZ_LABEL[lang]}"`, async ({
      page,
    }) => {
      await page.goto(`/${lang}`);
      // The hero button is the first control with this label on the home page
      // (the AI-Pulse teaser is the second, asserted below).
      const hero = page.locator("section").first();
      await expect(
        hero.getByRole("button", { name: FREE_QUIZ_LABEL[lang] }).first()
      ).toBeVisible();
    });

    test(`criterion 5: the home page carries exactly two quiz buttons on /${lang}, both with that label`, async ({
      page,
    }) => {
      await page.goto(`/${lang}`);
      // Hero + AI-Pulse teaser. A third would mean #ablauf opens the quiz again.
      await expect(page.getByRole("button", { name: FREE_QUIZ_LABEL[lang] })).toHaveCount(2);
    });

    test(`criterion 5: the /${lang}/leistungen hero and closing block both read "${FREE_QUIZ_LABEL[lang]}"`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const buttons = page.getByRole("button", { name: FREE_QUIZ_LABEL[lang] });
      // Hero button + closing-block button, and nothing else.
      await expect(buttons).toHaveCount(2);
      await expect(buttons.nth(0)).toBeVisible();
      await expect(buttons.nth(1)).toBeVisible();
    });

    test(`criterion 5: no control on /${lang} or /${lang}/leistungen is still labelled with a Pulse Check quiz label`, async ({
      page,
    }) => {
      for (const path of [`/${lang}`, `/${lang}/leistungen`]) {
        await page.goto(path);
        // The old labels, in both locales, must be gone from every control.
        for (const stale of [
          "Jetzt AI Pulse Check machen",
          "Take the AI Pulse Check now",
          "Pulse Check machen",
          "Take the Pulse Check",
        ]) {
          await expect(
            page.getByRole("button", { name: stale, exact: true }),
            `${path} still has a control labelled "${stale}"`
          ).toHaveCount(0);
        }
      }
    });
  }
});

/* ─── criterion 6: the dialog's accessible name ─────────────────────────── */

test.describe("the quiz dialog is named after the Pulse Score", () => {
  for (const lang of LANGS) {
    test(`criterion 6: the dialog on /${lang} is named "${DIALOG_NAME[lang]}"`, async ({ page }) => {
      await page.goto(`/${lang}`);
      await page.getByRole("button", { name: FREE_QUIZ_LABEL[lang] }).first().click();

      const dialog = page.locator(DIALOG);
      await expect(dialog).toBeVisible();

      // The accessible name, not just the visible text: Radix wires DialogTitle
      // to aria-labelledby, so this is what a screen reader announces.
      const accessibleName = await dialog.evaluate((el) => {
        const id = el.getAttribute("aria-labelledby");
        const labelled = id ? document.getElementById(id) : null;
        return labelled?.textContent?.trim() ?? el.getAttribute("aria-label") ?? "";
      });

      expect(accessibleName).toBe(DIALOG_NAME[lang]);
      expect(accessibleName).toContain("Pulse Score");
      expect(accessibleName).not.toContain("Pulse Check");
    });
  }
});

/* ─── criterion 13: the #ablauf intro ends with the first-call sentence ──── */

test.describe("the #ablauf intro answers the cost question with the first call", () => {
  for (const lang of LANGS) {
    for (const path of [`/${lang}`, `/${lang}/leistungen`]) {
      test(`criterion 13: the #ablauf intro on ${path} ends with the first-call sentence`, async ({
        page,
      }) => {
        await page.goto(path);
        const intro = page.locator("#ablauf p").first();
        await expect(intro).toBeVisible();

        const text = ((await intro.textContent()) ?? "").replace(/\s+/g, " ").trim();
        expect(text.endsWith(FIRST_CALL_SENTENCE[lang as Lang]), `intro read: ${text}`).toBe(true);
      });
    }
  }
});

/* ─── criterion 9: the rewritten closing block ──────────────────────────── */

test.describe("the closing block puts 'costs nothing' on the free Pulse Score", () => {
  for (const lang of LANGS) {
    test(`criterion 9: the /${lang}/leistungen closing paragraph names the Score first, then the Check`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);

      const paragraph = page.getByText(CTA_BODY[lang], { exact: false }).first();
      await expect(paragraph).toBeVisible();

      const text = ((await paragraph.textContent()) ?? "").replace(/\s+/g, " ").trim();
      expect(text).toBe(CTA_BODY[lang]);

      // "kostet nichts" / "costs nothing" attaches to the Score, which comes
      // first; the Pulse Check is named afterwards, as the next step.
      const freeClaim = lang === "de" ? "kostet nichts" : "costs nothing";
      const scoreAt = text.indexOf("AI Pulse Score");
      const freeAt = text.indexOf(freeClaim);
      const checkAt = text.indexOf("Pulse Check");

      expect(scoreAt, "the paragraph names the AI Pulse Score").toBeGreaterThanOrEqual(0);
      expect(freeAt, `the paragraph says "${freeClaim}"`).toBeGreaterThan(scoreAt);
      expect(checkAt, "the Pulse Check is named after the free claim").toBeGreaterThan(freeAt);

      // No number, no currency, no "ab" price hedge in that paragraph.
      expect(text).not.toMatch(/(\d[\d.,]*\s*(€|EUR\b|Euro\b))|((€|EUR|Euro)\s*\d)/i);
      expect(text).not.toMatch(/\bab\s+\d/i);
    });
  }
});

/* ─── criterion 10: the Check card leads into the conversation ──────────── */

test.describe("the paid Check step links to the contact page", () => {
  for (const lang of LANGS) {
    for (const path of [`/${lang}`, `/${lang}/leistungen`]) {
      test(`criterion 10: on ${path} the Check card's CTA is a link to /${lang}/kontakt and navigates there`, async ({
        page,
      }) => {
        await page.goto(path);
        const ablauf = await selectCheckStep(page, lang);

        const cta = ablauf.getByRole("link", { name: CHECK_CARD_LABEL[lang] });
        await expect(cta, "the Check card's CTA must be a link, not a button").toHaveCount(1);
        await expect(cta).toHaveAttribute("href", `/${lang}/kontakt`);

        // It must not be a button any more — that was the old quiz opener.
        await expect(
          ablauf.getByRole("button", { name: CHECK_CARD_LABEL[lang] })
        ).toHaveCount(0);

        await cta.click();
        await expect(page).toHaveURL(new RegExp(`/${lang}/kontakt$`));
        await expect(page.locator(DIALOG), "clicking it must open no dialog").toHaveCount(0);
      });
    }
  }
});

/* ─── criterion 11: nothing inside #ablauf opens the quiz ───────────────── */

test.describe("#ablauf opens no quiz dialog on any route", () => {
  for (const lang of LANGS) {
    for (const path of [`/${lang}`, `/${lang}/leistungen`]) {
      test(`criterion 11: no button inside #ablauf on ${path} opens the quiz dialog`, async ({
        page,
      }) => {
        await page.goto(path);
        const ablauf = page.locator("#ablauf");
        await expect(ablauf).toBeVisible();

        const buttons = ablauf.getByRole("button");
        const count = await buttons.count();
        expect(count, "#ablauf should still have its three step-rail buttons").toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
          await buttons.nth(i).click();
          await expect(
            page.locator(DIALOG),
            `button ${i} inside #ablauf on ${path} opened a dialog`
          ).toHaveCount(0);
        }

        // And no quiz-opening label survives inside the section.
        await expect(
          ablauf.getByRole("button", { name: FREE_QUIZ_LABEL[lang] })
        ).toHaveCount(0);
      });
    }
  }
});

/* ─── criterion 12: all four entry points still complete ────────────────── */

test.describe("the quiz still completes from all four entry points", () => {
  for (const lang of LANGS) {
    test(`criterion 12: the home hero on /${lang} completes to the result screen`, async ({
      page,
    }) => {
      await page.goto(`/${lang}`);
      await page.getByRole("button", { name: FREE_QUIZ_LABEL[lang] }).nth(0).click();
      await expect(page.locator(DIALOG)).toBeVisible();
      await completeQuiz(page, lang);
      await expect(page.getByText(RESULT_READY[lang])).toBeVisible();
    });

    test(`criterion 12: the home AI-Pulse teaser on /${lang} completes to the result screen`, async ({
      page,
    }) => {
      await page.goto(`/${lang}`);
      await page.getByRole("button", { name: FREE_QUIZ_LABEL[lang] }).nth(1).click();
      await expect(page.locator(DIALOG)).toBeVisible();
      await completeQuiz(page, lang);
      await expect(page.getByText(RESULT_READY[lang])).toBeVisible();
    });

    test(`criterion 12: the /${lang}/leistungen hero completes to the result screen`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      await page.getByRole("button", { name: FREE_QUIZ_LABEL[lang] }).nth(0).click();
      await expect(page.locator(DIALOG)).toBeVisible();
      await completeQuiz(page, lang);
      await expect(page.getByText(RESULT_READY[lang])).toBeVisible();
    });

    test(`criterion 12: the /${lang}/leistungen closing block completes to the result screen`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      await page.getByRole("button", { name: FREE_QUIZ_LABEL[lang] }).nth(1).click();
      await expect(page.locator(DIALOG)).toBeVisible();
      await completeQuiz(page, lang);
      await expect(page.getByText(RESULT_READY[lang])).toBeVisible();
    });
  }
});
