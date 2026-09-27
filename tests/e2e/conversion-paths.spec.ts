/**
 * 20260926-conversion-paths-no-cta-may-end-in-a-footer-anch
 *
 * The conversion-path criteria (5-19 of the spec) proven in a real browser: no
 * CTA ends in a page anchor, the navbar's primary action is the booking link
 * and is reachable by keyboard, every repointed CTA lands where it says, and
 * the booking CTAs fire "Call Link Clicked" once.
 *
 * The prerendered shells carry head tags only (the body is an empty root div),
 * so a static scan of dist/ proves nothing about hrefs — this spec crawls every
 * URL from dist/sitemap.xml with the app running.
 *
 * Run instructions: see tests/e2e/playwright.config.ts. Requires a `pnpm build`
 * first (the sitemap is read from dist/).
 *
 * Nothing leaves the machine: plausible.io and calendar.app.google are aborted
 * at the context level, so the booking page is never actually requested.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
  }
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";

/** Option buttons inside the quiz dialog (excludes the Radix close button). */
const OPTION_BUTTONS = '[role="dialog"] button.text-left';

/** Every route the prerender wrote, as a pathname ("/de", "/de/kontakt", …). */
function sitemapPaths(): string[] {
  const xml = readFileSync(join(REPO_ROOT, "dist", "sitemap.xml"), "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = locs.map((loc) => {
    const path = new URL(loc).pathname.replace(/\/$/, "");
    return path === "" ? "/" : path;
  });
  return [...new Set(paths)];
}

const SITEMAP_PATHS = sitemapPaths();

async function blockOutbound(context: BrowserContext): Promise<void> {
  // Context-level so a booking link's new tab is caught too.
  await context.route("**://plausible.io/**", (route) => route.abort());
  await context.route("**://calendar.app.google/**", (route) => route.abort());
}

async function withRecorder(page: Page): Promise<void> {
  await blockOutbound(page.context());
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

/** Clicks a link that opens in a new tab and closes the tab again. */
async function clickNewTab(page: Page, selector: string): Promise<void> {
  const popupPromise = page.waitForEvent("popup").catch(() => null);
  await page.locator(selector).first().click();
  const popup = await popupPromise;
  if (popup) await popup.close();
}

const navBooking = `header a[href="${BOOKING_URL}"]`;

test.describe("no CTA ends in a page anchor", () => {
  test("the sitemap holds the routes this spec crawls", () => {
    expect(SITEMAP_PATHS.length).toBeGreaterThan(40);
    expect(SITEMAP_PATHS).toContain("/de");
    expect(SITEMAP_PATHS).toContain("/en/kontakt");
  });

  test("criterion 5/7/8: every sitemap route renders no anchor CTA and both navbar links", async ({
    page,
  }) => {
    await blockOutbound(page.context());
    let checked = 0;

    for (const path of SITEMAP_PATHS) {
      await page.goto(path);
      await expect(page.locator("header nav").first()).toBeVisible();

      const hrefs = await page.locator("a").evaluateAll((els) =>
        els.map((el) => el.getAttribute("href") ?? "")
      );
      checked += hrefs.length;

      const anchorCtas = hrefs.filter((href) => /^\/(de|en)#(kontakt|projekte)$/.test(href));
      expect(anchorCtas, `${path} still renders a footer/section anchor CTA`).toEqual([]);

      const lang = path.startsWith("/en") ? "en" : "de";

      // criterion 7 — the navbar's primary action is the booking link
      const booking = page.locator(navBooking);
      await expect(booking, `${path} has no navbar booking link`).toHaveCount(1);
      await expect(booking).toHaveAttribute("target", "_blank");
      expect(await booking.getAttribute("rel")).toContain("noopener");
      await expect(booking).toHaveText(lang === "de" ? "Gespräch buchen" : "Book a call");

      // criterion 8 — the contact page keeps a navbar entry. Scoped to the nav
      // list: the language switcher next to it also links to /:lang/kontakt on
      // the contact route itself.
      await expect(
        page.locator(`header nav ul a[href="/${lang}/kontakt"]`),
        `${path} has no navbar link to the contact page`
      ).toHaveCount(1);
    }

    // Printed so the close-out can state how much of the site was crawled.
    console.log(`conversion-paths: checked ${checked} <a> elements across ${SITEMAP_PATHS.length} routes`);
  });

  test("criterion 6: a blog post's table of contents still uses in-page anchors that move the viewport", async ({
    page,
  }) => {
    await blockOutbound(page.context());
    await page.goto("/de/blog/warum-mvps-floppen");

    const tocLink = page.locator('aside nav a[href^="#"]').first();
    await expect(tocLink).toBeVisible();
    const href = await tocLink.getAttribute("href");
    expect(href).toMatch(/^#.+/);

    const before = await page.evaluate(() => window.scrollY);
    await tocLink.click();
    await expect(page).toHaveURL(new RegExp(`${href!.replace("#", "\\#")}$`));
    await page.waitForFunction((y) => window.scrollY !== y, before);
    expect(await page.evaluate(() => window.scrollY)).not.toBe(before);
  });
});

test.describe("the navbar booking link is reachable by keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await withRecorder(page);
  });

  test("criterion 9: Tab from a fresh load of /de reaches it, with a focus indicator", async ({
    page,
  }) => {
    await page.goto("/de");
    await expect(page.locator(navBooking)).toHaveCount(1);

    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(
        (url) => (document.activeElement as HTMLAnchorElement | null)?.href === url,
        BOOKING_URL
      );
    }
    expect(reached, "the navbar booking link never became document.activeElement").toBe(true);

    // A focus indicator is visible: the focused element draws an outline or a ring.
    const indicator = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });
    const hasRing =
      (indicator.outlineStyle !== "none" && parseFloat(indicator.outlineWidth) > 0) ||
      (indicator.boxShadow !== "none" && indicator.boxShadow !== "");
    expect(hasRing, `no focus indicator on the booking link: ${JSON.stringify(indicator)}`).toBe(
      true
    );
  });

  test("criterion 10: at 390 px the keyboard-opened menu also reaches it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/de");

    await page.getByRole("button", { name: "Menü öffnen" }).focus();
    await page.keyboard.press("Enter");

    // The desktop button stays in the DOM (CSS-hidden at this width), so the
    // menu's own booking link is the visible one.
    const menuBooking = page.locator(`header a[href="${BOOKING_URL}"]:visible`);
    await expect(menuBooking).toHaveCount(1);

    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(
        (url) => (document.activeElement as HTMLAnchorElement | null)?.href === url,
        BOOKING_URL
      );
    }
    expect(reached, "the booking link in the open menu never took focus").toBe(true);
  });
});

