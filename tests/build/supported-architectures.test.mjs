/**
 * 20260927-pnpm-supportedarchitectures-include-the-current-
 *
 * Source-level gate for criteria 1-3 of the spec: `supportedArchitectures` in
 * pnpm-workspace.yaml must list `current` for os, cpu AND libc, while keeping
 * every entry that was there before (linux, darwin / x64, arm64 / glibc), so a
 * plain `pnpm install --frozen-lockfile` fetches the host platform's
 * rollup/esbuild binaries on Windows, macOS and Linux CI alike, and the Netlify
 * (linux/x64/glibc) install set stays exactly what it is today.
 *
 * Why this file exists even though the spec's test plan says "no new test file"
 * (Tester, 2026-09-27): the spec's argument is that a static assertion only
 * restates the diff. That is true for the diff, but not over time — this test is
 * the only thing that catches a later edit quietly dropping `current` again, at
 * which point every Windows clone silently goes back to a broken `pnpm build`.
 * The install/build pair remains the behavioural proof (criteria 5-8); this is
 * the regression guard.
 *
 * Dependency-free on purpose (node --test, like tests/links/no-anchor-ctas.test.mjs):
 * it parses only the flat `key:` / `  - value` shape the file actually uses, so
 * it needs no YAML dependency, no build and no browser.
 *
 * Run: node --test tests/build/supported-architectures.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORKSPACE_FILE = join(REPO_ROOT, 'pnpm-workspace.yaml');

// The file is committed CRLF on Windows checkouts; normalise so the block
// assertions below are about content, not line endings.
const text = readFileSync(WORKSPACE_FILE, 'utf8').replace(/\r\n/g, '\n');

/**
 * The list under `supportedArchitectures.<key>`, in file order.
 * Handles exactly the two-space / four-space block-sequence shape of this file:
 *
 *   supportedArchitectures:
 *     os:
 *       - linux
 */
function architectureList(key) {
  const lines = text.split(/\r?\n/);
  const blockStart = lines.findIndex((l) => /^supportedArchitectures:\s*$/.test(l));
  assert.notEqual(
    blockStart,
    -1,
    'pnpm-workspace.yaml has no top-level `supportedArchitectures:` block',
  );

  let i = blockStart + 1;
  let keyLine = -1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    // a non-indented line ends the supportedArchitectures block
    if (!/^\s/.test(line)) break;
    if (new RegExp(`^\\s{2}${key}:\\s*$`).test(line)) {
      keyLine = i;
      break;
    }
  }
  assert.notEqual(keyLine, -1, `supportedArchitectures has no \`${key}:\` key`);

  const values = [];
  for (let j = keyLine + 1; j < lines.length; j++) {
    const match = /^\s{4}-\s*(.+?)\s*$/.exec(lines[j]);
    if (!match) break;
    values.push(match[1].replace(/^['"]|['"]$/g, ''));
  }
  return values;
}

const EXPECTED = {
  os: ['linux', 'darwin', 'current'],
  cpu: ['x64', 'arm64', 'current'],
  libc: ['glibc', 'current'],
};

for (const [key, expected] of Object.entries(EXPECTED)) {
  const criterion = { os: 1, cpu: 2, libc: 3 }[key];

  test(`criterion ${criterion}: supportedArchitectures.${key} contains exactly ${expected.join(', ')}`, () => {
    const actual = architectureList(key);
    assert.deepEqual(
      [...actual].sort(),
      [...expected].sort(),
      `supportedArchitectures.${key} is [${actual.join(', ')}], expected exactly [${expected.join(', ')}]`,
    );
  });

  test(`criterion ${criterion}: supportedArchitectures.${key} includes 'current' (the host platform's binaries)`, () => {
    assert.ok(
      architectureList(key).includes('current'),
      `supportedArchitectures.${key} lost 'current' — a plain \`pnpm install --frozen-lockfile\` ` +
        `will prune the host platform's rollup/esbuild binary again and \`pnpm build\` will crash`,
    );
  });

  test(`criterion 4: supportedArchitectures.${key} still keeps every pre-existing entry`, () => {
    const actual = architectureList(key);
    for (const pre of expected.filter((v) => v !== 'current')) {
      assert.ok(
        actual.includes(pre),
        `supportedArchitectures.${key} no longer lists '${pre}' — the change must be additive, ` +
          `or the Netlify (linux/x64/glibc) install set changes`,
      );
    }
  });
}

test('criterion 4: packages, overrides and allowBuilds are untouched by this change', () => {
  assert.match(text, /^packages:\n {2}- '\.'$/m, "the `packages: ['.']` block moved or changed");
  assert.match(text, /^overrides:\n {2}vite: 6\.3\.5$/m, 'the `overrides.vite` pin moved or changed');
  assert.match(
    text,
    /^allowBuilds:\n {2}'@tailwindcss\/oxide': true\n {2}core-js: true\n {2}esbuild: true$/m,
    'the `allowBuilds` block moved or changed — repo CLAUDE.md documents it as the build-approval mechanism',
  );
});
