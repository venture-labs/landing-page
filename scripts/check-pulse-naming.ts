/**
 * Mechanical assertions for the no-price / one-meaning-for-Pulse-Check change
 * (task 20260926-the-real-prices-on-the-main-site-and-one-meaning).
 *
 * The repo has no test runner and adding one is out of scope, so this script
 * (run on `tsx`, already a devDependency) replaces it for the assertable
 * acceptance criteria — the same pattern as `scripts/check-analytics.ts` and
 * `scripts/check-area-pages.ts`:
 *
 *   pnpm check:naming
 *
 * It asserts criterion 1 (no currency amount in content/, src/locales/ or the
 * generated src/data/{de,en}/), criterion 2 (none in dist/ either, when a build
 * exists), criteria 4-7 (every quiz-opening label and the dialog heading name
 * the free Pulse Score, never the paid Pulse Check), criterion 8 (the
 * "Pulse Check is free" sentence is gone in both locales), criterion 10
 * (content side: the Check card's label), criterion 11 (PulseJourney opens no
 * dialog) and criterion 19 (nothing names a duration for the first
 * conversation or calls it free). Criteria 4-6, 9, 10, 12 and 13 are also
 * browser checks — `scripts/prerender.ts` emits head tags only, the body is
 * client-rendered — so the rendered side stays the Tester's preview pass.
 *
 * Two deliberate deviations from the spec, both reported in the implementation
 * report:
 *
 * - The spec's currency regex `/\d[\d.,]*\s*(€|EUR|Euro)\b/` never matches
 *   `2.900 €`: `\b` after a non-word character like `€` only holds when a word
 *   character follows. CURRENCY below drops that boundary for `€` and keeps it
 *   for the letter forms, and also catches the `€ 2.900` order.
 * - Criterion 19's repo-wide scope for the free/30-minute-call claim cannot
 *   hold today: `content/services/ai-automation.md` and
 *   `content/services/venture-building.md` already said "im kostenlosen
 *   Erstgespräch" before this task, and rewriting area-page sales copy is
 *   outside its scope (that copy is Christian's call). FIRST_CALL_SCOPE is
 *   therefore the set of files this task owns.
 *
 * Exits non-zero and prints a FAIL line per failed criterion.
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { resolve, dirname, relative, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distDir = resolve(repoRoot, "dist");

/** A price, in either order: `2.900 €`, `2.500 €/Monat`, `EUR 15.000`, `2900 Euro`. */
const CURRENCY = /(\d[\d.,]*\s*(€|EUR\b|Euro\b))|((€|EUR|Euro)\s*\d)/i;

/** The first conversation must not be named free or given a duration. */
const FIRST_CALL = /30\s*-?\s*min|kostenlose[sn]?\s+(erst)?gespräch|free\s+(30|call)/i;

/** The free quiz's label and the dialog heading say Score, never Check. */
const FREE_QUIZ_LABELS = {
  de: "Kostenlosen Pulse Score starten",
  en: "Start your free Pulse Score",
};

/** The Check card's CTA in `#ablauf` — the paid step talks, it does not test. */
const CHECK_CARD_LABELS = {
  de: "Über den Pulse Check sprechen",
  en: "Talk about a Pulse Check",
};

const FORBIDDEN_SENTENCES = [
  "Der Pulse Check dauert fünf Minuten",
  "The Pulse Check takes five minutes",
];

/** Criterion 1 — hand-written and generated content, both locales. */
const CURRENCY_SCOPE = ["content", "src/locales", "src/data/de", "src/data/en"];

/** Criterion 19, scoped to the strings this task owns (see the header). */
const FIRST_CALL_SCOPE = ["content/site", "src/locales", "src/app"];

/** Criterion 8 — the free-Pulse-Check sentence, anywhere a string can live. */
const SENTENCE_SCOPE = ["content", "src"];

let failed = 0;

function pass(criterion: string, message: string): void {
  console.log(`PASS  [${criterion}] ${message}`);
}

function fail(criterion: string, message: string): void {
  failed++;
  console.error(`FAIL  [${criterion}] ${message}`);
}

function check(criterion: string, ok: boolean, okMessage: string, failMessage: string): void {
  if (ok) pass(criterion, okMessage);
  else fail(criterion, failMessage);
}

function read(path: string): string {
  return readFileSync(path, "utf-8");
}

function rel(path: string): string {
  return relative(repoRoot, path).replace(/\\/g, "/");
}

