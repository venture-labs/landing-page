/**
 * 20261030-leistungsseite-martin-l6-check-build-care-clicka
 *
 * The "Check. Build. Care." rail (`#ablauf`, StepRail in PulseJourney.tsx):
 * L7 large step labels and the L6 cue "Puls + Unterlinie" (waveform beat top
 * right + underline stub, one heartbeat, 3 s at rest, 2 s on hover and focus).
 *
 * Criteria covered: 5 (label size), 6 (accessible names), 7 (390 px overflow),
 * 9 (no fill), 10 (no auto-switch), 11 (data-cue on first paint), 12 (reduced
 * motion), 13 (animated properties), 14 (keyboard), 16 (animation names and
 * durations).
 *
 * Run instructions: see tests/e2e/playwright.config.ts (needs `pnpm build` and a
 * `vite preview` on :4173).
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";

type Lang = "de" | "en";

const LANGS: Lang[] = ["de", "en"];
const ROUTES = (lang: Lang) => [`/${lang}/leistungen`, `/${lang}`];

const RAIL_NAMES: Record<Lang, RegExp[]> = {
  de: [/01 · Verstehen/, /02 · Bauen/, /03 · Dranbleiben/],
  en: [/01 · Understand/, /02 · Build/, /03 · Keep going/],
};

const RAIL = "#ablauf button[aria-pressed]";

async function blockOutbound(context: BrowserContext): Promise<void> {
  await context.route("**://plausible.io/**", (route) => route.abort());
  await context.route("**://calendar.app.google/**", (route) => route.abort());
}

test.beforeEach(async ({ context }) => {
  await blockOutbound(context);
});

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator(RAIL)).toHaveCount(3);
}

/** Computed font sizes (px) of the label word and of the product title of one rail button. */
async function labelSizes(page: Page, index: number) {
  return page.locator(RAIL).nth(index).evaluate((button) => {
    const spans = Array.from(button.children).filter((c) => c.tagName === "SPAN");
    const word = spans[0].querySelectorAll("span")[1] as HTMLElement;
    const title = spans[1] as HTMLElement;
    return {
      word: parseFloat(getComputedStyle(word).fontSize),
      title: parseFloat(getComputedStyle(title).fontSize),
    };
  });
}

/* ─── L7: large labels, accessible names, 390 px ────────────────────────── */

for (const width of [1440, 390]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const lang of LANGS) {
      for (const path of ROUTES(lang)) {
        test(`criteria 5-7: ${path} labels are >= 24 px, larger than the title, named and unclipped`, async ({
          page,
        }) => {
          await open(page, path);
          for (let i = 0; i < 3; i++) {
            const { word, title } = await labelSizes(page, i);
            console.log(`${path} @${width} button ${i}: label ${word}px, title ${title}px`);
            expect(word).toBeGreaterThanOrEqual(24);
            expect(word).toBeGreaterThan(title);
            await expect(
              page.locator("#ablauf").getByRole("button", { name: RAIL_NAMES[lang][i] })
            ).toHaveCount(1);
          }
          const overflow = await page.evaluate(() => {
            const doc = document.scrollingElement as HTMLElement;
            return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth };
          });
          expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);

          // Label word (third span: wrapper, number, word) sits inside its button and
          // is not wider than its own box, so no word is clipped or broken.
          const clipped = await page.locator(RAIL).evaluateAll((buttons) =>
            buttons.map((button) => {
              const word = button.querySelectorAll("span")[2] as HTMLElement;
              const b = button.getBoundingClientRect();
              const w = word.getBoundingClientRect();
              return {
                inside: w.left >= b.left - 0.5 && w.right <= b.right + 0.5,
                fits: word.scrollWidth <= word.clientWidth + 1,
              };
            })
          );
          for (const c of clipped) {
            expect(c.inside).toBe(true);
            expect(c.fits).toBe(true);
          }
        });
      }
    }
  });
}

/* ─── L6: the cue ───────────────────────────────────────────────────────── */

