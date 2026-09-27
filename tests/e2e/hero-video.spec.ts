/**
 * Hero video: poster first, playback after the poster, reduced motion respected.
 * Spec 20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane, criteria 7, 8, 9, 10, 11, 12.
 * Run instructions: see tests/e2e/playwright.config.ts (Playwright is deliberately not a
 * dependency of this repo, so these specs run ad hoc against a production preview on :4173).
 *
 * Written by the Tester: the standing node checks in tests/assets/hero-video*.test.mjs prove the
 * asset and the markup, but the behaviour the fix is actually about — that no video byte is
 * requested before the poster is on screen, that playback then starts by itself, and that a
 * prefers-reduced-motion visitor never downloads the clip — only exists in a running browser.
 *
 * Criterion 13 (cold load under 4 MB in total) is deliberately NOT asserted here: the page still
 * transfers 8,623,233 B at 390 px, 6,865,921 B of it the seven case-card PNGs in public/uploads/,
 * whose trimming the same spec puts out of scope. That criterion is open for Christian, and a red
 * test asserting it would only hide the rest of this file.
 */
import { test, expect, type Page } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1024, height: 800 };

const VIDEO = "video";
const CONTROL = 'section button[aria-label*="Video"]';

interface Fetched {
  url: string;
  requestedAt: number;
  finishedAt: number | null;
}

/** Records every request of the page with its own monotonic clock. */
function recordRequests(page: Page): Fetched[] {
  const started = Date.now();
  const log: Fetched[] = [];
  page.on("request", (request) => {
    log.push({ url: request.url(), requestedAt: Date.now() - started, finishedAt: null });
  });
  page.on("requestfinished", (request) => {
    const entry = [...log].reverse().find((e) => e.url === request.url() && e.finishedAt === null);
    if (entry) entry.finishedAt = Date.now() - started;
  });
  return log;
}

const videoRequests = (log: Fetched[]) => log.filter((e) => /\.mp4(\?|$)/.test(e.url));
const posterRequests = (log: Fetched[]) => log.filter((e) => /hero-poster-[^/]*\.jpg/.test(e.url));

/** Marks the <video> element's own media events on the page clock. */
async function markMediaEvents(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __media: [string, number][] }).__media = [];
    const attach = () => {
      const element = document.querySelector("video") as (HTMLVideoElement & { __marked?: boolean }) | null;
      if (element && !element.__marked) {
        element.__marked = true;
        for (const type of ["loadstart", "play", "playing", "error"]) {
          element.addEventListener(type, () =>
            (window as unknown as { __media: [string, number][] }).__media.push([type, performance.now()])
          );
        }
      }
      requestAnimationFrame(attach);
    };
    requestAnimationFrame(attach);
  });
}

const mediaMark = (page: Page, type: string) =>
  page.evaluate(
    (name) =>
      ((window as unknown as { __media: [string, number][] }).__media.find(([t]) => t === name) ?? [null, null])[1],
    type
  );

