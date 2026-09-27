/**
 * 20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane
 *
 * Asset and markup checks for the compressed hero video (spec criteria 1, 2, 4, 5, 6).
 *
 * The hero shipped a 37,358,323-byte, 1920x1080@60 H.264 file with an AAC track, autoplaying
 * and without a poster. It is replaced by an audio-free 1280x720@24 re-encode plus a poster
 * frame, and the element now starts playback itself instead of autoplaying.
 *
 * The audio check walks the MP4 box tree instead of shelling out to ffprobe, so the test needs
 * nothing installed beyond node.
 *
 * Run: node --test tests/assets/hero-video.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS_DIR = join(REPO_ROOT, 'src', 'assets');

const VIDEO = 'venturelabs-reel.mp4';
const POSTER = 'hero-poster.jpg';

const MAX_VIDEO_BYTES = 3 * 1024 * 1024; // 3 MiB — criterion 1
const MAX_POSTER_BYTES = 150 * 1024; // 150 KiB — criterion 5

/**
 * Handler types of every track in an MP4, read from moov/trak/mdia/hdlr.
 * 'vide' is a video track, 'soun' an audio track.
 */
const trackHandlers = (buffer) => {
  const handlers = [];

  const walk = (start, end) => {
    let offset = start;
    while (offset + 8 <= end) {
      let size = buffer.readUInt32BE(offset);
      const type = buffer.toString('latin1', offset + 4, offset + 8);
      let headerSize = 8;
      if (size === 1) {
        // 64-bit largesize
        size = Number(buffer.readBigUInt64BE(offset + 8));
        headerSize = 16;
      } else if (size === 0) {
        size = end - offset; // box runs to the end of its parent
      }
      if (size < headerSize || offset + size > end) return;

      if (type === 'moov' || type === 'trak' || type === 'mdia') {
        walk(offset + headerSize, offset + size);
      } else if (type === 'hdlr') {
        // version+flags (4) + pre_defined (4) + handler_type (4)
        handlers.push(buffer.toString('latin1', offset + headerSize + 8, offset + headerSize + 12));
      }
      offset += size;
    }
  };

  walk(0, buffer.length);
  return handlers;
};

// --- criterion 1 ---------------------------------------------------------------

test('criterion 1: src/assets holds exactly one .mp4', () => {
  const found = readdirSync(ASSETS_DIR).filter((name) => name.toLowerCase().endsWith('.mp4'));
  assert.deepEqual(found, [VIDEO], 'the compressed reel must be the only video asset in src/assets');
});

test('criterion 1: the hero video is under 3 MiB', () => {
  const bytes = readFileSync(join(ASSETS_DIR, VIDEO)).length;
  assert.ok(
    bytes <= MAX_VIDEO_BYTES,
    `${VIDEO} is ${bytes} bytes, which is over the ${MAX_VIDEO_BYTES}-byte budget`,
  );
});

// --- criterion 2 ---------------------------------------------------------------

test('criterion 2: the hero video has a video track and no audio track', () => {
  const handlers = trackHandlers(readFileSync(join(ASSETS_DIR, VIDEO)));
  assert.ok(handlers.includes('vide'), `${VIDEO} must contain a video track, found: ${handlers}`);
  assert.ok(
    !handlers.includes('soun'),
    `${VIDEO} must not contain an audio track, found: ${handlers}`,
  );
});

// --- criterion 4 ---------------------------------------------------------------

test('criterion 4: no source file references the old "venturelabs reel.mp4" name', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (/\.(tsx?|jsx?|mjs|css|html|json)$/.test(entry.name)) {
        if (readFileSync(path, 'utf8').includes('venturelabs reel')) offenders.push(path);
      }
    }
  };
  walk(join(REPO_ROOT, 'src'));
  assert.deepEqual(offenders, [], 'the old, space-containing asset name must be gone from src/');
});

// --- criterion 5 ---------------------------------------------------------------

test('criterion 5: the poster is a JPEG under 150 KiB', () => {
  const bytes = readFileSync(join(ASSETS_DIR, POSTER));
  assert.equal(bytes[0], 0xff, `${POSTER} must start with the JPEG SOI marker`);
  assert.equal(bytes[1], 0xd8, `${POSTER} must start with the JPEG SOI marker`);
  assert.ok(
    bytes.length <= MAX_POSTER_BYTES,
    `${POSTER} is ${bytes.length} bytes, which is over the ${MAX_POSTER_BYTES}-byte budget`,
  );
});

// --- criterion 6 ---------------------------------------------------------------

test('criterion 6: the hero <video> has a poster, preload="none" and no autoplay', () => {
  const source = readFileSync(join(REPO_ROOT, 'src', 'app', 'components', 'Hero.tsx'), 'utf8');
  // The JSX element only — `<video` on its own line, up to the closing `/>`. A prose mention of
  // `<video poster>` in a comment must not be mistaken for the element.
  const match = source.match(/<video\s*\r?\n[\s\S]*?\/>/);
  assert.ok(match, 'Hero.tsx must render a <video> element');
  const element = match[0];

  assert.ok(element.includes('poster={heroPoster}'), 'the video element must carry a poster');
  assert.ok(element.includes('preload="none"'), 'the video element must not preload');
  assert.ok(!/\bautoPlay\b/.test(element), 'the video element must not autoplay');
  for (const attribute of ['muted', 'loop', 'playsInline']) {
    assert.ok(element.includes(attribute), `the video element must keep ${attribute}`);
  }
});
