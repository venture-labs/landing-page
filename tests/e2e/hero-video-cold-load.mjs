/**
 * 20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane
 *
 * Repeatable cold-load measurement for the hero video — spec criteria 7, 8, 9 and 13.
 *
 * Why this file and not the Playwright spec next to it: Playwright is deliberately not a
 * dependency of this repo, so `tests/e2e/hero-video.spec.ts` cannot be collected here and
 * proves nothing on this machine. This script needs nothing but Chrome and node >= 22 (global
 * `WebSocket`), drives Chrome over the DevTools Protocol directly, and reads per-request
 * transferred bytes from `Network.loadingFinished.encodedDataLength` — the same number the
 * DevTools "Transferred" column shows. It measures the PRODUCTION build, not the dev server.
 *
 * It asserts criterion 13's video figure and criteria 7/8/9, and it PRINTS the page total with
 * its five largest requests, which criterion 13 requires to be reported but explicitly does not
 * assert (the case-card PNGs under public/uploads/ are out of this task's scope — see the
 * 2026-09-27 amendment in the spec). Exit code 0 = every asserted criterion held.
 *
 * Run it (two shells, from the worktree root):
 *
 *   Windows — PowerShell, shell 1:
 *   pnpm build ; npx vite preview --port 4173 --strictPort
 *
 *   Windows — PowerShell, shell 2:
 *   node .\tests\e2e\hero-video-cold-load.mjs
 *
 *   macOS — Terminal (zsh): not available (this worktree lives on the Windows PC); on a Mac,
 *   point CHROME_PATH at Google Chrome.app and the rest is identical.
 *
 * What to expect: a JSON block per mode (normal, reduced motion) and a PASS/FAIL line per
 * criterion; it takes about 30 seconds and starts a throwaway headless Chrome profile.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';
const PAGE_URL = `${PREVIEW_URL}/de/`;
const CHROME_PATH =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MAX_VIDEO_TRANSFER = 3 * 1024 * 1024; // 3 MiB — criterion 13
const PLAYBACK_DEADLINE_MS = 3000; // criterion 8
const SETTLE_MS = 12000; // well past the poster -> play handoff

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** One headless Chrome, one CDP session, closed by the returned `close()`. */
const openChrome = async (port) => {
  const profile = mkdtempSync(join(tmpdir(), 'hero-cdp-'));
  const chrome = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      // The page starts playback itself after the poster; without this the headless autoplay
      // policy would reject play() and we would measure the policy, not the change.
      '--autoplay-policy=no-user-gesture-required',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let wsUrl;
  for (let attempt = 0; attempt < 80 && !wsUrl; attempt++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      wsUrl = targets.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
    } catch {
      /* not listening yet */
    }
    if (!wsUrl) await sleep(250);
  }
  if (!wsUrl) {
    chrome.kill();
    throw new Error(`Chrome did not expose a DevTools endpoint on :${port} (CHROME_PATH=${CHROME_PATH})`);
  }

  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let nextId = 1;
  const pending = new Map();
  const events = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    } else if (message.method) {
      events.push(message);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = nextId++;
      pending.set(id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const reply = await send('Runtime.evaluate', { expression, returnByValue: true });
    return JSON.parse(reply.result.result.value);
  };

  return {
    send,
    evaluate,
    events,
    close: () => {
      socket.close();
      chrome.kill();
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        /* Windows keeps the profile locked for a moment; a temp dir is harmless */
      }
    },
  };
};

/** requestId -> { url, bytes, sentAt, finishedAt, status } for one navigation. */
const requestTable = (events) => {
  const byId = new Map();
  for (const { method, params = {} } of events) {
    if (method === 'Network.requestWillBeSent') {
      byId.set(params.requestId, { url: params.request.url, bytes: 0, sentAt: params.timestamp });
    } else if (byId.has(params.requestId)) {
      const row = byId.get(params.requestId);
      if (method === 'Network.responseReceived') row.status = params.response.status;
      if (method === 'Network.loadingFinished') {
        row.bytes = params.encodedDataLength;
        row.finishedAt = params.timestamp;
      }
    }
  }
  return [...byId.values()].filter((row) => row.url.startsWith('http'));
};

const DOM_PROBE = `(() => {
  const video = document.querySelector('video');
  const control = document.querySelector('section button[aria-label]');
  return JSON.stringify({
    paused: video.paused,
    readyState: video.readyState,
    poster: video.getAttribute('poster'),
    preload: video.getAttribute('preload'),
    autoplay: video.hasAttribute('autoplay'),
    controlLabel: control && control.getAttribute('aria-label'),
    controlVisible: control ? getComputedStyle(control).display !== 'none' : null,
  });
})()`;

