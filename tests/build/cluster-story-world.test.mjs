/**
 * 20261024-leistungsseite-the-growing-cluster-story-design- (VL-11-S7), amended by
 * 20261028-leistungsseite-cluster-story-cleanup-dots-not-cl (VL-11-S10): nine steps, no Installation
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
    areas: steps.find((s) => s.id === "growth").areas.map((a) => a.label),
    example: l.exampleAgentLabel,
  };
};
const LB = labels(de, "de");
const EXAMPLE_LB = labels(en, "en");
const els = W.ELEMENTS;

test("step marks: everything up to the step is built, everything above is not there yet", () => {
  assert.equal(W.STEP_COUNT, 9);
  assert.equal(W.STEP_MARKS.length, 9);
  for (const [k, mark] of W.STEP_MARKS.entries()) {
    for (const el of els) {
      const p = W.buildAt(el, mark);
      if (el.k <= k) assert.equal(p, 1, `${el.id} (step ${el.k}) is built at the mark of step ${k}`);
      else assert.equal(p, 0, `${el.id} (step ${el.k}) is not built at the mark of step ${k}`);
    }
  }
  assert.equal(W.FINAL_F, 7.2);
});

test("nothing of a step is visible before its window opens (k - 0.5)", () => {
  for (const el of els) assert.equal(W.buildAt(el, el.k - 0.5), 0, el.id);
});

test("build progress never goes backwards while f grows (the scroll-back un-builds exactly)", () => {
  for (const el of els) {
    let prev = 0;
    for (let f = -1; f <= 8.5; f += 0.05) {
      const p = W.buildAt(el, f);
      assert.ok(p >= prev - 1e-9, `${el.id} at ${f}`);
      prev = p;
    }
  }
});

test("the camera holds from k - 0.2 to k + 0.25 and moves only inside k - 0.75 ... k - 0.2", () => {
  for (const narrow of [false, true]) {
    for (let k = 0; k < 9; k++) {
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

test("criterion 7 (a): the camera at k + 0.2 contains every judged element of step k, k = 0..8, both camera sets", () => {
  for (const [lang, lb] of [["de", LB], ["en", EXAMPLE_LB]]) {
    for (const narrow of [false, true]) {
      for (let k = 0; k <= 8; k++) {
        const r = W.cameraRect(k + 0.2, narrow);
        for (const el of els.filter((e) => e.k === k && judged(e))) {
          assert.ok(framed(W.boxOf(el, lb), r), `${el.id} inside the camera at step ${k} (narrow ${narrow}, ${lang})`);
        }
      }
    }
  }
});

test("criterion 7 (b): at k = 5 and k = 7 the camera contains every judged element built so far (the whole picture)", () => {
  for (const [lang, lb] of [["de", LB], ["en", EXAMPLE_LB]]) {
    for (const narrow of [false, true]) {
      for (const k of [5, 7]) {
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
  assert.ok(W.dynAt(1.2, null).cc.vis > 0.9, "the concept card has reached Du at the mark of step 2");
  assert.equal(W.dynAt(2.2, null).cc.vis, 0, "and is back in the hub at the mark of step 3");
  assert.equal(W.dynAt(7.2, null).b1, 1);
  assert.ok(Math.abs(W.dynAt(8.2, null).b1 - 0.38) < 1e-9);
  assert.ok(Math.abs(W.dynAt(8.2, null).b2 - 0.83) < 1e-9);
  assert.equal(W.dynAt(6.2, null).fl, 1);
  assert.equal(W.dynAt(5.2, null).fl, 0);
});

test("loop pulse and offer highlight fire in their shifted windows (the old, unshifted thresholds fail)", () => {
  const pulse = (f) => W.dynAt(f, null).cpulse.o;
  assert.equal(pulse(4.7), 0, "before the loop step's pulse window");
  assert.ok(pulse(4.9) > 0, "the pulse has started at 4.9 (the old window opened at 5.75)");
  assert.ok(pulse(5.2) > 0.3, "the pulse is at full strength at the loop mark");
  assert.equal(pulse(5.8), 0, "the pulse has faded out by 5.8 (the old window faded until 7.45)");
  const hv = (f) => W.dynAt(f, null).hv;
  assert.equal(hv(6.7), 0, "before the highlight window");
  assert.ok(hv(6.9) > 0 && hv(6.9) < 1, "the highlight rises at 6.9 (the old window opened at 7.8)");
  assert.equal(hv(7.2), 1, "the highlight is full at the service mark");
  assert.ok(hv(7.85) > 0 && hv(7.85) < 1, "the highlight falls at 7.85");
  assert.equal(hv(8.2), 0, "the highlight is gone at the outlook mark (the old one was still full)");
});

test("nine steps: no element beyond step 8, no install element, no install dynamic parts", () => {
  assert.equal(W.CAM_D.k.length, 9);
  assert.equal(W.CAM_M.k.length, 9);
  for (const el of els) {
    assert.ok(el.k >= 0 && el.k <= 8, `${el.id} has step ${el.k}`);
    assert.notEqual(el.id, "install");
    for (const p of el.art) if (p.t === "dyn") assert.ok(!["bar", "pct", "ok"].includes(p.n), `${el.id} uses ${p.n}`);
  }
  const d = W.dynAt(3.2, 0);
  for (const key of ["ip", "pct", "ok"]) assert.ok(!(key in d), `dynAt has no ${key}`);
  for (const key of ["bar", "pctX", "okRow"]) assert.ok(!(key in W.GEO), `GEO has no ${key}`);
});

test("the five-node cluster is built within step 4 (k = 3) and stays on screen to the end", () => {
  const ids = ["sat-l0", "sat-l1", "sat-l2", "sat-l3", "sat0", "sat1", "sat2", "sat3"];
  for (const id of ids) {
    const el = els.find((e) => e.id === id);
    assert.ok(el, id);
    assert.equal(el.k, 3, id);
    assert.equal(W.buildAt(el, 2.2), 0, `${id} not there at the mark of step 3`);
    assert.equal(W.buildAt(el, 3.2), 1, `${id} built at the mark of step 4`);
    assert.equal(W.buildAt(el, W.FINAL_F), 1, id);
    assert.equal(W.buildAt(el, 8.2), 1, id);
  }
});

test("the build line's packets fade out while the telemetry step builds", () => {
  const on = (f) => W.packetsAt(f, null).length;
  assert.ok(on(3.3) > on(3.8), "packets of the build line are still there at 3.3 and gone at 3.8");
  assert.ok(on(3.8) >= 0);
});

test("same arguments, same frame (no hidden state)", () => {
  assert.deepEqual(W.dynAt(3.7, 2.2), W.dynAt(3.7, 2.2));
  assert.deepEqual(W.cameraAt(3.3, true), W.cameraAt(3.3, true));
});

test("phone: at every step mark no drawn text is under 11px effective, desktop text keeps its size", () => {
  for (let k = 0; k < 9; k++) {
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
  for (let k = 0; k < 9; k++) {
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

test("no SVG text of any frame names the removed installation scene", () => {
  for (const [lang, l] of [["de", de], ["en", en]]) {
    for (const key of ["install", "running", "works", "worksNot"]) {
      assert.ok(!(key in l.clusterStory.graphic), `${lang}: graphic.${key} is gone`);
      assert.ok(!W.LABEL_KEYS.includes(key), `LABEL_KEYS has no ${key}`);
    }
  }
  const removed = new Set(["100 %", "100%", "Installation", "Cluster läuft", "Cluster running", "funktioniert", "works", "funktioniert nicht, daraus lernen", "doesn't work, we learn from it"]);
  for (const lb of [LB, EXAMPLE_LB]) {
    for (let f = -0.5; f <= 8.2 + 1e-9; f += 0.1) {
      for (const el of els) {
        if (W.buildAt(el, f) === 0) continue;
        for (const p of el.art) {
          if (p.t === "text") assert.ok(!removed.has(W.resolveText(p.src, lb)), `${el.id}: ${p.src}`);
        }
      }
    }
  }
});

test("no hex colour outside the set the page already used", () => {
  const known = new Set(
    "#030213 #0e0d13 #1c1a27 #272530 #4b5563 #7c3aed #8129ff #9ca3af #a318f8 #c7c4d1 #d9aeff #ef4444 #ffffff #14131b #1e1c27 #2b95f6 #5db1ff #fda700 #ffc861".split(" "),
  );
  for (const f of ["cluster-story/world.ts", "cluster-story/ClusterStoryWorld.tsx", "ClusterStorySection.tsx"]) {
    for (const h of read(`src/app/components/${f}`).match(/#[0-9a-fA-F]{6}\b/g) ?? []) assert.ok(known.has(h.toLowerCase()), `${f}: ${h}`);
  }
});

/* 20261028-leistungsseite-cluster-story-cards-show-their-la (VL-11-S11): on the phone every card of a step shows its labels */