test.describe("every repointed CTA lands where it says", () => {
  test.beforeEach(async ({ page }) => {
    await withRecorder(page);
  });

  test("criterion 11: the hero secondary CTA opens the contact page", async ({ page }) => {
    await page.goto("/de");
    const hero = page.locator("section a[href='/de/kontakt']").first();
    await expect(hero).toBeVisible();
    await hero.click();
    await expect(page).toHaveURL(/\/de\/kontakt$/);
    await expect(page.getByPlaceholder("Dein Name*")).toBeVisible();

    await page.goto("/en");
    await expect(page.locator("section a[href='/en/kontakt']").first()).toBeVisible();
  });

  test('criterion 12: the final CTA books a call and fires "Call Link Clicked" once', async ({
    page,
  }) => {
    await page.goto("/de");
    const finalCta = page.getByRole("link", { name: "Talk to Venture Labs" });
    await expect(finalCta).toHaveAttribute("href", BOOKING_URL);

    await clickNewTab(page, `a[href="${BOOKING_URL}"]:has-text("Talk to Venture Labs")`);
    expect(await callsFor(page, "Call Link Clicked")).toBe(1);
    await expect(page).toHaveURL(/\/de$/);
  });

  test('criterion 13: the quiz result CTA books a call and does not scroll to the footer', async ({
    page,
  }) => {
    await page.goto("/de");
    await page.getByRole("button", { name: "Kostenlosen Pulse Score starten" }).first().click();
    await page.getByRole("button", { name: /Meinen Pulse Score prüfen/ }).click();
    for (let i = 0; i < 10; i++) {
      await page.locator(OPTION_BUTTONS).first().click();
    }
    await expect(page.getByText("/ 100 Pulse Score")).toBeVisible();

    const resultCta = page.locator(`[role="dialog"] a[href="${BOOKING_URL}"]`);
    await expect(resultCta).toHaveCount(1);

    await clickNewTab(page, `[role="dialog"] a[href="${BOOKING_URL}"]`);
    expect(await callsFor(page, "Call Link Clicked")).toBe(1);
    expect(page.url()).not.toContain("#kontakt");
  });

  const AREA_CASES: [string, string][] = [
    ["ai-automation", "machinemaster"],
    ["ai-products", "tap2link"],
    ["ai-experience", "brylliant"],
    ["venture-building", "moerschen"],
  ];

  for (const [slug, caseSlug] of AREA_CASES) {
    test(`criterion 14: /de/leistungen/${slug} asks for contact and books a call`, async ({
      page,
    }) => {
      await page.goto(`/de/leistungen/${slug}`);

      const heroCta = page.getByRole("link", { name: "Jetzt anfragen" });
      await expect(heroCta).toHaveAttribute("href", "/de/kontakt");

      const bannerCta = page.locator(`section a[href="${BOOKING_URL}"]`).first();
      await expect(bannerCta).toBeVisible();
      await clickNewTab(page, `section a[href="${BOOKING_URL}"]`);
      expect(await callsFor(page, "Call Link Clicked")).toBe(1);
    });

    for (const lang of ["de", "en"] as const) {
      test(`criterion 15: /${lang}/leistungen/${slug} opens the ${caseSlug} case`, async ({
        page,
      }) => {
        await page.goto(`/${lang}/leistungen/${slug}`);

        // By label: the footer's project column links to the same case pages.
        const viewCase = page.getByRole("link", {
          name: lang === "de" ? "Zum Case ansehen" : "View the case",
        });
        await expect(viewCase).toHaveCount(1);
        await expect(viewCase).toHaveAttribute("href", `/${lang}/cases/${caseSlug}`);
        await viewCase.click();

        await expect(page).toHaveURL(new RegExp(`/${lang}/cases/${caseSlug}$`));
        await expect(page.locator("h1")).toBeVisible();
        expect((await page.locator("h1").innerText()).trim().length).toBeGreaterThan(0);
      });
    }
  }

  test("criterion 16: both CTAs on /de/cases/tap2link point at the contact page", async ({
    page,
  }) => {
    await page.goto("/de/cases/tap2link");
    const contactCtas = page.locator('a[href="/de/kontakt"]');
    // hero CTA, closing CTA and the navbar entry
    expect(await contactCtas.count()).toBeGreaterThanOrEqual(3);

    await expect(page.getByRole("link", { name: "Jetzt anfragen" })).toHaveAttribute(
      "href",
      "/de/kontakt"
    );
    await expect(page.getByRole("link", { name: "Kontakt aufnehmen" }).last()).toHaveAttribute(
      "href",
      "/de/kontakt"
    );
  });

  test("criterion 17: the Über-uns CTA is localized and points at the contact page", async ({
    page,
  }) => {
    await page.goto("/de/ueber-uns");
    const de = page.getByRole("link", { name: "Kontakt aufnehmen" }).last();
    await expect(de).toHaveAttribute("href", "/de/kontakt");

    await page.goto("/en/ueber-uns");
    const en = page.getByRole("link", { name: "Get in touch" }).last();
    await expect(en).toHaveAttribute("href", "/en/kontakt");
    await expect(page.getByRole("link", { name: "Kontakt aufnehmen" })).toHaveCount(0);
  });

  test("criterion 18: the contact strips book a call next to the mail link, with no phone", async ({
    page,
  }) => {
    for (const path of [
      "/de/kontakt",
      "/de/leistungen/ai-automation",
      "/de/leistungen/ai-products",
      "/de/leistungen/ai-experience",
      "/de/leistungen/venture-building",
    ]) {
      await page.goto(path);

      const strip = page.locator(`section:has(a[href="mailto:contact@venturelabs.team"])`).last();
      await expect(strip.locator(`a[href="${BOOKING_URL}"]`)).toHaveCount(1);
      await expect(strip.locator('a[href="mailto:contact@venturelabs.team"]')).toHaveCount(1);

      const telHrefs = await page
        .locator('a[href^="tel:"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
      for (const href of telHrefs) {
        expect(href, `${path} renders a tel: link with non-numeric characters`).toMatch(
          /^tel:\+?\d+$/
        );
      }
      expect(await page.getByText("+49 148 74 18 f6").count()).toBe(0);
    }
  });

  test("criterion 19: the contact strip's question no longer asks the visitor to phone", async ({
    page,
  }) => {
    await page.goto("/de/kontakt");
    const de = await page.locator("section", { hasText: "kostenlose Erstberatung" }).last().innerText();
    expect(de).not.toMatch(/Ruf (einfach )?an/i);
    expect(de).toMatch(/Gespräch/i);

    await page.goto("/en/kontakt");
    const en = await page
      .locator("section", { hasText: "initial consultation" })
      .last()
      .innerText();
    expect(en).not.toMatch(/\bcall or write\b/i);
    expect(en).toMatch(/Book a call/i);
  });
});
