/**
 * check-meta.ts - the build's gate for link previews and SEO meta data.
 *
 * Runs as the last step of `pnpm build` (so on Netlify too) and as
 * `pnpm check:meta`. Dependency-free (fs + path only). It reads the finished
 * dist/ and fails the build - exit 1, a `FAIL` line naming the route and the
 * tag or file - when:
 *   - a route lacks, empties or duplicates a tag of the share/meta checklist
 *     (title, description, robots, canonical, hreflang, Open Graph, Twitter,
 *     theme-color, icons, manifest, JSON-LD),
 *   - two routes share a title or a description (within or across locales),
 *   - an og:image is not an existing 1200x630 PNG of at most 300 KB on the
 *     origin the build context demands,
 *   - an icon or the manifest is missing or malformed,
 *   - the JSON-LD does not parse or lacks the type its route kind requires,
 *   - the root shell, dist/404.html or public/_redirects deviate,
 *   - or robots.txt / sitemap.xml / canonical / hreflang disagree (the
 *     criteria of the retired scripts/check-seo.ts).
 *   - a route's <title> is not 50-60 characters or its description not
 *     120-160 characters (inclusive; Unicode code points of the decoded,
 *     trimmed text). The per-route table is printed on success and on failure.
 *
 * Expected values are this script's OWN constants, deliberately not imported
 * from scripts/prerender.ts, so a silent change over there fails the check.
 *
 *   pnpm build && pnpm check:meta
 *
 * Exit codes: 0 = every check passed, 1 = at least one failed, 2 = dist/ missing.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { dirname, join, relative, resolve, sep } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const SITE_ORIGIN = "https://venturelabs.team";
const LOCALES = ["de", "en"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "de";
const BRAND = "Venture Labs";
const OLD_BRAND = "VentureLabs";
const SHARE_IMAGE: Record<Locale, { path: string; alt: string }> = {
  de: { path: "/og-venturelabs.png", alt: "Venture Labs – KI im Mittelstand, die sich rechnet." },
  en: { path: "/og-venturelabs-en.png", alt: "Venture Labs – AI for mid-sized companies, that pays off." },
};
const MAX_IMAGE_BYTES = 300 * 1024;
const HOME_TITLE: Record<Locale, string> = {
  de: "Venture Labs – Digitale Produkte, die wirklich funktionieren",
  en: "Venture Labs – Digital products that actually work, with AI",
};
/** The two legal pages carry the brand inside their title sentence, not as the " – Venture Labs" suffix. */
const BRAND_INSIDE_TITLE = new Set(["/de/impressum", "/en/impressum", "/de/datenschutz", "/en/datenschutz"]);
/** Inclusive bounds, in characters (Unicode code points of the decoded, trimmed text). */
export const TITLE_LENGTH = { min: 50, max: 60 };
export const DESCRIPTION_LENGTH = { min: 120, max: 160 };
const ROBOTS = "index,follow,max-image-preview:large";
const THEME_COLOR = "#0e0d13";
const FORBIDDEN_LD_KEYS = ["Offer", "offers", "price", "priceCurrency", "SearchAction", "potentialAction"];
const FOOTER_KEY_BY_SECTION: Record<string, string> = {
  leistungen: "servicesTitle",
  cases: "projectsTitle",
  blog: "blog",
  "ueber-uns": "aboutTitle",
  kontakt: "contactTitle",
  impressum: "imprint",
  datenschutz: "privacy",
};

/** Characters of a head string: code points of the trimmed text. */
export function headLength(text: string): number {
  return Array.from(text.trim()).length;
}

/**
 * The length rule for one head string: undefined when `text` is within the
 * inclusive bounds (title 50-60, description 120-160), otherwise the message
 * naming the measured length and the violated bound.
 */
export function lengthProblem(tag: "title" | "description", text: string): string | undefined {
  const { min, max } = tag === "title" ? TITLE_LENGTH : DESCRIPTION_LENGTH;
  const n = headLength(text);
  if (n < min) return `${n} characters, under the minimum of ${min}`;
  if (n > max) return `${n} characters, over the maximum of ${max}`;
  return undefined;
}

export interface CheckOutcome {
  passed: string[];
  failures: string[];
  report: string[];
}

type Attrs = Record<string, string>;

// ------------------------------------------------------------------ parsing

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function headOf(html: string): string {
  const m = stripComments(html).match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : "";
}

function parseAttrs(raw: string): Attrs {
  const out: Attrs = {};
  for (const m of raw.matchAll(/([a-zA-Z_:][\w:.-]*)(?:="([^"]*)")?/g)) {
    out[m[1].toLowerCase()] = m[2] === undefined ? "" : decode(m[2]);
  }
  return out;
}

function tagList(html: string, tag: "meta" | "link"): Attrs[] {
  const re = new RegExp(`<${tag}\\b((?:[^>"']|"[^"]*"|'[^']*')*)>`, "gi");
  return [...html.matchAll(re)].map((m) => parseAttrs(m[1]));
}

function titles(head: string): string[] {
  return [...head.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]));
}

