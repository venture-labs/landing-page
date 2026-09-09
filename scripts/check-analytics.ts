/**
 * Mechanical assertions for the Plausible analytics integration.
 *
 * The repo has no test runner and adding one is out of scope, so this script
 * (run on `tsx`, already a devDependency) replaces it for the assertable
 * acceptance criteria. Run it after `pnpm build`:
 *
 *   pnpm check:analytics
 *
 * Deploy-preview gate — build with the env var set, then run in absent mode:
 *
 *   CONTEXT=deploy-preview pnpm build
 *   pnpm exec tsx scripts/check-analytics.ts --expect-absent
 *
 * Exits non-zero and prints a FAIL line per failed criterion.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { resolve, dirname, relative, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distDir = resolve(repoRoot, "dist");

const EXPECT_ABSENT = process.argv.includes("--expect-absent");

const PLAUSIBLE_SRC = "https://plausible.io/js/script.file-downloads.outbound-links.js";
const PLAUSIBLE_DOMAIN = "venturelabs.team";
const EVENT_NAMES = ["Quiz Started", "Quiz Completed", "Contact Sent", "Call Link Clicked"];
const NAMED_ROUTES = ["de", join("de", "kontakt"), join("de", "datenschutz"), join("en", "cases")];

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

/** Repo-relative path of the first offender, for the FAIL message. Safe when empty. */
function firstOffender(files: string[]): string {
  return files.length > 0 ? relative(repoRoot, files[0]) : "-";
}

/** Every dist/**\/index.html, dist/index.html first. */
function findShells(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findShells(full));
    else if (entry === "index.html") out.push(full);
  }
  return out;
}

function loaderTags(html: string): string[] {
  return html.match(/<script\b[^>]*plausible\.io[^>]*>/g) ?? [];
}

function stubMatches(html: string): string[] {
  return html.match(/window\.plausible\s*=\s*window\.plausible\s*\|\|/g) ?? [];
}

/** Criterion 1 — the source shell never mentions Plausible. */
function checkSourceIndexHtml(): void {
  const html = read(resolve(repoRoot, "index.html"));
  check(
    "1",
    !/plausible/i.test(html),
    "source index.html contains no 'plausible' (so `pnpm dev` serves no tag)",
    "source index.html mentions 'plausible' — the tag must be injected at build time only"
  );
}

