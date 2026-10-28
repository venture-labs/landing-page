/**
 * 20261028-leistungsseite-pulse-score-flow-start-at-questio (VL-11-S8)
 *
 * The Pulse Score quiz flow after Martin's feedback (topic T152, L2-L5):
 * the dialog opens straight on question 1 under "10 Fragen, 5 Minuten", the
 * question text is one token size smaller, answers are filled arrow buttons
 * with an accent hover/focus, and the result is score + breakdown followed by
 * ONE box with "Erstgespräch buchen" and "Ergebnis festhalten" (which folds
 * the e-mail form open). DE and EN, 1440 and 390 wide, keyboard only.
 *
 * Covers spec criteria 1-11 and 14 (13 and 12 live in
 * booking-cta-above-fold.spec.ts, the form POST shape also in
 * lead-capture-forms.spec.ts). Run instructions: tests/e2e/playwright.config.ts.
 * Nothing leaves the machine: plausible.io is aborted, the booking page and
 * the Netlify form POST are fulfilled locally.
 */
import { test, expect, type Page, type Request } from "@playwright/test";

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";
const DIALOG = '[role="dialog"]';
const OPTION_BUTTONS = '[role="dialog"] button.text-left';
const ACCENT_RGB = "rgb(129, 41, 255)";

type Lang = "de" | "en";
const LANGS: Lang[] = ["de", "en"];

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
  }
}

const T = {
  de: {
    opener: "Kostenlosen Pulse Score starten",
    meta: "10 Fragen, 5 Minuten",
    label: (n: number) => `Frage ${n} von 10`,
    start: /Meinen Pulse Score prüfen/,
    book: "Erstgespräch buchen",
    save: "Ergebnis festhalten",
    oldLeadHeading: "Ergebnis festhalten?",
    scoreLabel: "/ 100 Pulse Score",
    restart: "Test erneut starten",
    thanks: "Danke! Wir melden uns bei dir.",
    error: "Das hat leider nicht geklappt. Bitte versuch es nochmal.",
    email: "Deine E-Mail-Adresse",
    privacy: "Datenschutzerklärung",
    submit: "Absenden",
    lowBand: "Erste Anzeichen",
    topBand: "Stabiler Puls",
    band: "Erste%20Anzeichen",
    weakest: "Datenbasis%2C%20Prozesse",
  },
  en: {
    opener: "Start your free Pulse Score",
    meta: "10 questions, 5 minutes",
    label: (n: number) => `Question ${n} of 10`,
    start: /Check my Pulse Score/,
    book: "Book an intro call",
    save: "Save my result",
    oldLeadHeading: "Keep your result?",
    scoreLabel: "/ 100 Pulse Score",
    restart: "Retake the test",
    thanks: "Thanks! We'll be in touch.",
    error: "Something went wrong. Please try again.",
    email: "Your email address",
    privacy: "privacy policy",
    submit: "Submit",
    lowBand: "Early Signs",
    topBand: "Steady Pulse",
    band: "Early%20Signs",
    weakest: "Data%20Readiness%2C%20Process%20Fit",
  },
} as const;

async function withRecorder(page: Page): Promise<void> {
  await page.route("**://plausible.io/**", (route) => route.abort());
  await page.context().route("**://calendar.app.google/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<title>booking</title>" })
  );
  await page.addInitScript(() => {
    window.__plausibleCalls = [];
    window.plausible = (...args: unknown[]) => {
      window.__plausibleCalls!.push(args);
    };
  });
}

type Props = Record<string, string>;

async function propsFor(page: Page, eventName: string): Promise<Props[]> {
  return page.evaluate(
    (name) =>
      (window.__plausibleCalls ?? [])
        .filter((args) => args[0] === name)
        .map((args) => ((args[1] as { props?: Props } | undefined)?.props ?? {}) as Props),
    eventName
  );
}

async function totalCalls(page: Page): Promise<number> {
  return page.evaluate(() => (window.__plausibleCalls ?? []).length);
}