const cardOf = (el, narrow) => W.artOf(el, narrow).find((p) => p.t === "rect" && p.card);
// The cards that carry the current step: every card of the step (and of the steps it stays current for)
// plus the four call rows, which sit on the call card.
const carrying = (k, narrow) =>
  els
    .filter((e) => (e.k === k || (e.cur ?? []).includes(k)) && (cardOf(e, narrow) || /^call-row\d$/.test(e.id)))
    .map((e) => ({ el: e, card: cardOf(e, narrow) ?? cardOf(els.find((c) => c.id === "call"), narrow) }));
const drawn = (el, narrow) => W.artOf(el, narrow).filter((p) => p.t === "text");

test("phone: every text of every carrying card of step k is drawn at its mark, at 11px effective or more (DE and EN)", () => {
  let checked = 0;
  for (const [lang, lb] of [["de", LB], ["en", EXAMPLE_LB]]) {
    for (let k = 0; k <= 8; k++) {
      const f = k + 0.2;
      const s = W.PHONE_STAGE_W / W.cameraAt(f, true)[2];
      for (const { el } of carrying(k, true)) {
        for (const p of drawn(el, true)) {
          if (p.tier === "s" && W.textSize(p, el, f, true) === 0) continue; // a secondary pill, left out on purpose
          const fs = W.textSize(p, el, f, true);
          assert.ok(fs > 0, `${el.id} ${p.src} is drawn at step ${k} (${lang})`);
          assert.ok(fs * s >= 11 - 1e-6, `${el.id} ${p.src} at step ${k} (${lang}): ${fs * s}px effective`);
          assert.ok(W.resolveText(p.src, lb).length > 0, `${el.id} ${p.src} has text (${lang})`);
          checked++;
        }
      }
    }
  }
  assert.ok(checked > 40, `checked ${checked} texts`);
});

