/**
 * check-seo.ts — mechanical proof of the acceptance criteria of task
 * 20260908-seo-basics-for-venturelabs-team-robots-sitemap-c over the built dist/.
 *
 * Dependency-free: run with the tsx that is already a devDependency.
 *
 *   pnpm build
 *   pnpm exec tsx scripts/check-seo.ts [expectedBaseCount]
 *
 * Exit codes: 0 = every check passed, 1 = at least one check failed,
 * 2 = dist/ is missing (run pnpm build first).
 *
 * The expected URL form (origin + trailing slash) is this script's OWN constant,
 * deliberately not re-derived from scripts/prerender.ts, so a silent flip of
 * TRAILING_SLASH or SITE_ORIGIN over there fails the check instead of passing it.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { resolve, dirname, join, relative, sep } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distDir = resolve(repoRoot, "dist");

/** Expected canonical origin — this script's own copy, not read from prerender.ts. */
const SITE_ORIGIN = "https://venturelabs.team";
/** Expected URL form, determined by the live curl recorded in the spec/report. */
const TRAILING_SLASH = true;
const LOCALES = ["de", "en"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "de";

// ---------------------------------------------------------------- test harness

interface Failure {
  check: string;
  detail: string;
}

const failures: Failure[] = [];
const passed: string[] = [];
const info: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    passed.push(name);
    console.log(`ok   ${name}`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    failures.push({ check: name, detail });
    console.log(`FAIL ${name}`);
    for (const line of detail.split("\n")) console.log(`       ${line}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  expected: ${String(expected)}\n  actual:   ${String(actual)}`);
  }
}

/** First 10 offenders, so a broken build prints a diagnosis and not a wall. */
function sample(items: string[], n = 10): string {
  const head = items.slice(0, n).join("\n  ");
  return items.length > n ? `  ${head}\n  … and ${items.length - n} more` : `  ${head}`;
}

// ---------------------------------------------------------------- dist reading

if (!existsSync(distDir) || !existsSync(join(distDir, "index.html"))) {
  console.error("run pnpm build first: no dist/index.html");
  process.exit(2);
}

function read(file: string): string {
  return readFileSync(file, "utf-8");
}

/** Every dist/**\/index.html except dist/index.html, as app route paths ("/de/blog"). */
function walkShells(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "assets" || entry === "uploads") continue;
      walkShells(full, acc);
    } else if (entry === "index.html" && full !== join(distDir, "index.html")) {
      acc.push("/" + relative(distDir, dirname(full)).split(sep).join("/"));
    }
  }
  return acc;
}

const shellPaths = walkShells(distDir).sort();
const shellHtml = new Map<string, string>(
  shellPaths.map((p) => [p, read(join(distDir, p.slice(1), "index.html"))])
);
const fallbackHtml = read(join(distDir, "index.html"));