test.describe("hero video — normal load at 390 px", () => {
  test.use({ viewport: MOBILE, reducedMotion: "no-preference" });

  test("criterion 7: the .mp4 is requested only after the poster response has completed", async ({ page }) => {
    const log = recordRequests(page);
    await page.goto("/de/");
    await page.waitForFunction(() => !document.querySelector("video")!.paused, null, { timeout: 15000 });

    const poster = posterRequests(log);
    const video = videoRequests(log);
    expect(poster.length, "the poster must be requested").toBe(1);
    expect(poster[0].finishedAt, "the poster response must complete").not.toBeNull();
    expect(video.length, "the video must be requested exactly once").toBe(1);
    expect(
      video[0].requestedAt,
      `the .mp4 was requested at ${video[0].requestedAt} ms, before the poster finished at ${poster[0].finishedAt} ms`
    ).toBeGreaterThanOrEqual(poster[0].finishedAt!);
  });

  test("criterion 8: playback starts within 3 s of the poster being painted", async ({ page }) => {
    await markMediaEvents(page);
    await page.goto("/de/");
    // 'playing' fires once frames are actually flowing, a beat after play() resolves — wait for
    // the event itself, not just for paused === false, or the mark is not there yet.
    await page.waitForFunction(
      () => (window as unknown as { __media: [string, number][] }).__media.some(([type]) => type === "playing"),
      null,
      { timeout: 15000 }
    );

    const playing = (await mediaMark(page, "playing")) as number;
    const posterEnd = await page.evaluate(
      () =>
        performance
          .getEntriesByType("resource")
          .filter((entry) => /hero-poster-[^/]*\.jpg/.test(entry.name))
          .map((entry) => entry.responseEnd)[0]
    );
    expect(posterEnd, "the poster must appear in the resource timeline").toBeGreaterThan(0);
    expect(playing, "the video must fire 'playing'").toBeGreaterThan(0);
    expect(
      playing - posterEnd,
      `playback started ${Math.round(playing - posterEnd)} ms after the poster response`
    ).toBeLessThanOrEqual(3000);
    expect(await page.locator(VIDEO).evaluate((el: HTMLVideoElement) => el.paused)).toBe(false);
  });

  test("criterion 12: the hero box and framing are unchanged by the poster→video swap", async ({ page }) => {
    await page.goto("/de/");
    const box = page.locator(VIDEO);
    const before = await box.boundingBox();
    const style = await box.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { minHeight: computed.minHeight, maxHeight: computed.maxHeight, objectFit: computed.objectFit };
    });
    expect(style).toEqual({ minHeight: "480px", maxHeight: "640px", objectFit: "cover" });

    await page.waitForFunction(() => !document.querySelector("video")!.paused, null, { timeout: 15000 });
    const after = await box.boundingBox();
    expect(after!.width, "the hero must not resize when the video replaces the poster").toBe(before!.width);
    expect(after!.height, "the hero must not resize when the video replaces the poster").toBe(before!.height);

    // Same intrinsic aspect ratio in poster and video: no letterboxing, no jump under object-fit.
    const intrinsic = await box.evaluate((el: HTMLVideoElement) => {
      const poster = new Image();
      poster.src = el.getAttribute("poster")!;
      return poster.decode().then(() => ({
        video: [el.videoWidth, el.videoHeight],
        poster: [poster.naturalWidth, poster.naturalHeight],
      }));
    });
    expect(intrinsic.poster).toEqual(intrinsic.video);
  });

  test("criterion 11: the control's icon and label follow the element's real state", async ({ page }) => {
    await page.goto("/de/");
    await page.waitForFunction(() => !document.querySelector("video")!.paused, null, { timeout: 15000 });

    await page.locator(VIDEO).evaluate((el: HTMLVideoElement) => el.pause());
    await expect(page.locator(CONTROL)).toHaveAttribute("aria-label", "Video abspielen");
    expect(
      await page.locator(`${CONTROL} svg polygon`).count(),
      "a paused video must show the play triangle"
    ).toBe(1);

    await page.locator(VIDEO).evaluate((el: HTMLVideoElement) => el.play());
    await expect(page.locator(CONTROL)).toHaveAttribute("aria-label", "Video pausieren");
    expect(
      await page.locator(`${CONTROL} svg rect`).count(),
      "a playing video must show the two pause bars"
    ).toBe(2);
  });
});

for (const [label, viewport] of [
  ["390 px", MOBILE],
  ["1024 px", DESKTOP],
] as const) {
  test.describe(`hero video — prefers-reduced-motion at ${label}`, () => {
    test.use({ viewport, reducedMotion: "reduce" });

    test("criterion 9: no .mp4 is fetched on load, the video stays paused, the poster stays", async ({ page }) => {
      const log = recordRequests(page);
      await page.goto("/de/");
      await page.waitForLoadState("networkidle");

      expect(videoRequests(log).map((e) => e.url), "reduced motion must not fetch the clip").toEqual([]);
      const state = await page.locator(VIDEO).evaluate((el: HTMLVideoElement) => ({
        paused: el.paused,
        poster: el.getAttribute("poster"),
        readyState: el.readyState,
      }));
      expect(state.paused).toBe(true);
      expect(state.poster, "the poster must still be the visible frame").toMatch(/hero-poster-[^/]*\.jpg/);
      expect(state.readyState, "nothing of the video may be loaded").toBe(0);
    });

    test("criterion 10: the play control is visible and starts playback", async ({ page }) => {
      const log = recordRequests(page);
      await page.goto("/de/");
      await page.waitForLoadState("networkidle");

      const control = page.locator(CONTROL);
      await expect(control).toBeVisible();
      await expect(control).toHaveAttribute("aria-label", "Video abspielen");

      await control.click();
      await page.waitForFunction(() => !document.querySelector("video")!.paused, null, { timeout: 15000 });
      expect(await page.locator(VIDEO).evaluate((el: HTMLVideoElement) => el.paused)).toBe(false);
      expect(videoRequests(log).length, "the click is what fetches the clip").toBe(1);
    });
  });
}
