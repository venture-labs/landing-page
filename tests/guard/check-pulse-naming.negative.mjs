/**
 * 20260926-the-real-prices-on-the-main-site-and-one-meaning — criterion 3, the
 * half that a green `pnpm check:naming` cannot prove.
 *
 * `pnpm check:naming` exiting 0 shows the guard is satisfied today. It does NOT
 * show the guard would CATCH a price, a "Pulse Check" quiz label or a
 * free/30-minute-call claim coming back — a guard whose regex never matches is
 * indistinguishable from a guard that passes. Criterion 3 asks for both
 * directions ("exits non-zero with a FAIL line naming the offending file when a
 * price string, a forbidden label or a free/30-minute-call claim is
 * introduced"), so this test seeds each offender and asserts the guard fails.
 *
 * It never writes inside the repo: every case runs against a throwaway copy of
 * `scripts/check-pulse-naming.ts` plus the directories it scans, made under the
 * OS temp dir and deleted afterwards. The repo's own files are read only.
 *
 * Windows — Git Bash:
 *   cd /c/ai/dev-worktrees/venturelabs/landing/20260926-the-real-prices-on-the-main-site-and-one-meaning && node tests/guard/check-pulse-naming.negative.mjs
 *
 * macOS — Terminal (zsh):
 *   node tests/guard/check-pulse-naming.negative.mjs        # from the repo root
 *
 * What it does: prints one PASS/FAIL line per seeded offender and exits
 * non-zero if any seeded offender slipped past the guard. Takes ~30 s (one
 * `tsx` start per case). No network, no service, no build needed.
 */
