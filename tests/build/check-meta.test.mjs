/**
 * 20261021-link-previews-meta-data-for-venturelabs-team-og- (criterion 22)
 *
 * One test per failure class of scripts/check-meta.ts: each mutates a COPY of
 * the built dist/ (never the real one) and expects runChecks() to report a
 * `FAIL` line naming the route and the tag or file. A test also proves the
 * untouched copy passes, so a failure cannot come from the copy itself.
 *
 * Needs a finished build first (`pnpm build`), like the check itself.
 * Run: pnpm exec tsx --test tests/build/check-meta.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runChecks } from "../../scripts/check-meta.ts";

const realDist = resolve(dirname(fileURLToPath(import.meta.url)), "../../dist");
const PROD_ENV = {};

function withCopy(mutate, env = PROD_ENV) {
  const dir = mkdtempSync(join(tmpdir(), "check-meta-"));
  try {
    cpSync(realDist, dir, { recursive: true });
    mutate(dir);
    return runChecks(dir, env);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function editFile(dir, rel, fn) {
  const file = join(dir, rel);
  writeFileSync(file, fn(readFileSync(file, "utf-8")));
}

function assertFails(outcome, ...needles) {
  assert.ok(outcome.failures.length > 0, "expected at least one FAIL, got none");
  for (const n of needles) {
    assert.ok(
      outcome.failures.some((l) => l.startsWith("FAIL ") && l.includes(n)),
      `no FAIL line containing "${n}" in:\n${outcome.failures.join("\n")}`
    );
  }
}

test("the untouched copy of dist/ passes", () => {
  assert.ok(existsSync(join(realDist, "index.html")), "run pnpm build first");
  const outcome = withCopy(() => {});
  assert.deepEqual(outcome.failures, []);
});

test("a missing tag is named by route and tag", () => {
  const o = withCopy((d) =>
    editFile(d, "de/leistungen/ai-automation/index.html", (h) => h.replace(/<meta property="og:image:alt"[^>]*>/, ""))
  );
  assertFails(o, "/de/leistungen/ai-automation", "og:image:alt");
});

test("an empty tag is reported", () => {
  const o = withCopy((d) =>
    editFile(d, "en/kontakt/index.html", (h) => h.replace(/(<meta name="description" content=")[^"]*(")/, "$1$2"))
  );
  assertFails(o, "/en/kontakt", "description");
});

test("a duplicated tag is reported", () => {
  const o = withCopy((d) =>
    editFile(d, "en/kontakt/index.html", (h) => h.replace("</head>", '<meta property="og:title" content="x" /></head>'))
  );
  assertFails(o, "/en/kontakt", "og:title", "duplicated");
});

test("a title shared with another route is reported (across locales too)", () => {
  const o = withCopy((d) => {
    const de = readFileSync(join(d, "de/kontakt/index.html"), "utf-8").match(/<title>([^<]*)<\/title>/)[1];
    editFile(d, "en/kontakt/index.html", (h) => h.replace(/<title>[^<]*<\/title>/, `<title>${de}</title>`));
  });
  assertFails(o, "<title>", "identical to");
});

test("a description shared with another route is reported", () => {
  const o = withCopy((d) => {
    const de = readFileSync(join(d, "de/kontakt/index.html"), "utf-8").match(/<meta name="description" content="([^"]*)"/)[1];
    editFile(d, "de/impressum/index.html", (h) => h.replace(/(<meta name="description" content=")[^"]*(")/, `$1${de}$2`));
  });
  assertFails(o, "meta[name=description]", "identical to");
});

test("an og:image with no file in dist/ is reported", () => {
  const o = withCopy((d) => rmSync(join(d, "og-venturelabs-en.png")));
  assertFails(o, "/en", "og:image", "no file in dist/");
});

test("an og:image that is not a PNG is reported", () => {
  const o = withCopy((d) => writeFileSync(join(d, "og-venturelabs.png"), "not a png at all, just text padding".repeat(4)));
  assertFails(o, "og-venturelabs.png", "not a PNG");
});

test("an og:image of the wrong size is reported", () => {
  const o = withCopy((d) => cpSync(join(d, "icon-512.png"), join(d, "og-venturelabs.png")));
  assertFails(o, "og-venturelabs.png", "512x512, expected 1200x630");
});

test("an og:image over 300 KB is reported", () => {
  const o = withCopy((d) => {
    const file = join(d, "og-venturelabs.png");
    writeFileSync(file, Buffer.concat([readFileSync(file), Buffer.alloc(300 * 1024)]));
  });
  assertFails(o, "og-venturelabs.png", "over the 300 KB limit");
});

test("an og:image on a foreign origin is reported", () => {
  const o = withCopy((d) =>
    editFile(d, "de/kontakt/index.html", (h) => h.replace('content="https://venturelabs.team/og-venturelabs.png"', 'content="https://example.org/og-venturelabs.png"'))
  );
  assertFails(o, "/de/kontakt", "og:image");
});

test("a preview build must use DEPLOY_PRIME_URL, a production build must not", () => {
  const preview = { CONTEXT: "deploy-preview", DEPLOY_PRIME_URL: "https://deploy-preview-1--x.netlify.app" };
  assertFails(withCopy(() => {}, preview), "og:image");
  const ignoredContext = { CONTEXT: "production", DEPLOY_PRIME_URL: "https://deploy-preview-1--x.netlify.app" };
  assert.deepEqual(withCopy(() => {}, ignoredContext).failures, []);
});

test("a missing icon file and an invalid ICO are reported", () => {
  assertFails(withCopy((d) => rmSync(join(d, "apple-touch-icon.png"))), "apple-touch-icon.png");
  assertFails(withCopy((d) => writeFileSync(join(d, "favicon.ico"), "nope")), "/favicon.ico", "invalid ICO");
});

test("a wrong icon PNG size is reported", () => {
  const o = withCopy((d) => cpSync(join(d, "icon-512.png"), join(d, "icon-192.png")));
  assertFails(o, "/icon-192.png", "size");
});

test("a manifest missing its name is reported", () => {
  const o = withCopy((d) =>
    editFile(d, "site.webmanifest", (t) => JSON.stringify({ ...JSON.parse(t), name: undefined }))
  );
  assertFails(o, "/site.webmanifest", "name");
});

test("JSON-LD that does not parse is reported", () => {
  const o = withCopy((d) =>
    editFile(d, "de/cases/tap2link/index.html", (h) =>
      h.replace(/(<script type="application\/ld\+json">)[\s\S]*?(<\/script>)/, "$1{ broken$2")
    )
  );
  assertFails(o, "/de/cases/tap2link", "does not parse");
});

test("JSON-LD lacking the type of the route kind, or carrying an Offer, is reported", () => {
  const swap = (d, rel, fn) =>
    editFile(d, rel, (h) =>
      h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_m, a, json, c) => a + fn(JSON.parse(json)) + c)
    );
  assertFails(
    withCopy((d) => swap(d, "de/index.html", (j) => JSON.stringify({ ...j, "@graph": j["@graph"].filter((n) => n["@type"] !== "WebSite") }))),
    "/de",
    "WebSite"
  );
  assertFails(
    withCopy((d) => swap(d, "de/leistungen/ai-automation/index.html", (j) => JSON.stringify({ ...j, "@graph": j["@graph"].filter((n) => n["@type"] !== "Service") }))),
    "/de/leistungen/ai-automation",
    "Service"
  );
  assertFails(
    withCopy((d) => swap(d, "de/leistungen/index.html", (j) => JSON.stringify({ ...j, "@graph": [...j["@graph"], { "@type": "Offer", price: "1" }] }))),
    "/de/leistungen",
    "forbidden"
  );
});

test("a non-absolute JSON-LD URL is reported", () => {
  const o = withCopy((d) =>
    editFile(d, "de/impressum/index.html", (h) => h.replace('"item":"https://venturelabs.team/de/"', '"item":"/de/"'))
  );
  assertFails(o, "/de/impressum", "script[type=application/ld+json]");
});

test("a root shell deviating from the /de head set is reported", () => {
  const o = withCopy((d) =>
    editFile(d, "index.html", (h) => h.replace('href="https://venturelabs.team/de/" />', 'href="https://venturelabs.team/en/" />'))
  );
  assertFails(o, "(dist/index.html)");
});

test("a missing or wrong 404 shell is reported", () => {
  assertFails(withCopy((d) => rmSync(join(d, "404.html"))), "/404.html");
  assertFails(
    withCopy((d) => editFile(d, "404.html", (h) => h.replace("</head>", '<link rel="canonical" href="https://venturelabs.team/de/" /></head>'))),
    "/404.html",
    "canonical"
  );
});

test("a _redirects without the /404.html catch-all is reported", () => {
  const o = withCopy((d) => editFile(d, "_redirects", (t) => t.split("\n").filter((l) => !l.startsWith("/*")).join("\n")));
  assertFails(o, "/_redirects");
});

test("a sitemap, robots.txt or hreflang disagreeing with the shells is reported", () => {
  assertFails(withCopy((d) => writeFileSync(join(d, "robots.txt"), "User-agent: *\nDisallow: /\n")), "/robots.txt");
  assertFails(
    withCopy((d) => editFile(d, "sitemap.xml", (t) => t.replace(/<url>[\s\S]*?<\/url>/, ""))),
    "/sitemap.xml",
    "no entry for the shell"
  );
  assertFails(
    withCopy((d) => editFile(d, "de/kontakt/index.html", (h) => h.replace(/<link rel="alternate" hreflang="en"[^>]*>/, ""))),
    "/de/kontakt",
    "hreflang"
  );
});

test("a head string spelled VentureLabs is reported", () => {
  const o = withCopy((d) =>
    editFile(d, "de/kontakt/index.html", (h) => h.replace(/<title>/, "<title>VentureLabs "))
  );
  assertFails(o, "/de/kontakt", "VentureLabs");
});
