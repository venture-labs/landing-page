/**
 * 20261028-leistungsseite-use-cases-as-one-section-in-situa (VL-11-S9), acceptance criteria 1-7:
 * the `situations` of content/site/leistungen.md and .en.md are the ONE list of use cases of
 * /:lang/leistungen. No browser, no build needed.
 * Run: pnpm exec tsx --test tests/build/use-cases-content.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const FILES = { de: "content/site/leistungen.md", en: "content/site/leistungen.en.md" };
const data = Object.fromEntries(Object.entries(FILES).map(([lang, p]) => [lang, matter(read(p)).data]));

/** The spec's limits, quoted once: 20 to 24 cards, text at most 160 characters, 2 to 4 capabilities. */
const MIN_CARDS = 20;
const MAX_CARDS = 24;
const MAX_TEXT_LENGTH = 160;
const MIN_CAPABILITIES = 2;
const MAX_CAPABILITIES = 4;
const FORBIDDEN_IN_TEXT = /Stunde|Stunden|Minuten|Prozent|\bhours?\b|\bminutes?\b|\bpercent\b|\bEUR\b|\bEuro\b|€/i;

for (const lang of ["de", "en"]) {
  const situations = data[lang].situations;

  test(`${lang}: criterion 1 - between ${MIN_CARDS} and ${MAX_CARDS} situations, none duplicated`, () => {
    assert.ok(Array.isArray(situations));
    assert.ok(situations.length >= MIN_CARDS && situations.length <= MAX_CARDS, `got ${situations.length}`);
    assert.equal(new Set(situations.map((s) => s.id)).size, situations.length);
  });

  test(`${lang}: criterion 2 - receipts / Beleg-Inbox first, no status field on any card`, () => {
    assert.equal(situations[0].id, "receipts");
    assert.equal(situations[0].agentName, "Beleg-Inbox");
    for (const s of situations) assert.equal("agentKind" in s, false, s.id);
  });

  test(`${lang}: criterion 3 - text, unique agent name and capabilities are within the limits`, () => {
    for (const s of situations) {
      assert.ok(typeof s.text === "string" && s.text.trim().length > 0, `${s.id} text`);
      assert.ok(s.text.length <= MAX_TEXT_LENGTH, `${s.id} text has ${s.text.length} characters`);
      assert.ok(typeof s.agentName === "string" && s.agentName.trim().length > 0, `${s.id} agentName`);
      assert.ok(Array.isArray(s.capabilities), `${s.id} capabilities`);
      assert.ok(
        s.capabilities.length >= MIN_CAPABILITIES && s.capabilities.length <= MAX_CAPABILITIES,
        `${s.id} has ${s.capabilities.length} capabilities`
      );
      for (const c of s.capabilities) assert.ok(typeof c === "string" && c.trim().length > 0, `${s.id} capability`);
    }
    assert.equal(new Set(situations.map((s) => s.agentName)).size, situations.length);
  });

  test(`${lang}: criterion 4 - no digit in any text, agent name, capability or the lead line; no hour/percent/currency word in a text`, () => {
    for (const s of situations) {
      for (const value of [s.text, s.agentName, ...s.capabilities]) {
        assert.doesNotMatch(value, /\d/, `${s.id}: "${value}"`);
      }
      assert.doesNotMatch(s.text, FORBIDDEN_IN_TEXT, s.id);
    }
    assert.doesNotMatch(data[lang].useCasesLeadLine, /\d/);
  });

  test(`${lang}: criterion 7 - the lead line names Beleg-Inbox, says the rest are examples, carries no count`, () => {
    const line = data[lang].useCasesLeadLine;
    assert.match(line, /Beleg-Inbox/);
    assert.match(line, lang === "de" ? /Beispiele/ : /examples?/);
    assert.doesNotMatch(line, /\bvier\b|\bfour\b|\d/i);
  });
}

test("criterion 1: both files carry the same ids in the same order", () => {
  assert.deepEqual(
    data.de.situations.map((s) => s.id),
    data.en.situations.map((s) => s.id)
  );
});

test("criterion 5: the tool-fatigue entry reads as the decision wants it, in both locales", () => {
  const de = data.de.situations.find((s) => s.id === "tool-fatigue");
  const en = data.en.situations.find((s) => s.id === "tool-fatigue");
  assert.equal(de.text, "Wir hatten ein gutes Konzept. Umgesetzt hat es dann niemand.");
  assert.equal(en.text, "We had a good concept. Nobody ever implemented it.");
  assert.equal(de.agentName, "Rollout-Lotse");
  assert.equal(en.agentName, "Rollout Guide");
});

test("criterion 5: the old tool-fatigue sentences are gone from content/, src/ and tests/", () => {
  for (const p of [FILES.de, FILES.en, "src/locales/de.json", "src/locales/en.json"]) {
    const text = read(p);
    assert.ok(!text.includes("Wir probieren seit Monaten"), p);
    assert.ok(!text.includes("We've been trying AI tools for months"), p);
  }
});

test("criterion 6: the agentOptions fields are gone from the tool profiles and the generator", () => {
  for (const p of ["content/tools/beleg-inbox.md", "content/tools/beleg-inbox.en.md", "scripts/generate-content.ts"]) {
    assert.ok(!/agentOption/i.test(read(p)), p);
  }
});

test("criterion 8: ToolProfile.tsx is deleted and Leistungen.tsx mounts the section right after PulseJourney", () => {
  assert.ok(!existsSync(resolve(root, "src/app/components/ToolProfile.tsx")));
  const page = read("src/app/pages/Leistungen.tsx");
  assert.ok(!page.includes("ToolProfile"));
  const order = ["<PulseJourney />", "<UseCasesSection />", "<SkillMatrix />", "<ClusterStorySection />"].map((m) =>
    page.indexOf(m)
  );
  assert.ok(order.every((i) => i > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});
