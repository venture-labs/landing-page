/**
 * Mechanical rule for the numbers on the case studies and on the area pages'
 * case blocks (task 20260926-case-facts-remove-the-contradictions-source-the-,
 * D6 of the 2026-09-26 website audit):
 *
 *   A number a visitor can read is either backed by a `statsSource` entry in
 *   the file's frontmatter (not rendered) or it is not there.
 *
 *   pnpm check:cases
 *
 * Standalone like `check-analytics.ts` / `check-area-pages.ts`: not part of
 * `pnpm build`. Prints one PASS/FAIL line per rule and file and exits 1 on
 * any FAIL. Rules:
 *
 *   R1 coverage     no digit left in a rendered text field once `Tap2Link`,
 *                   `B2B` and the file's own `statsSource[].value` are removed
 *   R2 no orphans   every `statsSource[].value` occurs in a rendered text field
 *   R3 real source  every `statsSource[].source` is filled in
 *   R4 one timeline all durations (N Wochen / weeks ...) in a file are equal
 *   R5 unique       no non-duration number appears in the stats of two cases
 *   R6 parity       de and en carry the same count of stats / statsSource
 *   R7 area = case  an area page's `statsSource` value exists on its case
 *   R8 Moerschen    its subtitle is not Tap2Link's copy
 */
import { readdirSync, readFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const casesDir = resolve(repoRoot, "content/cases");
const servicesDir = resolve(repoRoot, "content/services");

type Locale = "de" | "en";
type Fm = Record<string, any>;
interface Entry {
  kind: "case" | "service";
  file: string; // e.g. content/cases/tap2link.en.md
  slug: string;
  locale: Locale;
  fm: Fm;
}

let failed = 0;

function report(ok: boolean, rule: string, file: string, message: string): void {
  if (ok) {
    console.log(`PASS  [${rule}] ${file}`);
  } else {
    failed++;
    console.error(`FAIL  [${rule}] ${file}: ${message}`);
  }
}

function load(dir: string, kind: Entry["kind"]): Entry[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const locale: Locale = f.endsWith(".en.md") ? "en" : "de";
      const slug = f.replace(/\.en\.md$/, "").replace(/\.md$/, "");
      const fm = matter(readFileSync(join(dir, f), "utf-8")).data as Fm;
      return { kind, file: `content/${kind === "case" ? "cases" : "services"}/${f}`, slug, locale, fm };
    });
}

const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** The text a visitor reads from the case (or the area page's case block). */
function renderedFields(e: Entry): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = [];
  const add = (name: string, v: unknown) => out.push({ name, text: str(v) });
  if (e.kind === "case") {
    for (const k of ["title", "subtitle", "category", "heroHeadline", "heroSubline", "description", "background", "problem", "solution"]) {
      add(k, e.fm[k]);
    }
    list(e.fm.stats).forEach((s, i) => add(`stats[${i}]`, s));
    list(e.fm.detailStats).forEach((s, i) => {
      add(`detailStats[${i}].value`, s?.value);
      add(`detailStats[${i}].label`, s?.label);
    });
  } else {
    for (const k of ["caseTitle", "caseSubtitle", "caseDescription"]) add(k, e.fm[k]);
    list(e.fm.caseStats).forEach((s, i) => {
      add(`caseStats[${i}].value`, s?.value);
      add(`caseStats[${i}].label`, s?.label);
    });
  }
  return out;
}

/** The stat entries only (card stats and detail stats / case-block stats). */
function statTexts(e: Entry): string[] {
  if (e.kind === "case") {
    return [
      ...list(e.fm.stats).map(str),
      ...list(e.fm.detailStats).map((s) => `${str(s?.value)} ${str(s?.label)}`),
    ];
  }
  return list(e.fm.caseStats).map((s) => `${str(s?.value)} ${str(s?.label)}`);
}

const sources = (e: Entry): { value: string; source: string }[] =>
  list(e.fm.statsSource).map((s) => ({ value: str(s?.value), source: str(s?.source) }));

const DURATION = /(\d+(?:[.,]\d+)?)\s*(?:Wochen|Woche|Wo\.|weeks|week|wks|wk)(?![A-Za-zÄÖÜäöüß])/gi;
const NUMBER_WITH_UNIT = /\d+(?:[.,]\d+)?\s*(?:%|×|x(?![A-Za-z])|Sek[A-Za-z.]*|sec[A-Za-z.]*)|\d+\s*\/\s*\d+/gi;
const PLACEHOLDER_SOURCES = new Set(["tbd", "todo", "internal", "unknown", "?"]);

