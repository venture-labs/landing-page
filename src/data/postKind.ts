/**
 * Which section an article belongs to. Glossary entries and deep articles
 * (frontmatter `kind: glossar | tiefenartikel`) live in the knowledge hub at
 * /wissen/<slug>; everything else is a blog post at /blog/<slug>. Kept free of
 * React so scripts/prerender.ts can use it too.
 */
export function isWissenPost(p: { kind?: string }): boolean {
  return p.kind === "glossar" || p.kind === "tiefenartikel";
}

/** Route of an article without the locale prefix. */
export function postPath(p: { kind?: string; slug: string }): string {
  return isWissenPost(p) ? `/wissen/${p.slug}` : `/blog/${p.slug}`;
}