import { cpSync, mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Everything `check-pulse-naming.ts` reads, plus the script itself. */
const SANDBOX_TREES = ["scripts", "content", "src/locales", "src/data", "src/app"];

const TSX = join(REPO_ROOT, "node_modules", ".bin", process.platform === "win32" ? "tsx.CMD" : "tsx");

/**
 * Each case: the file to touch, the line to replace, its replacement, the
 * criterion number(s) the guard must name in its FAIL line, and the string that
 * FAIL line must carry so the offender is identifiable.
 *
 * `identifies` is the file path for the three offender kinds criterion 3
 * enumerates — a price string, a forbidden label, a free/30-minute-call claim.
 * The dialog heading is none of those three (the spec calls it "the dialog
 * heading" / "the accessible name", never a label), and the guard's
 * criterion-6 check is single-file by construction, so there `identifies` is
 * the quoted heading itself. That the heading's FAIL line omits
 * `src/app/components/PulseQuiz.tsx` is reported as an observation, not
 * asserted here — see the test report for the task.
 */
const CASES = [
  {
    name: "a price in content (criterion 1)",
    file: "content/site/home.md",
    find: "heroCta: Kostenlosen Pulse Score starten",
    replace: "heroCta: Pulse Score ab 2.900 €",
    expectCriteria: ["1"],
    identifies: "content/site/home.md",
  },
  {
    name: "a price written EUR-first in a locale file (criterion 1)",
    file: "src/locales/de.json",
    find: '"cta": "Kostenlosen Pulse Score starten"',
    replace: '"cta": "Kostenlosen Pulse Score starten (EUR 15.000)"',
    expectCriteria: ["1"],
    identifies: "src/locales/de.json",
  },
  {
    name: "a free-Erstgespräch claim (criterion 19)",
    file: "content/site/leistungen.md",
    find: "besprechen wir im Erstgespräch:",
    replace: "besprechen wir im kostenlosen Erstgespräch:",
    expectCriteria: ["19"],
    identifies: "content/site/leistungen.md",
  },
  {
    name: "a 30-minute duration for the first call (criterion 19)",
    file: "content/site/leistungen.en.md",
    find: "we work out in a first call:",
    replace: "we work out in a 30-minute call:",
    expectCriteria: ["19"],
    identifies: "content/site/leistungen.en.md",
  },
  {
    name: "a duration other than 30 minutes next to the first conversation (criterion 19)",
    file: "content/site/leistungen.md",
    find: "besprechen wir im Erstgespräch:",
    replace: "besprechen wir im Erstgespräch von 45 Minuten:",
    expectCriteria: ["19"],
    identifies: "content/site/leistungen.md",
  },
  {
    name: "a benign rewording of an owned string (criterion 20)",
    // No price, no free claim, no duration — only a deviation from the string
    // Approach §3 ships. Criterion 3 requires the guard to fail on that too,
    // which is what makes criterion 20 mechanically asserted rather than read.
    file: "content/site/leistungen.en.md",
    find: "an instant result across five areas",
    replace: "an instant result across all five areas",
    expectCriteria: ["20"],
    identifies: "content/site/leistungen.en.md",
  },
  {
    name: 'a quiz label that says "Pulse Check" again (criteria 4-5 and 7)',
    file: "content/site/home.md",
    find: "heroCta: Kostenlosen Pulse Score starten",
    replace: "heroCta: Jetzt AI Pulse Check machen",
    expectCriteria: ["4-5", "7"],
    identifies: "content/site/home.md",
  },
  {
    name: 'a dialog heading that says "Pulse Check" (criterion 6)',
    file: "src/app/components/PulseQuiz.tsx",
    find: 'quizHeading: "AI Pulse Score: Wie gesund ist dein KI-Einsatz?"',
    replace: 'quizHeading: "AI Pulse Check: Wie gesund ist dein KI-Einsatz?"',
    expectCriteria: ["6"],
    // Not one of criterion 3's three kinds; the quoted heading is the identifier.
    identifies: "AI Pulse Check: Wie gesund ist dein KI-Einsatz?",
  },
  {
    name: "the free-Pulse-Check sentence coming back (criterion 8)",
    file: "content/site/leistungen.md",
    find: "ctaBody: 'Der AI Pulse Score dauert fünf Minuten",
    replace: "ctaBody: 'Der Pulse Check dauert fünf Minuten",
    expectCriteria: ["8"],
    identifies: "content/site/leistungen.md",
  },
  {
    name: "the Check card opening the quiz again (criterion 11)",
    file: "src/app/components/PulseJourney.tsx",
    find: 'import { Link } from "react-router";',
    replace:
      'import { Link } from "react-router";\nimport { PulseCheckModal } from "@/app/components/PulseCheckModal";',
    expectCriteria: ["11"],
    // Named by basename here, not by full path — still names the file.
    identifies: "PulseJourney.tsx",
  },
];

function makeSandbox() {
  const dir = mkdtempSync(join(tmpdir(), "check-pulse-naming-negative-"));
  for (const tree of SANDBOX_TREES) {
    const from = join(REPO_ROOT, tree);
    if (existsSync(from)) cpSync(from, join(dir, tree), { recursive: true });
  }
  return dir;
}

function runGuard(sandbox) {
  const result = spawnSync(TSX, [join(sandbox, "scripts", "check-pulse-naming.ts")], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return {
    code: result.status,
    out: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

let failed = 0;

function assert(ok, message, detail) {
  if (ok) {
    console.log(`PASS  ${message}`);
  } else {
    failed++;
    console.error(`FAIL  ${message}${detail ? `\n      ${detail}` : ""}`);
  }
}

// Control: the untouched copy must pass, or a later FAIL proves nothing.
{
  const sandbox = makeSandbox();
  try {
    const { code, out } = runGuard(sandbox);
    assert(
      code === 0 && !out.includes("FAIL"),
      "control: the unmodified tree passes the guard (exit 0, no FAIL line)",
      `exit ${code}\n      ${out.split(/\r?\n/).filter((l) => l.startsWith("FAIL")).join("\n      ")}`
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

for (const testCase of CASES) {
  const sandbox = makeSandbox();
  try {
    const target = join(sandbox, testCase.file);
    const before = readFileSync(target, "utf8");
    if (!before.includes(testCase.find)) {
      failed++;
      console.error(
        `FAIL  ${testCase.name}: the fixture anchor is gone — ${testCase.file} no longer contains ${JSON.stringify(testCase.find)}`
      );
      continue;
    }
    writeFileSync(target, before.replace(testCase.find, testCase.replace));

    const { code, out } = runGuard(sandbox);
    const failLines = out.split(/\r?\n/).filter((line) => line.startsWith("FAIL"));

    assert(code !== 0, `${testCase.name}: the guard exits non-zero`, `exit ${code}`);
    for (const criterion of testCase.expectCriteria) {
      assert(
        failLines.some((line) => line.includes(`[${criterion}]`)),
        `${testCase.name}: a FAIL line names criterion ${criterion}`,
        failLines.length > 0 ? failLines.join("\n      ") : "no FAIL line at all"
      );
    }
    // Criterion 3 asks the FAIL line to identify the offender.
    assert(
      failLines.some((line) => line.includes(testCase.identifies)),
      `${testCase.name}: a FAIL line identifies the offender (${testCase.identifies})`,
      failLines.length > 0 ? failLines.join("\n      ") : "no FAIL line at all"
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

console.log("");
if (failed > 0) {
  console.error(`check-pulse-naming.negative: ${failed} assertion(s) failed`);
  process.exit(1);
}
console.log("check-pulse-naming.negative: every seeded offender was caught");
