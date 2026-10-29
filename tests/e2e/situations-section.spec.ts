/**
 * 20261028-leistungsseite-use-cases-as-one-section-in-situa (VL-11-S9), criteria 9-18.
 *
 * Adapted in place from the pre-S3 "Ihre Situation" spec (S11/S13): per the repo rule "a test may
 * change with the design but never disappear" the old file's checks stay where they still apply
 * (the card shape, the single shared CTA with a ring and a keyboard path, the allowed accent
 * palette, the overflow probe) and move to the new shape - ONE carousel of 20 to 24 situation
 * cards directly after "Check. Build. Care.", Beleg-Inbox first, no status pill on any card
 * (removed 2026-10-29), prev/next buttons and a "k / n" position text instead of the dot row.
 *
 * The cards are read from content/site/leistungen*.md (gray-matter), so this file holds no copy
 * of the texts. Run exactly as `tests/e2e/playwright.config.ts` documents (a `pnpm build` and a
 * preview first, e.g. `pnpm exec vite preview --port 4173`). Nothing leaves the machine:
 * plausible.io and the booking page are aborted.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { test, expect, type BrowserContext, type Locator, type Page } from "@playwright/test";

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";
const CTA_LABEL: Record<"de" | "en", string> = {
  de: "Kostenloses Erstgespräch buchen",
  en: "Book a free intro call",
};
const ALLOWED_ACCENTS = ["#2b95f6", "#a318f8", "#fda700", "#8129ff"];
// The browser serialises an inline hex background-color back as rgb(...), so
// compare against the resolved rgb triplets rather than the literal hex.
const ALLOWED_ACCENT_RGB = ALLOWED_ACCENTS.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
});
const EXAMPLE_MARKER: Record<"de" | "en", string> = { de: "Beispiel", en: "Example" };
const LIVE_MARKER: Record<"de" | "en", string> = { de: "läuft bei uns", en: "Runs at our company" };
const HEADING: Record<"de" | "en", string> = { de: "Mögliche Use Cases", en: "Possible use cases" };
const PREV_LABEL: Record<"de" | "en", string> = { de: "Vorherige Karte", en: "Previous card" };
const NEXT_LABEL: Record<"de" | "en", string> = { de: "Nächste Karte", en: "Next card" };
const CORE_HEADING = "Check. Build. Care.";
const CLUSTER_HEADING: Record<"de" | "en", string> = {
  de: "Wie dein Cluster bei uns entsteht",
  en: "How your cluster takes shape with us",
};
const CALLOUT_HEADING: Record<"de" | "en", string> = {
  de: "Noch unklar, wo du stehst?",
  en: "Not sure where you stand?",
};
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

interface Situation {
  id: string;
  text: string;
  agentName: string;
  capabilities: string[];
}

const FILES: Record<"de" | "en", string> = {
  de: "content/site/leistungen.md",
  en: "content/site/leistungen.en.md",
};
const SITUATIONS: Record<"de" | "en", Situation[]> = {
  de: matter(readFileSync(resolve(process.cwd(), FILES.de), "utf8")).data.situations,
  en: matter(readFileSync(resolve(process.cwd(), FILES.en), "utf8")).data.situations,
};

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
  }
}

async function blockOutbound(context: BrowserContext): Promise<void> {
  await context.route("**://plausible.io/**", (route) => route.abort());
  await context.route("**://calendar.app.google/**", (route) => route.abort());
}

async function withRecorder(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__plausibleCalls = [];
    window.plausible = (...args: unknown[]) => {
      window.__plausibleCalls!.push(args);
    };
  });
}

/** The use-case section, identified by its own h2. */
function sectionOf(page: Page, lang: "de" | "en"): Locator {
  return page.locator("section", { has: page.getByRole("heading", { level: 2, name: HEADING[lang], exact: true }) });
}

/** The cards: every carousel slide of the section. */
function cardsOf(section: Locator): Locator {
  return section.locator('[aria-roledescription="slide"]');
}

