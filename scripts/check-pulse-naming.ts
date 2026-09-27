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
 * dialog), criterion 19 (no duration for the first conversation anywhere, and
 * no new price or free claim for it inside the strings this task owns) and
 * criterion 20 (those six strings read exactly as the spec writes them).
 * Criteria 4-6, 9, 10, 12 and 13 are also browser checks —
 * `scripts/prerender.ts` emits head tags only, the body is client-rendered — so
 * the rendered side stays the Tester's preview pass.
 *
 * Two deliberate deviations from the spec, both reported in the implementation
 * report:
 *
 * - The spec's currency regex `/\d[\d.,]*\s*(€|EUR|Euro)\b/` never matches
 *   `2.900 €`: `\b` after a non-word character like `€` only holds when a word
 *   character follows. CURRENCY below drops that boundary for `€` and keeps it
 *   for the letter forms, and also catches the `€ 2.900` order.
 * - The spec pairs a digits-and-minutes phrase with "Gespräch"/"call" "on one
 *   line". A minified `dist/assets/*.js` line is 40.000 characters wide, so
 *   every blog reading time ("6 Min") lands on the same line as some unrelated
 *   "call" and the assertion would fire on a clean build. The pairing is
 *   therefore measured over a DURATION_WINDOW-character window around the
 *   minutes phrase, which is what "one line" means in prose.
 *
 * The word "kostenlos" is deliberately NOT banned repo-wide (Christian,
 * 2026-09-27, VL-5-S2 gate 1): a free first conversation is decided and fine,
 * only its duration is not, and `content/services/ai-automation.md` and
 * `content/services/venture-building.md` said "im kostenlosen Erstgespräch"
 * before this task and stay untouched, in `content/` and in `dist/`.
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

/** Criterion 19 — a duration for the first conversation, said outright. */
const CALL_DURATION = /30\s*-?\s*min|halbe\s+stunde|half\s+an\s+hour/i;

/** Criterion 19 — "45 Minuten" and the like, a duration only next to a conversation word. */
const MINUTES_PHRASE = /\d{1,3}\s*(min|minuten|minutes)\b/gi;
const CONVERSATION_WORD = /gespräch|\bcall\b/i;
const DURATION_WINDOW = 60;

/** Criterion 19 — a free or price claim, inside the six strings this task owns. */
const FREE_CLAIM = /kostenlos|gratis|umsonst|\bfree\b/i;

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

/** Criterion 19 — the no-duration half is repo-wide (plus dist/, when it exists). */
const DURATION_SCOPE = ["content", "src"];

/**
 * Criteria 19 and 20 — the six strings this task owns, character for character
 * as Approach §3 of the spec writes them. `key` is the YAML key; for `ctaLabel`
 * the owned one is the check step's, i.e. the only one naming the Pulse Check.
 */
const OWNED_STRINGS: { file: string; key: string; value: string }[] = [
  {
    file: "content/site/leistungen.md",
    key: "coreIntro",
    value:
      "Jeder Schritt baut auf dem vorherigen auf. Nach jedem entscheidest du, ob es weitergeht – ohne Verpflichtung zum nächsten. Was ein Schritt bei dir kostet, besprechen wir im Erstgespräch: konkret auf deinen Umfang gerechnet, unverbindlich.",
  },
  {
    file: "content/site/leistungen.md",
    key: "ctaLabel",
    value: "Über den Pulse Check sprechen",
  },
  {
    file: "content/site/leistungen.md",
    key: "ctaBody",
    value:
      "Der AI Pulse Score dauert fünf Minuten und kostet nichts: 10 Fragen, sofort ein Ergebnis über fünf Bereiche. Willst du danach genau wissen, wo dein größter Hebel liegt, ist der Pulse Check der nächste Schritt – was er bei dir umfasst, besprechen wir im Erstgespräch.",
  },
  {
    file: "content/site/leistungen.en.md",
    key: "coreIntro",
    value:
      "Each step builds on the one before. After each, you decide whether to continue — no obligation to take the next one. What a step costs in your case is something we work out in a first call: based on your actual scope, with no obligation.",
  },
  {
    file: "content/site/leistungen.en.md",
    key: "ctaLabel",
    value: "Talk about a Pulse Check",
  },
  {
    file: "content/site/leistungen.en.md",
    key: "ctaBody",
    value:
      "The AI Pulse Score takes five minutes and costs nothing: 10 questions, an instant result across five areas. If you then want to know exactly where your biggest lever is, the Pulse Check is the next step — what it covers in your case is something we work out in a first call.",
  },
];

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