test.describe("cue: Puls + Unterlinie", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("criterion 11: inactive tabs carry data-cue=on on first paint, the active one does not (also touch)", async ({
    browser,
  }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true });
    await blockOutbound(context);
    const page = await context.newPage();
    await open(page, "/de/leistungen");
    await expect(page.locator(RAIL).nth(0)).not.toHaveAttribute("data-cue", "on");
    await expect(page.locator(RAIL).nth(1)).toHaveAttribute("data-cue", "on");
    await expect(page.locator(RAIL).nth(2)).toHaveAttribute("data-cue", "on");
    await context.close();
  });

  test("criteria 13 and 16: animation names and durations at rest and on hover and focus", async ({
    page,
  }) => {
    await open(page, "/de/leistungen");
    const read = (index: number) =>
      page.locator(RAIL).nth(index).evaluate((button) => {
        const wave = button.querySelector(".pulse-cue-wave") as Element;
        const stub = button.querySelector(".pulse-cue-stub") as Element;
        const w = getComputedStyle(wave);
        const s = getComputedStyle(stub);
        return {
          wave: [w.animationName, w.animationDuration, w.animationIterationCount],
          stub: [s.animationName, s.animationDuration, s.animationIterationCount],
        };
      });

    const rest = await read(1);
    expect(rest.wave).toEqual(["cb-beat", "3s", "infinite"]);
    expect(rest.stub).toEqual(["cb-stub", "3s", "infinite"]);

    await page.locator(RAIL).nth(1).hover();
    const hover = await read(1);
    expect(hover.wave).toEqual(["cb-beat-hi", "2s", "infinite"]);
    expect(hover.stub).toEqual(["cb-stub-hi", "2s", "infinite"]);

    await page.mouse.move(0, 0);
    await page.locator(RAIL).nth(2).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const focus = await read(2);
    expect(focus.wave).toEqual(["cb-beat-hi", "2s", "infinite"]);
    expect(focus.stub).toEqual(["cb-stub-hi", "2s", "infinite"]);
  });

  test("criterion 13: the cue keyframes animate only transform and opacity", async ({ page }) => {
    await open(page, "/de/leistungen");
    const props = await page.evaluate(() => {
      const wanted = new Set(["cb-beat", "cb-stub", "cb-beat-hi", "cb-stub-hi"]);
      const found: Record<string, string[]> = {};
      const walk = (rules: CSSRuleList) => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSKeyframesRule && wanted.has(rule.name)) {
            const set = new Set<string>();
            for (const frame of Array.from(rule.cssRules)) {
              const style = (frame as CSSKeyframeRule).style;
              for (let i = 0; i < style.length; i++) set.add(style[i]);
            }
            found[rule.name] = [...set].sort();
          } else if ("cssRules" in rule) {
            walk((rule as CSSGroupingRule).cssRules);
          }
        }
      };
      for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
      return found;
    });
    expect(Object.keys(props).sort()).toEqual(["cb-beat", "cb-beat-hi", "cb-stub", "cb-stub-hi"]);
    for (const list of Object.values(props)) expect(list).toEqual(["opacity", "transform"]);
  });

  test("criterion 9: no rail button is filled above the active tint over four seconds", async ({
    page,
  }) => {
    await open(page, "/de/leistungen");
    for (let sample = 0; sample < 5; sample++) {
      const alphas = await page.locator(RAIL).evaluateAll((buttons) =>
        buttons.map((b) => {
          const m = getComputedStyle(b).backgroundColor.match(/rgba?\(([^)]+)\)/);
          const parts = m ? m[1].split(",").map((x) => parseFloat(x)) : [0, 0, 0, 0];
          return parts.length === 4 ? parts[3] : 1;
        })
      );
      for (const a of alphas) expect(a).toBeLessThanOrEqual(0.13);
      await page.waitForTimeout(1000);
    }
  });

  test("criterion 10: no auto-switch; hover and focus do not switch, click Enter and Space do", async ({
    page,
  }) => {
    await open(page, "/de/leistungen");
    const pressed = () =>
      page.locator(RAIL).evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-pressed")));
    await page.waitForTimeout(15_000);
    expect(await pressed()).toEqual(["true", "false", "false"]);

    await page.locator(RAIL).nth(1).hover();
    await page.locator(RAIL).nth(2).focus();
    expect(await pressed()).toEqual(["true", "false", "false"]);

    await page.locator(RAIL).nth(1).click();
    expect(await pressed()).toEqual(["false", "true", "false"]);
    await page.locator(RAIL).nth(2).focus();
    await page.keyboard.press("Enter");
    expect(await pressed()).toEqual(["false", "false", "true"]);
    await page.locator(RAIL).nth(0).focus();
    await page.keyboard.press("Space");
    expect(await pressed()).toEqual(["true", "false", "false"]);
  });

  test("criterion 14: Tab reaches each rail button in order with a visible focus outline", async ({
    page,
  }) => {
    await open(page, "/de/leistungen");
    await page.locator(RAIL).nth(0).focus();
    await page.keyboard.press("Tab");
    await expect(page.locator(RAIL).nth(1)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(RAIL).nth(2)).toBeFocused();
    const outline = await page.locator(RAIL).nth(2).evaluate((b) => {
      const s = getComputedStyle(b);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).toBe("solid");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });
});

/* ─── reduced motion ────────────────────────────────────────────────────── */

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("criterion 12: nothing runs on the rail at rest, the tabs work, the cue stays visible", async ({
    page,
  }) => {
    await open(page, "/de/leistungen");
    const running = await page.evaluate(() =>
      Array.from(document.querySelectorAll("#ablauf button[aria-pressed]")).flatMap((b) =>
        [b, ...Array.from(b.querySelectorAll("*"))].flatMap((el) => el.getAnimations().map((a) => a.id))
      )
    );
    expect(running).toEqual([]);

    const cue = await page.locator(RAIL).nth(1).evaluate((button) => {
      const wave = getComputedStyle(button.querySelector(".pulse-cue-wave") as Element);
      const stub = getComputedStyle(button.querySelector(".pulse-cue-stub") as Element);
      return {
        waveTransform: wave.transform,
        waveOpacity: parseFloat(wave.opacity),
        stubTransform: stub.transform,
        stubOpacity: parseFloat(stub.opacity),
      };
    });
    console.log("reduced-motion cue:", JSON.stringify(cue));
    expect(cue.waveTransform).toBe("matrix(1, 0, 0, 0.8, 0, 0)");
    expect(cue.stubTransform).toBe("matrix(0.3, 0, 0, 1, 0, 0)");
    expect(cue.waveOpacity).toBeGreaterThan(0.5);
    expect(cue.stubOpacity).toBeGreaterThan(0.5);

    await page.locator(RAIL).nth(2).click();
    await expect(page.locator(RAIL).nth(2)).toHaveAttribute("aria-pressed", "true");
  });
});
