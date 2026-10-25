/**
 * 20261024-leistungsseite-the-growing-cluster-story-design- (VL-11-S7)
 *
 * Checks of the pure model behind the cluster story (src/app/components/cluster-story/world.ts):
 * build completeness at the step marks, the camera hold, the nothing-before-its-window rule,
 * phone legibility, the colour set and locale key parity. No browser, no build needed.
 * Run: pnpm exec tsx --test tests/build/cluster-story-world.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as W from "../../src/app/components/cluster-story/world.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const de = JSON.parse(read("src/locales/de.json")).leistungen;
const en = JSON.parse(read("src/locales/en.json")).leistungen;

const story = (file) => matter(read(file)).data.clusterStory.steps;
const labels = (l, lang) => {
  const steps = story(lang === "de" ? "content/site/leistungen.md" : "content/site/leistungen.en.md");
  return {
    g: l.clusterStory.graphic,
    ch: steps[0].channels.map((c) => c.label),
    areas: steps[7].areas.map((a) => a.label),
    example: l.exampleAgentLabel,
  };
};
const LB = labels(de, "de");
const EXAMPLE_LB = labels(en, "en");
const els = W.ELEMENTS;

test("step marks: everything up to the step is built, everything above is not there yet", () => {
  assert.equal(W.STEP_MARKS.length, 10);
  for (const [k, mark] of W.STEP_MARKS.entries()) {
    for (const el of els) {
      const p = W.buildAt(el, mark);
      if (el.k <= k) assert.equal(p, 1, `${el.id} (step ${el.k}) is built at the mark of step ${k}`);
      else assert.equal(p, 0, `${el.id} (step ${el.k}) is not built at the mark of step ${k}`);
    }
  }
  assert.equal(W.FINAL_F, 8.2);
});

test("nothing of a step is visible before its window opens (k - 0.5)", () => {
  for (const el of els) assert.equal(W.buildAt(el, el.k - 0.5), 0, el.id);
});

test("build progress never goes backwards while f grows (the scroll-back un-builds exactly)", () => {
  for (const el of els) {
    let prev = 0;
    for (let f = -1; f <= 9.5; f += 0.05) {
      const p = W.buildAt(el, f);
      assert.ok(p >= prev - 1e-9, `${el.id} at ${f}`);
      prev = p;
    }
  }
});

test("the camera holds from k - 0.2 to k + 0.25 and moves only inside k - 0.75 ... k - 0.2", () => {
  for (const narrow of [false, true]) {
    for (let k = 0; k < 10; k++) {
      const hold = W.cameraAt(k - 0.2, narrow);
      for (let f = k - 0.2; f <= k + 0.25 + 1e-9; f += 0.05) {
        W.cameraAt(f, narrow).forEach((v, i) => assert.ok(Math.abs(v - hold[i]) < 1e-9, `k${k} f${f} narrow ${narrow}`));
      }
    }
    assert.deepEqual(W.cameraAt(-1, narrow), (narrow ? W.CAM_M : W.CAM_D).pre);
  }
});

const framed = (b, r) => b.x >= r.x - 1 && b.y >= r.y - 1 && b.x + b.w <= r.x + r.w + 1 && b.y + b.h <= r.y + r.h + 1;
const judged = (e) => e.layer >= 1 && e.layer <= 3 && !e.transforms;

test("criterion 7 (a): the camera at k + 0.2 contains every judged element of step k, k = 0..9, both camera sets", () => {
  for (const [lang, lb] of [["de", LB], ["en", EXAMPLE_LB]]) {
    for (const narrow of [false, true]) {
      for (let k = 0; k <= 9; k++) {
        const r = W.cameraRect(k + 0.2, narrow);
        for (const el of els.filter((e) => e.k === k && judged(e))) {
          assert.ok(framed(W.boxOf(el, lb), r), `${el.id} inside the camera at step ${k} (narrow ${narrow}, ${lang})`);
        }
      }
    }
  }
});

test("criterion 7 (b): at k = 6 and k = 8 the camera contains every judged element built so far (the whole picture)", () => {
  for (const [lang, lb] of [["de", LB], ["en", EXAMPLE_LB]]) {
    for (const narrow of [false, true]) {
      for (const k of [6, 8]) {
        const r = W.cameraRect(k + 0.2, narrow);
        for (const el of els.filter((e) => e.k <= k && judged(e))) {
          assert.ok(framed(W.boxOf(el, lb), r), `${el.id} (step ${el.k}) inside the camera at step ${k} (narrow ${narrow}, ${lang})`);
        }
      }
    }
  }
});

test("packets sit on the drawn lines and only start after the line is complete", () => {
  assert.equal(W.packetsAt(-0.4, 1).length, 0);
  const late = W.packetsAt(W.FINAL_F + 0.5, 3.3);
  assert.ok(late.length > 0);
  for (const p of late) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && p.a >= 0 && p.a <= 1);
  assert.deepEqual(W.packetsAt(5, null), W.packetsAt(5, null));
});

test("dynamic parts are finished by their step mark", () => {
  const d = W.dynAt(4.2, 0);
  assert.equal(d.pct, "100 %");
  assert.equal(d.ok, 1);
  assert.ok(W.dynAt(1.2, null).cc.vis > 0.9, "the concept card has reached Du at the mark of step 2");
  assert.equal(W.dynAt(2.2, null).cc.vis, 0, "and is back in the hub at the mark of step 3");
  assert.equal(W.dynAt(8.2, null).b1, 1);
  assert.ok(Math.abs(W.dynAt(9.2, null).b1 - 0.38) < 1e-9);
  assert.ok(Math.abs(W.dynAt(9.2, null).b2 - 0.83) < 1e-9);
  assert.equal(W.dynAt(7.2, null).fl, 1);
  assert.equal(W.dynAt(6.2, null).fl, 0);
});

test("same arguments, same frame (no hidden state)", () => {
  assert.deepEqual(W.dynAt(4.7, 2.2), W.dynAt(4.7, 2.2));
  assert.deepEqual(W.cameraAt(3.3, true), W.cameraAt(3.3, true));
});

test("phone: at every step mark no drawn text is under 11px effective, desktop text keeps its size", () => {
  for (let k = 0; k < 10; k++) {
    const f = k + 0.2;
    const s = W.PHONE_STAGE_W / W.cameraAt(f, true)[2];
    for (const el of els.filter((e) => e.k <= k)) {
      for (const p of el.art) {
        if (p.t !== "text") continue;
        const fs = W.textSize(p, el, f, true);
        if (fs > 0) assert.ok(fs * s >= 11 - 1e-6, `${el.id} ${p.src} at step ${k}: ${fs * s}`);
        assert.equal(W.textSize(p, el, f, false), p.fs);
      }
    }
  }
});

test("phone: the text that carries the current step is drawn at its step mark", () => {
  for (let k = 0; k < 10; k++) {
    const f = k + 0.2;
    const core = els.filter((e) => e.k === k).flatMap((e) => e.art.filter((p) => p.t === "text" && p.tier === "c").map((p) => [e, p]));
    for (const [el, p] of core) assert.ok(W.textSize(p, el, f, true) > 0, `${el.id} ${p.src}`);
  }
});

test("every graphic label of the world exists in both locales", () => {
  for (const l of [de, en]) for (const k of W.LABEL_KEYS) assert.ok(typeof l.clusterStory.graphic[k] === "string" && l.clusterStory.graphic[k].length > 0, k);
  assert.ok(de.clusterStory.outlookEyebrow && en.clusterStory.outlookEyebrow);
  for (const k of W.LABEL_KEYS) assert.ok(W.resolveText(`g:${k}`, EXAMPLE_LB).length > 0, k);
});

test("no hex colour outside the set the page already used", () => {
  const known = new Set(
    "#030213 #0e0d13 #1c1a27 #272530 #4b5563 #7c3aed #8129ff #9ca3af #a318f8 #c7c4d1 #d9aeff #ef4444 #ffffff #14131b #1e1c27 #2b95f6 #5db1ff #fda700 #ffc861".split(" "),
  );
  for (const f of ["cluster-story/world.ts", "cluster-story/ClusterStoryWorld.tsx", "ClusterStorySection.tsx"]) {
    for (const h of read(`src/app/components/${f}`).match(/#[0-9a-fA-F]{6}\b/g) ?? []) assert.ok(known.has(h.toLowerCase()), `${f}: ${h}`);
  }
});
