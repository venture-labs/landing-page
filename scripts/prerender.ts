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
 * The same route list is reused to emit dist/sitemap.xml and to inject each
 * route's complete head set (title, description, robots, canonical, hreflang,
 * Open Graph, Twitter, share image, JSON-LD - see renderHeadMeta) into every
 * route shell.
 *
 * dist/index.html (the root `/`, a real file so Netlify answers it with 200)
 * is rewritten with the /de head set and an EMPTY #root, so the client mounts
 * fresh and redirects to /de. dist/404.html (noindex, no canonical) is the
 * shell Netlify serves with status 404 for any unmatched path
 * (public/_redirects); its #root is empty too.
 *
 * scripts/check-meta.ts runs after this script (package.json) and fails the
 * build on any missing, empty or duplicated tag.
 */
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { execFileSync } from "child_process";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

import {
  findMissingPlacementCallSites,
  findMissingCtaCallSites,
  findUntrackedMailtoTelLinks,
  findUntrackedPulseCheckModalUsages,
  findUntrackedKontaktOrBookingLinks,
} from "./check-placements";

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

/**
 * The brand share image per language: 1200x630 PNG, centre-square-safe, in
 * public/. Every route of a locale uses its locale's image (VL-16-S1-Q3);
 * the alt is "Venture Labs - " plus the line printed on the image.
 */
const SHARE_IMAGE: Record<Locale, { path: string; alt: string }> = {
  de: { path: "/og-venturelabs.png", alt: "Venture Labs – KI im Mittelstand, die sich rechnet." },
  en: {
    path: "/og-venturelabs-en.png",
    alt: "Venture Labs – AI for mid-sized companies, that pays off.",
  },
};
const SHARE_IMAGE_WIDTH = 1200;
const SHARE_IMAGE_HEIGHT = 630;

/**
 * Origin of the share image URL. Production and local builds use the production
 * origin; a Netlify deploy-preview / branch-deploy build (the same CONTEXT
 * values vite.config.ts's Plausible plugin keys off) uses that deploy's own
 * origin, because /og-venturelabs*.png is not on the live domain until the
 * dev -> main merge. Canonical, og:url, hreflang, sitemap and JSON-LD never
 * use it: they always carry SITE_ORIGIN.
 */
function assetOrigin(env: NodeJS.ProcessEnv = process.env): string {
  const context = env.CONTEXT;
  const deployUrl = env.DEPLOY_PRIME_URL?.trim().replace(/\/+$/, "");
  if ((context === "deploy-preview" || context === "branch-deploy") && deployUrl) return deployUrl;
  return SITE_ORIGIN;
}

const BRAND = "Venture Labs";
const ORGANIZATION_NAME = "Venture Labs GmbH";

export interface Crumb {
  name: string;
  path: string; // app route path, e.g. "/de/leistungen"
}

