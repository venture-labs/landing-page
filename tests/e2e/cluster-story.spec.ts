/**
 * 20261024-leistungsseite-the-growing-cluster-story-design- (VL-11-S7)
 *
 * Browser behaviour of the cluster story on /:lang/leistungen: one world stage, the story position
 * `f` on the stage root (`data-f`), the rail, the SSR end state, reduced motion, the `?video=1`
 * contract (`window.setF` / `window.setStep`), the tracked booking button and the phone checks
 * (no horizontal overflow, graphic text at least 11px effective). The pure model is covered by
 * tests/build/cluster-story-world.test.mjs.
 *
 * Run instructions: see tests/e2e/playwright.config.ts (needs `pnpm build` and a `vite preview`).
 */
import { test, expect, type Page } from "@playwright/test";

const BOOKING_URL = "https://calendar.app.google/SsabAjwxnbUjhoGo8";
const STAGE = "#cluster-story-stage";
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

declare global {
  interface Window {
    __plausibleCalls?: unknown[][];
    setF?: (f: number, t?: number) => void;
    setStep?: (n: number, p?: number, t?: number) => void;
  }
}

async function recorder(page: Page): Promise<void> {
  await page.context().route("**://calendar.app.google/**", (route) => route.abort());
  await page.route("**://plausible.io/**", (route) => route.abort());
  await page.addInitScript(() => {
    window.__plausibleCalls = [];
    window.plausible = (...args: unknown[]) => {
      window.__plausibleCalls!.push(args);
    };
  });
}

const readF = (page: Page): Promise<number> =>
  page.evaluate((sel) => parseFloat((document.querySelector(sel) as HTMLElement).dataset.f ?? "NaN"), STAGE);

async function openStory(page: Page, path = "/de/leistungen"): Promise<void> {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const h = document.getElementById("cluster-story-heading");
    if (h) window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY);
  });
}

/** The rail's buttons are the stage's following sibling `nav`. */
const pill = (page: Page, k: number) => page.locator(`${STAGE} ~ nav button`).nth(k);

