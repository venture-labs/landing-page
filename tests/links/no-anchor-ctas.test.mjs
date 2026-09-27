/**
 * 20260926-conversion-paths-no-cta-may-end-in-a-footer-anch
 *
 * Source-level gate for criteria 2-4 of the spec: no CTA may target the footer
 * anchor (/:lang#kontakt) or the home page's project section (/:lang#projekte),
 * the broken public phone number is gone, and the booking URL lives in exactly
 * one place.
 *
 * Dependency-free on purpose (node --test, like tests/assets/case-card-images.test.mjs):
 * it runs anywhere, needs no build and no browser, and catches a regression in a
 * diff. The rendered-DOM half of the acceptance lives in
 * tests/e2e/conversion-paths.spec.ts.
 *
 * Run: node --test tests/links/no-anchor-ctas.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = join(REPO_ROOT, 'src');

const TEXT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'];

/** Every text file under src/, as { path (repo-relative, POSIX), text }. */
function sourceFiles(dir = SRC_DIR) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
      continue;
    }
    if (!TEXT_EXTENSIONS.some((ext) => entry.endsWith(ext))) continue;
    out.push({
      path: relative(REPO_ROOT, full).split(sep).join('/'),
      text: readFileSync(full, 'utf8'),
    });
  }
  return out;
}

const ALL_FILES = sourceFiles();

/** src/imports/ is Figma-exported code, src/data/{de,en}/ is generated from content/. */
const isHandWritten = (path) =>
  !path.startsWith('src/imports/') && !/^src\/data\/(de|en)\//.test(path);

const HAND_WRITTEN = ALL_FILES.filter((f) => isHandWritten(f.path));

test('the walker actually found the source files it is asserting over', () => {
  assert.ok(ALL_FILES.length > 50, `expected the src/ walk to find files, got ${ALL_FILES.length}`);
  assert.ok(
    HAND_WRITTEN.some((f) => f.path === 'src/app/components/Navbar.tsx'),
    'src/app/components/Navbar.tsx must be among the scanned hand-written files',
  );
});

// --- criterion 2: no anchor CTAs ------------------------------------------------

for (const anchor of ['/#kontakt', '/#projekte']) {
  test(`criterion 2: no hand-written file under src/ contains "${anchor}"`, () => {
    const offenders = HAND_WRITTEN.filter((f) => f.text.includes(anchor)).map((f) => f.path);
    assert.deepEqual(
      offenders,
      [],
      `${anchor} resolves to a page anchor (the footer / the home page's project section), never to a real destination`,
    );
  });
}

// --- criterion 3: the broken phone number is gone -------------------------------

for (const broken of ['+49 148 74 18 f6', 'tel:+491487418f6']) {
  test(`criterion 3: "${broken}" appears nowhere under src/`, () => {
    const offenders = ALL_FILES.filter((f) => f.text.includes(broken)).map((f) => f.path);
    assert.deepEqual(offenders, [], `${broken} is not a dialable number and must not be published`);
  });
}

test('criterion 3: every literal tel: href under src/ is "+" and digits only', () => {
  const bad = [];
  for (const file of ALL_FILES) {
    // Literal hrefs only: href="tel:…" / href={`tel:…`} without interpolation.
    for (const match of file.text.matchAll(/tel:([^"'`\s}]*)/g)) {
      const number = match[1];
      if (number.includes('${')) continue; // built at runtime — asserted below
      if (!/^\+?\d+$/.test(number)) bad.push(`${file.path}: tel:${number}`);
    }
  }
  assert.deepEqual(bad, [], 'a tel: href may carry "+" and digits only');
});

test('criterion 3: every phone value a tel: href is built from is "+" and digits once whitespace is stripped', () => {
  const bad = [];
  for (const file of HAND_WRITTEN) {
    for (const match of file.text.matchAll(/phone:\s*"([^"]*)"/g)) {
      const number = match[1].replace(/\s+/g, '');
      if (number && !/^\+?\d+$/.test(number)) bad.push(`${file.path}: ${match[1]}`);
    }
  }
  assert.deepEqual(
    bad,
    [],
    'src/app/pages/Kontakt.tsx builds tel: hrefs from these values with whitespace removed',
  );
});

// --- criterion 4: one home for the booking URL ----------------------------------

const BOOKING_URL = 'https://calendar.app.google/SsabAjwxnbUjhoGo8';

test('criterion 4: the booking URL literal appears exactly once under src/, in src/app/links.ts', () => {
  const hits = ALL_FILES.flatMap((f) =>
    [...f.text.matchAll(new RegExp(BOOKING_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))].map(
      () => f.path,
    ),
  );
  assert.deepEqual(hits, ['src/app/links.ts'], 'one URL, one place, one string to pin');
});

test('criterion 4: src/app/links.ts exports BOOKING_URL', () => {
  const links = ALL_FILES.find((f) => f.path === 'src/app/links.ts');
  assert.ok(links, 'src/app/links.ts must exist');
  assert.match(
    links.text,
    new RegExp(`export const BOOKING_URL\\s*=\\s*"${BOOKING_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`),
    'BOOKING_URL must be the exported constant every booking CTA imports',
  );
});

test('criterion 4: every component that links to the booking page imports BOOKING_URL', () => {
  const expected = [
    'src/app/components/Navbar.tsx',
    'src/app/components/Footer.tsx',
    'src/app/components/FinalCTA.tsx',
    'src/app/components/PulseQuiz.tsx',
    'src/app/pages/Kontakt.tsx',
    'src/app/pages/LeistungenDetail.tsx',
  ];
  const missing = expected.filter((path) => {
    const file = ALL_FILES.find((f) => f.path === path);
    return !file || !/import \{[^}]*BOOKING_URL[^}]*\} from "@\/app\/links"/.test(file.text);
  });
  assert.deepEqual(missing, [], 'these files carry a booking CTA and must import the constant');
});

// --- the area pages' case link ---------------------------------------------------

test('criterion 15: "Zum Case ansehen" links to the service\'s own case, not a page anchor', () => {
  const file = ALL_FILES.find((f) => f.path === 'src/app/pages/LeistungenDetail.tsx');
  assert.ok(file, 'src/app/pages/LeistungenDetail.tsx must exist');
  assert.match(
    file.text,
    /to=\{localizedPath\(`\/cases\/\$\{detail\.caseSlug\}`\)\}/,
    'the case link must be built from the service\'s own caseSlug',
  );
});

test('criterion 15: every service names a caseSlug that has a case detail file', () => {
  const contentDir = join(REPO_ROOT, 'content');
  const services = readdirSync(join(contentDir, 'services')).filter((f) => f.endsWith('.md'));
  assert.ok(services.length > 0, 'content/services must hold the area pages');

  const missing = [];
  for (const name of services) {
    const text = readFileSync(join(contentDir, 'services', name), 'utf8');
    const slug = text.match(/^caseSlug:\s*"([^"]+)"/m)?.[1];
    if (!slug) {
      missing.push(`${name}: no caseSlug`);
      continue;
    }
    const caseFile = name.endsWith('.en.md') ? `${slug}.en.md` : `${slug}.md`;
    try {
      statSync(join(contentDir, 'cases', caseFile));
    } catch {
      missing.push(`${name}: caseSlug "${slug}" has no content/cases/${caseFile}`);
    }
  }
  assert.deepEqual(missing, [], 'every area page must be able to open the case it describes');
});
