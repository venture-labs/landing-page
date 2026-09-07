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
 */
import { writeFileSync, mkdirSync, readFileSync } from "fs";
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
const distDir = resolve(__dirname, "../dist");

const LOCALES = ["de", "en"] as const;
type Locale = (typeof LOCALES)[number];

const OG_LOCALE: Record<Locale, string> = { de: "de_DE", en: "en_US" };

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
  });

  pages.push({
    path: `/${lang}/leistungen`,
    lang,
    title: `${leistungen.heroTitlePrefix} ${leistungen.heroTitleHighlight}${suffix}`,
    description: leistungen.heroSubheading,
  });

  for (const s of services) {
    pages.push({
      path: `/${lang}/leistungen/${s.slug}`,
      lang,
      title: `${s.title}${suffix}`,
      description: s.description,
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
    });
  }

  pages.push({
    path: `/${lang}/ueber-uns`,
    lang,
    title: `${about.heroTitle}${suffix}`,
    description: about.heroSubheading,
  });

  return pages;
}

function renderHtml(shell: string, page: PageMeta): string {
  const title = escapeText(page.title);
  const description = escapeAttr(page.description);

  return shell
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

function main() {
  const shell = readFileSync(resolve(distDir, "index.html"), "utf-8");

  let count = 0;
  for (const lang of LOCALES) {
    for (const page of buildPagesForLocale(lang)) {
      const outDir = resolve(distDir, page.path.replace(/^\//, ""));
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, "index.html"), renderHtml(shell, page));
      count++;
    }
  }

  console.log(`prerender: wrote ${count} route-specific HTML shells`);
}

main();