function stripNames(text: string, values: string[]): string {
  let t = text.replace(/Tap2Link/g, "").replace(/B2B/g, "");
  for (const v of values) if (v) t = t.split(v).join("");
  return t;
}

const cases = load(casesDir, "case");
const services = load(servicesDir, "service");
const all = [...cases, ...services];

for (const e of all) {
  const fields = renderedFields(e);
  const src = sources(e);
  const values = src.map((s) => s.value);

  // R1
  const leftovers = fields
    .map((f) => ({ name: f.name, rest: stripNames(f.text, values) }))
    .filter((f) => /\d/.test(f.rest));
  report(
    leftovers.length === 0,
    "R1 coverage",
    e.file,
    leftovers.map((f) => `${f.name} has an unsourced number: "${f.rest.trim()}"`).join("; "),
  );

  // R2
  const orphans = values.filter((v) => !fields.some((f) => f.text.includes(v)));
  report(orphans.length === 0, "R2 no orphans", e.file, `statsSource value(s) not on the page: ${orphans.map((v) => `"${v}"`).join(", ")}`);

  // R3
  const bad = src.filter((s) => !s.value || !s.source.trim() || PLACEHOLDER_SOURCES.has(s.source.trim().toLowerCase()));
  report(bad.length === 0, "R3 real source", e.file, `statsSource entry without a value or a real source: ${JSON.stringify(bad)}`);

  // R4
  const durations = new Set<string>();
  for (const f of fields) for (const m of f.text.matchAll(DURATION)) durations.add(m[1].replace(",", "."));
  report(durations.size <= 1, "R4 one timeline", e.file, `different durations in one file: ${[...durations].join(", ")}`);
}

// R5: per locale, a non-duration number belongs to one case only
for (const locale of ["de", "en"] as Locale[]) {
  const owner = new Map<string, Set<string>>();
  for (const e of cases.filter((c) => c.locale === locale)) {
    for (const text of statTexts(e)) {
      for (const m of text.matchAll(NUMBER_WITH_UNIT)) {
        const token = m[0].replace(/\s+/g, "").toLowerCase().replace("×", "x");
        if (!owner.has(token)) owner.set(token, new Set());
        owner.get(token)!.add(e.slug);
      }
    }
  }
  const shared = [...owner].filter(([, slugs]) => slugs.size > 1);
  report(
    shared.length === 0,
    "R5 unique number",
    `content/cases/*${locale === "en" ? ".en" : ""}.md`,
    shared.map(([t, slugs]) => `"${t}" on ${[...slugs].join(" and ")}`).join("; "),
  );
}

// R6: de and en agree
const byKey = new Map<string, Entry>();
for (const e of all) byKey.set(`${e.kind}:${e.slug}:${e.locale}`, e);
for (const e of all.filter((x) => x.locale === "de")) {
  const en = byKey.get(`${e.kind}:${e.slug}:en`);
  if (!en) {
    report(false, "R6 parity", e.file, "no English counterpart");
    continue;
  }
  const keys = e.kind === "case" ? ["stats", "detailStats", "statsSource"] : ["caseStats", "statsSource"];
  const diffs = keys.filter((k) => list(e.fm[k]).length !== list(en.fm[k]).length);
  report(
    diffs.length === 0,
    "R6 parity",
    e.file,
    diffs.map((k) => `${k}: de ${list(e.fm[k]).length} vs en ${list(en.fm[k]).length}`).join("; "),
  );
}

// R7: an area page only claims what its case claims
for (const e of services) {
  const c = byKey.get(`case:${str(e.fm.caseSlug)}:${e.locale}`);
  const caseValues = c ? sources(c).map((s) => s.value) : [];
  const missing = sources(e).filter((s) => !caseValues.includes(s.value));
  report(
    missing.length === 0 && (c !== undefined || sources(e).length === 0),
    "R7 area = case",
    e.file,
    c ? `statsSource not on case ${e.fm.caseSlug}: ${missing.map((s) => `"${s.value}"`).join(", ")}` : `case "${e.fm.caseSlug}" not found`,
  );
}

// R8: Moerschen's subtitle describes Moerschen
for (const e of cases.filter((c) => c.slug === "moerschen")) {
  const sub = str(e.fm.subtitle);
  const wrong = /Serviceportal|service portal|B2B/i.test(sub);
  report(!wrong && sub.length > 0, "R8 Moerschen subtitle", e.file, `subtitle is empty or still Tap2Link's copy: "${sub}"`);
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll case-fact checks passed.");