/** Criterion 6 — the event-name constants and the guarded trackEvent. */
function checkAnalyticsModule(): void {
  const path = resolve(repoRoot, "src/app/analytics.ts");
  if (!existsSync(path)) {
    fail("6", "src/app/analytics.ts is missing");
    return;
  }
  const src = read(path);

  const missing = EVENT_NAMES.filter((name) => !src.includes(`"${name}"`));
  check(
    "6",
    missing.length === 0,
    `src/app/analytics.ts declares all four goal names (${EVENT_NAMES.join(", ")})`,
    `src/app/analytics.ts is missing goal name literal(s): ${missing.join(", ")}`
  );

  check(
    "6",
    /export\s+function\s+trackEvent\s*\(/.test(src),
    "src/app/analytics.ts exports trackEvent()",
    "src/app/analytics.ts does not export a trackEvent function"
  );

  check(
    "6",
    /window\.plausible\?\./.test(src),
    "trackEvent guards on window.plausible (optional call — no throw when absent)",
    "trackEvent does not guard on window.plausible; it would throw without the script"
  );
}

/** Criteria 2-4 (present) or 5 (absent) — the built shells. */
function checkBuiltShells(): void {
  if (!existsSync(distDir)) {
    fail("2-5", "dist/ does not exist — run `pnpm build` first");
    return;
  }

  const shells = findShells(distDir);
  const rootShell = resolve(distDir, "index.html");

  if (!existsSync(rootShell)) {
    fail("2", "dist/index.html does not exist — run `pnpm build` first");
    return;
  }

  if (EXPECT_ABSENT) {
    const polluted = shells.filter((f) => read(f).includes("plausible.io"));
    check(
      "5",
      polluted.length === 0,
      `0 plausible.io occurrences in ${shells.length} shells (deploy-preview gate holds)`,
      `${polluted.length} of ${shells.length} shells still contain plausible.io, e.g. ${firstOffender(polluted)}`
    );
    return;
  }

  // Criterion 2 — the root shell.
  const rootTags = loaderTags(read(rootShell));
  const rootTag = rootTags[0] ?? "";
  check(
    "2",
    rootTags.length === 1 &&
      rootTag.includes(`src="${PLAUSIBLE_SRC}"`) &&
      /\sdefer(\s|>|=)/.test(rootTag) &&
      rootTag.includes(`data-domain="${PLAUSIBLE_DOMAIN}"`),
    `dist/index.html has exactly one loader tag with defer, data-domain="${PLAUSIBLE_DOMAIN}" and the ${PLAUSIBLE_SRC.split("/").pop()} variant`,
    `dist/index.html loader tag wrong (${rootTags.length} found): ${rootTag || "none"}`
  );

  // Criterion 3 — every route shell carries the same tag.
  const badTag = shells.filter((f) => {
    const tags = loaderTags(read(f));
    return (
      tags.length !== 1 ||
      !tags[0].includes(`src="${PLAUSIBLE_SRC}"`) ||
      !/\sdefer(\s|>|=)/.test(tags[0]) ||
      !tags[0].includes(`data-domain="${PLAUSIBLE_DOMAIN}"`)
    );
  });
  check(
    "3",
    shells.length > 40 && badTag.length === 0,
    `all ${shells.length} dist/**/index.html shells carry exactly one correct loader tag`,
    badTag.length > 0
      ? `${badTag.length} of ${shells.length} shells have a wrong or duplicated loader tag, e.g. ${firstOffender(badTag)}`
      : `only ${shells.length} shells found — expected more than 40; did prerender run?`
  );

  // Criterion 3 — the four routes the spec names explicitly.
  for (const route of NAMED_ROUTES) {
    const file = resolve(distDir, route, "index.html");
    const tags = existsSync(file) ? loaderTags(read(file)) : [];
    check(
      "3",
      tags.length === 1,
      `dist/${route.replace(/\\/g, "/")}/index.html: exactly one loader tag`,
      `dist/${route.replace(/\\/g, "/")}/index.html: ${existsSync(file) ? `${tags.length} loader tags` : "file missing"}`
    );
  }

  // Criterion 4 — exactly one queue stub per shell.
  const badStub = shells.filter((f) => stubMatches(read(f)).length !== 1);
  check(
    "4",
    badStub.length === 0,
    `all ${shells.length} shells carry exactly one window.plausible queue stub`,
    `${badStub.length} shells have a missing or duplicated queue stub, e.g. ${firstOffender(badStub)}`
  );
}

/** Criterion 12 — one Plausible sentence per locale in section V, DE pronoun-free. */
function checkDatenschutz(): void {
  const src = read(resolve(repoRoot, "src/app/pages/Datenschutz.tsx"));

  const occurrences = src.match(/Plausible/g) ?? [];
  check(
    "12",
    occurrences.length === 2,
    "Datenschutz.tsx names Plausible exactly twice (one DE sentence, one EN sentence)",
    `Datenschutz.tsx names Plausible ${occurrences.length} times — expected exactly 2`
  );

  // Section V of each locale: from its <h2>V. Cookies</h2> to the end of that <div>.
  const sections = [...src.matchAll(/<h2>V\. Cookies<\/h2>([\s\S]*?)<\/div>/g)].map((m) => m[1]);
  check(
    "12",
    sections.length === 2,
    "Datenschutz.tsx has two 'V. Cookies' sections (DE and EN)",
    `found ${sections.length} 'V. Cookies' sections — expected 2 (DE and EN)`
  );

  if (sections.length !== 2) return;
  const [de, en] = sections;

  check(
    "12",
    de.includes("Plausible"),
    "the DE section V names Plausible",
    "the DE section V does not name Plausible"
  );
  check(
    "12",
    en.includes("Plausible"),
    "the EN section V names Plausible",
    "the EN section V does not name Plausible"
  );

  const dePronoun = de.match(/\b(Sie|Ihre|Ihr|ihr|euch)\b/);
  check(
    "12",
    dePronoun === null,
    "the DE section V is pronoun-free (no Sie/Ihr/ihr/euch register clash)",
    `the DE section V uses the pronoun "${dePronoun?.[1]}" — write the sentence pronoun-free`
  );
}

function main(): void {
  console.log(
    EXPECT_ABSENT
      ? "check-analytics: asserting the Plausible tag is ABSENT (deploy-preview gate)\n"
      : "check-analytics: asserting the Plausible tag is PRESENT (production build)\n"
  );

  checkSourceIndexHtml();
  checkBuiltShells();
  if (!EXPECT_ABSENT) checkAnalyticsModule();
  checkDatenschutz();

  console.log("");
  if (failed > 0) {
    console.error(`check-analytics: ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("check-analytics: all checks passed");
}

main();