for (const lang of ["de", "en"] as const) {
  const situations = SITUATIONS[lang];
  const total = situations.length;

  test.describe(`/${lang}/leistungen - all use cases as one section`, () => {
    test.beforeEach(async ({ page }) => {
      await blockOutbound(page.context());
      await withRecorder(page);
    });

    test(`criterion 9: the section is the next sibling of #ablauf, followed by #skills, the cluster story and the callout (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      await expect(page.locator("#ablauf").getByRole("heading", { name: CORE_HEADING, exact: true })).toHaveCount(1);

      const sectionIsNextSibling = await page.evaluate((heading) => {
        const next = document.querySelector("#ablauf")?.nextElementSibling;
        return next?.tagName === "SECTION" && next.querySelector("h2")?.textContent === heading;
      }, HEADING[lang]);
      expect(sectionIsNextSibling, "the use-case section must be the element right after #ablauf").toBe(true);

      const nextAfterSection = await page.evaluate(() => {
        const section = document.querySelector("#ablauf")?.nextElementSibling;
        return section?.nextElementSibling?.id ?? null;
      });
      expect(nextAfterSection).toBe("skills");

      const top = (name: string) =>
        page.getByRole("heading", { name, exact: true }).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      const sectionY = await top(HEADING[lang]);
      const clusterY = await top(CLUSTER_HEADING[lang]);
      const calloutY = await top(CALLOUT_HEADING[lang]);
      expect(sectionY).toBeLessThan(clusterY);
      expect(clusterY).toBeLessThan(calloutY);

      // The old second section and its counter are gone.
      await expect(page.getByText("Was sonst noch möglich ist", { exact: false })).toHaveCount(0);
      await expect(page.getByText("What else is possible", { exact: false })).toHaveCount(0);
      await expect(page.getByText(/(von|of) 16\b/)).toHaveCount(0);
    });

    test(`criterion 10: one h2, one card per situation, exactly one link - the booking CTA (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/leistungen`);
      const section = sectionOf(page, lang);
      await expect(section).toHaveCount(1);
      await expect(section.locator("h2")).toHaveCount(1);
      await expect(cardsOf(section)).toHaveCount(total);
      expect(total).toBeGreaterThanOrEqual(20);
      expect(total).toBeLessThanOrEqual(24);

      const links = section.locator("a");
      await expect(links).toHaveCount(1);
      await expect(links.first()).toHaveAttribute("href", BOOKING_URL);
      await expect(links.first()).toHaveAttribute("target", "_blank");
      expect(await links.first().getAttribute("rel")).toMatch(/noopener/);
      // No card has a control of its own: only prev, next (buttons) and the CTA (link).
      await expect(cardsOf(section).locator("a, button")).toHaveCount(0);
      await expect(section.locator("button")).toHaveCount(2);
    });

    test(`criterion 11: no card carries a status pill, Beleg-Inbox is still the first card (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const section = sectionOf(page, lang);
      const cards = cardsOf(section);

      await expect(cards.nth(0).getByText("Beleg-Inbox", { exact: true })).toHaveCount(1);
      await expect(section.getByText(EXAMPLE_MARKER[lang], { exact: true })).toHaveCount(0);
      await expect(section.getByText(LIVE_MARKER[lang], { exact: true })).toHaveCount(0);
    });

    test(`criterion 12: each card shows its quoted problem text on top, then the agent name and one check-mark item per capability (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const cards = cardsOf(sectionOf(page, lang));
      for (let i = 0; i < total; i++) {
        const situation = situations[i];
        const card = cards.nth(i);
        await expect(card.locator("p").first(), situation.id).toContainText(situation.text);
        await expect(card.getByText(situation.agentName, { exact: true }), situation.id).toHaveCount(1);
        await expect(card.locator("li"), situation.id).toHaveCount(situation.capabilities.length);
        for (const capability of situation.capabilities) {
          await expect(card.locator("li", { hasText: capability }), `${situation.id}: ${capability}`).toHaveCount(1);
        }
        // The problem text sits above the agent name.
        const textBox = await card.locator("p").first().boundingBox();
        const nameBox = await card.getByText(situation.agentName, { exact: true }).boundingBox();
        expect(textBox && nameBox && textBox.y < nameBox.y, situation.id).toBe(true);
      }
    });

    test(`criterion 13: prev/next buttons and the "k / n" text move through all ${total} cards, the dot row is gone (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const section = sectionOf(page, lang);
      const prev = section.getByRole("button", { name: PREV_LABEL[lang], exact: true });
      const next = section.getByRole("button", { name: NEXT_LABEL[lang], exact: true });
      const position = (k: number) => section.getByText(`${k} / ${total}`, { exact: true });

      await expect(position(1)).toBeVisible();
      await expect(prev).toBeDisabled();
      await expect(next).toBeEnabled();

      await next.click();
      await expect(position(2)).toBeVisible();
      await expect(prev).toBeEnabled();

      // No dot per card: the section has only the prev and next buttons.
      await expect(section.locator("button")).toHaveCount(2);

      // Walk to the end, waiting for each position text; the next button is
      // disabled exactly on the last card.
      for (let k = 3; k <= total; k++) {
        await next.click();
        await expect(position(k), `position ${k} / ${total}`).toBeVisible();
      }
      await expect(next).toBeDisabled();
      await expect(prev).toBeEnabled();

      // And back to card 1: the first button is disabled again.
      for (let k = total - 1; k >= 1; k--) {
        await prev.click();
        await expect(position(k), `position ${k} / ${total}`).toBeVisible();
      }
      await expect(prev).toBeDisabled();
      await expect(next).toBeEnabled();
    });

    test(`criterion 17: clicking the booking CTA fires exactly one "Call Link Clicked" with placement "situations" and cta "book-call" (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const cta = sectionOf(page, lang).getByRole("link", { name: CTA_LABEL[lang], exact: true });
      await expect(cta).toHaveCount(1);
      const popupPromise = page.waitForEvent("popup").catch(() => null);
      await cta.click();
      const popup = await popupPromise;
      if (popup) await popup.close();

      const calls = await page.evaluate(() => window.__plausibleCalls ?? []);
      const callLinkClicked = calls.filter((args) => args[0] === "Call Link Clicked");
      expect(callLinkClicked.length).toBe(1);
      expect(callLinkClicked[0][1]).toMatchObject({ props: { placement: "situations", cta: "book-call" } });
    });

    test(`criterion 18: card accent colours are drawn only from the pre-existing palette (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/leistungen`);
      const cards = cardsOf(sectionOf(page, lang));
      for (let i = 0; i < total; i++) {
        const bg = await cards
          .nth(i)
          .locator("> div")
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor);
        const usesAllowedHex = ALLOWED_ACCENT_RGB.some((rgb) => bg.includes(rgb));
        expect(usesAllowedHex, `card ${i + 1} computed background-color "${bg}" uses no pre-existing accent hex`).toBe(true);
      }
    });

    test(`criterion 16: the cards are in the server-rendered HTML without client JS (${lang})`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      await blockOutbound(context);
      const page = await context.newPage();
      // With the trailing slash vite preview serves the route's own prerendered shell.
      await page.goto(`/${lang}/leistungen/`);
      const rootText = (await page.locator("#root").textContent()) ?? "";
      for (const situation of situations) {
        expect(rootText, situation.id).toContain(situation.text);
      }
      await context.close();
    });
  });
}

test.describe("criterion 14: layout at 390px and 1440px", () => {
  for (const viewport of VIEWPORTS) {
    for (const lang of ["de", "en"] as const) {
      test(`/${lang}/leistungen at ${viewport.width}px: one horizontal row, no horizontal page overflow, controls inside the viewport`, async ({
        page,
      }) => {
        await blockOutbound(page.context());
        await page.setViewportSize(viewport);
        await page.goto(`/${lang}/leistungen`);

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth, `document is wider than the viewport at ${viewport.width}px`).toBeLessThanOrEqual(clientWidth + 1);

        const section = sectionOf(page, lang);
        const cards = cardsOf(section);
        // One row: all cards share the same top edge.
        const tops = await cards.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
        expect(new Set(tops).size, "the cards are not in one horizontal row").toBe(1);

        await section.getByRole("button", { name: NEXT_LABEL[lang], exact: true }).scrollIntoViewIfNeeded();
        const prev = await section.getByRole("button", { name: PREV_LABEL[lang], exact: true }).boundingBox();
        const next = await section.getByRole("button", { name: NEXT_LABEL[lang], exact: true }).boundingBox();
        const position = await section.getByText(/^\d+ \/ \d+$/).boundingBox();
        for (const box of [prev, next, position]) {
          expect(box).not.toBeNull();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
        }
      });
    }
  }
});

test.describe("criterion 15: keyboard and reduced motion", () => {
  for (const viewport of VIEWPORTS) {
    test(`de/leistungen at ${viewport.width}px: Tab/Shift+Tab reach prev, next and the CTA with a visible ring; Enter/Space move the cards; Enter on the CTA opens the booking URL`, async ({
      page,
    }) => {
      await blockOutbound(page.context());
      await page.setViewportSize(viewport);
      await page.goto("/de/leistungen");

      const section = sectionOf(page, "de");
      const n = SITUATIONS.de.length;
      const prev = section.getByRole("button", { name: PREV_LABEL.de, exact: true });
      const next = section.getByRole("button", { name: NEXT_LABEL.de, exact: true });
      const cta = section.getByRole("link", { name: CTA_LABEL.de, exact: true });
      await expect(cta).toHaveCount(1);
      const isActive = (locator: Locator) => locator.evaluate((el) => document.activeElement === el);

      const ringOf = (locator: Locator) =>
        locator.evaluate((el) => {
          const s = getComputedStyle(el);
          return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
        });
      // A focus ring must appear because of focus: the focused style differs from the unfocused one.
      const expectRingOnFocus = async (control: Locator, name: string) => {
        await control.evaluate((el) => (el as HTMLElement).blur());
        const unfocused = await ringOf(control);
        await control.focus();
        const focused = await ringOf(control);
        const drawsSomething =
          (focused.outlineStyle !== "none" && parseFloat(focused.outlineWidth) > 0) ||
          (focused.boxShadow !== "none" && focused.boxShadow !== "");
        expect(drawsSomething, `${name}: no visible ring on focus: ${JSON.stringify(focused)}`).toBe(true);
        expect(JSON.stringify(focused), `${name}: focused and unfocused styles are identical`).not.toBe(
          JSON.stringify(unfocused)
        );
      };

      // Move to card 2 first so the previous button is enabled and can take focus.
      // (By keyboard, so the later programmatic focus() keeps :focus-visible semantics.)
      await next.scrollIntoViewIfNeeded();
      await next.focus();
      await page.keyboard.press("Enter");
      await expect(section.getByText(`2 / ${n}`, { exact: true })).toBeVisible();
      await expect(prev).toBeEnabled();
      for (const [control, name] of [
        [prev, "prev"],
        [next, "next"],
        [cta, "cta"],
      ] as const) {
        await control.scrollIntoViewIfNeeded();
        await expectRingOnFocus(control, name);
      }

      // Real Tab-only reachability of the section's own controls (the navbar and footer carry
      // their own booking links, so matching by href alone would prove nothing). Start over on
      // card 1, where prev is disabled and skipped: Tab reaches next, Enter and Space move on.
      await page.goto("/de/leistungen");
      let reachedNext = false;
      for (let i = 0; i < 80 && !reachedNext; i++) {
        await page.keyboard.press("Tab");
        reachedNext = await isActive(next);
      }
      expect(reachedNext, "the next button never became document.activeElement via Tab").toBe(true);
      await page.keyboard.press("Enter");
      await expect(section.getByText(`2 / ${n}`, { exact: true })).toBeVisible();
      await page.keyboard.press("Space");
      await expect(section.getByText(`3 / ${n}`, { exact: true })).toBeVisible();

      // On card 3 the previous button is enabled: Shift+Tab reaches it, Enter moves back.
      await page.keyboard.press("Shift+Tab");
      expect(await isActive(prev), "Shift+Tab from next did not land on the previous button").toBe(true);
      await page.keyboard.press("Enter");
      await expect(section.getByText(`2 / ${n}`, { exact: true })).toBeVisible();

      // Tab on to the booking CTA and activate it by keyboard: a new tab must open AND request
      // BOOKING_URL (captured before blockOutbound's route.abort() turns it into an error page).
      await page.keyboard.press("Tab");
      expect(await isActive(next), "Tab from prev did not land on the next button").toBe(true);
      await page.keyboard.press("Tab");
      expect(await isActive(cta), "Tab from next did not land on the booking CTA").toBe(true);

      const popupPromise = page.waitForEvent("popup").catch(() => null);
      const requestPromise = page
        .context()
        .waitForEvent("request", { predicate: (req) => req.url() === BOOKING_URL, timeout: 5000 })
        .catch(() => null);
      await page.keyboard.press("Enter");
      const [popup, bookingRequest] = await Promise.all([popupPromise, requestPromise]);
      expect(popup, "pressing Enter on the focused CTA did not open a new tab").not.toBeNull();
      expect(bookingRequest, "pressing Enter on the focused CTA did not request the booking URL").not.toBeNull();
      if (popup) await popup.close();
    });
  }

  test("under prefers-reduced-motion the move jumps to the next card without animated scroll", async ({ page }) => {
    await blockOutbound(page.context());
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de/leistungen");
    const section = sectionOf(page, "de");
    const next = section.getByRole("button", { name: NEXT_LABEL.de, exact: true });
    const second = cardsOf(section).nth(1);
    const firstLeft = (await cardsOf(section).nth(0).boundingBox())!.x;
    await next.click();
    // A jump lands on the next snap in the same frame; an animated move would still be in flight.
    await expect(section.getByText(`2 / ${SITUATIONS.de.length}`, { exact: true })).toBeVisible();
    const secondLeft = (await second.boundingBox())!.x;
    expect(Math.abs(secondLeft - firstLeft), "the second card must now sit where the first one was").toBeLessThan(2);
  });
});
