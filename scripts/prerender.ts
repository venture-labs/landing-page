/**
 * Post-build step: writes a static HTML file per route (every locale x path,
 * including every service/case/blog slug) with a correct <title> and
 * <meta description> baked in, instead of every route serving the same
 * generic shell.
 *
 * Each route's <body> also carries its fully rendered content: the SSR
 * bundle built by `vite build --ssr src/entry-server.tsx --outDir dist/server`
 * (a build step before this script, see package.json) is imported once and
 * its renderApp(path) is awaited per route, sequentially — never
 * Promise.all, so the one shared i18next instance's language (set inside
 * renderApp before each render) is always correct for the page currently
 * rendering. The returned HTML replaces the empty `<div id="root"></div>`
 * shell, leaving everything else in <body> (the two hidden Netlify forms)
 * untouched. The client (src/main.tsx) hydrates this same markup.
 *
 * Netlify serves a directory's index.html for both "/foo" and "/foo/", so
 * writing dist/<lang>/<route>/index.html is enough to make it the response
 * for the matching app route.
 *
 * The same route list is reused to emit dist/sitemap.xml and to inject a
 * self-referencing <link rel="canonical"> plus the de/en/x-default hreflang
 * alternates into every route shell. dist/index.html (the SPA fallback for
 * unmatched URLs) is deliberately left untouched: #root stays empty there,
 * so the client falls back to a fresh client-side mount (createRoot) for any
 * path with no prerendered file, 404 included, and the file carries no
 * canonical.
 */
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { execFileSync } from "child_process";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

import { findMissingPlacementCallSites } from "./check-placements";

import { siteData as siteDe } from "../src/data/de/site";
import { leistungenData as leistungenDe } from "../src/data/de/leistungen";
import { aboutData as aboutDe } from "../src/data/de/about";
import { services as servicesDe } from "../src/data/de/services";
import { serviceDetails as serviceDetailsDe } from "../src/data/de/serviceDetails";
import { caseDetailsMap as caseDetailsDe } from "../src/data/de/caseDetails";
import { blogPosts as blogPostsDe } from "../src/data/de/blog";

import { siteData as siteEn } from "../src/data/en/site";
import { leistungenData as leistungenEn } from "../src/data/en/leistungen";
import { aboutData as aboutEn } from "../src/data/en/about";
import { services as servicesEn } from "../src/data/en/services";
import { serviceDetails as serviceDetailsEn } from "../src/data/en/serviceDetails";
import { caseDetailsMap as caseDetailsEn } from "../src/data/en/caseDetails";
import { blogPosts as blogPostsEn } from "../src/data/en/blog";

import deUi from "../src/locales/de.json";
import enUi from "../src/locales/en.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const distDir = resolve(repoRoot, "dist");

const LOCALES = ["de", "en"] as const;
type Locale = (typeof LOCALES)[number];

const DEFAULT_LOCALE: Locale = "de";

const OG_LOCALE: Record<Locale, string> = { de: "de_DE", en: "en_US" };

/** The one canonical origin. Every absolute URL this script emits starts here. */
const SITE_ORIGIN = "https://venturelabs.team";

/**
 * Netlify serves this site in the trailing-slash form: on 2026-09-08
 * `curl -sI https://venturelabs.team/de/leistungen` answered
 * `301 Moved Permanently` with `Location: /de/leistungen/`, and the slash form
 * answered 200 (same for `/de`). Canonicals, hreflang hrefs and sitemap <loc>
 * values therefore all carry the trailing slash.
 */
const TRAILING_SLASH = true;

