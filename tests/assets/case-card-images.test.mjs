/**
 * 20260907-fix-mismatched-case-card-images-on-venturelabs-t
 *
 * Asset-content checks for the case-card thumbnails under public/uploads/cases/.
 *
 * The four *-card.png files held the wrong company's screenshot. The fix rotates their
 * bytes (brylliant <- moerschen, machinemaster <- tap2link, tap2link <- brylliant) and
 * re-encodes moerschen-card.png from laptop_moerschen_screen.jpg.
 *
 * Every PRE_FIX_SHA256 below was read out of the task's base commit
 * (git merge-base dev HEAD = 87bd24dfeec65c7463021d141a04dd1b48cca647) with
 *     git show <base>:<path> | sha256sum
 * so the expectations are pinned to the real pre-fix bytes, not to the post-fix state.
 *
 * Run: node --test tests/assets/case-card-images.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CASES_DIR = join(REPO_ROOT, 'public', 'uploads', 'cases');

/** SHA-256 of a file under public/uploads/cases/. */
const sha256 = (name) =>
  createHash('sha256').update(readFileSync(join(CASES_DIR, name))).digest('hex');

/** First 8 bytes of a PNG file: 89 50 4E 47 0D 0A 1A 0A. */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const isPng = (name) =>
  readFileSync(join(CASES_DIR, name)).subarray(0, 8).equals(PNG_MAGIC);

/** Bytes as they were at the base commit, before the Implementer ran. */
const PRE_FIX_SHA256 = {
  'brylliant-card.png': '7e972b1ae8b3e1a9436d88b8f00f3b2c0a47039332c2cc8e23ce0768b78af714',
  'machinemaster-card.png': '776537b6347de1a0c5d4340fe1298718b7958e055647e528dcbbe74679af509c',
  'moerschen-card.png': '4bc22793eef36eb6746fe2225c55eee90f61fcf2477b820b3da9e4eae425e811',
  'tap2link-card.png': '91a2cb5fbf659a4501743aca0f9cb4afe476ba3614bccbfc9d1d6c06bec8b4f5',
  'laptop_moerschen_screen.jpg': 'd8b09ac568d9938d2946cb85e4bf327418572cae1c8bb07d776a5ef19e82525b',
  // criterion 7 — must be untouched
  'hero-machinemaster.png': '6b930da6703b10d7906cfc528a757a5662a886798ae50c52e24f5bb3e61324bb',
  'hero-moereschen.png': '48e936a4e4a431953c1ab6616be6115ea9a28881c50d9d3fbc8e887bed976e0c',
  'tap2link-hero.png': '86b1b217efcef4dc37e2b3dd082ab73d5510051838a849f9d6686861adc7b480',
  'case-machinemaster-1.png': 'd0b653b7b1233a084261bd7acc88defd6c4b1888254312947c608b18909750f1',
  'case-machinemaster-2.png': '16a9a3857d0cd56903894132e7889cb39694ad174ff096f1dea2bb5985162820',
  'case-machinemaster-3.png': '6beeaebb4c1ad569a0579ad7caa5a5f755a19bf87dd6a910cd2a6b3baf1da272',
  'case-moerschen-pic1.png': '1eeb8adf5faa5f4f38b20e0bc6138c9539a1a0d50b23fd27e53ac8dabe7c0d6e',
  'case-moerschen-pic2.png': '575fcf0853c1aeebca370751d34e60dcf2082767bb274336051ba0fea230662d',
  'case-moerschen-pic3.png': '5a536d25ca1cf9de96a4287df12862695a31f410939ee9ba96d72354732ed3ac',
  'tap2link-mockup-1.png': '3ae9765e13a5f6a03dff7016a2524a0debaa26708503ac43245d9c3cc29a24be',
  'tap2link-mockup-3.png': '055105ae3c0a2531cc74e08addc88fae6bd463f42833107636da866320887c81',
  'card_tap2link.png': 'c631b107d9d096f902e740035672476873531e8d56fbbcf466a7710274398ba3',
  'animation-card.png': '12bf13af28323ff85ee4e6bceda27b29843fbcf0ad95b09c71ccdd1c9e9e7908',
  'neuer-look-card.png': '10eca4b5d7d726556f38df1a0665c40fa58a1fd916288b8a35d2a9e58a0b5d52',
  'scanservice-card.png': '44e910792688dbfd225943812e5ec8a6fc3882eb3afd21395ef4ba0afecbe2aa',
};

// --- criterion 1 ---------------------------------------------------------------

test('criterion 1: brylliant-card.png holds the pre-fix moerschen-card.png bytes', () => {
  assert.equal(
    sha256('brylliant-card.png'),
    PRE_FIX_SHA256['moerschen-card.png'],
    'brylliant-card.png must be byte-identical to the Brylliant laptop briefing-tool screenshot that moerschen-card.png held before the fix',
  );
});

test('criterion 1: brylliant-card.png is a valid PNG', () => {
  assert.ok(isPng('brylliant-card.png'), 'brylliant-card.png must start with the PNG magic bytes');
});

// --- criterion 2 ---------------------------------------------------------------

test('criterion 2: machinemaster-card.png holds the pre-fix tap2link-card.png bytes', () => {
  assert.equal(
    sha256('machinemaster-card.png'),
    PRE_FIX_SHA256['tap2link-card.png'],
    'machinemaster-card.png must be byte-identical to the MachineMaster mobile hero that tap2link-card.png held before the fix',
  );
});

test('criterion 2: machinemaster-card.png is a valid PNG', () => {
  assert.ok(
    isPng('machinemaster-card.png'),
    'machinemaster-card.png must start with the PNG magic bytes',
  );
});

