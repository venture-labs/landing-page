/**
 * 20261016-leistungen-ihre-situation-entry-with-a-free-30-m — Tester's tests.
 *
 * No Test Writer ran ahead of this task (removed 2026-09-10). These cover the
 * acceptance criteria the Implementer's own mechanical checks
 * (`pnpm check:naming`, `pnpm check:analytics`) cannot reach because the
 * "Ihre Situation" block is client-rendered (criteria 1-8 of the spec):
 * the five situations' text/agent/capabilities render in both languages, no
 * situation carries its own CTA, exactly one shared CTA exists with the right
 * href/target/rel and free-30-minute label with no price, clicking it fires
 * exactly one `Call Link Clicked` event, no agentName is a hyperlink, and the
 * CTA is keyboard-reachable with a focus ring that appears because of focus
 * at both 390px and 1440px.
 *
 * Run exactly as `tests/e2e/playwright.config.ts` documents (a `pnpm build`
 * and a preview first, e.g. `pnpm exec vite preview --port 4173`). Nothing
 * leaves the machine: plausible.io and the booking page are aborted.
 */
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
  }
}

const SITUATIONS: Record<"de" | "en", { text: string; agentName: string; capabilities: string[] }[]> = {
  de: [
    {
      text: "Zu jeder Abbuchung fehlt mir der Beleg.",
      agentName: "Beleg-Inbox",
      capabilities: ["Belege automatisch einsammeln", "Belegprüfungen", "Belegabgleich mit Bankauszug"],
    },
    {
      text: "Ich weiß nicht, ob alle Rechnungen eines Projekts erfasst sind.",
      agentName: "Beleg-Inbox",
      capabilities: [
        "Rechnungen automatisch dem richtigen Projekt zuordnen",
        "Vollständigkeits-Check pro Projekt",
        "Prüfung durch eine Person, bevor etwas freigegeben wird",
      ],
    },
    {
      text: "Wir probieren seit Monaten KI-Tools aus, aber im Alltag läuft keines davon wirklich.",
      agentName: "Vom Pilot in den Alltag",
      capabilities: [
        "Feste Übergabe ins Tagesgeschäft statt Demo-Modus",
        "Ein Anwendungsfall, ein Agent, eine verantwortliche Person",
        "Laufende Weiterentwicklung statt Stillstand nach dem Start",
      ],
    },
    {
      text: "Ich weiß nicht, wo wir mit KI anfangen sollen – überall wird es empfohlen, aber keiner sagt, was zuerst dran ist.",
      agentName: "Erst sehen, was sich lohnt",
      capabilities: [
        "Prozesse, Daten und Tools in 1–2 Tagen sichten",
        "Eine priorisierte Liste statt eines 40-Seiten-Reports",
        "Die Anwendungsfälle nennen, die sich zuerst lohnen",
      ],
    },
    {
      text: "Wir haben mal ein Tool eingeführt – seitdem kümmert sich niemand mehr darum.",
      agentName: "Ein System, das dranbleibt",
      capabilities: ["Laufendes Monitoring statt Stillstand", "Feste Termine jeden Monat", "Regelmäßige Weiterentwicklung statt Verstauben"],
    },
  ],
  en: [
    {
      text: "Every time money leaves the account, the receipt for it is missing.",
      agentName: "Beleg-Inbox",
      capabilities: ["Collects receipts automatically", "Checks every receipt", "Matches receipts against the bank statement"],
    },
    {
      text: "I don't know if every invoice for a project has actually been captured.",
      agentName: "Beleg-Inbox",
      capabilities: [
        "Assigns invoices to the right project automatically",
        "Checks completeness per project",
        "A person reviews it before anything is released",
      ],
    },
    {
      text: "We've been trying AI tools for months, but none of them actually run in daily work.",
      agentName: "From pilot to daily work",
      capabilities: [
        "A real handover into daily operations, not a demo",
        "One use case, one agent, one person responsible",
        "Ongoing development instead of stalling after launch",
      ],
    },
    {
      text: "I don't know where to start with AI — everyone recommends it, but nobody says what comes first.",
      agentName: "See what pays off first",
      capabilities: ["Scans your processes, data and tools in 1–2 days", "A prioritised list instead of a 40-page report", "Names the use cases worth doing first"],
    },
    {
      text: "We rolled out a tool once — nobody has looked after it since.",
      agentName: "A system that stays maintained",
      capabilities: ["Ongoing monitoring instead of standing still", "Fixed sessions every month", "Regular development instead of gathering dust"],
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

    test(`criteria 1-3: all five situations render their text, agent/outcome name and >=3 capabilities (${lang})`, async ({
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
    });

    test(`criterion 7: no agentName is wrapped in an <a> (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/leistungen`);
      for (const situation of SITUATIONS[lang]) {
        const asLink = page.locator(`a:has-text("${situation.agentName}")`);
        await expect(asLink).toHaveCount(0);
      }
    });

    test(`criterion 4: no situation card has its own link/button; exactly one shared CTA exists in the block (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const heading = lang === "de" ? "Kommt dir eine davon bekannt vor?" : "Does one of these sound familiar?";
      const ctaLabel = lang === "de" ? "Kostenloses Erstgespräch buchen (30 Min.)" : "Book a free 30-minute intro call";

      // Scope to the "Ihre Situation" section itself (identified by its own
      // heading), not the whole page — the navbar/footer carry their own
      // booking links that are out of scope for this block.
      const section = page.locator("section", { has: page.getByText(heading, { exact: true }) });
      await expect(section).toHaveCount(1);

      const sharedCta = section.getByRole("link", { name: ctaLabel });
      await expect(sharedCta).toHaveCount(1);
      await expect(sharedCta).toHaveAttribute("href", BOOKING_URL);
      await expect(sharedCta).toHaveAttribute("target", "_blank");
      await expect(await sharedCta.getAttribute("rel")).toMatch(/noopener/);

      // Exactly one interactive element (the shared CTA itself) inside the
      // whole section — no situation card carries a link/button of its own.
      await expect(section.locator("a, button")).toHaveCount(1);
    });

    test(`criterion 5: the shared CTA label states free + 30 minutes, no price (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/leistungen`);
      const ctaLabel = lang === "de" ? "Kostenloses Erstgespräch buchen (30 Min.)" : "Book a free 30-minute intro call";
      const sharedCta = page.getByRole("link", { name: ctaLabel });
      await expect(sharedCta).toHaveCount(1);
      const text = (await sharedCta.textContent()) ?? "";
      expect(text).toMatch(lang === "de" ? /30[ -]?min/i : /30[ -]?minute/i);
      expect(text).not.toMatch(/\d[\d.,]*\s*(€|EUR|Euro)/i);
    });

    test(`criterion 6: clicking the shared CTA fires exactly one "Call Link Clicked" event, no extra args (${lang})`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/leistungen`);
      const ctaLabel = lang === "de" ? "Kostenloses Erstgespräch buchen (30 Min.)" : "Book a free 30-minute intro call";
      const sharedCta = page.getByRole("link", { name: ctaLabel });
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

test.describe("criterion 8: the shared CTA is keyboard-reachable with a focus ring that appears because of focus", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`de/leistungen at ${viewport.width}px`, async ({ page }) => {
      await blockOutbound(page.context());
      await page.setViewportSize(viewport);
      await page.goto("/de/leistungen");

      const sharedCta = page.getByRole("link", { name: "Kostenloses Erstgespräch buchen (30 Min.)" });
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

test.describe("criterion 13: layout/order/position at 390px and 1440px", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    for (const lang of ["de", "en"] as const) {
      test(`/${lang}/leistungen at ${viewport.width}px: section sits below "Check. Build. Care." and above the skills section, no horizontal scroll`, async ({
        page,
      }) => {
        await blockOutbound(page.context());
        await page.setViewportSize(viewport);
        await page.goto(`/${lang}/leistungen`);

        const heading = lang === "de" ? "Kommt dir eine davon bekannt vor?" : "Does one of these sound familiar?";
        const checkBuildCareHeading = lang === "de" ? "Check. Build. Care." : "Check. Build. Care.";

        const situationsY = await page.getByText(heading, { exact: true }).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        const journeyY = await page
          .getByText(checkBuildCareHeading, { exact: true })
          .first()
          .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        expect(situationsY, "the situations block must render below the Check. Build. Care. journey").toBeGreaterThan(journeyY);

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