/** Absolute, canonical-form URL for an app route path such as "/de/leistungen". */
function absoluteUrl(path: string): string {
  const clean = `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  return `${SITE_ORIGIN}${clean}${TRAILING_SLASH ? "/" : ""}`;
}

/** Build date, used as the <lastmod> fallback. */
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const lastmodCache = new Map<string, string>();

/**
 * Last commit date (YYYY-MM-DD) of a content file, or the build date when git
 * has no answer — a shallow clone, an untracked file or no git binary at all
 * must never fail the build.
 */
function lastmodFor(sourceFile?: string): string {
  if (!sourceFile) return BUILD_DATE;

  const cached = lastmodCache.get(sourceFile);
  if (cached) return cached;

  let date = BUILD_DATE;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", sourceFile], {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) date = out;
  } catch {
    date = BUILD_DATE;
  }

  lastmodCache.set(sourceFile, date);
  return date;
}

/** Path of the markdown file a page's content comes from ("x.md" = de, "x.en.md" = en). */
function contentFile(lang: Locale, rel: string): string {
  return `content/${rel}${lang === DEFAULT_LOCALE ? "" : ".en"}.md`;
}

const byLocale = {
  de: {
    site: siteDe,
    leistungen: leistungenDe,
    about: aboutDe,
    services: servicesDe,
    serviceDetails: serviceDetailsDe,
    caseDetails: caseDetailsDe,
    blogPosts: blogPostsDe,
    ui: deUi as any,
  },
  en: {
    site: siteEn,
    leistungen: leistungenEn,
    about: aboutEn,
    services: servicesEn,
    serviceDetails: serviceDetailsEn,
    caseDetails: caseDetailsEn,
    blogPosts: blogPostsEn,
    ui: enUi as any,
  },
};

/** Branded 1200x630 default share image, used by every route with no own hero/case image. */
const DEFAULT_OG_IMAGE = "/og/default.png";

export interface PageMeta {
  path: string; // e.g. "/de/leistungen/development"
  lang: Locale;
  title: string;
  description: string;
  image?: string; // og:image path, relative to SITE_ORIGIN; defaults to DEFAULT_OG_IMAGE
  sourceFile?: string; // markdown file backing the page, for <lastmod>
}

export interface Alternate {
  hreflang: string;
  href: string;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildPagesForLocale(lang: Locale): PageMeta[] {
  const { site, leistungen, about, services, serviceDetails, caseDetails, blogPosts, ui } =
    byLocale[lang];
  const suffix = " – VentureLabs";
  const pages: PageMeta[] = [];

  pages.push({
    path: `/${lang}`,
    lang,
    // seoTitle is optional frontmatter (content/site/home.md / home.en.md); fall
    // back to the pre-existing title expression when it's absent or blank so an
    // editor omitting it never ships an empty <title>/og:title.
    title: site.seoTitle?.trim() ? site.seoTitle : `VentureLabs – ${site.heroHeadline}`,
    description: site.heroSubline,
    sourceFile: contentFile(lang, "site/home"),
  });

  pages.push({
    path: `/${lang}/leistungen`,
    lang,
    title: `${leistungen.heroTitlePrefix} ${leistungen.heroTitleHighlight}${suffix}`,
    description: leistungen.heroSubheading,
    sourceFile: contentFile(lang, "site/leistungen"),
  });

  for (const s of services) {
    const detail = serviceDetails.find((d) => d.slug === s.slug);
    pages.push({
      path: `/${lang}/leistungen/${s.slug}`,
      lang,
      title: `${s.title} – ${leistungen.heroEyebrow}${suffix}`,
      description: s.description,
      image: detail?.heroImage,
      sourceFile: contentFile(lang, `services/${s.slug}`),
    });
  }

  pages.push({
    path: `/${lang}/cases`,
    lang,
    title: `${ui.cases.heroTitle}${suffix}`,
    description: ui.cases.heroSubheading,
  });

  for (const slug of Object.keys(caseDetails)) {
    const c = caseDetails[slug];
    pages.push({
      path: `/${lang}/cases/${slug}`,
      lang,
      title: `${c.title}${suffix}`,
      description: c.description || c.heroSubline,
      image: c.heroImage,
      sourceFile: contentFile(lang, `cases/${slug}`),
    });
  }

  pages.push({
    path: `/${lang}/kontakt`,
    lang,
    title: `${ui.kontakt.heroTitle}${suffix}`,
    description: ui.kontakt.heroSubtitle,
  });

  pages.push({
    path: `/${lang}/blog`,
    lang,
    title: ui.blog.seoTitle,
    description: ui.blog.heroSubtitle,
  });

  for (const p of blogPosts) {
    pages.push({
      path: `/${lang}/blog/${p.slug}`,
      lang,
      title: `${p.title}${suffix}`,
      description: p.excerpt,
      sourceFile: contentFile(lang, `blog/${p.slug}`),
    });
  }

  pages.push({
    path: `/${lang}/ueber-uns`,
    lang,
    title: `${about.heroTitle}${suffix}`,
    description: about.heroSubheading,
    sourceFile: contentFile(lang, "about/about"),
  });

  pages.push({
    path: `/${lang}/impressum`,
    lang,
    title: `${lang === "de" ? "Impressum" : "Imprint"}${suffix}`,
    description:
      lang === "de"
        ? "Impressum der Venture Labs GmbH."
        : "Legal notice (Impressum) for Venture Labs GmbH.",
  });

  pages.push({
    path: `/${lang}/datenschutz`,
    lang,
    title: `${lang === "de" ? "Datenschutzerklärung" : "Privacy Policy"}${suffix}`,
    description:
      lang === "de"
        ? "Datenschutzerklärung für venturelabs.team."
        : "Privacy policy for venturelabs.team.",
  });

  return pages;
}

/**
 * Key that identifies a page across locales: the route path with its locale
 * segment stripped ("/de/leistungen/ai-experience" -> "/leistungen/ai-experience").
 */
function localeAgnosticKey(path: string): string {
  const stripped = path.replace(/^\/(?:de|en)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

/**
 * hreflang alternates for one page group: one entry per locale the page exists
 * in (including the self-reference), plus x-default pointing at the German URL
 * — or at the only existing locale if the page has no German twin.
 */
function alternatesFor(group: Map<Locale, string>): Alternate[] {
  const alternates: Alternate[] = [];
  for (const lang of LOCALES) {
    const path = group.get(lang);
    if (path) alternates.push({ hreflang: lang, href: absoluteUrl(path) });
  }

  const defaultPath = group.get(DEFAULT_LOCALE) ?? [...group.values()][0];
  alternates.push({ hreflang: "x-default", href: absoluteUrl(defaultPath) });

  return alternates;
}

export function renderHtml(shell: string, page: PageMeta, alternates: Alternate[], bodyHtml: string): string {
  const title = escapeText(page.title);
  const description = escapeAttr(page.description);

  const imagePath = page.image ?? DEFAULT_OG_IMAGE;
  const imageUrl = `${SITE_ORIGIN}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;

  const headLinks = [
    `    <link rel="canonical" href="${escapeAttr(absoluteUrl(page.path))}" />`,
    ...alternates.map(
      (a) => `    <link rel="alternate" hreflang="${escapeAttr(a.hreflang)}" href="${escapeAttr(a.href)}" />`
    ),
    `    <meta property="og:url" content="${escapeAttr(absoluteUrl(page.path))}" />`,
    `    <meta property="og:image" content="${escapeAttr(imageUrl)}" />`,
  ].join("\n");

  // Injected before the first </head>; index.html itself is never modified, so
  // the SPA fallback shell keeps no canonical.
  const withHead = shell.replace(/[ \t]*<\/head>/, () => `${headLinks}\n  </head>`);

  // A replacement callback (not a replacement string) returns bodyHtml
  // verbatim: String.replace's string form treats "$$", "$&", "$1" etc. in
  // the replacement as special patterns, so rendered editorial copy that
  // happens to contain a literal "$$" would otherwise be silently collapsed
  // to "$" in the written HTML.
  const withBody = withHead.replace(
    '<div id="root"></div>',
    () => `<div id="root">${bodyHtml}</div>`
  );

  return withBody
    .replace(/<html lang="[^"]*"/, `<html lang="${page.lang}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${description}" />`
    )
    .replace(/<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${OG_LOCALE[page.lang]}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`)
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${description}" />`
    );
}