export interface PageMeta {
  path: string; // e.g. "/de/leistungen/development"
  lang: Locale;
  title: string;
  description: string;
  /** Breadcrumb items after the home item, last = the page itself; absent on home. */
  crumbs?: Crumb[];
  /** Present on /leistungen and the /leistungen/:slug pages: one schema.org Service. */
  service?: { name: string; description: string };
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

/**
 * An authored head string (frontmatter `seoTitle` / `seoDescription`, or a
 * `seo.<page>.*` locale key) is used verbatim - no suffix - when it is
 * non-blank; a blank or missing one falls back to the page's composed string,
 * so a page never gets an empty <title> or description. scripts/check-meta.ts
 * then fails the build if the fallback is out of the 50-60 / 120-160 range.
 */
function authored(value: string | undefined, fallback: string): string {
  return value?.trim() ? value.trim() : fallback;
}

function buildPagesForLocale(lang: Locale): PageMeta[] {
  const { site, leistungen, about, services, caseDetails, blogPosts, ui } = byLocale[lang];
  const suffix = " – Venture Labs";
  const pages: PageMeta[] = [];
  const footer = ui.footer;
  const crumb = (name: string, path: string): Crumb => ({ name, path: `/${lang}${path}` });

  pages.push({
    path: `/${lang}`,
    lang,
    // seoTitle is optional frontmatter (content/site/home.md / home.en.md); fall
    // back to a locale-correct literal (the same wording the seoTitle fields are
    // authored with today — index.html's own former German title / the
    // already-translated English footer tagline) when it's absent or blank, so an
    // editor omitting it never reproduces F-a6d917's identical-English-title bug
    // via the shared, locale-identical heroHeadline.
    title: site.seoTitle?.trim()
      ? site.seoTitle
      : lang === "de"
        ? "Venture Labs – Digitale Produkte, die wirklich funktionieren"
        : "Venture Labs – Digital products that actually work",
    description: authored(site.seoDescription, site.heroSubline),
    sourceFile: contentFile(lang, "site/home"),
  });

  const leistungenDescription = authored(leistungen.seoDescription, leistungen.heroSubheading);
  pages.push({
    path: `/${lang}/leistungen`,
    lang,
    title: authored(leistungen.seoTitle, `${leistungen.heroTitlePrefix} ${leistungen.heroTitleHighlight}${suffix}`),
    description: leistungenDescription,
    crumbs: [crumb(footer.servicesTitle, "/leistungen")],
    // "AI Pulse" is the glossary's name for the productised offer; the hero
    // ("Drei Schritte. Ein Puls.") is a claim, not a name.
    service: { name: "AI Pulse", description: leistungenDescription },
    sourceFile: contentFile(lang, "site/leistungen"),
  });

  for (const s of services) {
    const serviceDescription = authored(s.seoDescription, s.description);
    pages.push({
      path: `/${lang}/leistungen/${s.slug}`,
      lang,
      title: authored(s.seoTitle, `${s.title} – ${leistungen.heroEyebrow}${suffix}`),
      description: serviceDescription,
      crumbs: [crumb(footer.servicesTitle, "/leistungen"), crumb(s.title, `/leistungen/${s.slug}`)],
      service: { name: s.title, description: serviceDescription },
      sourceFile: contentFile(lang, `services/${s.slug}`),
    });
  }

  pages.push({
    path: `/${lang}/cases`,
    lang,
    title: authored(ui.seo?.cases?.title, `${ui.cases.heroTitle}${suffix}`),
    description: authored(ui.seo?.cases?.description, ui.cases.heroSubheading),
    crumbs: [crumb(footer.projectsTitle, "/cases")],
  });

  for (const slug of Object.keys(caseDetails)) {
    const c = caseDetails[slug];
    pages.push({
      path: `/${lang}/cases/${slug}`,
      lang,
      title: authored(c.seoTitle, `${c.title}${suffix}`),
      description: authored(c.seoDescription, c.description || c.heroSubline),
      crumbs: [crumb(footer.projectsTitle, "/cases"), crumb(c.title, `/cases/${slug}`)],
      sourceFile: contentFile(lang, `cases/${slug}`),
    });
  }

  pages.push({
    path: `/${lang}/kontakt`,
    lang,
    title: authored(ui.seo?.kontakt?.title, `${ui.kontakt.heroTitle}${suffix}`),
    description: authored(ui.seo?.kontakt?.description, ui.kontakt.heroSubtitle),
    crumbs: [crumb(footer.contactTitle, "/kontakt")],
  });

  pages.push({
    path: `/${lang}/blog`,
    lang,
    title: authored(ui.seo?.blog?.title, `${ui.blog.heroTitle}${suffix}`),
    description: authored(ui.seo?.blog?.description, ui.blog.heroSubtitle),
    crumbs: [crumb(footer.blog, "/blog")],
  });

  for (const p of blogPosts) {
    pages.push({
      path: `/${lang}/blog/${p.slug}`,
      lang,
      title: authored(p.seoTitle, `${p.title}${suffix}`),
      description: authored(p.seoDescription, p.excerpt),
      crumbs: [crumb(footer.blog, "/blog"), crumb(p.title, `/blog/${p.slug}`)],
      sourceFile: contentFile(lang, `blog/${p.slug}`),
    });
  }

  pages.push({
    path: `/${lang}/ueber-uns`,
    lang,
    title: authored(about.seoTitle, `${about.heroTitle}${suffix}`),
    description: authored(about.seoDescription, about.heroSubheading),
    crumbs: [crumb(footer.aboutTitle, "/ueber-uns")],
    sourceFile: contentFile(lang, "about/about"),
  });

  pages.push({
    path: `/${lang}/impressum`,
    lang,
    title: authored(ui.seo?.impressum?.title, `${lang === "de" ? "Impressum" : "Imprint"}${suffix}`),
    description: authored(
      ui.seo?.impressum?.description,
      lang === "de" ? "Impressum der Venture Labs GmbH." : "Legal notice (Impressum) for Venture Labs GmbH."
    ),
    crumbs: [crumb(footer.imprint, "/impressum")],
  });

  pages.push({
    path: `/${lang}/datenschutz`,
    lang,
    title: authored(ui.seo?.datenschutz?.title, `${lang === "de" ? "Datenschutzerklärung" : "Privacy Policy"}${suffix}`),
    description: authored(
      ui.seo?.datenschutz?.description,
      lang === "de" ? "Datenschutzerklärung für venturelabs.team." : "Privacy policy for venturelabs.team."
    ),
    crumbs: [crumb(footer.privacy, "/datenschutz")],
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

/** Escapes the three characters that could close a <script> or start an entity, as JSON unicode escapes. */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function organizationNode(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: ORGANIZATION_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/icon-512.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Breite Str. 27",
      postalCode: "40213",
      addressLocality: "Düsseldorf",
      addressCountry: "DE",
    },
    // No sameAs: no social profile URL has been named (VL-16-S1-Q4).
  };
}

function isHomePath(path: string): boolean {
  return /^\/(?:de|en)\/?$/.test(path);
}

/**
 * The route's JSON-LD graph: Organization + WebSite on the home routes,
 * BreadcrumbList on every other route, plus one Service on the service routes.
 * Every URL is on the production origin.
 */
function jsonLdFor(page: PageMeta): Record<string, unknown> {
  const canonical = absoluteUrl(page.path);
  const graph: Record<string, unknown>[] = [];

  if (isHomePath(page.path)) {
    graph.push(organizationNode());
    graph.push({
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      name: BRAND,
      url: `${SITE_ORIGIN}/`,
      inLanguage: page.lang,
      publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    });
  } else {
    const items: Crumb[] = [
      { name: BRAND, path: `/${page.lang}` },
      ...(page.crumbs ?? [{ name: page.title, path: page.path }]),
    ];
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: items.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: absoluteUrl(c.path),
      })),
    });
  }

  if (page.service) {
    graph.push({
      "@type": "Service",
      name: page.service.name,
      description: page.service.description,
      url: canonical,
      inLanguage: page.lang,
      provider: {
        "@type": "Organization",
        "@id": `${SITE_ORIGIN}/#organization`,
        name: ORGANIZATION_NAME,
      },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * The complete route-specific head block: everything a link-preview crawler or
 * search engine reads, generated in one place. Each tag appears exactly once;
 * renderHtml() strips the same tags from the shell by name before injecting it.
 */
export function renderHeadMeta(page: PageMeta, alternates: Alternate[], env: NodeJS.ProcessEnv = process.env): string {
  const canonical = escapeAttr(absoluteUrl(page.path));
  const title = escapeText(page.title);
  const titleAttr = escapeAttr(page.title);
  const description = escapeAttr(page.description);
  const image = SHARE_IMAGE[page.lang];
  const imageUrl = escapeAttr(`${assetOrigin(env)}${image.path}`);
  const imageAlt = escapeAttr(image.alt);
  const otherLocale = OG_LOCALE[page.lang === "de" ? "en" : "de"];

  const meta = (attr: "name" | "property", key: string, value: string) =>
    `    <meta ${attr}="${key}" content="${value}" />`;

  return [
    `    <title>${title}</title>`,
    meta("name", "description", description),
    meta("name", "robots", "index,follow,max-image-preview:large"),
    `    <link rel="canonical" href="${canonical}" />`,
    ...alternates.map(
      (a) => `    <link rel="alternate" hreflang="${escapeAttr(a.hreflang)}" href="${escapeAttr(a.href)}" />`
    ),
    meta("property", "og:locale", OG_LOCALE[page.lang]),
    meta("property", "og:locale:alternate", otherLocale),
    meta("property", "og:title", titleAttr),
    meta("property", "og:description", description),
    meta("property", "og:url", canonical),
    meta("property", "og:image", imageUrl),
    meta("property", "og:image:width", String(SHARE_IMAGE_WIDTH)),
    meta("property", "og:image:height", String(SHARE_IMAGE_HEIGHT)),
    meta("property", "og:image:type", "image/png"),
    meta("property", "og:image:alt", imageAlt),
    meta("name", "twitter:title", titleAttr),
    meta("name", "twitter:description", description),
    meta("name", "twitter:image", imageUrl),
    meta("name", "twitter:image:alt", imageAlt),
    `    <script type="application/ld+json">${jsonForScript(jsonLdFor(page))}</script>`,
  ].join("\n");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const STRIPPED_META_NAMES = [
  "description",
  "robots",
  "twitter:title",
  "twitter:description",
  "twitter:image",
  "twitter:image:alt",
];
const STRIPPED_META_PROPERTIES = [
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

/**
 * Removes, from the shell's <head> only, every tag renderHeadMeta() generates
 * (matched by name, so the single- and multi-line forms index.html uses are
 * both caught). `extraMetaNames` lets the 404 shell drop twitter:card too.
 */
function stripRouteHead(shell: string, extraMetaNames: string[] = []): string {
  const headEnd = shell.search(/<\/head>/);
  if (headEnd === -1) return shell;
  let head = shell.slice(0, headEnd);
  const rest = shell.slice(headEnd);

  const meta = (attr: string, value: string) =>
    new RegExp(`[ \\t]*<meta\\b(?=[^>]*\\b${attr}="${escapeRegExp(value)}")[^>]*>[ \\t]*\\r?\\n?`, "gi");
  for (const n of [...STRIPPED_META_NAMES, ...extraMetaNames]) head = head.replace(meta("name", n), "");
  for (const p of STRIPPED_META_PROPERTIES) head = head.replace(meta("property", p), "");

  head = head
    .replace(/[ \t]*<title>[\s\S]*?<\/title>[ \t]*\r?\n?/gi, "")
    .replace(/[ \t]*<link\b(?=[^>]*\brel="(?:canonical|alternate)")[^>]*>[ \t]*\r?\n?/gi, "")
    .replace(/[ \t]*<script\b[^>]*\btype="application\/ld\+json"[^>]*>[\s\S]*?<\/script>[ \t]*\r?\n?/gi, "");

  return head + rest;
}

/** Injects a block before the first </head>, with a callback so "$" in the block stays literal. */
function injectIntoHead(html: string, block: string): string {
  return html.replace(/[ \t]*<\/head>/, () => `${block}\n  </head>`);
}

export function renderHtml(shell: string, page: PageMeta, alternates: Alternate[], bodyHtml: string): string {
  const withHead = injectIntoHead(stripRouteHead(shell), renderHeadMeta(page, alternates));

  // A replacement callback (not a replacement string) returns bodyHtml
  // verbatim: String.replace's string form treats "$$", "$&", "$1" etc. in
  // the replacement as special patterns, so rendered editorial copy that
  // happens to contain a literal "$$" would otherwise be silently collapsed
  // to "$" in the written HTML.
  const withBody = withHead.replace(
    '<div id="root"></div>',
    () => `<div id="root">${bodyHtml}</div>`
  );

  return withBody.replace(/<html lang="[^"]*"/, `<html lang="${page.lang}"`);
}

/**
 * The shell Netlify serves with status 404 for an unmatched path: the shell's
 * static tags, a German title and description, noindex - and no canonical,
 * hreflang, og:url, og:image, Twitter tag or JSON-LD. #root stays empty, the
 * client renders the NotFound page for the URL's locale.
 */
export function render404Html(shell: string): string {
  const stripped = stripRouteHead(shell, ["twitter:card"]);
  const block = [
    `    <title>${escapeText(`${deUi.notFound.heading} – ${BRAND}`)}</title>`,
    `    <meta name="description" content="${escapeAttr(deUi.notFound.message)}" />`,
    `    <meta name="robots" content="noindex" />`,
  ].join("\n");
  return injectIntoHead(stripped, block).replace(/<html lang="[^"]*"/, `<html lang="de"`);
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

/**
 * 20261021-cta-tracking-every-call-to-action-fires-a-plausi — the four new
 * "every CTA is attributable" checks (cta argument, mailto:/tel: links,
 * PulseCheckModal's placement, a booking/kontakt link with no tracked
 * onClick), wired into `pnpm build` itself for the same reason
 * assertPlacementIds() above is: scripts/check-analytics.ts's own criteria
 * 18-21 are only ever run separately via `pnpm check:analytics`.
 */
function assertCtaTracking(): void {
  const srcDir = resolve(repoRoot, "src");
  const offenders = [
    ...findMissingCtaCallSites(srcDir).map((f) => `missing cta argument: ${relative(repoRoot, f)}`),
    ...findUntrackedMailtoTelLinks(srcDir).map((f) => `untracked mailto:/tel: link: ${relative(repoRoot, f)}`),
    ...findUntrackedPulseCheckModalUsages(srcDir).map(
      (f) => `<PulseCheckModal> missing placement=: ${relative(repoRoot, f)}`
    ),
    ...findUntrackedKontaktOrBookingLinks(srcDir).map(
      (f) => `untracked booking/kontakt link: ${relative(repoRoot, f)}`
    ),
  ];
  if (offenders.length > 0) {
    console.error(
      `prerender: ${offenders.length} untracked CTA(s) found:\n` + offenders.map((o) => `  - ${o}`).join("\n")
    );
    process.exit(1);
  }
}

async function main() {
  assertPlacementIds();
  assertCtaTracking();

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

  // The root "/": dist/index.html is a real file, so Netlify answers it with 200
  // (a redirect would hide the head from scrapers). It carries the /de head set
  // (canonical https://venturelabs.team/de/) and an EMPTY #root: the client
  // mounts fresh and redirects to /de. `shell` was read before this write.
  const dePage = allPages.find((p) => p.path === `/${DEFAULT_LOCALE}`)!;
  writeFileSync(
    resolve(distDir, "index.html"),
    renderHtml(shell, dePage, alternatesByPath.get(dePage.path)!, "")
  );

  // The unmatched-path shell public/_redirects serves with status 404.
  writeFileSync(resolve(distDir, "404.html"), render404Html(shell));

  writeFileSync(resolve(distDir, "sitemap.xml"), renderSitemap(allPages, alternatesByPath));

  console.log(`prerender: wrote ${count} route-specific HTML shells`);
  console.log("prerender: wrote the root shell (dist/index.html) and dist/404.html");
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