function ldScripts(head: string): string[] {
  return [...head.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((m) => parseAttrs(m[1]).type === "application/ld+json")
    .map((m) => m[2]);
}

interface HeadTags {
  title: string[];
  names: Map<string, string[]>; // meta[name] -> contents
  props: Map<string, string[]>; // meta[property] -> contents
  links: Attrs[];
  ld: string[];
}

function parseHead(html: string): HeadTags {
  const head = headOf(html);
  const names = new Map<string, string[]>();
  const props = new Map<string, string[]>();
  for (const a of tagList(head, "meta")) {
    if (a.name !== undefined) names.set(a.name, [...(names.get(a.name) ?? []), a.content ?? ""]);
    if (a.property !== undefined) props.set(a.property, [...(props.get(a.property) ?? []), a.content ?? ""]);
  }
  return { title: titles(head), names, props, links: tagList(head, "link"), ld: ldScripts(head) };
}

const one = (list: string[] | undefined): string | undefined => (list && list.length === 1 ? list[0] : undefined);

// ------------------------------------------------------------------- helpers

function expectedAssetOrigin(env: NodeJS.ProcessEnv): string {
  const context = env.CONTEXT;
  const deployUrl = env.DEPLOY_PRIME_URL?.trim().replace(/\/+$/, "");
  if ((context === "deploy-preview" || context === "branch-deploy") && deployUrl) return deployUrl;
  return SITE_ORIGIN;
}

function canonicalOf(path: string): string {
  return `${SITE_ORIGIN}/${path.replace(/^\/+|\/+$/g, "")}/`;
}

function localeOf(path: string): Locale {
  return path.split("/")[1] as Locale;
}

function agnosticKey(path: string): string {
  const stripped = path.replace(/^\/(?:de|en)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

function isHome(path: string): boolean {
  return /^\/(?:de|en)$/.test(path);
}

interface Png {
  width: number;
  height: number;
  colorType: number;
  bytes: number;
}

function readPng(file: string): Png | string {
  const buf = readFileSync(file);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 33 || sig.some((b, i) => buf[i] !== b)) return "not a PNG (bad signature)";
  if (buf.toString("ascii", 12, 16) !== "IHDR") return "PNG without an IHDR chunk first";
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), colorType: buf[25], bytes: buf.length };
}

function icoProblem(file: string): string | undefined {
  const buf = readFileSync(file);
  if (buf.length < 6 || buf[0] !== 0 || buf[1] !== 0 || buf[2] !== 1 || buf[3] !== 0) {
    return "does not start with 00 00 01 00";
  }
  const count = buf.readUInt16LE(4);
  if (count < 1) return "no directory entries";
  for (let i = 0; i < count; i++) {
    const at = 6 + i * 16;
    if (at + 16 > buf.length) return `directory entry ${i} lies outside the file`;
    const size = buf.readUInt32LE(at + 8);
    const offset = buf.readUInt32LE(at + 12);
    if (offset + size > buf.length) return `image ${i} (offset ${offset}, ${size} bytes) lies outside the file`;
  }
  return undefined;
}

/** Path part of an absolute or root-relative URL, or undefined for anything else. */
function pathnameOf(href: string): string | undefined {
  if (href.startsWith("/")) return href;
  const m = href.match(/^https?:\/\/[^/]+(\/.*)?$/);
  return m ? (m[1] ?? "/") : undefined;
}

function originOf(href: string): string | undefined {
  const m = href.match(/^(https?:\/\/[^/]+)/);
  return m ? m[1] : undefined;
}

function walkShells(distDir: string, dir = distDir, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (dir === distDir && !LOCALES.includes(entry as Locale)) continue;
      walkShells(distDir, full, acc);
    } else if (entry === "index.html" && dir !== distDir) {
      acc.push("/" + relative(distDir, dirname(full)).split(sep).join("/"));
    }
  }
  return acc;
}

// ------------------------------------------------------------------ the checks