/** The built site, when a build exists: bundles and prerendered shells. */
function distFiles(): string[] {
  return findFiles(distDir, (name) => name.endsWith(".js") || name === "index.html");
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
  const files = distFiles();
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
 * Criterion 19, first half — nothing anywhere gives the first conversation a
 * duration: Christian has not fixed one (2026-09-27), so neither "30 Minuten"
 * nor "45 Minuten Gespräch" may appear. The spelled-out "dauert fünf Minuten"
 * about the free Pulse Score carries no digit and passes.
 */
function checkNoCallDuration(): void {
  const files = [...filesUnder(DURATION_SCOPE), ...distFiles()];
  const hits = files.filter((file) => statesCallDuration(read(file)));
  check(
    "19",
    files.length > 0 && hits.length === 0,
    `no duration for the first conversation in any of the ${files.length} files under ${DURATION_SCOPE.join(", ")}${existsSync(distDir) ? ", dist" : ""}`,
    files.length === 0
      ? `found no files under ${DURATION_SCOPE.join(", ")} — is this the repo root?`
      : `${hits.length} file(s) state a duration for the first conversation, e.g. ${hits.length > 0 ? rel(hits[0]) : "-"}`
  );
}

/** "30 Minuten", "halbe Stunde", or "45 Minuten" close to a conversation word. */
function statesCallDuration(text: string): boolean {
  if (CALL_DURATION.test(text)) return true;
  MINUTES_PHRASE.lastIndex = 0;
  for (let match = MINUTES_PHRASE.exec(text); match; match = MINUTES_PHRASE.exec(text)) {
    const from = Math.max(0, match.index - DURATION_WINDOW);
    const to = match.index + match[0].length + DURATION_WINDOW;
    if (CONVERSATION_WORD.test(text.slice(from, to))) return true;
  }
  return false;
}

/**
 * Criterion 19, second half, and criterion 20 — the six strings this task owns
 * read exactly as the spec writes them, so no free or price claim for the first
 * conversation can be slipped into them. The pre-existing "kostenlosen
 * Erstgespräch" lines in `content/services/*.md` are out of scope and are not
 * looked at (Christian, 2026-09-27).
 */
function checkOwnedStrings(): void {
  for (const owned of OWNED_STRINGS) {
    const path = resolve(repoRoot, owned.file);
    if (!existsSync(path)) {
      fail("19-20", `${owned.file} is missing`);
      continue;
    }
    const values = ownedValues(read(path), owned.key);

    check(
      "20",
      values.length === 1 && values[0] === owned.value,
      `${owned.file} ${owned.key} reads exactly the string the spec ships`,
      values.length === 1
        ? `${owned.file} ${owned.key} deviates from the string the spec ships: ${JSON.stringify(values[0])}`
        : `${owned.file} carries ${values.length} candidate ${owned.key} values — expected exactly 1`
    );

    const offending = values.filter((value) => FREE_CLAIM.test(value) || CURRENCY.test(value));
    check(
      "19",
      offending.length === 0,
      `${owned.file} ${owned.key} makes no free or price claim for the first conversation`,
      `${owned.file} ${owned.key} makes a free or price claim: ${JSON.stringify(offending[0] ?? "")}`
    );
  }
}

/**
 * The YAML values of `key` in a content file. Three steps declare a `ctaLabel`;
 * the one this task owns is the check step's, the only one naming the Pulse
 * product, so for that key the candidates are narrowed to it.
 */
function ownedValues(source: string, key: string): string[] {
  const values = source
    .split(/\r?\n/)
    .map((line) => line.match(new RegExp(`^\\s*${key}: '(.*)'\\s*$`)))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => match[1]);
  return key === "ctaLabel" ? values.filter((value) => value.includes("Pulse")) : values;
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
    "check-pulse-naming: asserting no price, one meaning for \"Pulse Check\", no duration for the first conversation, and the six strings this task ships\n"
  );

  checkNoPriceInSource();
  checkNoPriceInDist();
  checkNoCallDuration();
  checkOwnedStrings();
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