test("phone: the carrying cards of the steps with a call, a lock, a release and metric cards are not icon-only", () => {
  const need = { 5: ["call", "call-row0", "call-row1", "call-row2", "call-row3"], 4: ["lock", "release"] };
  for (const [k, ids] of Object.entries(need)) {
    for (const id of ids) {
      const el = els.find((e) => e.id === id);
      assert.ok(el && el.k === Number(k), `${id} belongs to step ${k}`);
      const f = Number(k) + 0.2;
      assert.ok(drawn(el, true).some((p) => W.textSize(p, el, f, true) > 0), `${id} shows text on the phone at step ${k}`);
    }
  }
});

test("phone: the estimated size of every such text lies inside the card it sits on (DE and EN)", () => {
  for (const [lang, lb] of [["de", LB], ["en", EXAMPLE_LB]]) {
    for (let k = 0; k <= 8; k++) {
      const f = k + 0.2;
      for (const { el, card } of carrying(k, true)) {
        for (const p of drawn(el, true)) {
          const fs = W.textSize(p, el, f, true);
          if (fs === 0) continue;
          const lines = W.wrapText(W.resolveText(p.src, lb), fs, p.wt, p.mw);
          const w = Math.max(...lines.map((l) => W.textWidth(l, fs, p.wt)));
          const h = lines.length * fs * W.LINE_HEIGHT;
          const x0 = p.a === "s" ? p.x : p.a === "m" ? p.x - w / 2 : p.x - w;
          const y0 = p.vc ? p.y - h / 2 : p.y - (fs * W.LINE_HEIGHT) / 2;
          const where = `${el.id} ${p.src} at step ${k} (${lang})`;
          assert.ok(x0 >= card.x && x0 + w <= card.x + card.w, `${where}: width ${Math.round(x0)}..${Math.round(x0 + w)} in ${card.x}..${card.x + card.w}`);
          assert.ok(y0 >= card.y && y0 + h <= card.y + card.h, `${where}: height ${Math.round(y0)}..${Math.round(y0 + h)} in ${card.y}..${card.y + card.h}`);
        }
      }
    }
  }
});

test("phone: the phone art of each step stays inside the camera at its mark (and the whole picture at k = 5 and 7)", () => {
  for (const [lang, lb] of [["de", LB], ["en", EXAMPLE_LB]]) {
    for (let k = 0; k <= 8; k++) {
      const r = W.cameraRect(k + 0.2, true);
      for (const el of els.filter((e) => (e.k === k || ((k === 5 || k === 7) && e.k <= k)) && judged(e))) {
        assert.ok(framed(W.boxOf(el, lb, true), r), `${el.id} (step ${el.k}) phone art inside the camera at step ${k} (${lang})`);
      }
    }
  }
});

test("desktop is unchanged: the design art is drawn, the desktop camera has not moved, the four call points read short", () => {
  assert.deepEqual(W.CAM_D, {
    pre: [315, 250, 300],
    k: [[225, 209, 520], [225, 209, 520], [300, 235, 560], [640, 270, 720], [620, 316, 640], [470, 392, 990], [700, 394, 780], [470, 392, 990], [842, 380, 760]],
  });
  for (const el of els) assert.equal(W.artOf(el, false), el.art, el.id);
  assert.deepEqual(
    [de.clusterStory.graphic.reviewWorked, de.clusterStory.graphic.rules, de.clusterStory.graphic.models, de.clusterStory.graphic.nextProject],
    ["Was lief, was nicht", "Regeln nachschärfen", "Modelle aktualisieren", "Nächstes Projekt"],
  );
  assert.deepEqual(
    [en.clusterStory.graphic.reviewWorked, en.clusterStory.graphic.rules, en.clusterStory.graphic.models, en.clusterStory.graphic.nextProject],
    ["What worked, what not", "Sharpen the rules", "Update models", "Next project"],
  );
});