/** Expected absolute URL of an app route path, per this script's own constants. */
function expectedUrl(path: string): string {
  const clean = `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  return `${SITE_ORIGIN}${clean}${TRAILING_SLASH ? "/" : ""}`;
}

function localeOf(path: string): Locale {
  return path.split("/")[1] as Locale;
}

function localeAgnosticKey(path: string): string {
  const stripped = path.replace(/^\/(?:de|en)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

// --------------------------------------------------- minimal sitemap XML scan

interface SitemapUrl {
  loc: string;
  lastmods: string[];
  alternates: { hreflang: string; href: string }[];
  raw: string;
}

const sitemapPath = join(distDir, "sitemap.xml");
const sitemapXml = existsSync(sitemapPath) ? read(sitemapPath) : "";

function parseSitemap(xml: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const raw of blocks) {
    const loc = (raw.match(/<loc>([\s\S]*?)<\/loc>/) ?? [])[1] ?? "";
    const lastmods = [...raw.matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/g)].map((m) => m[1]);
    const alternates = [...raw.matchAll(/<xhtml:link\b([^>]*)\/?>/g)].map((m) => {
      const attrs = m[1];
      return {
        hreflang: (attrs.match(/hreflang="([^"]*)"/) ?? [])[1] ?? "",
        href: (attrs.match(/href="([^"]*)"/) ?? [])[1] ?? "",
        rel: (attrs.match(/rel="([^"]*)"/) ?? [])[1] ?? "",
      };
    });
    for (const a of alternates) {
      assert(a.rel === "alternate", `xhtml:link without rel="alternate" in ${loc}`);
    }
    urls.push({ loc, lastmods, alternates, raw });
  }
  return urls;
}

const sitemapUrls = sitemapXml ? parseSitemap(sitemapXml) : [];

/** Shell head tags, scanned the same hand-rolled way. */
function linkTags(html: string, rel: string): { hreflang: string; href: string }[] {
  return [...html.matchAll(/<link\b([^>]*)\/?>/g)]
    .map((m) => m[1])
    .filter((attrs) => (attrs.match(/rel="([^"]*)"/) ?? [])[1] === rel)
    .map((attrs) => ({
      hreflang: (attrs.match(/hreflang="([^"]*)"/) ?? [])[1] ?? "",
      href: (attrs.match(/href="([^"]*)"/) ?? [])[1] ?? "",
    }));
}

function headOf(html: string): string {
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : "";
}

function bodyOf(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1] : "";
}

// ------------------------------------------------------------------- criterion 1

check("1 robots.txt: exists, allow-all, absolute Sitemap line", () => {
  const file = join(distDir, "robots.txt");
  assert(existsSync(file), "dist/robots.txt does not exist");
  const txt = read(file);
  assert(txt.trim().length > 0, "dist/robots.txt is empty");
  assert(/^\s*User-agent:\s*\*\s*$/m.test(txt), "no `User-agent: *` line");
  assert(/^\s*Allow:\s*\/\s*$/m.test(txt), "no `Allow: /` line");
  assert(
    txt.split(/\r?\n/).some((l) => l.trim() === `Sitemap: ${SITE_ORIGIN}/sitemap.xml`),
    `no line \`Sitemap: ${SITE_ORIGIN}/sitemap.xml\``
  );
  const disallow = txt
    .split(/\r?\n/)
    .filter((l) => /^\s*Disallow:\s*\S/.test(l))
    .map((l) => l.trim());
  assert(disallow.length === 0, `Disallow with a non-empty path:\n${sample(disallow)}`);
});

// ------------------------------------------------------------------- criterion 2