for (const [name, viewport] of [
  ["1440", DESKTOP],
  ["390", PHONE],
] as const) {
  test.describe(`cluster story at ${name}px`, () => {
    test.use({ viewport });

    test("one world svg, ten blocks, ten pills, no horizontal overflow", async ({ page }) => {
      await page.goto("/de/leistungen", { waitUntil: "networkidle" });
      await expect(page.locator(`${STAGE} svg`)).toHaveCount(1);
      await expect(page.locator(`${STAGE} > svg`)).toHaveAttribute("aria-hidden", "true");
      await expect(page.locator("li[data-step-index]")).toHaveCount(10);
      await expect(page.locator(`${STAGE} ~ nav button`)).toHaveCount(10);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("the stage stays pinned while its blocks scroll by", async ({ page }) => {
      await openStory(page);
      const top = () => page.locator(STAGE).evaluate((el) => el.getBoundingClientRect().top);
      await pill(page, 3).click();
      await page.waitForTimeout(1200);
      const a = await top();
      await pill(page, 6).click();
      await page.waitForTimeout(1200);
      const b = await top();
      expect(Math.abs(a - b)).toBeLessThan(2);
      expect(a).toBeGreaterThanOrEqual(0);
    });

    test("pill k brings block k to the viewline so data-f reads k, in both directions", async ({ page }) => {
      await openStory(page);
      for (const k of [0, 2, 5, 9, 4, 1]) {
        await pill(page, k).click();
        // The smooth scroll needs a moment; wait until the stage settles on k, then assert the value at rest.
        await page.waitForFunction(
          ([sel, want]) => Math.abs(parseFloat((document.querySelector(sel as string) as HTMLElement).dataset.f ?? "NaN") - (want as number)) < 0.06,
          [STAGE, k] as const,
          { timeout: 8000 }
        );
        await page.waitForTimeout(300);
        const atRest = await readF(page);
        expect(Math.abs(atRest - k), `data-f ${atRest} after pill ${k}`).toBeLessThan(0.06);
        await expect(pill(page, k)).toHaveAttribute("aria-current", "step");
      }
    });

    test("Tab reaches every pill in order and shows a focus ring", async ({ page }) => {
      await openStory(page);
      await pill(page, 0).focus();
      for (let k = 0; k < 10; k++) {
        await expect(pill(page, k)).toBeFocused();
        const outline = await pill(page, k).evaluate((el) => {
          const s = getComputedStyle(el);
          return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
        });
        expect(outline.style).not.toBe("none");
        expect(outline.width).toBeGreaterThanOrEqual(2);
        if (k < 9) await page.keyboard.press("Tab");
      }
      await pill(page, 0).focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      await expect.poll(() => readF(page), { timeout: 5000 }).toBeGreaterThan(0.94);
    });

    test("no pill or block carries a planned (geplant) marker", async ({ page }) => {
      await page.goto("/de/leistungen", { waitUntil: "networkidle" });
      await expect(page.locator("body")).not.toContainText(/geplant/i);
      for (let i = 0; i < 10; i++) await expect(pill(page, i)).not.toHaveAttribute("aria-label", /geplant/i);
    });

    test("graphic text is at least 11px effective in the frames of every step mark", async ({ page }) => {
      await page.goto("/de/leistungen?video=1", { waitUntil: "networkidle" });
      for (let k = 0; k < 10; k++) {
        await page.evaluate((f) => window.setF!(f, 0), k + 0.2);
        const small = await page.evaluate((sel) => {
          const svg = document.querySelector(`${sel} svg`) as SVGSVGElement;
          const bad: string[] = [];
          svg.querySelectorAll("text").forEach((t) => {
            if (!t.textContent?.trim()) return;
            let o = 1;
            for (let n: Element | null = t; n && n !== svg; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || "1");
            if (o < 0.05) return;
            const px = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM()?.a ?? 1);
            if (px < 10.95) bad.push(`${t.textContent} ${px.toFixed(2)}`);
          });
          return bad;
        }, STAGE);
        // The 11px floor is the phone's rule (390px); desktop text keeps its drawn size.
        if (viewport.width <= 390) expect(small, `step ${k}`).toEqual([]);
      }
    });
  });
}

test.describe("server markup and first render", () => {
  test("the prerendered page already shows the step-9 end state and the booking link", async ({ request }) => {
    const html = await (await request.get("/de/leistungen/")).text();
    expect(html).toContain('data-f="8.2"');
    expect(html).toContain(BOOKING_URL);
    expect((html.match(/<h3/g) ?? []).length).toBeGreaterThanOrEqual(10);
  });

  test("EN: ten blocks", async ({ page }) => {
    await page.goto("/en/leistungen", { waitUntil: "networkidle" });
    await expect(page.locator("li[data-step-index]")).toHaveCount(10);
    await expect(page.locator("li[data-step-index='9']")).not.toContainText(/planned/i);
  });

  for (const lang of ["de", "en"]) {
    test(`${lang}: none of the forbidden strings in the prerendered section, graphic labels included (criterion 23)`, async ({ request }) => {
      const html = await (await request.get(`/${lang}/leistungen/`)).text();
      const at = html.indexOf('id="cluster-story-heading"');
      expect(at).toBeGreaterThan(0);
      const section = html.slice(html.lastIndexOf("<section", at), html.indexOf("</section>", at));
      expect(section).toContain("cluster-story-stage");
      for (const re of [/machine[\s-]*brain/i, /15\s+jahre/i, /15\s+years/i, /second[\s-]*brain/i]) {
        expect(section, String(re)).not.toMatch(re);
      }
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ viewport: DESKTOP });

  test("each step stands finished at k + 0.2 and nothing runs", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openStory(page);
    for (const k of [0, 3, 7, 9]) {
      await pill(page, k).click();
      await expect.poll(() => readF(page), { timeout: 5000 }).toBeCloseTo(k + 0.2, 3);
    }
    const a = await page.locator(STAGE).innerHTML();
    await page.waitForTimeout(1200);
    expect(await page.locator(STAGE).innerHTML()).toBe(a);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe("motion on: the quiet clock", () => {
  test.use({ viewport: DESKTOP });

  test("only the loops change over time while f stays put", async ({ page }) => {
    await openStory(page);
    await pill(page, 8).click();
    await page.waitForTimeout(1500);
    const a = await page.locator(STAGE).innerHTML();
    await page.waitForTimeout(500);
    const b = await page.locator(STAGE).innerHTML();
    expect(a).not.toBe(b);
  });
});

test.describe("?video=1", () => {
  test.use({ viewport: DESKTOP });

  test("setF / setStep draw the same frame for the same arguments and scrubbing back restores it", async ({ page }) => {
    await page.goto("/de/leistungen?video=1", { waitUntil: "networkidle" });
    const frame = (f: number, t = 0) =>
      page.evaluate(
        ([ff, tt, sel]) => {
          window.setF!(ff as number, tt as number);
          return (document.querySelector(sel as string) as HTMLElement).innerHTML;
        },
        [f, t, STAGE] as const
      );
    const up = await frame(4.7, 1.3);
    await frame(8.2, 0);
    await frame(1, 0);
    expect(await frame(4.7, 1.3)).toBe(up);
    const viaStep = await page.evaluate(
      ([sel]) => {
        window.setStep!(5, 0.5, 1.3);
        return (document.querySelector(sel as string) as HTMLElement).innerHTML;
      },
      [STAGE] as const
    );
    expect(viaStep).toBe(await frame(5 - 0.5 + 0.7 * 0.5, 1.3));
  });

  test("window.setF / window.setStep exist only with the query (criterion 20)", async ({ page }) => {
    await page.goto("/de/leistungen", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => [typeof window.setF, typeof window.setStep])).toEqual(["undefined", "undefined"]);
    await page.goto("/de/leistungen?video=1", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => [typeof window.setF, typeof window.setStep])).toEqual(["function", "function"]);
  });

  test("only the stage is visible and the page does not scroll (criterion 20)", async ({ page }) => {
    await page.goto("/de/leistungen?video=1", { waitUntil: "networkidle" });
    const { w, h } = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
    const points = [
      [w * 0.1, h * 0.1],
      [w * 0.9, h * 0.1],
      [w * 0.5, h * 0.5],
      [w * 0.1, h * 0.9],
      [w * 0.9, h * 0.9],
    ];
    for (const [x, y] of points) {
      const inside = await page.evaluate(
        ([px, py, sel]) => !!document.elementFromPoint(px as number, py as number)?.closest(sel as string),
        [x, y, STAGE] as const
      );
      expect(inside, `point ${Math.round(x)},${Math.round(y)}`).toBe(true);
    }
    await page.mouse.move(w / 2, h / 2);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("at the mark of step 2 nothing of step 4 or later is visible", async ({ page }) => {
    await page.goto("/de/leistungen?video=1", { waitUntil: "networkidle" });
    await page.evaluate(() => window.setF!(2.2, 0));
    const later = await page.evaluate((sel) => {
      const root = document.querySelector(sel) as HTMLElement;
      return Array.from(root.querySelectorAll<SVGElement>("[data-k]"))
        .filter((e) => Number(e.dataset.k) >= 3 && parseFloat(getComputedStyle(e).opacity) > 0.001)
        .map((e) => e.dataset.k);
    }, STAGE);
    expect(later).toEqual([]);
  });
});

test.describe("booking button of step 9", () => {
  test.use({ viewport: DESKTOP });

  test("one click fires exactly one Call Link Clicked with placement cluster-story", async ({ page }) => {
    await recorder(page);
    await openStory(page);
    const link = page.locator("li[data-step-index='8'] a[href='" + BOOKING_URL + "']");
    await expect(link).toHaveCount(1);
    await link.scrollIntoViewIfNeeded();
    const popup = page.waitForEvent("popup").catch(() => null);
    await link.click();
    const p = await popup;
    if (p) await p.close();
    const calls = await page.evaluate(() =>
      (window.__plausibleCalls ?? [])
        .filter((a) => a[0] === "Call Link Clicked")
        .map((a) => (a[1] as { props?: Record<string, string> }).props ?? {})
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ placement: "cluster-story", cta: "book-call" });
  });
});
