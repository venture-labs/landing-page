/**
 * 20261024-leistungsseite-the-growing-cluster-story-design- (VL-11-S7), acceptance criterion 25,
 * amended by 20261028-leistungsseite-cluster-story-cleanup-dots-not-cl (VL-11-S10):
 * both locale files carry the same key set under `leistungen.clusterStory`, every value is a
 * non-empty string and none of them is a raw key; both content files carry the same nine steps
 * (VL-11-S10: no Installation step, new copy for input, build, telemetry and service).
 * No browser, no build needed.
 * Run: pnpm exec tsx --test tests/build/cluster-story-locales.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const de = JSON.parse(read("src/locales/de.json")).leistungen.clusterStory;
const en = JSON.parse(read("src/locales/en.json")).leistungen.clusterStory;

/** Every leaf of a nested object as `a.b.c` -> value. */
function leaves(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") Object.assign(out, leaves(value, path));
    else out[path] = value;
  }
  return out;
}

const deLeaves = leaves(de);
const enLeaves = leaves(en);

test("de and en have the same key set under leistungen.clusterStory", () => {
  assert.ok(Object.keys(deLeaves).length > 0);
  assert.deepEqual(Object.keys(deLeaves).sort(), Object.keys(enLeaves).sort());
});

test("every clusterStory value is a non-empty string and no value is a raw key", () => {
  for (const [lang, set] of [["de", deLeaves], ["en", enLeaves]]) {
    for (const [key, value] of Object.entries(set)) {
      assert.equal(typeof value, "string", `${lang}: ${key} is not a string`);
      assert.ok(value.trim().length > 0, `${lang}: ${key} is empty`);
      assert.ok(!value.startsWith("leistungen.clusterStory"), `${lang}: ${key} renders as a raw key`);
    }
  }
});

const steps = (file) => matter(read(file)).data.clusterStory.steps;
const story = (file) => matter(read(file)).data.clusterStory;
const FILES = { de: "content/site/leistungen.md", en: "content/site/leistungen.en.md" };
const IDS = ["input", "concepts", "handover", "build", "telemetry", "loop", "growth", "service", "outlook"];
const byId = (list, id) => list.find((s) => s.id === id);

test("both content files have exactly the nine steps in the same order, none is marked planned", () => {
  for (const lang of ["de", "en"]) {
    const list = steps(FILES[lang]);
    assert.deepEqual(list.map((s) => s.id), IDS, lang);
    list.forEach((s, i) => {
      assert.notEqual(s.status, "planned", `${lang} step ${i + 1} status`);
      assert.ok(typeof s.body === "string" && s.body.length > 0, `${lang} step ${i + 1} body`);
    });
  }
});

test("no Installation step, label or installation bar in any clusterStory text", () => {
  for (const lang of ["de", "en"]) {
    const text = JSON.stringify(story(FILES[lang]));
    assert.ok(!/Installation|installation/.test(text), `${lang}: installation`);
    assert.ok(!/0 auf 100|0 to 100|Balken|\bbar\b/.test(text), `${lang}: bar`);
    for (const key of ["install", "running", "works", "worksNot"]) {
      assert.ok(!(key in (lang === "de" ? de : en).graphic), `${lang}: graphic.${key}`);
    }
  }
});

test("the intro names the step count: the word neun / nine matches steps.length", () => {
  const words = { de: "neun", en: "nine" };
  const numbers = { 1: ["ein", "one"], 2: ["zwei", "two"], 3: ["drei", "three"], 4: ["vier", "four"], 5: ["fünf", "five"], 6: ["sechs", "six"], 7: ["sieben", "seven"], 8: ["acht", "eight"], 9: ["neun", "nine"], 10: ["zehn", "ten"] };
  for (const lang of ["de", "en"]) {
    const st = story(FILES[lang]);
    const n = st.steps.length;
    assert.equal(n, 9);
    assert.match(st.intro, new RegExp(`\\b${numbers[n][lang === "de" ? 0 : 1]}\\b`, "i"), `${lang}: intro names ${n}`);
    assert.ok(st.intro.includes(words[lang]), lang);
  }
});

test("new copy: input, build, telemetry and service steps", () => {
  const d = steps(FILES.de);
  const e = steps(FILES.en);
  assert.equal(byId(d, "input").heading, "Dein Problem");
  assert.ok(byId(d, "input").body.startsWith("Du hast eine Aufgabe, die zu viel Zeit frisst. Erzähl sie uns da, wo du ohnehin arbeitest."));
  assert.equal(byId(e, "input").heading, "Your problem");
  assert.ok(byId(e, "input").body.startsWith("You have a task that eats up too much time. Tell us about it where you already work."));
  for (const list of [d, e]) {
    assert.deepEqual(byId(list, "input").channels.map((c) => c.status), ["live", "live", "live", "live"]);
    assert.equal(byId(list, "input").channels.length, 4);
  }
  assert.ok(byId(d, "build").body.includes("läuft bei dir") && byId(d, "build").body.includes("lernen daraus"));
  assert.ok(byId(e, "build").body.includes("runs at your site") && byId(e, "build").body.includes("learn from it"));
  assert.equal(byId(d, "telemetry").heading, "Wir sehen, ob es läuft. Nicht, was drin ist.");
  for (const w of ["Laufzeit", "Fehler", "Kosten", "Updates"]) assert.ok(byId(d, "telemetry").body.includes(w), w);
  assert.equal(byId(e, "telemetry").heading, "We see whether it runs. Not what is inside.");
  for (const w of ["runtime", "errors", "costs", "updates"]) assert.ok(byId(e, "telemetry").body.includes(w), w);
  for (const list of [d, e]) assert.doesNotMatch(byId(list, "telemetry").body, /verlässt nie|nie etwas|never leaves|nothing (ever )?leaves/i);
  assert.ok(byId(d, "service").body.includes("Fertig wird ein Cluster nie, er wächst mit deinem Unternehmen. Wir bauen weiter, Schritt für Schritt und nachvollziehbar."));
  assert.ok(byId(e, "service").body.includes("A cluster is never finished, it grows with your company. We keep building, step by step and traceably."));
  assert.equal(byId(d, "service").billingNote, "Aufbau = ein Projekt · Betrieb = monatliche Betreuung");
  assert.equal(byId(e, "service").billingNote, "Build = one project · Operation = monthly retainer");
});

test("no guarantee wording anywhere in the clusterStory text", () => {
  for (const lang of ["de", "en"]) assert.doesNotMatch(JSON.stringify(story(FILES[lang])), /Garantie|guarantee/i, lang);
});

test("German '100 %' is joined by U+00A0 (intro and service heading); no normal-space form remains", () => {
  const st = story(FILES.de);
  const text = JSON.stringify(st);
  assert.ok(!/100 %/.test(text), "no '100 %' with a normal space");
  assert.ok(st.intro.includes("100\u00a0%"));
  assert.ok(byId(st.steps, "service").heading.includes("100\u00a0%"));
  assert.equal(text.match(/100\u00a0%/g).length, 2);
});

test("the progress indicator is named by progressLabel; the old step-nav label is gone", () => {
  assert.equal(de.progressLabel, "Fortschritt");
  assert.equal(en.progressLabel, "Progress");
  assert.ok(!("stepNavLabel" in de) && !("stepNavLabel" in en));
});
