/**
 * Post-build step: writes a static HTML file per route (every locale x path,
 * including every service/case/blog slug) with a correct <title> and
 * <meta description> baked in, instead of every route serving the same
 * generic shell.
 *
 * This does not prerender page content — the SPA still mounts into #root
 * exactly as before, from the same built JS bundle. It only replaces the
 * <head> tags a crawler or link-preview bot sees before any JS runs.
 * Netlify serves a directory's index.html for both "/foo" and "/foo/", so
 * writing dist/<lang>/<route>/index.html is enough to make it the response
 * for the matching app route.
 *
 * The same route list is reused to emit dist/sitemap.xml and to inject a
 * self-referencing <link rel="canonical"> plus the de/en/x-default hreflang
 * alternates into every route shell. dist/index.html (the SPA fallback for
 * unmatched URLs) is deliberately left untouched, so it carries no canonical.
 */
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { execFileSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { siteData as siteDe } from "../src/data/de/site";
import { leistungenData as leistungenDe } from "../src/data/de/leistungen";
import { aboutData as aboutDe } from "../src/data/de/about";
import { services as servicesDe } from "../src/data/de/services";
import { caseDetailsMap as caseDetailsDe } from "../src/data/de/caseDetails";
import { blogPosts as blogPostsDe } from "../src/data/de/blog";

import { siteData as siteEn } from "../src/data/en/site";
import { leistungenData as leistungenEn } from "../src/data/en/leistungen";
import { aboutData as aboutEn } from "../src/data/en/about";
import { services as servicesEn } from "../src/data/en/services";
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
    caseDetails: caseDetailsDe,
    blogPosts: blogPostsDe,
    ui: deUi as any,
  },
  en: {
    site: siteEn,
    leistungen: leistungenEn,
    about: aboutEn,
    services: servicesEn,
    caseDetails: caseDetailsEn,
    blogPosts: blogPostsEn,
    ui: enUi as any,
  },
};

interface PageMeta {
  path: string; // e.g. "/de/leistungen/development"
  lang: Locale;
  title: string;
  description: string;
  sourceFile?: string; // markdown file backing the page, for <lastmod>
}

interface Alternate {
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
  const { site, leistungen, about, services, caseDetails, blogPosts, ui } = byLocale[lang];
  const suffix = " – VentureLabs";
  const pages: PageMeta[] = [];

  pages.push({
    path: `/${lang}`,
    lang,
    title: `VentureLabs – ${site.heroHeadline}`,
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
    pages.push({
      path: `/${lang}/leistungen/${s.slug}`,
      lang,
      title: `${s.title}${suffix}`,
      description: s.description,
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
      title: `${c.heroHeadline}${suffix}`,
      description: c.description || c.heroSubline,
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
    title: `${ui.blog.heroTitle}${suffix}`,
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

function renderHtml(shell: string, page: PageMeta, alternates: Alternate[]): string {
  const title = escapeText(page.title);
  const description = escapeAttr(page.description);

  const headLinks = [
    `    <link rel="canonical" href="${escapeAttr(absoluteUrl(page.path))}" />`,
    ...alternates.map(
      (a) => `    <link rel="alternate" hreflang="${escapeAttr(a.hreflang)}" href="${escapeAttr(a.href)}" />`
    ),
  ].join("\n");

  // Injected before the first </head>; index.html itself is never modified, so
  // the SPA fallback shell keeps no canonical.
  const withHead = shell.replace(/[ \t]*<\/head>/, () => `${headLinks}\n  </head>`);

  return withHead
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

function main() {
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

  let count = 0;
  for (const page of allPages) {
    const outDir = resolve(distDir, page.path.replace(/^\//, ""));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      resolve(outDir, "index.html"),
      renderHtml(shell, page, alternatesByPath.get(page.path)!)
    );
    count++;
  }

  writeFileSync(resolve(distDir, "sitemap.xml"), renderSitemap(allPages, alternatesByPath));

  console.log(`prerender: wrote ${count} route-specific HTML shells`);
  console.log(`prerender: wrote sitemap.xml with ${allPages.length} urls`);
}

main();
