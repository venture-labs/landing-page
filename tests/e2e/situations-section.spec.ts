/**
 * 20261016-leistungen-ihre-situation-entry-with-a-free-30-m (S11), adapted
 * for 20261016-leistungen-ihre-situation-variant-c-changes-desi (S13).
 *
 * Originally written against S11's pre-D1 shape of the "Ihre Situation"
 * block (duplicate "Beleg-Inbox" agent on two situations, slogan-style agent
 * names for the rest, a per-CTA "(30 Min.)"/"30-minute" duration suffix, and
 * placement directly below "Check. Build. Care."). S13's change request
 * ("Wir bräuchten für jede Aussage Beispielagenten, die das Problem lösen
 * könnten") and VL-5-D1 replace that shape on purpose (spec Assumptions:
 * "S13 owns the block's end state, whatever S11 happens to leave behind").
 * Per Christian's constraint-floor answer — "a test may change with the
 * design but never disappear" — this file is adapted in place rather than
 * deleted: the five situations' fixtures, the "Beispiel"/"Example" marker on
 * the four illustrative agents, the duration-free CTA label, and the block's
 * new placement (below SkillMatrix, above the closing Pulse callout) all
 * reflect the current, shipped content. It still proves what the Implementer's
 * own mechanical checks (`pnpm check:naming`, `pnpm check:analytics`) cannot
 * reach because the block is client-rendered.
 *
 * D10: `tests/e2e/situations-section-example-agents.spec.ts` was written
 * independently by the Tester on the (then correct) assumption that this
 * file would be retired; once Christian's constraint-floor answer kept this
 * file instead, the two duplicated the same criteria 1-10 against the same
 * fixtures. Criterion 9 (the accent-colour check), the one assertion that
 * file had and this one didn't, is folded in below; the duplicate file is
 * deleted. This is now the one file for this block's criteria 1-10.
 *
 * Run exactly as `tests/e2e/playwright.config.ts` documents (a `pnpm build`
 * and a preview first, e.g. `pnpm exec vite preview --port 4173`). Nothing
 * leaves the machine: plausible.io and the booking page are aborted.
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

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
const HEADING: Record<"de" | "en", string> = {
  de: "Kommt dir eine davon bekannt vor?",
  en: "Does one of these sound familiar?",
};
const SKILLS_HEADING: Record<"de" | "en", string> = {
  de: "Vier Skills. Je nachdem, was dein Fall braucht.",
  en: "Four skills. Depending on what your case needs.",
};
const CTA_HEADING: Record<"de" | "en", string> = {
  de: "Noch unklar, wo du stehst?",
  en: "Not sure where you stand?",
};

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
  }
}

const SITUATIONS: Record<"de" | "en", { text: string; agentName: string; isExample: boolean; capabilities: string[] }[]> = {
  de: [
    {
      text: "Zu jeder Abbuchung fehlt mir der Beleg.",
      agentName: "Beleg-Inbox",
      isExample: false,
      capabilities: ["Belege automatisch einsammeln", "Belegprüfungen", "Belegabgleich mit Bankauszug"],
    },
    {
      text: "Ich weiß nicht, ob alle Rechnungen eines Projekts erfasst sind.",
      agentName: "Rechnungs-Radar",
      isExample: true,
      capabilities: [
        "Rechnungen automatisch dem passenden Projekt zuordnen",
        "Fehlende Rechnungen markieren",
        "Monatsabgleich pro Projekt zusammenfassen",
      ],
    },
    {
      text: "Wir probieren seit Monaten KI-Tools aus, aber im Alltag läuft keines davon wirklich.",
      agentName: "Rollout-Lotse",
      isExample: true,
      capabilities: [
        "Einführung Schritt für Schritt pro Team begleiten",
        "Blockaden im Alltag früh erkennen",
        "Nutzung laufend sichtbar machen",
      ],
    },
    {
      text: "Ich weiß nicht, wo wir mit KI anfangen sollen – überall wird es empfohlen, aber keiner sagt, was zuerst dran ist.",
      agentName: "Fokus-Kompass",
      isExample: true,
      capabilities: [
        "Anwendungsfälle nach Aufwand und Wirkung sortieren",
        "Einen konkreten ersten Schritt vorschlagen",
        "Fortschritt über die Zeit sichtbar machen",
      ],
    },
    {
      text: "Wir haben mal ein Tool eingeführt – seitdem kümmert sich niemand mehr darum.",
      agentName: "Tool-Wächter",
      isExample: true,
      capabilities: [
        "Nutzung und Fehler laufend überwachen",
        "Verantwortliche automatisch erinnern",
        "Monatlichen Gesundheitscheck liefern",
      ],
    },
  ],
  en: [
    {
      text: "Every time money leaves the account, the receipt for it is missing.",
      agentName: "Beleg-Inbox",
      isExample: false,
      capabilities: ["Collects receipts automatically", "Checks every receipt", "Matches receipts against the bank statement"],
    },
    {
      text: "I don't know if every invoice for a project has actually been captured.",
      agentName: "Invoice Radar",
      isExample: true,
      capabilities: [
        "Match invoices to the right project automatically",
        "Flag invoices that are missing",
        "Summarise the monthly reconciliation per project",
      ],
    },
    {
      text: "We've been trying AI tools for months, but none of them actually run in daily work.",
      agentName: "Rollout Guide",
      isExample: true,
      capabilities: [
        "Walk each team through the rollout step by step",
        "Spot friction in daily use early",
        "Keep usage visible over time",
      ],
    },
    {
      text: "I don't know where to start with AI — everyone recommends it, but nobody says what comes first.",
      agentName: "Focus Compass",
      isExample: true,
      capabilities: ["Rank use cases by effort and impact", "Suggest one concrete first step", "Keep progress visible over time"],
    },
    {
      text: "We rolled out a tool once — nobody has looked after it since.",
      agentName: "Tool Watchdog",
      isExample: true,
      capabilities: [
        "Monitor usage and errors continuously",
        "Automatically remind whoever is responsible",
        "Deliver a monthly health check",
      ],
    },
  ],
};

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

for (const lang of ["de", "en"] as const) {
  test.describe(`/${lang}/leistungen — Ihre Situation block`, () => {
    test.beforeEach(async ({ page }) => {
      await blockOutbound(page.context());
      await withRecorder(page);
    });

    test(`criteria 2-3: all five situations render their quote, agent name and capabilities (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      for (const situation of SITUATIONS[lang]) {
        await expect(page.getByText(situation.text, { exact: false })).toBeVisible();
        await expect(page.getByText(situation.agentName, { exact: true }).first()).toBeVisible();
        for (const capability of situation.capabilities) {
          await expect(page.getByText(capability, { exact: false })).toBeVisible();
        }
      }
      // Every agent name is distinct (receipts + 4 illustrative agents).
      const names = new Set(SITUATIONS[lang].map((s) => s.agentName));
      expect(names.size).toBe(5);
    });

    test(`criterion 3: the receipts situation names Beleg-Inbox and carries no "${EXAMPLE_MARKER[lang]}" marker (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const receipts = SITUATIONS[lang][0];
      expect(receipts.agentName).toBe("Beleg-Inbox");
      expect(receipts.isExample).toBe(false);
      const card = page.locator("div", { has: page.getByText(receipts.text, { exact: false }) }).last();
      await expect(card.getByText(EXAMPLE_MARKER[lang], { exact: true })).toHaveCount(0);
    });

    test(`criterion 4: the other four situations each carry a visible "${EXAMPLE_MARKER[lang]}" marker (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      for (const situation of SITUATIONS[lang].filter((s) => s.isExample)) {
        const card = page.locator("div", { has: page.getByText(situation.text, { exact: false }) }).last();
        await expect(card.getByText(EXAMPLE_MARKER[lang], { exact: true })).toBeVisible();
      }
      // Exactly 4 markers on the whole page — one per illustrative agent,
      // none on Beleg-Inbox.
      await expect(page.getByText(EXAMPLE_MARKER[lang], { exact: true })).toHaveCount(4);
    });

    test(`criterion 9: card accent colours are drawn only from the pre-existing palette (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/leistungen`);
      for (const situation of SITUATIONS[lang]) {
        const card = page.locator("div", { has: page.getByText(situation.text, { exact: false }) }).last();
        const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
        const usesAllowedHex = ALLOWED_ACCENT_RGB.some((rgb) => bg.includes(rgb));
        expect(usesAllowedHex, `card computed background-color "${bg}" uses no pre-existing accent hex`).toBe(true);
      }
    });

    test(`criterion 8: no agentName is wrapped in an <a> (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/leistungen`);
      for (const situation of SITUATIONS[lang]) {
        const asLink = page.locator(`a:has-text("${situation.agentName}")`);
        await expect(asLink).toHaveCount(0);
      }
    });

    test(`criterion 5: no situation card has its own link/button; exactly one shared CTA exists in the block (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);

      // Scope to the "Ihre Situation" section itself (identified by its own
      // heading), not the whole page — the navbar/footer carry their own
      // booking links that are out of scope for this block.
      const section = page.locator("section", { has: page.getByText(HEADING[lang], { exact: true }) });
      await expect(section).toHaveCount(1);

      const sharedCta = section.getByRole("link", { name: CTA_LABEL[lang], exact: true });
      await expect(sharedCta).toHaveCount(1);
      await expect(sharedCta).toHaveAttribute("href", BOOKING_URL);
      await expect(sharedCta).toHaveAttribute("target", "_blank");
      await expect(await sharedCta.getAttribute("rel")).toMatch(/noopener/);

      // Exactly one interactive element (the shared CTA itself) inside the
      // whole section — no situation card carries a link/button of its own.
      await expect(section.locator("a, button")).toHaveCount(1);
    });

    test(`criterion 6: the shared CTA label states no price and no call duration (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/leistungen`);
      const sharedCta = page.getByRole("link", { name: CTA_LABEL[lang], exact: true });
      await expect(sharedCta).toHaveCount(1);
      const text = (await sharedCta.textContent()) ?? "";
      expect(text).not.toMatch(/\d[\d.,]*\s*(€|EUR|Euro)/i);
      expect(text).not.toMatch(/\d+\s*-?\s*min/i);
    });

    test(`criterion 5: clicking the shared CTA fires exactly one "Call Link Clicked" event, no extra args (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const sharedCta = page.getByRole("link", { name: CTA_LABEL[lang], exact: true });
      const popupPromise = page.waitForEvent("popup").catch(() => null);
      await sharedCta.click();
      const popup = await popupPromise;
      if (popup) await popup.close();

      const calls = await page.evaluate(() => window.__plausibleCalls ?? []);
      const callLinkClicked = calls.filter((args) => args[0] === "Call Link Clicked");
      expect(callLinkClicked.length).toBe(1);
      expect(callLinkClicked[0]).toEqual(["Call Link Clicked"]);
    });
  });
}

test.describe("criterion 10: the shared CTA is keyboard-reachable with a focus ring that appears because of focus", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`de/leistungen at ${viewport.width}px`, async ({ page }) => {
      await blockOutbound(page.context());
      await page.setViewportSize(viewport);
      await page.goto("/de/leistungen");

      const sharedCta = page.getByRole("link", { name: CTA_LABEL.de, exact: true });
      await expect(sharedCta).toHaveCount(1);
      await sharedCta.scrollIntoViewIfNeeded();

      const ringOf = () =>
        sharedCta.evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            outlineStyle: s.outlineStyle,
            outlineWidth: s.outlineWidth,
            boxShadow: s.boxShadow,
          };
        });

      const unfocused = await ringOf();
      await sharedCta.focus();
      const focused = await ringOf();

      const drawsSomething =
        (focused.outlineStyle !== "none" && parseFloat(focused.outlineWidth) > 0) ||
        (focused.boxShadow !== "none" && focused.boxShadow !== "");
      expect(drawsSomething, `no visible ring on focus: ${JSON.stringify(focused)}`).toBe(true);
      expect(
        JSON.stringify(focused),
        `focused and unfocused styles are identical: ${JSON.stringify(unfocused)}`
      ).not.toBe(JSON.stringify(unfocused));

      // Also prove real Tab-only reachability of THIS specific element — the
      // navbar and footer carry their own booking link to the same
      // BOOKING_URL, so matching by href alone would pass even if the
      // situations CTA itself were skipped from the tab order (e.g. a
      // regression setting tabIndex=-1 on it, which still lets .focus() work
      // programmatically above but must not satisfy this check).
      await page.goto("/de/leistungen");
      const sharedCtaHandle = await sharedCta.elementHandle();
      expect(sharedCtaHandle, "the shared CTA element could not be resolved").not.toBeNull();

      let reached = false;
      for (let i = 0; i < 60 && !reached; i++) {
        await page.keyboard.press("Tab");
        reached = await page.evaluate(
          (el) => document.activeElement === el,
          sharedCtaHandle
        );
      }
      expect(
        reached,
        "the shared situations CTA (not some other element, e.g. the navbar's booking link) never became document.activeElement via Tab"
      ).toBe(true);

      // And that it is actually activatable by keyboard, not merely
      // focusable: Enter on the focused CTA must open a new tab AND that tab
      // must actually request BOOKING_URL (captured before blockOutbound's
      // route.abort() turns it into a chrome-error page, so the assertion
      // does not depend on the aborted page's final URL).
      const popupPromise = page.waitForEvent("popup").catch(() => null);
      const requestPromise = page.context().waitForEvent("request", { predicate: (req) => req.url() === BOOKING_URL, timeout: 5000 }).catch(() => null);
      await page.keyboard.press("Enter");
      const [popup, bookingRequest] = await Promise.all([popupPromise, requestPromise]);
      expect(popup, "pressing Enter on the focused shared CTA did not open a new tab").not.toBeNull();
      expect(bookingRequest, "pressing Enter on the focused shared CTA did not request the booking URL").not.toBeNull();
      if (popup) await popup.close();
    });
  }
});

test.describe("criterion 1: layout/order/position at 390px and 1440px", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    for (const lang of ["de", "en"] as const) {
      test(`/${lang}/leistungen at ${viewport.width}px: section sits below the skill grid and above the closing Pulse callout, no horizontal scroll`, async ({
        page,
      }) => {
        await blockOutbound(page.context());
        await page.setViewportSize(viewport);
        await page.goto(`/${lang}/leistungen`);

        const situationsY = await page
          .getByText(HEADING[lang], { exact: true })
          .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        const skillsY = await page
          .getByText(SKILLS_HEADING[lang], { exact: true })
          .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        const ctaY = await page
          .getByText(CTA_HEADING[lang], { exact: true })
          .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        expect(situationsY, "the situations block must render below the skill grid (SkillMatrix)").toBeGreaterThan(skillsY);
        expect(situationsY, "the situations block must render above the closing Pulse callout").toBeLessThan(ctaY);

        // No horizontal scroll at this width.
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth, `document is wider than the viewport at ${viewport.width}px (scrollWidth ${scrollWidth} > clientWidth ${clientWidth})`).toBeLessThanOrEqual(clientWidth + 1);
      });
    }
  }
});
