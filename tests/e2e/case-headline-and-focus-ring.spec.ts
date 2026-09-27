/**
 * 20260926-conversion-paths-no-cta-may-end-in-a-footer-anch — Tester's additions
 *
 * Two acceptance criteria that `conversion-paths.spec.ts` proves only in part:
 *
 *   criterion 15 — "clicking it lands on that case's detail page and its `h1`
 *                  is that case's `heroHeadline`". The existing test asserts the
 *                  h1 is non-empty, which passes on the wrong case page too.
 *                  Here the expected headline is read out of
 *                  `content/cases/<caseSlug>[.en].md`, so the assertion fails if
 *                  a slug is ever wired to the wrong case.
 *   criterion 9  — "a focus indicator is visible on it". The existing test
 *                  accepts any non-`none` outline or box-shadow, which a purely
 *                  decorative shadow would satisfy without focus doing anything.
 *                  Here the unfocused and focused computed styles are compared,
 *                  so the ring has to appear *because of* focus.
 *
 * Run exactly as `tests/e2e/playwright.config.ts` documents (a `pnpm build` and
 * a preview on :4173 first). Nothing leaves the machine: the booking page and
 * plausible.io are aborted at context level.
 */
import { test, expect, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";

const AREA_CASES: [string, string][] = [
  ["ai-automation", "machinemaster"],
  ["ai-products", "tap2link"],
  ["ai-experience", "brylliant"],
  ["venture-building", "moerschen"],
];

async function blockOutbound(context: BrowserContext): Promise<void> {
  await context.route("**://plausible.io/**", (route) => route.abort());
  await context.route("**://calendar.app.google/**", (route) => route.abort());
}

/**
 * The `heroHeadline` a case's content file declares. Read straight from the
 * markdown frontmatter rather than from the generated `src/data/` (a denied
 * path for this task) so the expectation comes from the authored source.
 */
function heroHeadlineOf(caseSlug: string, lang: "de" | "en"): string {
  const file = join(REPO_ROOT, "content", "cases", lang === "de" ? `${caseSlug}.md` : `${caseSlug}.en.md`);
  const frontmatter = readFileSync(file, "utf8").split(/^---\s*$/m)[1] ?? "";
  const match = frontmatter.match(/^heroHeadline:\s*(.+)$/m);
  if (!match) throw new Error(`no heroHeadline in ${file}`);
  return match[1].trim().replace(/^["']|["']$/g, "");
}

test.describe("criterion 15: the area page opens its own case, headline and all", () => {
  for (const [slug, caseSlug] of AREA_CASES) {
    for (const lang of ["de", "en"] as const) {
      test(`criterion 15: /${lang}/leistungen/${slug} lands on the ${caseSlug} case whose h1 is its heroHeadline`, async ({
        page,
      }) => {
        await blockOutbound(page.context());
        const expected = heroHeadlineOf(caseSlug, lang);

        await page.goto(`/${lang}/leistungen/${slug}`);
        const viewCase = page.getByRole("link", {
          name: lang === "de" ? "Zum Case ansehen" : "View the case",
        });
        await expect(viewCase).toHaveCount(1);
        await viewCase.click();

        await expect(page).toHaveURL(new RegExp(`/${lang}/cases/${caseSlug}$`));
        await expect(
          page.locator("h1"),
          `/${lang}/leistungen/${slug} must open the case whose heroHeadline is "${expected}"`
        ).toHaveText(expected);
      });
    }
  }
});

test.describe("criterion 9: the navbar booking link's focus ring appears because of focus", () => {
  test("criterion 9: the focus indicator is drawn on focus, not painted on permanently", async ({
    page,
  }) => {
    await blockOutbound(page.context());
    await page.goto("/de");

    const booking = page.locator(`header a[href="${BOOKING_URL}"]`);
    await expect(booking).toHaveCount(1);

    const ringOf = () =>
      booking.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          outlineStyle: s.outlineStyle,
          outlineWidth: s.outlineWidth,
          outlineColor: s.outlineColor,
          boxShadow: s.boxShadow,
        };
      });

    const unfocused = await ringOf();

    // Keyboard only: Tab from the top of a freshly loaded page, as criterion 9
    // describes, rather than calling .focus() on the element.
    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(
        (url) => (document.activeElement as HTMLAnchorElement | null)?.href === url,
        BOOKING_URL
      );
    }
    expect(reached, "the navbar booking link never became document.activeElement").toBe(true);

    const focused = await ringOf();

    const drawsSomething =
      (focused.outlineStyle !== "none" && parseFloat(focused.outlineWidth) > 0) ||
      (focused.boxShadow !== "none" && focused.boxShadow !== "");
    expect(
      drawsSomething,
      `the focused booking link draws no outline and no ring: ${JSON.stringify(focused)}`
    ).toBe(true);

    expect(
      JSON.stringify(focused),
      `the booking link looks identical focused and unfocused, so nothing marks focus: ${JSON.stringify(unfocused)}`
    ).not.toBe(JSON.stringify(unfocused));
  });
});
