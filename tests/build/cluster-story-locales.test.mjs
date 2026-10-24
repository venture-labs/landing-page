/**
 * 20261024-leistungsseite-the-growing-cluster-story-design- (VL-11-S7), acceptance criterion 25:
 * both locale files carry the same key set under `leistungen.clusterStory`, every value is a
 * non-empty string and none of them is a raw key; both content files carry the same ten steps.
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

test("both content files have the same ten steps in the same order, only the tenth is planned", () => {
  const steps = (file) => matter(read(file)).data.clusterStory.steps;
  const deSteps = steps("content/site/leistungen.md");
  const enSteps = steps("content/site/leistungen.en.md");
  assert.equal(deSteps.length, 10);
  assert.deepEqual(deSteps.map((s) => s.id), enSteps.map((s) => s.id));
  assert.equal(deSteps[9].id, "outlook");
  for (const list of [deSteps, enSteps]) {
    list.forEach((s, i) => {
      assert.equal(s.status, i === 9 ? "planned" : undefined, `step ${i + 1} status`);
      assert.ok(typeof s.body === "string" && s.body.length > 0, `step ${i + 1} body`);
    });
  }
});
