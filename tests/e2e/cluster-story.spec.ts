/**
 * 20261024-leistungsseite-the-growing-cluster-story-design- (VL-11-S7), amended by
 * 20261028-leistungsseite-cluster-story-cleanup-dots-not-cl (VL-11-S10): nine steps, the dots are a
 * non-interactive progress indicator
 *
 * Browser behaviour of the cluster story on /:lang/leistungen: one world stage, the story position
 * `f` on the stage root (`data-f`), the progress indicator, the SSR end state, reduced motion, the `?video=1`
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

/** The progress indicator is the stage's following sibling with `role="progressbar"`; its items are its children. */
const BAR = `${STAGE} ~ [role="progressbar"]`;
const item = (page: Page, k: number) => page.locator(`${BAR} > [data-progress-item]`).nth(k);
const STEPS = 9;

/** Resolves after `n` rendered animation frames in the page: a wait on the browser's own render loop, not on wall-clock time. */
const frames = (page: Page, n: number): Promise<void> =>
  page.evaluate(
    (count) =>
      new Promise<void>((done) => {
        let left = count;
        const tick = () => (--left <= 0 ? done() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      }),
    n
  );

/** Scroll (instantly) so block k sits on the viewline; the page reads f = k from the scroll position. */
async function scrollToBlock(page: Page, k: number, want = k): Promise<void> {
  await page.evaluate((index) => {
    const el = document.querySelector(`li[data-step-index='${index}']`) as HTMLElement;
    const sticky = document.getElementById("cluster-story-stage")!.parentElement as HTMLElement;
    const vh = window.innerHeight;
    let line = vh * 0.5;
    if (window.innerWidth < 1024) {
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      line = Math.min(top + sticky.offsetHeight + 130, vh - 80);
    }
    const r = el.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top + r.height / 2 - line, behavior: "instant" });
  }, k);
  await page.waitForFunction(
    ([sel, want]) => Math.abs(parseFloat((document.querySelector(sel as string) as HTMLElement).dataset.f ?? "NaN") - (want as number)) < 0.06,
    [STAGE, want] as const,
    { timeout: 8000 }
  );
}

