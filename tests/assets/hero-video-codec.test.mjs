/**
 * 20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane
 *
 * Codec check for the hero video (spec criterion 3: "H.264 in yuv420p, plays in Chrome, Firefox
 * and Safari-family engines without a codec error").
 *
 * Written by the Tester: the Implementer's tests/assets/hero-video.test.mjs covers criteria 1, 2,
 * 4, 5 and 6, but nothing standing proved the codec — only an ad-hoc `ffprobe` run. This walks the
 * MP4 box tree to moov/trak/mdia/minf/stbl/stsd and reads the AVC decoder configuration record, so
 * it needs nothing installed beyond node and cannot silently pass a future re-encode in a codec
 * that Safari or Firefox will not play (HEVC, AV1, VP9-in-MP4).
 *
 * yuv420p is read from the SPS chroma_format_idc, which is what makes the file decodable by every
 * hardware decoder in the field.
 *
 * Run: node --test tests/assets/hero-video-codec.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VIDEO_PATH = join(REPO_ROOT, 'src', 'assets', 'venturelabs-reel.mp4');

const AVC_PROFILE_HIGH = 100; // ISO/IEC 14496-10 profile_idc

/** Depth-first walk of the MP4 box tree; calls visit(type, payloadStart, payloadEnd). */
const walkBoxes = (buffer, start, end, visit) => {
  let offset = start;
  while (offset + 8 <= end) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    let headerSize = 8;
    if (size === 1) {
      size = Number(buffer.readBigUInt64BE(offset + 8));
      headerSize = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < headerSize || offset + size > end) return;
    visit(type, offset + headerSize, offset + size, (v) => walkBoxes(buffer, offset + headerSize, offset + size, v));
    offset += size;
  }
};

/** The sample description ([format, payloadStart, payloadEnd]) of the first video track. */
const videoSampleDescription = (buffer) => {
  let result = null;
  walkBoxes(buffer, 0, buffer.length, (type, s, e, into) => {
    if (type === 'moov') {
      into((t2, s2, e2, into2) => {
        if (t2 === 'trak') {
          let isVideo = false;
          let stsd = null;
          const scan = (t3, s3, e3, into3) => {
            if (t3 === 'hdlr') {
              if (buffer.toString('latin1', s3 + 8, s3 + 12) === 'vide') isVideo = true;
            } else if (t3 === 'stsd') {
              stsd = [s3, e3];
            } else if (t3 === 'mdia' || t3 === 'minf' || t3 === 'stbl') {
              into3(scan);
            }
          };
          into2(scan);
          if (isVideo && stsd && !result) {
            // stsd payload: version+flags (4), entry_count (4), then sample entries
            const [s3] = stsd;
            const entryCount = buffer.readUInt32BE(s3 + 4);
            const entryStart = s3 + 8;
            const entrySize = buffer.readUInt32BE(entryStart);
            const format = buffer.toString('latin1', entryStart + 4, entryStart + 8);
            result = { format, entryCount, start: entryStart, end: entryStart + entrySize };
          }
        }
      });
    }
  });
  return result;
};

/** The AVCDecoderConfigurationRecord bytes inside an avc1 sample entry. */
const avcConfig = (buffer, entry) => {
  const marker = buffer.indexOf(Buffer.from('avcC', 'latin1'), entry.start);
  assert.ok(marker > 0 && marker < entry.end, 'the avc1 sample entry must carry an avcC box');
  const payload = marker + 4;
  return {
    configurationVersion: buffer[payload],
    profileIdc: buffer[payload + 1],
    levelIdc: buffer[payload + 3],
    sps: (() => {
      // configurationVersion(1) profile(1) compat(1) level(1) lengthSizeMinusOne(1) numSPS(1)
      const count = buffer[payload + 5] & 0x1f;
      if (count < 1) return null;
      const length = buffer.readUInt16BE(payload + 6);
      return buffer.subarray(payload + 8, payload + 8 + length);
    })(),
  };
};

/** chroma_format_idc from an SPS NAL unit; 1 === 4:2:0 (yuv420p). */
const chromaFormatIdc = (sps) => {
  // Strip emulation-prevention bytes, then read the leading SPS fields bit by bit.
  const bytes = [];
  for (let i = 0; i < sps.length; i++) {
    if (i >= 2 && sps[i] === 0x03 && sps[i - 1] === 0x00 && sps[i - 2] === 0x00) continue;
    bytes.push(sps[i]);
  }
  let bit = 8; // skip the NAL header byte
  const u = (n) => {
    let value = 0;
    for (let i = 0; i < n; i++) {
      value = (value << 1) | ((bytes[bit >> 3] >> (7 - (bit & 7))) & 1);
      bit++;
    }
    return value;
  };
  const ue = () => {
    let zeros = 0;
    while (u(1) === 0) zeros++;
    if (zeros === 0) return 0;
    return (1 << zeros) - 1 + u(zeros);
  };

  const profileIdc = u(8);
  u(8); // constraint flags + reserved
  u(8); // level_idc
  ue(); // seq_parameter_set_id
  // chroma_format_idc is only present for the high profiles; 4:2:0 is implied otherwise.
  if ([100, 110, 122, 244, 44, 83, 86, 118, 128, 138, 139, 134, 135].includes(profileIdc)) {
    return ue();
  }
  return 1;
};

test('criterion 3: the hero video is H.264 (avc1), the codec every target engine decodes', () => {
  const buffer = readFileSync(VIDEO_PATH);
  const entry = videoSampleDescription(buffer);
  assert.ok(entry, 'the file must carry a video track with a sample description');
  assert.equal(entry.entryCount, 1, 'the video track must have exactly one sample description');
  assert.equal(
    entry.format,
    'avc1',
    `the video track must be H.264/avc1 — Safari and Firefox do not decode every alternative; found ${entry.format}`,
  );
});

test('criterion 3: the H.264 stream is High profile at a level the field decodes', () => {
  const buffer = readFileSync(VIDEO_PATH);
  const config = avcConfig(buffer, videoSampleDescription(buffer));
  assert.equal(config.configurationVersion, 1, 'avcC must be configuration version 1');
  assert.equal(
    config.profileIdc,
    AVC_PROFILE_HIGH,
    `expected H.264 High profile (${AVC_PROFILE_HIGH}), found profile_idc ${config.profileIdc}`,
  );
  // Level 4.2 (=42) is the ceiling older iOS hardware decoders accept; 1280x720@24 needs 3.1.
  assert.ok(
    config.levelIdc <= 42,
    `H.264 level ${config.levelIdc / 10} is above the 4.2 ceiling of older Safari hardware decoders`,
  );
});

test('criterion 3: the H.264 stream is 4:2:0 chroma (yuv420p)', () => {
  const buffer = readFileSync(VIDEO_PATH);
  const config = avcConfig(buffer, videoSampleDescription(buffer));
  assert.ok(config.sps, 'avcC must carry at least one SPS');
  assert.equal(
    chromaFormatIdc(config.sps),
    1,
    'expected chroma_format_idc 1 (4:2:0 / yuv420p); 4:2:2 or 4:4:4 is not decoded by browser hardware paths',
  );
});