/** Every file under a directory, recursively, that matches `accept`. */
function findFiles(dir: string, accept: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findFiles(full, accept));
    else if (accept(entry.name)) out.push(full);
  }
  return out;
}

const isText = (name: string) => /\.(md|json|ts|tsx|html)$/.test(name);

function filesUnder(roots: string[]): string[] {
  return roots.flatMap((root) => findFiles(resolve(repoRoot, root), isText));
}

/**
 * The first offender as "path:line", for a FAIL message. Safe when empty: both
 * messages of a `check()` are built before the verdict is known.
 */
function firstHit(files: string[], re: RegExp): string {
  if (files.length === 0) return "-";
  const lines = read(files[0]).split(/\r?\n/);
  const index = lines.findIndex((line) => re.test(line));
  return `${rel(files[0])}${index >= 0 ? `:${index + 1}` : ""}`;
}

function offenders(files: string[], re: RegExp): string[] {
  return files.filter((file) => re.test(read(file)));
}

/** Criterion 1 — no price in the content pipeline. */
function checkNoPriceInSource(): void {
  const files = filesUnder(CURRENCY_SCOPE);
  const hits = offenders(files, CURRENCY);
  check(
    "1",
    files.length > 0 && hits.length === 0,
    `no currency amount in any of the ${files.length} files under ${CURRENCY_SCOPE.join(", ")}`,
    files.length === 0
      ? `found no files under ${CURRENCY_SCOPE.join(", ")} — is this the repo root?`
      : `${hits.length} file(s) carry a currency amount, e.g. ${firstHit(hits, CURRENCY)}`
  );
}

/** Criterion 2 — no price in the built site. */
function checkNoPriceInDist(): void {
  if (!existsSync(distDir)) {
    console.log("SKIP  [2] dist/ does not exist — run `pnpm build` to assert the bundle is price-free");
    return;
  }
  const files = findFiles(distDir, (name) => name.endsWith(".js") || name === "index.html");
  const hits = offenders(files, CURRENCY);
  check(
    "2",
    files.length > 0 && hits.length === 0,
    `no currency amount in any of the ${files.length} dist/**/*.js and dist/**/index.html files`,
    files.length === 0
      ? "dist/ holds no .js or index.html files — did the build run?"
      : `${hits.length} built file(s) carry a currency amount, e.g. ${firstHit(hits, CURRENCY)}`
  );
}

/**
 * Criterion 19 — the first conversation is an Erstgespräch / first call, with
 * no duration and no "free": Christian has not decided the free 30-minute
 * video call, so no string this task owns may claim it.
 */
function checkNoFreeCallClaim(): void {
  const files = filesUnder(FIRST_CALL_SCOPE);
  const hits = offenders(files, FIRST_CALL);
  check(
    "19",
    files.length > 0 && hits.length === 0,
    `no duration and no free claim for the first conversation in any of the ${files.length} files under ${FIRST_CALL_SCOPE.join(", ")}`,
    files.length === 0
      ? `found no files under ${FIRST_CALL_SCOPE.join(", ")} — is this the repo root?`
      : `${hits.length} file(s) name a duration or call the first conversation free, e.g. ${firstHit(hits, FIRST_CALL)}`
  );
}

/** Criteria 4, 5 and 7 — every quiz-opening label names the free Pulse Score. */
function checkQuizLabels(): void {
  const sources: [string, string, keyof typeof FREE_QUIZ_LABELS][] = [
    ["content/site/home.md", "heroCta", "de"],
    ["content/site/home.en.md", "heroCta", "en"],
    ["src/locales/de.json", '"cta"', "de"],
    ["src/locales/en.json", '"cta"', "en"],
    ["src/locales/de.json", '"pulseCta"', "de"],
    ["src/locales/en.json", '"pulseCta"', "en"],
  ];

  for (const [file, key, lang] of sources) {
    const path = resolve(repoRoot, file);
    if (!existsSync(path)) {
      fail("4-5", `${file} is missing`);
      continue;
    }
    const label = FREE_QUIZ_LABELS[lang];
    const line = read(path)
      .split(/\r?\n/)
      .find((l) => l.includes(key) && l.includes(label));
    check(
      "4-5",
      line !== undefined,
      `${file} ${key} reads "${label}"`,
      `${file} ${key} does not read "${label}"`
    );
  }

  // Criterion 7 — and none of them still says "Pulse Check".
  const labelFiles = [
    "content/site/home.md",
    "content/site/home.en.md",
    "src/locales/de.json",
    "src/locales/en.json",
  ].map((f) => resolve(repoRoot, f));
  const hits = offenders(labelFiles, /Pulse Check/);
  check(
    "7",
    hits.length === 0,
    "no quiz-opening label in content/site/home*.md or src/locales/*.json contains \"Pulse Check\"",
    `${hits.length} label file(s) still contain "Pulse Check", e.g. ${firstHit(hits, /Pulse Check/)}`
  );
}

