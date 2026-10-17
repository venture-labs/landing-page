/**
 * 20261016-leistungen-ihre-situation-variant-c-changes-desi — Tester's tests.
 *
 * S13 extends S11's "Ihre Situation" block (VL-5-S13, CONCEPT.md §S13): every
 * situation now names an example agent, not only the receipts one. S11's own
 * suite (tests/e2e/situations-section.spec.ts) asserted S11's superseded
 * pre-D1 fixtures (duplicate "Beleg-Inbox" for invoice-coverage, the old
 * slogan-style agent names, the old "(30 Min.)" CTA label) — per the spec's
 * own Assumptions ("S13 owns the block's end state, whatever S11 happens to
 * leave behind") and the Dev Manager's round-4 instruction, that file has
 * been retired and its two still-unique, still-valid assertions (keyboard
 * *activation*, not just focus, on the shared CTA; no horizontal scroll at
 * 390px/1440px) are folded into this file's criterion 10 and the new
 * "layout" describe block below. This file now covers S13's acceptance
 * criteria 1-10 against the current, shipped content.
 *
 * Run exactly as tests/e2e/playwright.config.ts documents: `pnpm build`,
 * then `pnpm exec vite preview --port <port>`, then this file against
 * PW_BASE_URL=http://localhost:<port>.
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";
const ALLOWED_ACCENTS = ["#2b95f6", "#a318f8", "#fda700", "#8129ff"];
// The browser serialises an inline hex background-color back as rgb(...),
// so compare against the resolved rgb triplets rather than the literal hex.
const ALLOWED_ACCENT_RGB = ALLOWED_ACCENTS.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
});

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
  }
}

type Situation = {
  text: string;
  agentName: string;
  isExample: boolean;
  capabilities: string[];
};

const SITUATIONS: Record<"de" | "en", Situation[]> = {
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
const EXAMPLE_MARKER: Record<"de" | "en", string> = { de: "Beispiel", en: "Example" };
const CTA_LABEL: Record<"de" | "en", string> = {
  de: "Kostenloses Erstgespräch buchen",
  en: "Book a free intro call",
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
  test.describe(`/${lang}/leistungen — Ihre Situation block (S13 agents)`, () => {
    test.beforeEach(async ({ page }) => {
      await blockOutbound(page.context());
      await withRecorder(page);
      await page.goto(`/${lang}/leistungen`);
    });

    test(`criteria 2-3: all five situations render their quote, named agent and capabilities (${lang})`, async ({ page }) => {
      for (const situation of SITUATIONS[lang]) {
        await expect(page.getByText(situation.text, { exact: false })).toBeVisible();
        await expect(page.getByText(situation.agentName, { exact: true })).toBeVisible();
        for (const capability of situation.capabilities) {
          await expect(page.getByText(capability, { exact: false })).toBeVisible();
        }
      }
      // Every agent name must be distinct (receipts + 4 example agents).
      const names = new Set(SITUATIONS[lang].map((s) => s.agentName));
      expect(names.size).toBe(5);
    });

    test(`criterion 3: the receipts situation names Beleg-Inbox with exactly these 3 capabilities, no marker (${lang})`, async ({
      page,
    }) => {
      const receipts = SITUATIONS[lang][0];
      expect(receipts.agentName).toBe("Beleg-Inbox");
      expect(receipts.capabilities).toHaveLength(3);
      // The Beleg-Inbox card must not carry the "Beispiel"/"Example" marker,
      // even though the word appears once elsewhere on the page (the other
      // 4 cards). Scope to the card containing the receipts quote text.
      const card = page.locator("div", { has: page.getByText(receipts.text, { exact: false }) }).last();
      await expect(card.getByText(EXAMPLE_MARKER[lang], { exact: true })).toHaveCount(0);
    });

    test(`criterion 4: the other 4 situations each carry a visible "${EXAMPLE_MARKER[lang]}" marker (${lang})`, async ({
      page,
    }) => {
      for (const situation of SITUATIONS[lang].slice(1)) {
        const card = page.locator("div", { has: page.getByText(situation.text, { exact: false }) }).last();
        await expect(card.getByText(EXAMPLE_MARKER[lang], { exact: true })).toBeVisible();
      }
      // Exactly 4 markers on the whole page (one per example agent).
      await expect(page.getByText(EXAMPLE_MARKER[lang], { exact: true })).toHaveCount(4);
    });

    test(`criterion 8: no agent name is wrapped in an <a> (${lang})`, async ({ page }) => {
      for (const situation of SITUATIONS[lang]) {
        const asLink = page.locator(`a:has-text("${situation.agentName}")`);
        await expect(asLink).toHaveCount(0);
      }
    });

    test(`criterion 5: no situation card carries its own CTA; exactly one shared CTA closes the block, with no price/duration claim (${lang})`, async ({
      page,
    }) => {
      const heading = HEADING[lang];
      const section = page.locator("section", { has: page.getByText(heading, { exact: true }) });
      await expect(section).toHaveCount(1);

      const sharedCta = section.getByRole("link", { name: CTA_LABEL[lang], exact: true });
      await expect(sharedCta).toHaveCount(1);
      await expect(sharedCta).toHaveAttribute("href", BOOKING_URL);
      await expect(sharedCta).toHaveAttribute("target", "_blank");
      await expect(await sharedCta.getAttribute("rel")).toMatch(/noopener/);

      // Exactly one interactive element inside the whole section — no
      // per-situation link/button, only the one shared CTA.
      await expect(section.locator("a, button")).toHaveCount(1);

      const text = (await sharedCta.textContent()) ?? "";
      expect(text).not.toMatch(/\d[\d.,]*\s*(€|EUR|Euro)/i);
      expect(text).not.toMatch(/\d+\s*-?\s*min/i);
    });

    test(`criterion 5: clicking the shared CTA fires exactly one "Call Link Clicked" event (${lang})`, async ({ page }) => {
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

    test(`criterion 1: the block sits between the skill grid and the Pulse callout, below SkillMatrix (${lang})`, async ({
      page,
    }) => {
      const situationsY = await page
        .getByText(HEADING[lang], { exact: true })
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      const skillsY = await page
        .getByText(SKILLS_HEADING[lang], { exact: true })
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      const ctaY = await page
        .getByText(CTA_HEADING[lang], { exact: true })
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      expect(situationsY, "Ihre Situation must render below the skill grid (SkillMatrix)").toBeGreaterThan(skillsY);
      expect(situationsY, "Ihre Situation must render above the Pulse callout").toBeLessThan(ctaY);
    });

    test(`criterion 9: card accent colours are drawn only from the pre-existing palette (${lang})`, async ({ page }) => {
      for (const situation of SITUATIONS[lang]) {
        const card = page.locator("div", { has: page.getByText(situation.text, { exact: false }) }).last();
        const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
        const usesAllowedHex = ALLOWED_ACCENT_RGB.some((rgb) => bg.includes(rgb));
        expect(usesAllowedHex, `card computed background-color "${bg}" uses no pre-existing accent hex`).toBe(true);
      }
    });
  });
}

test.describe("criterion 10: the shared CTA is keyboard reachable with a visible focus ring", () => {
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
          return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
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

      // Real Tab-only reachability of this specific element (the navbar
      // and footer carry their own booking link to the same BOOKING_URL).
      await page.goto("/de/leistungen");
      const sharedCtaHandle = await sharedCta.elementHandle();
      expect(sharedCtaHandle, "the shared CTA element could not be resolved").not.toBeNull();

      let reached = false;
      for (let i = 0; i < 60 && !reached; i++) {
        await page.keyboard.press("Tab");
        reached = await page.evaluate((el) => document.activeElement === el, sharedCtaHandle);
      }
      expect(
        reached,
        "the shared situations CTA never became document.activeElement via Tab"
      ).toBe(true);

      // And that it is actually activatable by keyboard, not merely
      // focusable: Enter on the focused CTA must open a new tab AND that tab
      // must actually request BOOKING_URL (captured before blockOutbound's
      // route.abort() turns it into a chrome-error page, so the assertion
      // does not depend on the aborted page's final URL).
      const popupPromise = page.waitForEvent("popup").catch(() => null);
      const requestPromise = page
        .context()
        .waitForEvent("request", { predicate: (req) => req.url() === BOOKING_URL, timeout: 5000 })
        .catch(() => null);
      await page.keyboard.press("Enter");
      const [popup, bookingRequest] = await Promise.all([popupPromise, requestPromise]);
      expect(popup, "pressing Enter on the focused shared CTA did not open a new tab").not.toBeNull();
      expect(bookingRequest, "pressing Enter on the focused shared CTA did not request the booking URL").not.toBeNull();
      if (popup) await popup.close();
    });
  }
});

test.describe("layout: no horizontal scroll at 390px/1440px", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    for (const lang of ["de", "en"] as const) {
      test(`/${lang}/leistungen at ${viewport.width}px introduces no horizontal scroll`, async ({ page }) => {
        await blockOutbound(page.context());
        await page.setViewportSize(viewport);
        await page.goto(`/${lang}/leistungen`);
        await expect(page.getByText(HEADING[lang], { exact: true })).toBeVisible();

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(
          scrollWidth,
          `document is wider than the viewport at ${viewport.width}px (scrollWidth ${scrollWidth} > clientWidth ${clientWidth})`
        ).toBeLessThanOrEqual(clientWidth + 1);
      });
    }
  }
});