function renderSitemap(pages: PageMeta[], alternatesByPath: Map<string, Alternate[]>): string {
  const entries = pages.map((page) => {
    const links = (alternatesByPath.get(page.path) ?? [])
      .map(
        (a) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeAttr(a.hreflang)}" href="${escapeAttr(a.href)}"/>`
      )
      .join("\n");

    return [
      "  <url>",
      `    <loc>${escapeText(absoluteUrl(page.path))}</loc>`,
      `    <lastmod>${lastmodFor(page.sourceFile)}</lastmod>`,
      links,
      "  </url>",
    ]
      .filter((line) => line !== "")
      .join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

/**
 * Build guard: a route whose written HTML has an empty `#root` or no `<h1`
 * inside it means the body render silently failed (or regressed) for that
 * route. Fails the build (non-zero exit) and names every offending route,
 * instead of letting the SPA shell ship unnoticed again.
 */
function findEmptyBodyRoutes(writtenFiles: Map<string, string>): string[] {
  const offending: string[] = [];
  for (const [path, html] of writtenFiles) {
    // #root is the body's last element (the two hidden forms come before
    // it, nothing comes after) — greedy up to the final "</div>" right
    // before "</body>" captures exactly #root's own content, however many
    // nested <div>s it contains.
    const rootMatch = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/);
    const rootContent = rootMatch ? rootMatch[1] : "";
    const hasH1 = /<h1[\s>]/.test(rootContent);
    const isEmpty = rootContent.trim().length === 0;
    if (isEmpty || !hasH1) offending.push(path);
  }
  return offending;
}

/**
 * 20261017-tracking-every-booking-contact-button-identifiab, Reviewer finding
 * 1: `pnpm build` is `generate-content.ts && vite build && prerender.ts`
 * (package.json stays untouched per the spec), so this is the one script in
 * that chain where "a booking CTA without a placement id fails the build"
 * can actually be true — scripts/check-analytics.ts's own criterion 15 is
 * only ever run separately via `pnpm check:analytics`.
 */
function assertPlacementIds(): void {
  const offenders = findMissingPlacementCallSites(resolve(repoRoot, "src"));
  if (offenders.length > 0) {
    console.error(
      `prerender: ${offenders.length} call site(s) fire EVENTS.callLinkClicked without a Plausible placement argument:\n` +
        offenders.map((f) => `  - ${relative(repoRoot, f)}`).join("\n")
    );
    process.exit(1);
  }
}

async function main() {
  assertPlacementIds();

  const shell = readFileSync(resolve(distDir, "index.html"), "utf-8");

  const allPages: PageMeta[] = [];
  for (const lang of LOCALES) {
    allPages.push(...buildPagesForLocale(lang));
  }

  // Group the de/en twins of one page, then resolve each page's alternates once.
  const groups = new Map<string, Map<Locale, string>>();
  for (const page of allPages) {
    const key = localeAgnosticKey(page.path);
    const group = groups.get(key) ?? new Map<Locale, string>();
    group.set(page.lang, page.path);
    groups.set(key, group);
  }

  const alternatesByPath = new Map<string, Alternate[]>();
  for (const page of allPages) {
    alternatesByPath.set(page.path, alternatesFor(groups.get(localeAgnosticKey(page.path))!));
  }

  // The SSR bundle built by `vite build --ssr src/entry-server.tsx --outDir
  // dist/server` (package.json's build script, before this script runs).
  const serverEntryUrl = pathToFileURL(resolve(distDir, "server/entry-server.js")).href;
  const { renderApp } = (await import(serverEntryUrl)) as {
    renderApp: (path: string) => Promise<string>;
  };

  const writtenFiles = new Map<string, string>();

  let count = 0;
  for (const page of allPages) {
    // Rendered one page at a time (never Promise.all): renderApp mutates the
    // one shared i18next instance's language before each render, so a
    // parallel render would race between routes of different locales.
    const bodyHtml = await renderApp(page.path);
    const html = renderHtml(shell, page, alternatesByPath.get(page.path)!, bodyHtml);

    const outDir = resolve(distDir, page.path.replace(/^\//, ""));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html);
    writtenFiles.set(page.path, html);
    count++;
  }

  writeFileSync(resolve(distDir, "sitemap.xml"), renderSitemap(allPages, alternatesByPath));

  console.log(`prerender: wrote ${count} route-specific HTML shells`);
  console.log(`prerender: wrote sitemap.xml with ${allPages.length} urls`);

  const offending = findEmptyBodyRoutes(writtenFiles);
  if (offending.length > 0) {
    console.error(
      `prerender: build guard failed — ${offending.length} route(s) have an empty #root or no <h1>:\n` +
        offending.map((p) => `  - ${p}`).join("\n")
    );
    process.exit(1);
  }
}

// Only auto-run the build when this file is the entry point tsx actually
// invokes ("tsx scripts/prerender.ts") — not when a test imports renderHtml
// (or any other export) directly, which would otherwise re-run the whole
// prerender pipeline (reading dist/index.html, exiting the process) as a
// side effect of the import.
const isMainModule =
  !!process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  main().catch((err) => {
    console.error("prerender: failed with an uncaught error:", err);
    process.exit(1);
  });
}