for (const [name, viewport] of [
  ["1440", DESKTOP],
  ["390", PHONE],
] as const) {
  test.describe(`cluster story at ${name}px`, () => {
    test.use({ viewport });

    test("one world svg, nine blocks, nine progress items, no horizontal overflow", async ({ page }) => {
      await page.goto("/de/leistungen", { waitUntil: "networkidle" });
      await expect(page.locator(`${STAGE} svg`)).toHaveCount(1);
      await expect(page.locator(`${STAGE} > svg`)).toHaveAttribute("aria-hidden", "true");
      await expect(page.locator("li[data-step-index]")).toHaveCount(STEPS);
      await expect(page.locator(`${BAR} > [data-progress-item]`)).toHaveCount(STEPS);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("the stage stays pinned while its blocks scroll by", async ({ page }) => {
      await openStory(page);
      const top = () => page.locator(STAGE).evaluate((el) => el.getBoundingClientRect().top);
      await scrollToBlock(page, 3);
      const a = await top();
      await scrollToBlock(page, 6);
      const b = await top();
      expect(Math.abs(a - b)).toBeLessThan(2);
      expect(a).toBeGreaterThanOrEqual(0);
    });

    test("scrolling to block k makes data-f read k and marks that item as current, in both directions", async ({ page }) => {
      await openStory(page);
      for (const k of [0, 2, 5, 8, 4, 1]) {
        await scrollToBlock(page, k);
        await expect.poll(async () => Math.abs((await readF(page)) - k), { message: `data-f at block ${k}` }).toBeLessThan(0.06);
        await expect(page.locator(`${BAR} > [data-current]`)).toHaveCount(1);
        await expect(item(page, k)).toHaveAttribute("data-current", "");
        await expect(page.locator(`${BAR} svg`)).toHaveCount(k); // one check mark per earlier item
      }
    });

    test("the indicator is a progressbar: named, valued, with no interactive element, no pointer cursor", async ({ page }) => {
      await openStory(page);
      await scrollToBlock(page, 4);
      const bar = page.locator(BAR);
      await expect(bar).toHaveCount(1);
      await expect(bar).toHaveAttribute("aria-label", "Fortschritt");
      await expect(bar).toHaveAttribute("aria-valuemin", "1");
      await expect(bar).toHaveAttribute("aria-valuemax", String(STEPS));
      await expect(bar).toHaveAttribute("aria-valuenow", "5");
      await expect(bar).toHaveAttribute("aria-valuetext", `Schritt 5 von ${STEPS}`);
      await expect(page.locator(`${BAR} button, ${BAR} a, ${BAR} [tabindex], ${BAR} [role="button"], ${BAR} [onclick]`)).toHaveCount(0);
      await expect(page.locator(`${BAR} [aria-label]`)).toHaveCount(0);
      for (let k = 0; k < STEPS; k++) await expect(item(page, k)).toHaveAttribute("aria-hidden", "true");
      const cursors = await page.locator(`${BAR}, ${BAR} *`).evaluateAll((els) => els.map((e) => getComputedStyle(e).cursor));
      expect(cursors.filter((c) => c === "pointer")).toEqual([]);
      const hover = await page.evaluate(
        (sel) => !Array.from(document.querySelectorAll(`${sel}, ${sel} *`)).some((e) => /(^|\s)hover:/.test(e.getAttribute("class") ?? "")),
        BAR
      );
      expect(hover).toBe(true);
    });

    test("clicking a progress item changes neither the scroll position nor the current item", async ({ page }) => {
      await openStory(page);
      await scrollToBlock(page, 2);
      const y = await page.evaluate(() => window.scrollY);
      // Count every way a click handler could move the page: scroll events and the scroll APIs.
      await page.evaluate(() => {
        const w = window as unknown as { __scrolls: number };
        w.__scrolls = 0;
        const bump = () => void w.__scrolls++;
        window.addEventListener("scroll", bump);
        for (const name of ["scrollTo", "scrollBy"] as const) {
          const orig = window[name].bind(window) as (...a: unknown[]) => void;
          (window as unknown as Record<string, unknown>)[name] = (...a: unknown[]) => (bump(), orig(...a));
        }
        const intoView = Element.prototype.scrollIntoView;
        Element.prototype.scrollIntoView = function (this: Element, ...a: Parameters<typeof intoView>) {
          bump();
          return intoView.apply(this, a);
        };
      });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await item(page, 6).click({ force: true });
      await frames(page, 30); // a smooth scroll or a re-render would show within these frames
      expect(errors, "the click raised no page error").toEqual([]);
      expect(await page.evaluate(() => (window as unknown as { __scrolls: number }).__scrolls)).toBe(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(y);
      await expect(item(page, 2)).toHaveAttribute("data-current", "");
    });

    test("Tab never lands in the progress indicator", async ({ page }) => {
      await openStory(page);
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press("Tab");
        const inside = await page.evaluate((sel) => !!document.activeElement?.closest(sel), BAR);
        expect(inside).toBe(false);
      }
    });

    test("every eyebrow reads Schritt n von N with N the block count; the last one adds Ausblick", async ({ page }) => {
      await page.goto("/de/leistungen", { waitUntil: "networkidle" });
      const eyebrows = await page.locator("li[data-step-index] > span").allTextContents();
      expect(eyebrows).toHaveLength(STEPS);
      eyebrows.forEach((t, i) => {
        expect(t).toBe(i === STEPS - 1 ? `Schritt ${STEPS} von ${STEPS} · Ausblick` : `Schritt ${i + 1} von ${STEPS}`);
      });
    });

    test("no block or progress item carries a planned (geplant) marker", async ({ page }) => {
      await page.goto("/de/leistungen", { waitUntil: "networkidle" });
      await expect(page.locator("body")).not.toContainText(/geplant/i);
    });

    test("graphic text is at least 11px effective in the frames of every step mark", async ({ page }) => {
      await page.goto("/de/leistungen?video=1", { waitUntil: "networkidle" });
      for (let k = 0; k < STEPS; k++) {
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

test.describe("phone: every carrying card shows its labels (VL-11-S11)", () => {
  test.use({ viewport: PHONE });

  test("at the mark of every step each card of that step has rendered text of 11px or more, inside the card", async ({ page }) => {
    await page.goto("/de/leistungen?video=1", { waitUntil: "networkidle" });
    for (let k = 0; k < STEPS; k++) {
      await page.evaluate((f) => window.setF!(f, 0), k + 0.2);
      const report = await page.evaluate(
        ({ sel, k }) => {
          const svg = document.querySelector(`${sel} svg`) as SVGSVGElement;
          const inside = (a: DOMRect, b: DOMRect) => a.left >= b.left - 2 && a.right <= b.right + 2 && a.top >= b.top - 2 && a.bottom <= b.bottom + 2;
          const out: { id: string; cards: number; texts: number; problems: string[] }[] = [];
          const groups = Array.from(svg.querySelectorAll<SVGGElement>(`g[data-id][data-k="${k}"]`));
          for (const g of groups) {
            const id = g.getAttribute("data-id")!;
            const own = Array.from(g.querySelectorAll<SVGRectElement>('rect[fill="url(#cs-card)"]'));
            const rowOf = /^call-row\d$/.test(id);
            // `cc` is the cluster core's container; its caption is the separate agents-lbl element.
            if ((!own.length && !rowOf) || id === "cc") continue;
            const cardRects = rowOf
              ? [svg.querySelector<SVGRectElement>('g[data-id="call"] rect[fill="url(#cs-card)"]')!.getBoundingClientRect()]
              : own.map((r) => r.getBoundingClientRect());
            const texts = Array.from(g.querySelectorAll("text")).filter((t) => t.textContent?.trim());
            const problems: string[] = [];
            for (const t of texts) {
              const px = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM()?.a ?? 1);
              if (px < 10.95) problems.push(`${t.textContent} is ${px.toFixed(2)}px`);
              const r = t.getBoundingClientRect();
              if (!cardRects.some((c) => inside(r, c))) problems.push(`${t.textContent} leaves its card`);
            }
            out.push({ id, cards: cardRects.length, texts: texts.length, problems });
          }
          return out;
        },
        { sel: STAGE, k },
      );
      for (const g of report) {
        expect(g.problems, `step ${k} ${g.id}`).toEqual([]);
        expect(g.texts, `step ${k} ${g.id} shows text, not only an icon`).toBeGreaterThan(0);
      }
      const ids = report.map((g) => g.id);
      if (k === 4) expect(ids).toEqual(expect.arrayContaining(["lock", "release"]));
      if (k === 5) expect(ids).toEqual(expect.arrayContaining(["call", "call-row0", "call-row1", "call-row2", "call-row3"]));
    }
  });
});

test.describe("server markup and first render", () => {
  test("the prerendered page already shows the finished end state and the booking link", async ({ request }) => {
    const html = await (await request.get("/de/leistungen/")).text();
    expect(html).toContain('data-f="7.2"');
    expect(html).toContain(BOOKING_URL);
  });

  for (const lang of ["de", "en"]) {
    test(`${lang}: the prerendered story has nine h3 blocks and nine progress items, no Installation`, async ({ request }) => {
      const html = await (await request.get(`/${lang}/leistungen/`)).text();
      const at = html.indexOf('id="cluster-story-heading"');
      const section = html.slice(html.lastIndexOf("<section", at), html.indexOf("</section>", at));
      expect((section.match(/<h3/g) ?? []).length).toBe(STEPS);
      expect((section.match(/data-progress-item/g) ?? []).length).toBe(STEPS);
      expect(section).not.toMatch(/Installation/);
    });
  }

  test("EN: nine blocks, the last one is the outlook and not planned", async ({ page }) => {
    await page.goto("/en/leistungen", { waitUntil: "networkidle" });
    await expect(page.locator("li[data-step-index]")).toHaveCount(STEPS);
    await expect(page.locator("li[data-step-index='8']")).not.toContainText(/planned/i);
    await expect(page.locator("li[data-step-index='8'] > span")).toHaveText("Step 9 of 9 · Outlook");
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
    for (const k of [0, 3, 6, 8]) {
      await scrollToBlock(page, k, k + 0.2);
      await expect.poll(() => readF(page), { timeout: 5000 }).toBeCloseTo(k + 0.2, 3);
      await expect(item(page, k)).toHaveAttribute("data-current", "");
    }
    const a = await page.locator(STAGE).innerHTML();
    // Watch the stage's whole subtree while the render loop runs; a clock or an animation would mutate it.
    await page.evaluate((sel) => {
      const w = window as unknown as { __mutations: MutationRecord[]; __mo: MutationObserver };
      w.__mutations = [];
      w.__mo = new MutationObserver((records) => w.__mutations.push(...records));
      w.__mo.observe(document.querySelector(sel)!, { subtree: true, attributes: true, childList: true, characterData: true });
    }, STAGE);
    await frames(page, 90);
    expect(await page.evaluate(() => (window as unknown as { __mutations: MutationRecord[] }).__mutations.length)).toBe(0);
    expect(await page.locator(STAGE).innerHTML()).toBe(a);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe("motion on: the quiet clock", () => {
  test.use({ viewport: DESKTOP });

  test("only the loops change over time while f stays put", async ({ page }) => {
    await openStory(page);
    await scrollToBlock(page, 7);
    const fBefore = await readF(page);
    const a = await page.locator(STAGE).innerHTML();
    await expect.poll(() => page.locator(STAGE).innerHTML(), { timeout: 8000, message: "the loops of the stage move" }).not.toBe(a);
    expect(await readF(page)).toBe(fBefore);
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
    await frames(page, 20);
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

test.describe("booking button of the offer step (id service)", () => {
  test.use({ viewport: DESKTOP });

  test("one click fires exactly one Call Link Clicked with placement cluster-story", async ({ page }) => {
    await recorder(page);
    await openStory(page);
    const link = page.locator("li[data-step-id='service'] a[href='" + BOOKING_URL + "']");
    await expect(link).toHaveCount(1);
    await expect(page.locator("li[data-step-id='service']")).toHaveAttribute("data-step-index", "7");
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