export function runChecks(distDir: string, env: NodeJS.ProcessEnv = process.env): CheckOutcome {
  const report: string[] = [];
  const passed: string[] = [];
  const failures: string[] = [];
  const out = (line: string) => report.push(line);

  /** One check: `fn` reports problems through `fail(where, what, message)`. */
  function check(name: string, fn: (fail: (where: string, what: string, msg: string) => void) => void): void {
    const own: string[] = [];
    const fail = (where: string, what: string, msg: string) => own.push(`FAIL ${where} ${what}: ${msg}`);
    try {
      fn(fail);
    } catch (err) {
      own.push(`FAIL ${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (own.length === 0) {
      passed.push(name);
      out(`ok   ${name}`);
    } else {
      out(`FAIL ${name}`);
      for (const line of own) {
        out(`     ${line}`);
        failures.push(line);
      }
    }
  }

  const read = (rel: string): string => readFileSync(join(distDir, rel), "utf-8");
  const exists = (rel: string): boolean => existsSync(join(distDir, rel.replace(/^\//, "")));

  if (!existsSync(join(distDir, "index.html"))) {
    return { passed, failures: ["FAIL dist/index.html: missing - run pnpm build first"], report };
  }

  const shellPaths = walkShells(distDir).sort();
  const shells = new Map<string, string>(shellPaths.map((p) => [p, read(`${p.slice(1)}/index.html`)]));
  const parsed = new Map<string, HeadTags>([...shells].map(([p, h]) => [p, parseHead(h)]));
  const rootHtml = read("index.html");
  const rootHead = parseHead(rootHtml);

  const groups = new Map<string, Locale[]>();
  for (const p of shellPaths) groups.set(agnosticKey(p), [...(groups.get(agnosticKey(p)) ?? []), localeOf(p)]);
  function expectedAlternates(path: string): Attrs[] {
    const key = agnosticKey(path);
    const langs = LOCALES.filter((l) => (groups.get(key) ?? []).includes(l));
    const urlFor = (l: Locale) => canonicalOf(`/${l}${key === "/" ? "" : key}`);
    const defaultLang = langs.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : langs[0];
    return [
      ...langs.map((l) => ({ hreflang: l as string, href: urlFor(l) })),
      { hreflang: "x-default", href: urlFor(defaultLang) },
    ];
  }

  const fingerprint = (list: { hreflang?: string; href?: string }[]) =>
    list.map((a) => `${a.hreflang}=${a.href}`).sort().join(" | ");

  // ---- (a)+(b) the per-route tag set and its values --------------------------
  const NAME_TAGS = [
    "description",
    "robots",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "twitter:image:alt",
    "theme-color",
  ];
  const PROP_TAGS = [
    "og:type",
    "og:site_name",
    "og:locale",
    "og:locale:alternate",
    "og:title",
    "og:description",
    "og:url",
    "og:image",
    "og:image:width",
    "og:image:height",
    "og:image:type",
    "og:image:alt",
  ];

  /** Every checklist tag exactly once and non-empty, inside <head>; returns false when the page is unusable. */
  function checklist(path: string, html: string, h: HeadTags, fail: (w: string, t: string, m: string) => void): void {
    const once = (tag: string, list: string[] | undefined) => {
      const n = list?.length ?? 0;
      if (n === 0) fail(path, tag, "missing");
      else if (n > 1) fail(path, tag, `duplicated (${n}x)`);
      else if (list![0].trim() === "") fail(path, tag, "empty");
    };
    once("<title>", h.title);
    for (const n of NAME_TAGS) once(`meta[name=${n}]`, h.names.get(n));
    for (const p of PROP_TAGS) once(`meta[property=${p}]`, h.props.get(p));

    const linkOnce = (label: string, match: (a: Attrs) => boolean) => {
      const hits = h.links.filter(match);
      if (hits.length === 0) fail(path, label, "missing");
      else if (hits.length > 1) fail(path, label, `duplicated (${hits.length}x)`);
      else if ((hits[0].href ?? "").trim() === "") fail(path, label, "empty href");
      return hits[0];
    };
    linkOnce("link[rel=canonical]", (a) => a.rel === "canonical");
    linkOnce("link[rel=manifest]", (a) => a.rel === "manifest");
    linkOnce("link[rel=apple-touch-icon]", (a) => a.rel === "apple-touch-icon");
    for (const hl of ["de", "en", "x-default"]) {
      linkOnce(`link[rel=alternate][hreflang=${hl}]`, (a) => a.rel === "alternate" && a.hreflang === hl);
    }
    const alternates = h.links.filter((a) => a.rel === "alternate");
    if (alternates.length !== 3) fail(path, "link[rel=alternate]", `${alternates.length} alternates, expected 3`);
    const svg = linkOnce("link[rel=icon][href=/favicon.svg]", (a) => a.rel === "icon" && a.href === "/favicon.svg");
    if (svg && svg.type !== "image/svg+xml") fail(path, "link[rel=icon] favicon.svg", `type ${svg.type}`);
    const png = linkOnce(
      "link[rel=icon][href=/favicon-32x32.png]",
      (a) => a.rel === "icon" && a.href === "/favicon-32x32.png"
    );
    if (png && png.type !== "image/png") fail(path, "link[rel=icon] favicon-32x32.png", `type ${png.type}`);
    linkOnce("link[rel=icon][href=/favicon.ico]", (a) => a.rel === "icon" && a.href === "/favicon.ico");
    once("script[type=application/ld+json]", h.ld);

    // None of the head tags may sit outside <head> (React-rendered bodies must not carry them).
    const body = stripComments(html).replace(/<head[^>]*>[\s\S]*?<\/head>/i, "");
    for (const a of tagList(body, "meta")) {
      const key = a.name ?? a.property ?? "";
      if (NAME_TAGS.includes(key) || PROP_TAGS.includes(key)) fail(path, `meta[${key}]`, "sits outside <head>");
    }
    for (const a of tagList(body, "link")) {
      if (a.rel === "canonical" || a.rel === "alternate") fail(path, `link[rel=${a.rel}]`, "sits outside <head>");
    }
  }

  check("1 every route carries each checklist tag exactly once, non-empty, inside <head>", (fail) => {
    if (shellPaths.length === 0) fail("dist/", "routes", "no prerendered route found");
    for (const p of shellPaths) checklist(p, shells.get(p)!, parsed.get(p)!, fail);
  });

  check("1b both locales have the same routes", (fail) => {
    const de = shellPaths.filter((p) => localeOf(p) === "de").map(agnosticKey);
    const en = shellPaths.filter((p) => localeOf(p) === "en").map(agnosticKey);
    for (const k of de) if (!en.includes(k)) fail(`/de${k}`, "route", "has no /en twin");
    for (const k of en) if (!de.includes(k)) fail(`/en${k}`, "route", "has no /de twin");
    out(`     ${de.length} de + ${en.length} en = ${shellPaths.length} routes`);
  });

  check("2 per-route values: canonical, og:url, hreflang, lang, locale, robots, theme-color, twitter mirrors", (fail) => {
    for (const p of shellPaths) {
      const h = parsed.get(p)!;
      const html = shells.get(p)!;
      const lang = localeOf(p);
      const eq = (what: string, actual: string | undefined, expected: string) => {
        if (actual !== undefined && actual !== expected) fail(p, what, `expected "${expected}", got "${actual}"`);
      };
      const canonical = h.links.find((a) => a.rel === "canonical")?.href;
      eq("link[rel=canonical]", canonical, canonicalOf(p));
      eq("meta[property=og:url]", one(h.props.get("og:url")), canonicalOf(p));
      const alts = h.links.filter((a) => a.rel === "alternate");
      if (fingerprint(alts) !== fingerprint(expectedAlternates(p))) {
        fail(p, "link[rel=alternate]", `expected ${fingerprint(expectedAlternates(p))}, got ${fingerprint(alts)}`);
      }
      const htmlLang = html.match(/<html\b[^>]*\blang="([^"]*)"/i)?.[1];
      if (htmlLang !== lang) fail(p, "<html lang>", `expected "${lang}", got "${htmlLang}"`);
      eq("meta[property=og:locale]", one(h.props.get("og:locale")), lang === "de" ? "de_DE" : "en_US");
      eq("meta[property=og:locale:alternate]", one(h.props.get("og:locale:alternate")), lang === "de" ? "en_US" : "de_DE");
      eq("meta[property=og:type]", one(h.props.get("og:type")), "website");
      eq("meta[property=og:site_name]", one(h.props.get("og:site_name")), BRAND);
      eq("meta[name=robots]", one(h.names.get("robots")), ROBOTS);
      eq("meta[name=theme-color]", one(h.names.get("theme-color")), THEME_COLOR);
      eq("meta[name=twitter:card]", one(h.names.get("twitter:card")), "summary_large_image");
      eq("meta[property=og:title]", one(h.props.get("og:title")), h.title[0] ?? "");
      eq("meta[name=twitter:title]", one(h.names.get("twitter:title")), h.title[0] ?? "");
      eq("meta[property=og:description]", one(h.props.get("og:description")), one(h.names.get("description")) ?? "");
      eq("meta[name=twitter:description]", one(h.names.get("twitter:description")), one(h.names.get("description")) ?? "");
      eq("meta[name=twitter:image]", one(h.names.get("twitter:image")), one(h.props.get("og:image")) ?? "");
      eq("meta[name=twitter:image:alt]", one(h.names.get("twitter:image:alt")), one(h.props.get("og:image:alt")) ?? "");
    }
  });

  check(`3 og:image: ${expectedAssetOrigin(env)}/<per-language file>, a 1200x630 PNG of at most 300 KB`, (fail) => {
    const origin = expectedAssetOrigin(env);
    const checkedFiles = new Map<string, string | undefined>();
    for (const p of shellPaths) {
      const h = parsed.get(p)!;
      const lang = localeOf(p);
      const image = one(h.props.get("og:image"));
      if (image === undefined) continue; // reported by check 1
      const expected = `${origin}${SHARE_IMAGE[lang].path}`;
      if (image !== expected) fail(p, "meta[property=og:image]", `expected ${expected}, got ${image}`);
      const path = pathnameOf(image);
      if (!path || !exists(path)) {
        fail(p, "meta[property=og:image]", `${image} has no file in dist/`);
        continue;
      }
      if (originOf(image) !== origin) fail(p, "meta[property=og:image]", `origin ${originOf(image)}, the build context demands ${origin}`);
      if (!checkedFiles.has(path)) {
        const png = readPng(join(distDir, path.slice(1)));
        let problem: string | undefined;
        if (typeof png === "string") problem = png;
        else if (png.width !== 1200 || png.height !== 630) problem = `${png.width}x${png.height}, expected 1200x630`;
        else if (png.bytes > MAX_IMAGE_BYTES) problem = `${png.bytes} bytes, over the 300 KB limit (${MAX_IMAGE_BYTES})`;
        else if (![2, 3, 6].includes(png.colorType)) problem = `unexpected PNG colour type ${png.colorType}`;
        checkedFiles.set(path, problem);
        if (typeof png !== "string") out(`     ${path}: ${png.width}x${png.height}, ${png.bytes} bytes`);
      }
      const problem = checkedFiles.get(path);
      if (problem) fail(p, `meta[property=og:image] -> ${path}`, problem);
      const eq = (what: string, actual: string | undefined, want: string) => {
        if (actual !== undefined && actual !== want) fail(p, what, `expected "${want}", got "${actual}"`);
      };
      eq("meta[property=og:image:width]", one(h.props.get("og:image:width")), "1200");
      eq("meta[property=og:image:height]", one(h.props.get("og:image:height")), "630");
      eq("meta[property=og:image:type]", one(h.props.get("og:image:type")), "image/png");
      eq("meta[property=og:image:alt]", one(h.props.get("og:image:alt")), SHARE_IMAGE[lang].alt);
    }
  });

  check("4 brand spelling: no head string says VentureLabs; titles end in the brand", (fail) => {
    const scan = (where: string, what: string, value: string | undefined) => {
      if (value && value.includes(OLD_BRAND)) fail(where, what, `contains "${OLD_BRAND}": ${value}`);
    };
    for (const p of shellPaths) {
      const h = parsed.get(p)!;
      for (const t of h.title) scan(p, "<title>", t);
      for (const [name, values] of h.names) {
        for (const v of values) scan(p, `meta[name=${name}]`, v);
      }
      for (const [prop, values] of h.props) {
        for (const v of values) scan(p, `meta[property=${prop}]`, v);
      }
      for (const ld of h.ld) scan(p, "script[type=application/ld+json]", ld);
      const title = h.title[0] ?? "";
      if (isHome(p)) {
        if (title !== HOME_TITLE[localeOf(p)]) fail(p, "<title>", `expected "${HOME_TITLE[localeOf(p)]}", got "${title}"`);
      } else if (BRAND_INSIDE_TITLE.has(p)) {
        if (!title.includes(BRAND)) fail(p, "<title>", `does not contain "${BRAND}": ${title}`);
      } else if (!title.endsWith(` – ${BRAND}`)) {
        fail(p, "<title>", `does not end with " – ${BRAND}": ${title}`);
      }
    }
    if (exists("site.webmanifest")) scan("/site.webmanifest", "content", read("site.webmanifest"));
  });

  check("5 no two routes share a title or a description (within or across locales)", (fail) => {
    for (const [what, get] of [
      ["<title>", (h: HeadTags) => h.title[0]],
      ["meta[name=description]", (h: HeadTags) => one(h.names.get("description"))],
    ] as const) {
      const seen = new Map<string, string>();
      for (const p of shellPaths) {
        const v = get(parsed.get(p)!)?.trim();
        if (!v) continue; // reported by check 1
        const first = seen.get(v);
        if (first) fail(p, what, `identical to ${first}: "${v}"`);
        else seen.set(v, p);
      }
    }
  });

  // ---- (e) icons and manifest -------------------------------------------------
  check("6 icons and manifest: files exist with the right structure and size", (fail) => {
    const sizedPng = (rel: string, size: number) => {
      if (!exists(rel)) return fail(`/${rel}`, "file", "missing in dist/");
      const png = readPng(join(distDir, rel));
      if (typeof png === "string") return fail(`/${rel}`, "file", png);
      if (png.width !== size || png.height !== size) fail(`/${rel}`, "size", `${png.width}x${png.height}, expected ${size}x${size}`);
    };
    sizedPng("favicon-32x32.png", 32);
    sizedPng("apple-touch-icon.png", 180);
    sizedPng("icon-192.png", 192);
    sizedPng("icon-512.png", 512);
    if (!exists("favicon.svg")) fail("/favicon.svg", "file", "missing in dist/");
    else if (!read("favicon.svg").trimStart().startsWith("<svg")) fail("/favicon.svg", "file", "does not start with <svg");
    if (!exists("favicon.ico")) fail("/favicon.ico", "file", "missing in dist/");
    else {
      const problem = icoProblem(join(distDir, "favicon.ico"));
      if (problem) fail("/favicon.ico", "file", `invalid ICO: ${problem}`);
    }

    // every icon/manifest href of every route (and of the root) resolves to a dist/ file
    for (const [p, h] of [...parsed, ["/", rootHead] as [string, HeadTags]]) {
      for (const a of h.links) {
        if (!["icon", "apple-touch-icon", "manifest"].includes(a.rel ?? "")) continue;
        if (a.href && !exists(a.href)) fail(p, `link[rel=${a.rel}][href=${a.href}]`, "no such file in dist/");
      }
    }

    if (!exists("site.webmanifest")) return fail("/site.webmanifest", "file", "missing in dist/");
    let manifest: any;
    try {
      manifest = JSON.parse(read("site.webmanifest"));
    } catch (err) {
      return fail("/site.webmanifest", "JSON", `does not parse: ${err instanceof Error ? err.message : err}`);
    }
    const eq = (key: string, want: unknown) => {
      if (manifest[key] !== want) fail("/site.webmanifest", key, `expected ${JSON.stringify(want)}, got ${JSON.stringify(manifest[key])}`);
    };
    eq("name", BRAND);
    eq("short_name", BRAND);
    eq("start_url", "/de/");
    eq("display", "browser");
    eq("theme_color", THEME_COLOR);
    eq("background_color", THEME_COLOR);
    const icons: any[] = Array.isArray(manifest.icons) ? manifest.icons : [];
    const want = [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ];
    if (icons.length !== 2 || want.some((w, i) => icons[i]?.src !== w.src || icons[i]?.sizes !== w.sizes || icons[i]?.type !== w.type)) {
      fail("/site.webmanifest", "icons", `expected exactly ${JSON.stringify(want)}, got ${JSON.stringify(manifest.icons)}`);
    }
  });

  // ---- (f) JSON-LD -------------------------------------------------------------
  const footerLabels: Record<Locale, Record<string, string>> = { de: {}, en: {} };
  for (const l of LOCALES) {
    footerLabels[l] = JSON.parse(readFileSync(resolve(repoRoot, `src/locales/${l}.json`), "utf-8")).footer ?? {};
  }

  function ldProblems(path: string, h: HeadTags, fail: (w: string, t: string, m: string) => void): void {
    const tag = "script[type=application/ld+json]";
    const raw = one(h.ld);
    if (raw === undefined) return; // reported by check 1
    let doc: any;
    try {
      doc = JSON.parse(raw);
    } catch (err) {
      return fail(path, tag, `does not parse: ${err instanceof Error ? err.message : err}`);
    }
    if (doc["@context"] !== "https://schema.org") fail(path, tag, `@context is ${JSON.stringify(doc["@context"])}`);
    const graph: any[] = Array.isArray(doc["@graph"]) ? doc["@graph"] : [];
    const ofType = (t: string) => graph.filter((n) => n?.["@type"] === t);
    const lang = localeOf(path);
    const canonical = canonicalOf(path);

    // every string URL absolute on the production origin; nothing forbidden
    const walk = (v: unknown, key: string): void => {
      if (Array.isArray(v)) return v.forEach((x) => walk(x, key));
      if (v && typeof v === "object") {
        for (const [k, x] of Object.entries(v)) {
          if (FORBIDDEN_LD_KEYS.includes(k)) fail(path, tag, `contains the forbidden key "${k}"`);
          walk(x, k);
        }
        return;
      }
      if (typeof v !== "string") return;
      if (FORBIDDEN_LD_KEYS.includes(v)) fail(path, tag, `contains the forbidden value "${v}"`);
      if (key === "@context") return;
      if (/^(url|item|logo|@id|sameAs)$/.test(key) || /^https?:/.test(v)) {
        if (!v.startsWith(`${SITE_ORIGIN}/`)) fail(path, tag, `${key} is not an absolute https URL on ${SITE_ORIGIN}: ${v}`);
      }
    };
    walk(doc, "");

    const expectedHome = isHome(path);
    const service = ofType("Service");
    const isServiceRoute = /^\/(?:de|en)\/leistungen(?:\/[^/]+)?$/.test(path);
    if (expectedHome) {
      const org = ofType("Organization");
      const site = ofType("WebSite");
      if (org.length !== 1) fail(path, tag, `${org.length} Organization nodes, expected 1`);
      if (site.length !== 1) fail(path, tag, `${site.length} WebSite nodes, expected 1`);
      if (ofType("BreadcrumbList").length !== 0) fail(path, tag, "a home route must not carry a BreadcrumbList");
      const o = org[0];
      if (o) {
        const eq = (k: string, v: unknown) => o[k] !== v && fail(path, tag, `Organization.${k} is ${JSON.stringify(o[k])}, expected ${JSON.stringify(v)}`);
        eq("@id", `${SITE_ORIGIN}/#organization`);
        eq("name", "Venture Labs GmbH");
        eq("url", `${SITE_ORIGIN}/`);
        eq("logo", `${SITE_ORIGIN}/icon-512.png`);
        const a = o.address ?? {};
        for (const [k, v] of Object.entries({
          "@type": "PostalAddress",
          streetAddress: "Breite Str. 27",
          postalCode: "40213",
          addressLocality: "Düsseldorf",
          addressCountry: "DE",
        })) {
          if (a[k] !== v) fail(path, tag, `Organization.address.${k} is ${JSON.stringify(a[k])}, expected ${JSON.stringify(v)}`);
        }
      }
      const s = site[0];
      if (s) {
        const eq = (k: string, v: unknown) => s[k] !== v && fail(path, tag, `WebSite.${k} is ${JSON.stringify(s[k])}, expected ${JSON.stringify(v)}`);
        eq("@id", `${SITE_ORIGIN}/#website`);
        eq("name", BRAND);
        eq("url", `${SITE_ORIGIN}/`);
        eq("inLanguage", lang);
        if (s.publisher?.["@id"] !== `${SITE_ORIGIN}/#organization`) fail(path, tag, "WebSite.publisher does not reference the Organization @id");
      }
    } else {
      const crumbs = ofType("BreadcrumbList");
      if (crumbs.length !== 1) fail(path, tag, `${crumbs.length} BreadcrumbList nodes, expected 1`);
      if (ofType("Organization").length + ofType("WebSite").length !== 0) fail(path, tag, "only home routes carry Organization/WebSite");
      const items: any[] = Array.isArray(crumbs[0]?.itemListElement) ? crumbs[0].itemListElement : [];
      if (crumbs[0] && items.length < 2) fail(path, tag, "BreadcrumbList has fewer than 2 items");
      items.forEach((it, i) => {
        if (it.position !== i + 1) fail(path, tag, `item ${i + 1} has position ${it.position}`);
        if (typeof it.name !== "string" || it.name.trim() === "") fail(path, tag, `item ${i + 1} has no name`);
        if (typeof it.item !== "string" || !it.item.startsWith(`${SITE_ORIGIN}/`) || !it.item.endsWith("/")) {
          fail(path, tag, `item ${i + 1} URL is not an absolute trailing-slash canonical: ${it.item}`);
        }
      });
      if (items.length >= 2) {
        if (items[0].name !== BRAND) fail(path, tag, `first item is "${items[0].name}", expected "${BRAND}"`);
        const section = path.split("/")[2];
        const label = footerLabels[lang][FOOTER_KEY_BY_SECTION[section] ?? ""];
        if (!label) fail(path, tag, `no footer label known for section "${section}"`);
        else if (items[1].name !== label) fail(path, tag, `section item is "${items[1].name}", expected the footer label "${label}"`);
        if (items[items.length - 1].item !== canonical) {
          fail(path, tag, `last item URL is ${items[items.length - 1].item}, expected the page's canonical ${canonical}`);
        }
        const isDetail = path.split("/").length === 4;
        // The last label is the content `title` field, the <title> is an authored head string
        // (seoTitle), so the two are no longer tied by a prefix; the service routes' Service.name
        // check below still ties a service page's title to its name.
        if (items.length !== (isDetail ? 3 : 2)) fail(path, tag, `${items.length} items, expected ${isDetail ? 3 : 2}`);
      }
    }
    if (isServiceRoute) {
      if (service.length !== 1) fail(path, tag, `${service.length} Service nodes, expected 1`);
      const s = service[0];
      if (s) {
        const isDetail = path.split("/").length === 4;
        if (!isDetail && s.name !== "AI Pulse") fail(path, tag, `Service.name is "${s.name}", expected "AI Pulse"`);
        if (isDetail && !(h.title[0] ?? "").startsWith(s.name ?? " ")) fail(path, tag, `Service.name "${s.name}" is not the service title`);
        if (s.description !== one(h.names.get("description"))) fail(path, tag, "Service.description is not the route's description");
        if (s.url !== canonical) fail(path, tag, `Service.url is ${s.url}, expected ${canonical}`);
        if (s.provider?.["@type"] !== "Organization" || s.provider?.name !== "Venture Labs GmbH") fail(path, tag, "Service.provider is not Organization Venture Labs GmbH");
      }
    } else if (service.length !== 0) {
      fail(path, tag, "only the service routes carry a Service");
    }
  }

  check("7 JSON-LD: parses, the route kind's types, absolute URLs, no Offer/price/potentialAction", (fail) => {
    for (const p of shellPaths) ldProblems(p, parsed.get(p)!, fail);
  });

  // ---- (g) root and 404 -------------------------------------------------------
  const formsBeforeRoot = (html: string) => {
    const root = html.indexOf('<div id="root"');
    return ['<form name="contact"', '<form name="pulse-score-leads"'].every((f) => {
      const at = html.indexOf(f);
      return at !== -1 && root !== -1 && at < root;
    });
  };

  check("8 root shell: empty #root, the full set with the /de canonical and head set", (fail) => {
    const where = "/ (dist/index.html)";
    if (!rootHtml.includes('<div id="root"></div>')) fail(where, "#root", 'is not exactly <div id="root"></div>');
    checklist(where, rootHtml, rootHead, fail);
    const de = parsed.get("/de");
    if (!de) return fail(where, "/de", "no /de shell to compare against");
    const eq = (what: string, a: string | undefined, b: string | undefined) => a !== b && fail(where, what, `"${a}" differs from /de's "${b}"`);
    eq("link[rel=canonical]", rootHead.links.find((a) => a.rel === "canonical")?.href, canonicalOf("/de"));
    eq("meta[property=og:url]", one(rootHead.props.get("og:url")), canonicalOf("/de"));
    eq("<title>", rootHead.title[0], de.title[0]);
    eq("meta[name=description]", one(rootHead.names.get("description")), one(de.names.get("description")));
    eq("meta[property=og:image]", one(rootHead.props.get("og:image")), one(de.props.get("og:image")));
    eq("meta[name=robots]", one(rootHead.names.get("robots")), ROBOTS);
    eq("script[type=application/ld+json]", one(rootHead.ld), one(de.ld));
    const rootAlts = rootHead.links.filter((a) => a.rel === "alternate");
    if (fingerprint(rootAlts) !== fingerprint(expectedAlternates("/de"))) {
      fail(where, "link[rel=alternate]", `${fingerprint(rootAlts)} differs from /de's ${fingerprint(expectedAlternates("/de"))}`);
    }
    if (!/<html\b[^>]*\blang="de"/i.test(rootHtml)) fail(where, "<html lang>", 'is not "de"');
    ldProblems("/de", rootHead, (_w, t, m) => fail(where, t, m));
  });

  check("9 dist/404.html: noindex, empty #root, no canonical/hreflang/og:url/og:image/twitter/JSON-LD", (fail) => {
    const where = "/404.html";
    if (!exists("404.html")) return fail(where, "file", "missing in dist/");
    const html = read("404.html");
    const h = parseHead(html);
    if (!html.includes('<div id="root"></div>')) fail(where, "#root", 'is not exactly <div id="root"></div>');
    if (h.title.length !== 1 || h.title[0] !== `Seite nicht gefunden – ${BRAND}`) fail(where, "<title>", `is ${JSON.stringify(h.title)}`);
    if (one(h.names.get("robots")) !== "noindex") fail(where, "meta[name=robots]", `is ${JSON.stringify(h.names.get("robots"))}, expected "noindex"`);
    if (!one(h.names.get("description"))) fail(where, "meta[name=description]", "missing or empty");
    if (h.links.some((a) => a.rel === "canonical")) fail(where, "link[rel=canonical]", "must be absent");
    if (h.links.some((a) => a.rel === "alternate")) fail(where, "link[rel=alternate]", "must be absent");
    if (h.props.has("og:url")) fail(where, "meta[property=og:url]", "must be absent");
    if (h.props.has("og:image")) fail(where, "meta[property=og:image]", "must be absent");
    for (const n of h.names.keys()) if (n.startsWith("twitter:")) fail(where, `meta[name=${n}]`, "must be absent");
    if (h.ld.length > 0) fail(where, "script[type=application/ld+json]", "must be absent");
    if (html.includes(OLD_BRAND)) fail(where, "head", `contains "${OLD_BRAND}"`);
  });

  check("10 both Netlify forms sit before #root in every written shell", (fail) => {
    for (const [p, html] of [...shells, ["/ (dist/index.html)", rootHtml], ["/404.html", exists("404.html") ? read("404.html") : ""]]) {
      if (!formsBeforeRoot(html)) fail(p, "form[name=contact|pulse-score-leads]", "not both present before #root");
    }
  });

  check("11 _redirects: the two /ai-pulse 301s and the /404.html catch-all", (fail) => {
    if (!exists("_redirects")) return fail("/_redirects", "file", "missing in dist/");
    const rules = read("_redirects")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l !== "" && !l.startsWith("#"))
      .map((l) => l.split(/\s+/));
    for (const l of LOCALES) {
      const r = rules.find((x) => x[0] === `/${l}/ai-pulse`);
      if (!r || r[1] !== `/${l}/leistungen` || r[2] !== "301") fail("/_redirects", `/${l}/ai-pulse`, `expected "/${l}/ai-pulse /${l}/leistungen 301", got ${JSON.stringify(r)}`);
      else if (!shellPaths.includes(r[1])) fail("/_redirects", `/${l}/ai-pulse`, `target ${r[1]} is not a prerendered route`);
    }
    const catchAll = rules.filter((x) => x[0] === "/*");
    if (catchAll.length !== 1 || catchAll[0][1] !== "/404.html" || catchAll[0][2] !== "404") {
      fail("/_redirects", "/*", `expected exactly one catch-all "/* /404.html 404", got ${JSON.stringify(catchAll)}`);
    }
    if (rules.length !== 3) fail("/_redirects", "rules", `expected 3 rules, got ${rules.length}`);
  });

  // ---- (h) carried over from the retired check-seo.ts -------------------------
  check("12 robots.txt: allow-all with the absolute Sitemap line", (fail) => {
    if (!exists("robots.txt")) return fail("/robots.txt", "file", "missing in dist/");
    const txt = read("robots.txt");
    if (!/^\s*User-agent:\s*\*\s*$/m.test(txt)) fail("/robots.txt", "User-agent", "no `User-agent: *` line");
    if (!/^\s*Allow:\s*\/\s*$/m.test(txt)) fail("/robots.txt", "Allow", "no `Allow: /` line");
    if (!txt.split(/\r?\n/).some((l) => l.trim() === `Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) fail("/robots.txt", "Sitemap", `no line "Sitemap: ${SITE_ORIGIN}/sitemap.xml"`);
    if (txt.split(/\r?\n/).some((l) => /^\s*Disallow:\s*\S/.test(l))) fail("/robots.txt", "Disallow", "a non-empty Disallow");
  });

  interface SitemapUrl {
    loc: string;
    lastmods: string[];
    alternates: { hreflang: string; href: string }[];
  }
  const sitemapXml = exists("sitemap.xml") ? read("sitemap.xml") : "";
  const sitemap: SitemapUrl[] = (sitemapXml.match(/<url>[\s\S]*?<\/url>/g) ?? []).map((raw) => ({
    loc: (raw.match(/<loc>([\s\S]*?)<\/loc>/) ?? [])[1] ?? "",
    lastmods: [...raw.matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/g)].map((m) => m[1]),
    alternates: [...raw.matchAll(/<xhtml:link\b([^>]*)\/?>/g)].map((m) => {
      const a = parseAttrs(m[1]);
      return { hreflang: a.hreflang ?? "", href: a.href ?? "" };
    }),
  }));

  check("13 sitemap.xml: well-formed urlset, same set as the shells (root excluded), one lastmod each", (fail) => {
    if (!sitemapXml.trim()) return fail("/sitemap.xml", "file", "missing or empty");
    const root = sitemapXml.match(/<urlset\b([^>]*)>/);
    if (!root) return fail("/sitemap.xml", "<urlset>", "root element is not <urlset>");
    if (!root[1].includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) fail("/sitemap.xml", "<urlset>", "no sitemap 0.9 namespace");
    if (!root[1].includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) fail("/sitemap.xml", "<urlset>", "no xhtml namespace");
    if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(sitemapXml)) fail("/sitemap.xml", "escaping", "a raw & in the sitemap");

    const expected = shellPaths.map(canonicalOf).sort();
    const actual = sitemap.map((u) => u.loc).sort();
    for (const u of expected) if (!actual.includes(u)) fail("/sitemap.xml", "<loc>", `no entry for the shell ${u}`);
    for (const u of actual) if (!expected.includes(u)) fail("/sitemap.xml", "<loc>", `${u} has no shell`);
    actual.forEach((u, i) => i > 0 && u === actual[i - 1] && fail("/sitemap.xml", "<loc>", `duplicate ${u}`));
    if (actual.includes(`${SITE_ORIGIN}/`)) fail("/sitemap.xml", "<loc>", "the root must not be in the sitemap");

    for (const u of sitemap) {
      if (u.lastmods.length !== 1) fail(u.loc, "<lastmod>", `${u.lastmods.length} lastmod values, expected 1`);
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(u.lastmods[0]) || Number.isNaN(Date.parse(u.lastmods[0]))) fail(u.loc, "<lastmod>", `bad value "${u.lastmods[0]}"`);
      const urls = [u.loc, ...u.alternates.map((a) => a.href)];
      for (const url of urls) {
        if (!url.startsWith(`${SITE_ORIGIN}/`) || !url.endsWith("/") || /\/\/$|\s/.test(url.slice(SITE_ORIGIN.length))) {
          fail(u.loc, "<loc>/href", `not an absolute trailing-slash URL on ${SITE_ORIGIN}: ${url}`);
        }
      }
    }
  });

  check("14 sitemap alternates and shell hreflang links agree with the expected set", (fail) => {
    for (const p of shellPaths) {
      const entry = sitemap.find((u) => u.loc === canonicalOf(p));
      if (!entry) continue; // reported by check 13
      const want = expectedAlternates(p);
      if (fingerprint(entry.alternates) !== fingerprint(want)) {
        fail(p, "sitemap xhtml:link", `expected ${fingerprint(want)}, got ${fingerprint(entry.alternates)}`);
      }
      const inShell = parsed.get(p)!.links.filter((a) => a.rel === "alternate");
      if (fingerprint(inShell) !== fingerprint(entry.alternates)) {
        fail(p, "link[rel=alternate]", `shell ${fingerprint(inShell)} differs from the sitemap ${fingerprint(entry.alternates)}`);
      }
    }
  });

  // ---- (i) the length rule and its table -----------------------------------------
  check(
    `15 title ${TITLE_LENGTH.min}-${TITLE_LENGTH.max} and description ${DESCRIPTION_LENGTH.min}-${DESCRIPTION_LENGTH.max} characters on every route`,
    (fail) => {
      for (const p of shellPaths) {
        const h = parsed.get(p)!;
        const title = h.title[0];
        const description = one(h.names.get("description"));
        // a missing or duplicated tag is reported by check 1
        const tt = title === undefined ? undefined : lengthProblem("title", title);
        if (tt) fail(p, "title", tt);
        const dp = description === undefined ? undefined : lengthProblem("description", description);
        if (dp) fail(p, "description", dp);
      }
    }
  );
  out("");
  out("route                                              title  description");
  for (const p of shellPaths) {
    const h = parsed.get(p)!;
    out(`${p.padEnd(50)} ${String(headLength(h.title[0] ?? "")).padStart(5)}  ${String(headLength(one(h.names.get("description")) ?? "")).padStart(11)}`);
  }

  return { passed, failures, report };
}

// ------------------------------------------------------------------ CLI entry

const isMainModule = !!process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  const distDir = resolve(repoRoot, "dist");
  if (!existsSync(join(distDir, "index.html"))) {
    console.error("check-meta: no dist/index.html - run pnpm build first");
    process.exit(2);
  }
  const { passed, failures, report } = runChecks(distDir);
  for (const line of report) console.log(line);
  console.log("");
  console.log(`check-meta: ${passed.length} checks passed, ${failures.length} failure(s)`);
  if (failures.length > 0) process.exit(1);
}