/** Criterion 6 — the dialog's accessible name names the Score, not the Check. */
function checkQuizHeading(): void {
  const path = resolve(repoRoot, "src/app/components/PulseQuiz.tsx");
  if (!existsSync(path)) {
    fail("6", "src/app/components/PulseQuiz.tsx is missing");
    return;
  }
  const headings = [...read(path).matchAll(/quizHeading:\s*"([^"]+)"/g)].map((m) => m[1]);

  check(
    "6",
    headings.length === 2,
    "PulseQuiz.tsx declares exactly two quizHeading strings (de and en)",
    `PulseQuiz.tsx declares ${headings.length} quizHeading strings — expected 2 (de and en)`
  );

  for (const heading of headings) {
    check(
      "6",
      heading.includes("Pulse Score") && !heading.includes("Pulse Check"),
      `the dialog heading "${heading}" names the Pulse Score and not the Pulse Check`,
      `the dialog heading "${heading}" must name "Pulse Score" and must not name "Pulse Check"`
    );
  }
}

/** Criterion 8 — the sentence that called the paid product free is gone. */
function checkForbiddenSentences(): void {
  const files = filesUnder(SENTENCE_SCOPE);
  for (const sentence of FORBIDDEN_SENTENCES) {
    const hits = files.filter((file) => read(file).includes(sentence));
    check(
      "8",
      hits.length === 0,
      `no file under ${SENTENCE_SCOPE.join(", ")} contains "${sentence}"`,
      `${hits.length} file(s) still contain "${sentence}", e.g. ${hits.length > 0 ? rel(hits[0]) : "-"}`
    );
  }
}

/** Criterion 10 (content side) — the Check card talks instead of testing. */
function checkCheckCardLabel(): void {
  const sources: [string, keyof typeof CHECK_CARD_LABELS][] = [
    ["content/site/leistungen.md", "de"],
    ["content/site/leistungen.en.md", "en"],
  ];
  for (const [file, lang] of sources) {
    const path = resolve(repoRoot, file);
    if (!existsSync(path)) {
      fail("10", `${file} is missing`);
      continue;
    }
    const label = CHECK_CARD_LABELS[lang];
    check(
      "10",
      read(path).includes(`ctaLabel: '${label}'`),
      `${file} gives the check step the label "${label}"`,
      `${file} does not give the check step the label "${label}"`
    );
  }
}

/** Criterion 11 — nothing in #ablauf opens the quiz dialog. */
function checkJourneyOpensNoDialog(): void {
  const path = resolve(repoRoot, "src/app/components/PulseJourney.tsx");
  if (!existsSync(path)) {
    fail("11", "src/app/components/PulseJourney.tsx is missing");
    return;
  }
  const src = read(path);

  for (const token of ["PulseCheckModal", "quizOpen", "onCheckCta", 'step.key === "check"']) {
    check(
      "11",
      !src.includes(token),
      `PulseJourney.tsx contains no ${token}`,
      `PulseJourney.tsx still contains ${token}`
    );
  }

  check(
    "11",
    src.includes('localizedPath("/kontakt")'),
    "PulseJourney.tsx links its step CTA to /:lang/kontakt",
    "PulseJourney.tsx no longer links its step CTA to /:lang/kontakt"
  );
}

function main(): void {
  console.log(
    "check-pulse-naming: asserting no price, one meaning for \"Pulse Check\", and no free/30-minute-call claim\n"
  );

  checkNoPriceInSource();
  checkNoPriceInDist();
  checkNoFreeCallClaim();
  checkQuizLabels();
  checkQuizHeading();
  checkForbiddenSentences();
  checkCheckCardLabel();
  checkJourneyOpensNoDialog();

  console.log("");
  if (failed > 0) {
    console.error(`check-pulse-naming: ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("check-pulse-naming: all checks passed");
}

main();