// --- criterion 3 ---------------------------------------------------------------

test('criterion 3: tap2link-card.png holds the pre-fix brylliant-card.png bytes', () => {
  assert.equal(
    sha256('tap2link-card.png'),
    PRE_FIX_SHA256['brylliant-card.png'],
    'tap2link-card.png must be byte-identical to the Tap2Link phone mockup that brylliant-card.png held before the fix',
  );
});

test('criterion 3: tap2link-card.png is a valid PNG', () => {
  assert.ok(isPng('tap2link-card.png'), 'tap2link-card.png must start with the PNG magic bytes');
});

// --- criterion 4 ---------------------------------------------------------------

test('criterion 4: moerschen-card.png is a valid PNG', () => {
  assert.ok(isPng('moerschen-card.png'), 'moerschen-card.png must start with the PNG magic bytes');
});

test('criterion 4: moerschen-card.png differs from its own pre-fix content', () => {
  assert.notEqual(
    sha256('moerschen-card.png'),
    PRE_FIX_SHA256['moerschen-card.png'],
    'moerschen-card.png must no longer hold the Brylliant screenshot',
  );
});

test('criterion 4: moerschen-card.png differs from the other three cards, old and new', () => {
  const moerschen = sha256('moerschen-card.png');
  const others = [
    ['brylliant-card.png (post-fix)', sha256('brylliant-card.png')],
    ['machinemaster-card.png (post-fix)', sha256('machinemaster-card.png')],
    ['tap2link-card.png (post-fix)', sha256('tap2link-card.png')],
    ['brylliant-card.png (pre-fix)', PRE_FIX_SHA256['brylliant-card.png']],
    ['machinemaster-card.png (pre-fix)', PRE_FIX_SHA256['machinemaster-card.png']],
    ['tap2link-card.png (pre-fix)', PRE_FIX_SHA256['tap2link-card.png']],
  ];
  for (const [label, hash] of others) {
    assert.notEqual(moerschen, hash, `moerschen-card.png must not be byte-identical to ${label}`);
  }
});

test('criterion 4: moerschen-card.png decodes to the same raster as laptop_moerschen_screen.jpg', () => {
  // A JPEG re-encoded to PNG is never byte-identical to its source, so the check that the
  // PNG really carries that photo is: same pixel dimensions as the JPEG's SOF frame header.
  const png = readFileSync(join(CASES_DIR, 'moerschen-card.png'));
  const pngWidth = png.readUInt32BE(16);
  const pngHeight = png.readUInt32BE(20);

  const jpg = readFileSync(join(CASES_DIR, 'laptop_moerschen_screen.jpg'));
  let jpgWidth = 0;
  let jpgHeight = 0;
  for (let i = 2; i < jpg.length - 9; ) {
    if (jpg[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = jpg[i + 1];
    // SOF0..SOF15, excluding DHT (c4), JPG (c8) and DAC (cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      jpgHeight = jpg.readUInt16BE(i + 5);
      jpgWidth = jpg.readUInt16BE(i + 7);
      break;
    }
    i += 2 + jpg.readUInt16BE(i + 2);
  }

  assert.ok(jpgWidth > 0 && jpgHeight > 0, 'could not read the JPEG frame header');
  assert.deepEqual(
    { width: pngWidth, height: pngHeight },
    { width: jpgWidth, height: jpgHeight },
    'moerschen-card.png must have the same dimensions as the laptop_moerschen_screen.jpg it re-encodes',
  );
});

// --- criterion 5 ---------------------------------------------------------------

test('criterion 5: the fix touches no content, generated data, app code or vite config', () => {
  const base = execFileSync('git', ['merge-base', 'dev', 'HEAD'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  const changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const forbidden = changed.filter(
    (p) =>
      p.startsWith('content/cases/') ||
      p.startsWith('src/data/de/') ||
      p.startsWith('src/data/en/') ||
      p.startsWith('src/app/') ||
      p === 'vite.config.ts',
  );

  assert.deepEqual(forbidden, [], `these files must not be modified by this fix: ${forbidden}`);
});

// --- criterion 6 ---------------------------------------------------------------

test('criterion 6: the temp carrier file is not committed', () => {
  assert.equal(
    existsSync(join(CASES_DIR, 'tmp-original-brylliant-card.png')),
    false,
    'tmp-original-brylliant-card.png must have been deleted after the swap',
  );
});

test('criterion 6: laptop_moerschen_screen.jpg still exists and is unchanged', () => {
  assert.ok(existsSync(join(CASES_DIR, 'laptop_moerschen_screen.jpg')), 'source JPEG must remain');
  assert.equal(
    sha256('laptop_moerschen_screen.jpg'),
    PRE_FIX_SHA256['laptop_moerschen_screen.jpg'],
    'the source JPEG is read, not modified',
  );
});

// --- criterion 7 ---------------------------------------------------------------

const UNTOUCHED = [
  'hero-machinemaster.png',
  'hero-moereschen.png',
  'tap2link-hero.png',
  'case-machinemaster-1.png',
  'case-machinemaster-2.png',
  'case-machinemaster-3.png',
  'case-moerschen-pic1.png',
  'case-moerschen-pic2.png',
  'case-moerschen-pic3.png',
  'tap2link-mockup-1.png',
  'tap2link-mockup-3.png',
  'card_tap2link.png',
  'animation-card.png',
  'neuer-look-card.png',
  'scanservice-card.png',
];

for (const name of UNTOUCHED) {
  test(`criterion 7: ${name} is untouched`, () => {
    assert.equal(sha256(name), PRE_FIX_SHA256[name], `${name} must keep its pre-fix bytes`);
  });
}