/** One cold load of /de/ at 390x844, cache disabled, optionally with reduced motion. */
const coldLoad = async ({ reducedMotion, port }) => {
  const chrome = await openChrome(port);
  try {
    await chrome.send('Network.enable');
    await chrome.send('Page.enable');
    await chrome.send('Runtime.enable');
    await chrome.send('Network.setCacheDisabled', { cacheDisabled: true });
    await chrome.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    if (reducedMotion) {
      await chrome.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
    }

    await chrome.send('Page.navigate', { url: PAGE_URL });
    await sleep(SETTLE_MS);

    const rows = requestTable(chrome.events);
    return {
      rows,
      total: rows.reduce((sum, row) => sum + row.bytes, 0),
      mp4: rows.filter((row) => row.url.includes('.mp4')),
      poster: rows.find((row) => /hero-poster-[^/]*\.jpg$/.test(row.url)),
      dom: await chrome.evaluate(DOM_PROBE),
    };
  } finally {
    chrome.close();
  }
};

// --- run -----------------------------------------------------------------------

try {
  const probe = await fetch(PAGE_URL);
  if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
} catch (error) {
  console.error(
    `${PAGE_URL} is not answering (${error.message}). Start the production preview first:\n` +
      '  pnpm build ; npx vite preview --port 4173 --strictPort',
  );
  process.exit(2);
}

const failures = [];
const check = (ok, label, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} — ${detail}`);
  if (!ok) failures.push(label);
};

const normal = await coldLoad({ reducedMotion: false, port: 9333 });
const top5 = normal.rows
  .slice()
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 5)
  .map((row) => ({ url: row.url.replace(PREVIEW_URL, ''), bytes: row.bytes }));

console.log(
  JSON.stringify(
    {
      mode: 'normal',
      requests: normal.rows.length,
      totalTransferredBytes: normal.total,
      mp4: normal.mp4.map((row) => ({ url: row.url, bytes: row.bytes, status: row.status })),
      top5,
      dom: normal.dom,
    },
    null,
    2,
  ),
);

check(
  normal.mp4.length === 1,
  'criterion 13: exactly one .mp4 request',
  `${normal.mp4.length} request(s)`,
);
check(
  normal.mp4.length === 1 && normal.mp4[0].bytes <= MAX_VIDEO_TRANSFER,
  'criterion 13: the .mp4 transfers at most 3 MiB',
  `${normal.mp4[0]?.bytes ?? 'n/a'} of ${MAX_VIDEO_TRANSFER} bytes`,
);
check(
  Boolean(normal.poster?.finishedAt) &&
    normal.mp4.length === 1 &&
    normal.mp4[0].sentAt >= normal.poster.finishedAt,
  'criterion 7: the .mp4 is requested only after the poster response completed',
  normal.poster
    ? `${((normal.mp4[0].sentAt - normal.poster.finishedAt) * 1000).toFixed(1)} ms after the poster`
    : 'no poster request seen',
);
check(
  normal.dom.paused === false,
  `criterion 8: playback has started within ${PLAYBACK_DEADLINE_MS} ms of the poster`,
  `paused=${normal.dom.paused}, readyState=${normal.dom.readyState}`,
);
check(
  normal.dom.preload === 'none' && normal.dom.autoplay === false && Boolean(normal.dom.poster),
  'criterion 6: poster set, preload="none", no autoplay attribute',
  `poster=${normal.dom.poster}, preload=${normal.dom.preload}, autoplay=${normal.dom.autoplay}`,
);
console.log(
  `REPORTED (not asserted, criterion 13): page total ${normal.total} B over ${normal.rows.length} requests; ` +
    `largest: ${top5.map((row) => `${row.url} ${row.bytes} B`).join(' · ')}`,
);

const reduced = await coldLoad({ reducedMotion: true, port: 9335 });
console.log(
  JSON.stringify(
    {
      mode: 'prefers-reduced-motion: reduce',
      requests: reduced.rows.length,
      totalTransferredBytes: reduced.total,
      mp4: reduced.mp4.map((row) => ({ url: row.url, bytes: row.bytes })),
      dom: reduced.dom,
    },
    null,
    2,
  ),
);

check(
  reduced.mp4.length === 0,
  'criterion 9: prefers-reduced-motion fetches no video byte',
  `${reduced.mp4.length} .mp4 request(s)`,
);
check(
  reduced.dom.paused === true && Boolean(reduced.dom.poster),
  'criterion 9: the video stays paused and the poster stays in place',
  `paused=${reduced.dom.paused}, poster=${reduced.dom.poster}`,
);
check(
  reduced.dom.controlVisible === true,
  'criterion 10: the play control is visible at 390 px under reduced motion',
  `display visible=${reduced.dom.controlVisible}, label=${reduced.dom.controlLabel}`,
);

console.log(failures.length === 0 ? '\nAll asserted criteria held.' : `\nFailed: ${failures.join('; ')}`);
process.exit(failures.length === 0 ? 0 : 1);
