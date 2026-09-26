/**
 * Mechanical assertions for the area-page process list and the removed
 * strength block (task 20260926-area-pages-all-four-process-steps-readable-gener).
 *
 * The repo has no test runner and adding one is out of scope, so this script
 * (run on `tsx`, already a devDependency) replaces it for the assertable
 * acceptance criteria — the same pattern as `scripts/check-analytics.ts`:
 *
 *   pnpm check:area-pages
 *
 * It asserts the content side of criterion 1 (every process step of every
 * service file carries a description), criterion 2 (no per-step open state),
 * criterion 3 (no interactive element inside a step row) and criterion 6 (no
 * StrengthSection left anywhere under src/). Criteria 1 (rendered), 4 and 5 are
 * DOM-level and stay preview checks — the built HTML body is `<div id="root">`.
 *
 * Exits non-zero and prints a FAIL line per failed criterion.
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { resolve, dirname, relative, join } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const detailPage = resolve(repoRoot, "src/app/pages/LeistungenDetail.tsx");

const STRENGTH_TOKENS = [
  "StrengthSection",
  "strengthHeadline",
  "strengthDescription",
  "strengthFeatures",
];

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

/**
 * Every hand-written .ts/.tsx file under a directory, recursively.
 *
 * src/data/de and src/data/en are skipped: they are generated from content/ by
 * scripts/generate-content.ts, and the task deliberately leaves the strength*
 * frontmatter and the generator fields in place (they are simply unrendered),
 * so those two folders keep carrying the field names by design.
 */
const GENERATED_DIRS = ["src/data/de", "src/data/en"];

function findSources(dir: string): string[] {
  if (GENERATED_DIRS.includes(relative(repoRoot, dir).replace(/\\/g, "/"))) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findSources(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** The source of one top-level function, from its `function X(` to the next one. */
function functionBody(src: string, name: string, nextName: string): string {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return "";
  const end = src.indexOf(`function ${nextName}(`, start);
  return src.slice(start, end < 0 ? src.length : end);
}

/** Criterion 1 (content side) — every process step of every locale has a description. */
function checkServiceContent(): void {
  const dir = resolve(repoRoot, "content/services");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

  check(
    "1",
    files.length === 8,
    `content/services holds all 8 service files (4 areas × 2 locales)`,
    `content/services holds ${files.length} markdown files — expected 8 (4 areas × 2 locales)`
  );

  let steps = 0;
  const empty: string[] = [];
  for (const file of files) {
    const { data } = matter(read(join(dir, file)));
    const process = (data as any).process;
    if (!Array.isArray(process) || process.length === 0) {
      empty.push(`${file} (no process list)`);
      continue;
    }
    for (const step of process) {
      steps++;
      if (typeof step?.description !== "string" || step.description.trim() === "") {
        empty.push(`${file} step ${step?.number ?? "?"}`);
      }
    }
  }

  check(
    "1",
    empty.length === 0 && steps > 0,
    `all ${steps} process steps across ${files.length} service files carry a non-empty description`,
    empty.length > 0
      ? `${empty.length} process step(s) have no description, e.g. ${empty[0]}`
      : "no process steps found in content/services"
  );
}

/** Criteria 2 and 3 — ProcessStep is a static, non-interactive row. */
function checkProcessStep(): void {
  if (!existsSync(detailPage)) {
    fail("2-3", "src/app/pages/LeistungenDetail.tsx is missing");
    return;
  }
  const src = read(detailPage);
  const step = functionBody(src, "ProcessStep", "ProcessSection");

  if (step === "") {
    fail("2-3", "no ProcessStep function found in src/app/pages/LeistungenDetail.tsx");
    return;
  }

  // Criterion 2 — no per-step open/closed state.
  const stateHits = [
    ["useState(index === 0)", /useState\s*\(\s*index\s*===\s*0\s*\)/],
    ["open/setOpen", /\b(open|setOpen)\b/],
    ["cursor-pointer", /cursor-pointer/],
  ] as const;
  for (const [label, re] of stateHits) {
    check(
      "2",
      !re.test(step),
      `ProcessStep has no ${label}`,
      `ProcessStep still contains ${label}`
    );
  }
  check(
    "2",
    !/\{\s*open\s*&&/.test(step) && !/\?\s*\(?\s*<motion\.div/.test(step),
    "ProcessStep renders the description unconditionally (no conditional wrapper)",
    "ProcessStep still wraps the description in a conditional"
  );
  check(
    "2",
    step.includes("{step.description}"),
    "ProcessStep renders {step.description}",
    "ProcessStep no longer renders {step.description}"
  );

  // Criterion 3 — nothing interactive inside the row.
  const interactiveHits = [
    ["<button>", /<button\b/],
    ["<a>", /<a\b/],
    ["role=", /\brole\s*=/],
    ["tabIndex", /tabIndex/],
    ["onClick", /onClick/],
    ["ArrowRight (the circular arrow indicator)", /ArrowRight/],
  ] as const;
  for (const [label, re] of interactiveHits) {
    check(
      "3",
      !re.test(step),
      `ProcessStep contains no ${label}`,
      `ProcessStep still contains ${label}`
    );
  }
}

/** Criterion 6 — the strength block is gone from the source tree. */
function checkStrengthGone(): void {
  check(
    "6",
    !existsSync(resolve(repoRoot, "src/app/components/StrengthSection.tsx")),
    "src/app/components/StrengthSection.tsx no longer exists",
    "src/app/components/StrengthSection.tsx still exists"
  );

  const sources = findSources(resolve(repoRoot, "src"));
  for (const token of STRENGTH_TOKENS) {
    const offenders = sources.filter((f) => read(f).includes(token));
    check(
      "6",
      offenders.length === 0,
      `no hand-written file under src/ references ${token}`,
      `${offenders.length} hand-written file(s) under src/ still reference ${token}, e.g. ${relative(repoRoot, offenders[0] ?? "")}`
    );
  }
}

function main(): void {
  console.log("check-area-pages: asserting the process list is static and the strength block is gone\n");

  checkServiceContent();
  checkProcessStep();
  checkStrengthGone();

  console.log("");
  if (failed > 0) {
    console.error(`check-area-pages: ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("check-area-pages: all checks passed");
}

main();