/** Opens the dialog from the first "Pulse Score starten" button of /<lang>/leistungen. */
async function openQuiz(page: Page, lang: Lang): Promise<void> {
  await page.goto(`/${lang}/leistungen`);
  await page.getByRole("button", { name: T[lang].opener }).first().click();
  await expect(page.locator(DIALOG)).toBeVisible();
}

/** Answers the 10 questions with the option at `index` each. */
async function answerAll(page: Page, index = 0): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const options = page.locator(OPTION_BUTTONS);
    await expect(options.nth(index)).toBeVisible();
    await options.nth(index).click();
  }
}

async function mockFormPost(page: Page, status: number): Promise<Request[]> {
  const captured: Request[] = [];
  await page.route(
    (url) => url.pathname === "/",
    async (route, request) => {
      if (request.method() === "POST") {
        captured.push(request);
        await route.fulfill({ status, contentType: "text/plain", body: "" });
      } else {
        await route.continue();
      }
    }
  );
  return captured;
}

for (const lang of LANGS) {
  const t = T[lang];

  test.describe(`/${lang}/leistungen quiz flow`, () => {
    test.beforeEach(async ({ page }) => {
      await withRecorder(page);
    });

    test(`criteria 1-2: opens on question 1 with "${t.meta}", no intro and no start button`, async ({ page }) => {
      await openQuiz(page, lang);
      const dialog = page.locator(DIALOG);

      await expect(dialog.getByRole("button", { name: t.start })).toHaveCount(0);
      await expect(dialog.getByText(t.meta)).toBeVisible();
      await expect(dialog.getByText(t.label(1))).toBeVisible();
      await expect(dialog.locator('div[style*="width: 10%"]')).toHaveCount(1);

      // The meta line precedes the question text in DOM order.
      const order = await page.evaluate((meta) => {
        const root = document.querySelector('[role="dialog"]')!;
        const metaEl = Array.from(root.querySelectorAll("p")).find((p) => p.textContent === meta);
        const heading = root.querySelector("h3");
        if (!metaEl || !heading) return null;
        return metaEl.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING ? "before" : "after";
      }, t.meta);
      expect(order).toBe("before");

      // Question 2: the meta line is gone, the label moves on.
      await page.locator(OPTION_BUTTONS).first().click();
      await expect(dialog.getByText(t.label(2))).toBeVisible();
      await expect(dialog.getByText(t.meta)).toHaveCount(0);
    });

    test("criterion 1: loading #pulse-score shows question 1 as well", async ({ page }) => {
      await page.goto(`/${lang}/leistungen#pulse-score`);
      const dialog = page.locator(DIALOG);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(t.label(1))).toBeVisible();
      await expect(dialog.getByRole("button", { name: t.start })).toHaveCount(0);
    });

    for (const vp of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      test(`criteria 3-4: question text is one token smaller than the title, answers are filled arrow buttons at ${vp.width}`, async ({
        page,
      }) => {
        await page.setViewportSize(vp);
        await openQuiz(page, lang);
        const dialog = page.locator(DIALOG);

        const sizes = await page.evaluate(() => {
          const probe = document.createElement("div");
          probe.style.fontSize = "var(--text-h3)";
          document.body.appendChild(probe);
          const h3Token = getComputedStyle(probe).fontSize;
          probe.style.fontSize = "var(--text-h2)";
          const h2Token = getComputedStyle(probe).fontSize;
          probe.remove();
          const root = document.querySelector('[role="dialog"]')!;
          return {
            h3Token,
            h2Token,
            question: getComputedStyle(root.querySelector("h3")!).fontSize,
            title: getComputedStyle(root.querySelector('[data-slot="dialog-title"]')!).fontSize,
          };
        });
        expect(sizes.question).toBe(sizes.h3Token);
        expect(sizes.title).toBe(sizes.h2Token);
        expect(parseFloat(sizes.question)).toBeLessThan(parseFloat(sizes.title));

        const options = page.locator(OPTION_BUTTONS);
        const count = await options.count();
        expect(count).toBeGreaterThanOrEqual(3);
        for (let i = 0; i < count; i++) {
          const option = options.nth(i);
          const info = await option.evaluate((el) => {
            const svg = el.querySelector("svg");
            return {
              tag: el.tagName,
              bg: getComputedStyle(el).backgroundColor,
              svgHidden: svg?.getAttribute("aria-hidden") ?? null,
              text: el.textContent?.trim() ?? "",
              height: el.getBoundingClientRect().height,
            };
          });
          expect(info.tag).toBe("BUTTON");
          expect(info.bg).not.toBe("rgba(0, 0, 0, 0)");
          expect(info.bg).not.toBe("transparent");
          expect(info.svgHidden).toBe("true");
          expect(info.height).toBeGreaterThanOrEqual(44);
          // The accessible name is the option text only.
          await expect(dialog.getByRole("button", { name: info.text, exact: true })).toHaveCount(1);
        }
      });
    }

    test("criterion 5: an answer turns accent purple on hover and on keyboard focus, with a visible focus ring", async ({
      page,
    }) => {
      await openQuiz(page, lang);
      const options = page.locator(OPTION_BUTTONS);
      const bg = (index: number) => options.nth(index).evaluate((el) => getComputedStyle(el).backgroundColor);

      await options.nth(2).hover();
      await expect.poll(() => bg(2)).toBe(ACCENT_RGB);

      // Move the mouse away, then reach an answer with the keyboard only.
      await page.mouse.move(0, 0);
      await expect.poll(() => bg(2)).not.toBe(ACCENT_RGB);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
        const onOption = await page.evaluate(() => document.activeElement?.matches('[role="dialog"] button.text-left') ?? false);
        if (onOption) break;
      }
      const focused = page.locator(`${OPTION_BUTTONS}:focus`);
      await expect(focused).toHaveCount(1);
      await expect.poll(() => focused.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ACCENT_RGB);
      const outline = await focused.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { width: parseFloat(cs.outlineWidth), style: cs.outlineStyle };
      });
      expect(outline.style).not.toBe("none");
      expect(outline.width).toBeGreaterThan(0);
    });

    test("criterion 6: all 10 questions and the result are completable by keyboard, focus lands on the next question", async ({
      page,
    }) => {
      await openQuiz(page, lang);
      for (let i = 0; i < 10; i++) {
        // Question 1 may already have focus on its first answer (Radix); later
        // ones start on the question heading and need one Tab.
        const onOption = await page.evaluate(() => document.activeElement?.matches('[role="dialog"] button.text-left') ?? false);
        if (!onOption) await page.keyboard.press("Tab");
        await page.keyboard.press("Enter");
        if (i < 9) {
          const focus = await page.evaluate(() => {
            const active = document.activeElement;
            return { tag: active?.tagName, inDialog: !!active?.closest('[role="dialog"]'), text: active?.textContent ?? "" };
          });
          expect(focus.tag, `after answer ${i + 1} focus must be on the next question heading`).toBe("H3");
          expect(focus.inDialog).toBe(true);
          await expect(page.getByText(t.label(i + 2))).toBeVisible();
        }
      }
      await expect(page.getByText(t.scoreLabel)).toBeVisible();
      const afterResult = await page.evaluate(() => ({
        isBody: document.activeElement === document.body,
        inDialog: !!document.activeElement?.closest('[role="dialog"]'),
      }));
      expect(afterResult.isBody).toBe(false);
      expect(afterResult.inDialog).toBe(true);
    });

    test("criteria 7-8: result order is score, breakdown, then one box with exactly two controls", async ({ page }) => {
      await openQuiz(page, lang);
      await answerAll(page);
      const dialog = page.locator(DIALOG);
      await expect(dialog.getByText(t.scoreLabel)).toBeVisible();

      const order = await page.evaluate(
        ([scoreLabel, bookingUrl]) => {
          const root = document.querySelector('[role="dialog"]')!;
          const all = Array.from(root.querySelectorAll("*"));
          const score = all.find((el) => el.children.length === 0 && el.textContent === scoreLabel);
          const rows = all.filter((el) => el.children.length === 0 && /^\d\/6$/.test(el.textContent ?? ""));
          const link = root.querySelector(`a[href="${bookingUrl}"]`);
          const box = link?.parentElement?.parentElement;
          const controls = box ? Array.from(box.querySelectorAll(":scope > div > a, :scope > div > button")) : [];
          const follows = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
          return {
            rows: rows.length,
            scoreBeforeRows: !!score && rows.every((r) => follows(score, r)),
            rowsBeforeBox: !!box && rows.every((r) => follows(r, box)),
            controls: controls.map((c) => `${c.tagName}:${c.textContent?.trim()}`),
          };
        },
        [t.scoreLabel, BOOKING_URL]
      );
      expect(order.rows).toBe(5);
      expect(order.scoreBeforeRows).toBe(true);
      expect(order.rowsBeforeBox).toBe(true);
      expect(order.controls).toEqual([`A:${t.book}`, `BUTTON:${t.save}`]);

      await expect(dialog.getByText(t.lowBand)).toBeVisible();
      await expect(dialog.getByRole("link", { name: t.book })).toBeVisible();
      await expect(dialog.getByRole("button", { name: t.save })).toBeVisible();

      // No old lead heading, exactly one booking link.
      await expect(dialog.getByText(t.oldLeadHeading)).toHaveCount(0);
      await expect(dialog.locator(`a[href="${BOOKING_URL}"]`)).toHaveCount(1);
    });

    test("criterion 9: the e-mail form opens only after the toggle, with focus in the e-mail field", async ({ page }) => {
      await openQuiz(page, lang);
      await answerAll(page);
      const dialog = page.locator(DIALOG);
      const toggle = dialog.getByRole("button", { name: t.save });

      await expect(dialog.getByPlaceholder(t.email)).toBeHidden();
      await expect(dialog.locator('input[type="checkbox"]')).toBeHidden();
      await expect(dialog.getByRole("button", { name: t.submit })).toBeHidden();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");

      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(dialog.getByPlaceholder(t.email)).toBeVisible();
      await expect(dialog.locator('input[type="checkbox"]')).toBeVisible();
      await expect(dialog.getByRole("button", { name: t.submit })).toBeVisible();
      await expect(dialog.getByPlaceholder(t.email)).toBeFocused();
    });

    test("criterion 10: the folded-open form POSTs the byte-identical body; 200 thanks, non-200 errors, consent blocks", async ({
      page,
    }) => {
      const requests = await mockFormPost(page, 200);
      await openQuiz(page, lang);
      await answerAll(page);
      const dialog = page.locator(DIALOG);
      await dialog.getByRole("button", { name: t.save }).click();

      await expect(dialog.getByRole("link", { name: t.privacy })).toHaveAttribute("href", `/${lang}/datenschutz`);
      await dialog.getByPlaceholder(t.email).fill("lead@example.com");
      await dialog.getByRole("button", { name: t.submit }).click();
      expect(requests, "native validation blocks the submit without consent").toHaveLength(0);

      await dialog.locator('input[type="checkbox"]').check();
      await dialog.getByRole("button", { name: t.submit }).click();
      await expect(dialog.getByText(t.thanks)).toBeVisible();
      expect(requests).toHaveLength(1);
      expect(requests[0].method()).toBe("POST");
      expect(requests[0].postData()).toBe(
        `form-name=pulse-score-leads&email=lead%40example.com&score=0&band=${t.band}&weakest=${t.weakest}&lang=${lang}&bot-field=`
      );
    });

    test("criterion 10: a non-200 shows the inline error and no thank-you", async ({ page }) => {
      await mockFormPost(page, 500);
      await openQuiz(page, lang);
      await answerAll(page);
      const dialog = page.locator(DIALOG);
      await dialog.getByRole("button", { name: t.save }).click();
      await dialog.getByPlaceholder(t.email).fill("lead@example.com");
      await dialog.locator('input[type="checkbox"]').check();
      await dialog.getByRole("button", { name: t.submit }).click();
      await expect(dialog.getByText(t.error)).toBeVisible();
      await expect(dialog.getByText(t.thanks)).toHaveCount(0);
    });

    test("criterion 11: tracking — Quiz Started once per open and per restart, Completed once, booking click once, no toggle event", async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen#pulse-score`);
      const dialog = page.locator(DIALOG);
      await expect(dialog).toBeVisible();

      let started = await propsFor(page, "Quiz Started");
      expect(started).toHaveLength(1);
      expect(started[0].cta).toBe("quiz");
      expect(started[0].placement).toBe("leistungen-hero");
      expect(await propsFor(page, "Quiz Completed")).toHaveLength(0);

      await answerAll(page);
      await expect(dialog.getByText(t.scoreLabel)).toBeVisible();
      const completed = await propsFor(page, "Quiz Completed");
      expect(completed).toHaveLength(1);
      expect(completed[0].cta).toBe("quiz");
      expect(completed[0].placement).toBe("leistungen-hero");

      // The toggle fires nothing.
      const before = await totalCalls(page);
      await dialog.getByRole("button", { name: T[lang].save }).click();
      await expect(dialog.getByPlaceholder(t.email)).toBeVisible();
      expect(await totalCalls(page)).toBe(before);

      // The booking link fires Call Link Clicked once and opens a new tab.
      const popupPromise = page.waitForEvent("popup");
      await dialog.getByRole("link", { name: t.book }).click();
      const popup = await popupPromise;
      expect(popup.url()).toContain("calendar.app.google");
      await popup.close();
      const calls = await propsFor(page, "Call Link Clicked");
      expect(calls).toHaveLength(1);
      expect(calls[0].placement).toBe("quiz-result");
      expect(calls[0].cta).toBe("book-call");

      // Restart: back on question 1, Quiz Started once more.
      await dialog.getByRole("button", { name: t.restart }).click();
      await expect(dialog.getByText(t.label(1))).toBeVisible();
      await expect(dialog.getByText(t.meta)).toBeVisible();
      started = await propsFor(page, "Quiz Started");
      expect(started).toHaveLength(2);
      expect(await propsFor(page, "Quiz Completed")).toHaveLength(1);
    });

    test("criterion 11: two openers give two different Quiz Started placements", async ({ page }) => {
      await page.goto(`/${lang}/leistungen`);
      await page.getByRole("button", { name: t.opener }).first().click();
      await expect(page.locator(DIALOG)).toBeVisible();
      // Close with the Radix close button: an Escape pressed in the first
      // milliseconds after the dialog renders can beat Radix's own key listener.
      await page.getByRole("button", { name: "Close" }).click();
      await expect(page.locator(DIALOG)).toBeHidden();
      await page.getByRole("button", { name: t.opener }).nth(1).click();
      await expect(page.locator(DIALOG)).toBeVisible();

      const started = await propsFor(page, "Quiz Started");
      expect(started.map((s) => s.placement)).toEqual(["leistungen-hero", "leistungen-pulse-callout"]);
    });

    test("criterion 14: answers summing to 15/30 score 50 in the lower band", async ({ page }) => {
      await openQuiz(page, lang);
      for (const idx of [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]) {
        const options = page.locator(OPTION_BUTTONS);
        await expect(options.nth(idx)).toBeVisible();
        await options.nth(idx).click();
      }
      const dialog = page.locator(DIALOG);
      await expect(dialog.getByText(t.scoreLabel)).toBeVisible();
      await expect(dialog.getByText("50", { exact: true })).toBeVisible();
      await expect(dialog.getByText(t.lowBand)).toBeVisible();
      await expect(dialog.getByText(t.topBand)).toHaveCount(0);
    });
  });
}