check("2 sitemap.xml: exists, well-formed, urlset with both namespaces", () => {
  assert(existsSync(sitemapPath), "dist/sitemap.xml does not exist");
  assert(sitemapXml.trim().length > 0, "dist/sitemap.xml is empty");

  // Well-formedness, checked by a tag-balance scan (no parser dependency).
  const stack: string[] = [];
  for (const m of sitemapXml.matchAll(/<(\/?)([A-Za-z_][\w.:-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, name, attrs, selfClose] = m;
    if (name.toLowerCase() === "?xml" || attrs.startsWith("?")) continue;
    if (selfClose === "/") continue;
    if (closing === "/") {
      const open = stack.pop();
      assertEqual(open, name, `unbalanced tag: </${name}> closes <${open ?? "nothing"}>`);
    } else {
      stack.push(name);
    }
  }
  assert(stack.length === 0, `unclosed tags: ${stack.join(", ")}`);
  assert(!/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(sitemapXml), "raw & in the sitemap");

  const root = sitemapXml.match(/<urlset\b([^>]*)>/);
  assert(root, "root element is not <urlset>");
  assert(
    root[1].includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),
    "urlset does not declare the sitemap 0.9 namespace"
  );
  assert(
    root[1].includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'),
    "urlset does not declare the xhtml namespace"
  );
});

// ------------------------------------------------------------------- criterion 3

check("3 sitemap <loc> set == prerendered shells, no dupes/extras/missing", () => {
  assert(shellPaths.length > 0, "no prerendered shells found under dist/");
  const expected = shellPaths.map(expectedUrl).sort();
  const actual = sitemapUrls.map((u) => u.loc).sort();

  const dupes = actual.filter((v, i) => i > 0 && v === actual[i - 1]);
  assert(dupes.length === 0, `duplicate <loc>:\n${sample([...new Set(dupes)])}`);

  const missing = expected.filter((u) => !actual.includes(u));
  const extra = actual.filter((u) => !expected.includes(u));
  assert(missing.length === 0, `shells with no <loc>:\n${sample(missing)}`);
  assert(extra.length === 0, `<loc> with no shell:\n${sample(extra)}`);
  assertEqual(actual.length, expected.length, "<loc> count != shell count");
});

// ------------------------------------------------------------------- criterion 4

/** Alternates a page group must carry, derived from the shell walk alone. */
const groups = new Map<string, Locale[]>();
for (const p of shellPaths) {
  const key = localeAgnosticKey(p);
  groups.set(key, [...(groups.get(key) ?? []), localeOf(p)]);
}

function expectedAlternates(path: string): { hreflang: string; href: string }[] {
  const key = localeAgnosticKey(path);
  const langs = LOCALES.filter((l) => (groups.get(key) ?? []).includes(l));
  const out = langs.map((l) => ({
    hreflang: l as string,
    href: expectedUrl(l === DEFAULT_LOCALE ? `/${l}${key === "/" ? "" : key}` : `/${l}${key === "/" ? "" : key}`),
  }));
  const defaultLang = langs.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : langs[0];
  out.push({
    hreflang: "x-default",
    href: expectedUrl(`/${defaultLang}${key === "/" ? "" : key}`),
  });
  return out;
}

function fingerprint(list: { hreflang: string; href: string }[]): string {
  return [...list].map((a) => `${a.hreflang}=${a.href}`).sort().join(" | ");
}

check("4 every <url> carries one alternate per existing locale plus one x-default", () => {
  assert(sitemapUrls.length > 0, "no <url> entries in the sitemap — nothing to check");
  const bad: string[] = [];
  for (const u of sitemapUrls) {
    const path = shellPaths.find((p) => expectedUrl(p) === u.loc);
    if (!path) continue; // covered by check 3
    const want = expectedAlternates(path);
    const xdef = u.alternates.filter((a) => a.hreflang === "x-default");
    if (xdef.length !== 1) {
      bad.push(`${u.loc}: ${xdef.length} x-default entries, expected exactly 1`);
      continue;
    }
    const self = u.alternates.filter((a) => a.href === u.loc && a.hreflang === localeOf(path));
    if (self.length !== 1) bad.push(`${u.loc}: no self-referencing hreflang="${localeOf(path)}"`);
    if (fingerprint(u.alternates) !== fingerprint(want)) {
      bad.push(`${u.loc}:\n    expected ${fingerprint(want)}\n    actual   ${fingerprint(u.alternates)}`);
    }
  }
  assert(bad.length === 0, `${bad.length} <url> with wrong alternates:\n${sample(bad)}`);
});

// ------------------------------------------------------------------- criterion 5

check(`5 every <loc>/href is absolute on ${SITE_ORIGIN} in the ${TRAILING_SLASH ? "trailing-slash" : "no-slash"} form`, () => {
  assert(sitemapUrls.length > 0, "no <url> entries in the sitemap — nothing to check");
  const bad: string[] = [];
  const shape = (url: string, where: string) => {
    if (!url.startsWith(`${SITE_ORIGIN}/`)) {
      bad.push(`${where}: not absolute on ${SITE_ORIGIN}: ${url}`);
      return;
    }
    const path = url.slice(SITE_ORIGIN.length);
    if (TRAILING_SLASH && !path.endsWith("/")) bad.push(`${where}: missing trailing slash: ${url}`);
    if (!TRAILING_SLASH && path.endsWith("/") && path !== "/") {
      bad.push(`${where}: unexpected trailing slash: ${url}`);
    }
    if (/\/\/$|\s/.test(path)) bad.push(`${where}: malformed path: ${url}`);
  };

  for (const u of sitemapUrls) {
    shape(u.loc, "sitemap <loc>");
    for (const a of u.alternates) shape(a.href, `sitemap alternate (${u.loc})`);
  }
  for (const [path, html] of shellHtml) {
    for (const c of linkTags(headOf(html), "canonical")) shape(c.href, `canonical in ${path}`);
    for (const a of linkTags(headOf(html), "alternate")) shape(a.href, `alternate in ${path}`);
  }
  assert(bad.length === 0, `${bad.length} malformed URLs:\n${sample(bad)}`);
});

// ------------------------------------------------------------------- criterion 6

check("6 every <url> has exactly one <lastmod> in YYYY-MM-DD form", () => {
  assert(sitemapUrls.length > 0, "no <url> entries in the sitemap — nothing to check");
  const bad: string[] = [];
  for (const u of sitemapUrls) {
    if (u.lastmods.length !== 1) {
      bad.push(`${u.loc}: ${u.lastmods.length} <lastmod>, expected 1`);
      continue;
    }
    const v = u.lastmods[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) bad.push(`${u.loc}: bad <lastmod> "${v}"`);
    else if (Number.isNaN(Date.parse(v))) bad.push(`${u.loc}: unparseable date "${v}"`);
  }
  assert(bad.length === 0, `${bad.length} bad <lastmod>:\n${sample(bad)}`);
  info.push(
    `lastmod values in use: ${[...new Set(sitemapUrls.map((u) => u.lastmods[0]))].sort().join(", ")}`
  );
});

// ------------------------------------------------------------------- criterion 7

check("7 every shell has exactly one self-referencing <link rel=\"canonical\">", () => {
  const bad: string[] = [];
  for (const [path, html] of shellHtml) {
    const canon = linkTags(headOf(html), "canonical");
    if (canon.length !== 1) {
      bad.push(`${path}: ${canon.length} canonical tags, expected 1`);
      continue;
    }
    if (canon[0].href !== expectedUrl(path)) {
      bad.push(`${path}: canonical ${canon[0].href}, expected ${expectedUrl(path)}`);
    }
    if (linkTags(html, "canonical").length !== canon.length) {
      bad.push(`${path}: a canonical tag sits outside <head>`);
    }
  }
  assert(bad.length === 0, `${bad.length} shells with a wrong canonical:\n${sample(bad)}`);
});

// ------------------------------------------------------------------- criterion 8

check("8 shell hreflang set == that route's sitemap alternates", () => {
  const bad: string[] = [];
  for (const [path, html] of shellHtml) {
    const inShell = linkTags(headOf(html), "alternate");
    const entry = sitemapUrls.find((u) => u.loc === expectedUrl(path));
    if (!entry) {
      bad.push(`${path}: no sitemap <url> to compare against`);
      continue;
    }
    if (inShell.length !== entry.alternates.length) {
      bad.push(`${path}: ${inShell.length} shell alternates vs ${entry.alternates.length} in the sitemap`);
      continue;
    }
    if (fingerprint(inShell) !== fingerprint(entry.alternates)) {
      bad.push(`${path}:\n    shell   ${fingerprint(inShell)}\n    sitemap ${fingerprint(entry.alternates)}`);
    }
  }
  assert(bad.length === 0, `${bad.length} shells disagreeing with the sitemap:\n${sample(bad)}`);
});

// ------------------------------------------------------------------- criterion 9

function titleOf(html: string): string {
  return (html.match(/<title>([\s\S]*?)<\/title>/) ?? [])[1] ?? "";
}

function descriptionOf(html: string): string {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  return m ? m[1] : "";
}

check("9 non-empty title+description everywhere; unique within each locale", () => {
  const empties: string[] = [];
  for (const [path, html] of shellHtml) {
    if (titleOf(html).trim() === "") empties.push(`${path}: empty <title>`);
    if (descriptionOf(html).trim() === "") empties.push(`${path}: empty meta description`);
  }
  assert(empties.length === 0, `${empties.length} empty tags:\n${sample(empties)}`);

  const dupes: string[] = [];
  for (const lang of LOCALES) {
    const paths = shellPaths.filter((p) => localeOf(p) === lang);
    for (const [what, get] of [
      ["title", titleOf],
      ["description", descriptionOf],
    ] as const) {
      const seen = new Map<string, string>();
      for (const p of paths) {
        const value = get(shellHtml.get(p)!);
        const first = seen.get(value);
        if (first) dupes.push(`${lang}: duplicate ${what} "${value}" in ${first} and ${p}`);
        else seen.set(value, p);
      }
    }
  }
  assert(dupes.length === 0, `${dupes.length} within-locale duplicates:\n${sample(dupes)}`);

  // Informational: cross-locale duplicate titles are permitted by criterion 9.
  const byTitle = new Map<string, string[]>();
  for (const p of shellPaths) {
    const t = titleOf(shellHtml.get(p)!);
    byTitle.set(t, [...(byTitle.get(t) ?? []), p]);
  }
  const cross = [...byTitle.entries()].filter(([, ps]) => ps.length > 1);
  info.push(
    `cross-locale duplicate titles (permitted, ${cross.length}):` +
      (cross.length
        ? "\n" + cross.map(([t, ps]) => `    "${t}" — ${ps.join(", ")}`).join("\n")
        : " none")
  );
});

// ------------------------------------------------------------------ criterion 10

check("10 dist/index.html (SPA fallback) carries no canonical and no hreflang", () => {
  assertEqual(linkTags(fallbackHtml, "canonical").length, 0, "fallback shell has a canonical");
  const alts = linkTags(fallbackHtml, "alternate").filter((a) => a.hreflang !== "");
  assertEqual(alts.length, 0, "fallback shell has hreflang alternates");
  const shellTitle = titleOf(fallbackHtml);
  const routeTitles = new Set([...shellHtml.values()].map(titleOf));
  assert(shellTitle.trim() !== "", "fallback shell has an empty <title>");
  assert(
    !routeTitles.has(shellTitle) || shellTitle === titleOf(fallbackHtml),
    "unexpected fallback title"
  );
  info.push(`fallback <title> left as: "${shellTitle}"`);
});

// ------------------------------------------------------------------ criterion 11

const expectedBaseCount = process.argv[2] ? Number(process.argv[2]) : undefined;

check("11 shell count == sitemap <url> count" + (expectedBaseCount ? ` == ${expectedBaseCount} (base build)` : ""), () => {
  assertEqual(sitemapUrls.length, shellPaths.length, "sitemap <url> count != shell count");
  if (expectedBaseCount !== undefined) {
    assert(!Number.isNaN(expectedBaseCount), "the base count argument is not a number");
    assertEqual(shellPaths.length, expectedBaseCount, "shell count differs from the base-branch build");
  }
  info.push(`route count: ${shellPaths.length} shells / ${sitemapUrls.length} <url> entries`);
});

// ------------------------------------------------------------------ criterion 13

check("13 /ai-pulse redirect matches what App.tsx does with the route", () => {
  const appTsx = read(resolve(repoRoot, "src/app/App.tsx"));
  const routeLine = appTsx
    .split(/\r?\n/)
    .find((l) => /path=["'][^"']*ai-pulse/.test(l) || /ai-pulse/.test(l));
  const rendersRealPage =
    /ai-pulse/.test(appTsx) && !/ai-pulse[\s\S]{0,200}?LegacyRedirect/.test(appTsx);
  const shellExists = existsSync(join(distDir, "de", "ai-pulse", "index.html"));

  if (rendersRealPage || shellExists) {
    info.push("13 not applicable: /:lang/ai-pulse still renders a page — redirect deferred");
    assert(
      !existsSync(join(distDir, "_redirects")),
      "the route still renders, so public/_redirects should not have been created"
    );
    return;
  }

  const file = join(distDir, "_redirects");
  assert(existsSync(file), "dist/_redirects does not exist");
  const rules = read(file)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"));
  assertEqual(rules.length, 2, `expected exactly 2 rules, got:\n${sample(rules)}`);

  for (const lang of LOCALES) {
    const rule = rules.find((r) => r.startsWith(`/${lang}/ai-pulse`));
    assert(rule, `no rule for /${lang}/ai-pulse`);
    const parts = rule.split(/\s+/);
    assertEqual(parts.length, 3, `rule is not "<from> <to> <status>": ${rule}`);
    assertEqual(parts[2], "301", `rule for /${lang}/ai-pulse is not a 301: ${rule}`);
    const target = parts[1].replace(/\/$/, "");
    assert(
      shellPaths.includes(target),
      `redirect target ${parts[1]} is not a prerendered route (rule: ${rule})`
    );
  }
  info.push(`13 App.tsx route line: ${routeLine?.trim() ?? "(none)"}`);
  info.push(`13 rules: ${rules.join(" | ")}`);
});

// ------------------------------------------------------- criterion 14 (partial)

check("14 (partial) every shell <body> is byte-identical to the fallback shell body", () => {
  const fallbackBody = bodyOf(fallbackHtml);
  assert(fallbackBody.length > 0, "could not read <body> of dist/index.html");
  const bad = shellPaths.filter((p) => bodyOf(shellHtml.get(p)!) !== fallbackBody);
  assert(bad.length === 0, `${bad.length} shells whose <body> differs:\n${sample(bad)}`);
  info.push("14 base-branch bundle comparison is manual — see the report");
});

// ------------------------------------------------- informational: description source

check("informational: routes whose description is not from content frontmatter", () => {
  const nonContent = shellPaths.filter((p) =>
    /\/(cases|blog|kontakt|impressum|datenschutz)$/.test(p)
  );
  info.push(
    `descriptions not from content frontmatter (${nonContent.length}):\n    ${nonContent.join(", ")}`
  );
});

// ------------------------------------------------------------------------ report

console.log("");
console.log("--- informational ---");
for (const line of info) console.log(line);
console.log("");
console.log(`${passed.length} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log("");
  for (const f of failures) console.log(`FAILED: ${f.check}\n${f.detail}`);
  process.exit(1);
}
process.exit(0);
