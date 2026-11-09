import { Link } from "react-router";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useLocale } from "@/app/locale";
import { useDraftPosts } from "@/data/content";

/**
 * Hidden review page: lists every article that is still a draft (frontmatter
 * `draft: true`). Not linked from the nav, noindex, not in the sitemap. Goes
 * away (or stays empty) once the drafts are approved and `draft` is removed.
 */
export function EntwurfReview() {
  const { lang, localizedPath } = useLocale();
  const drafts = useDraftPosts();
  const de = lang === "de";
  const kinds = [
    { key: "blog", label: de ? "Blogartikel" : "Blog posts" },
    { key: "glossar", label: de ? "Glossareinträge" : "Glossary entries" },
    { key: "tiefenartikel", label: de ? "Tiefenartikel" : "Deep articles" },
  ];

  return (
    <div className="min-h-screen bg-[#0e0d13] text-white">
      <Navbar />
      <section className="pt-40 pb-24 px-6 lg:px-12 max-w-[1000px] mx-auto">
        <h1 className="font-semibold leading-[110%] mb-4" style={{ fontSize: "var(--text-hero)" }}>
          {de ? "Artikel-Entwürfe" : "Draft articles"}
        </h1>
        <p className="text-white/60 font-light mb-10" style={{ fontSize: "var(--text-body)" }}>
          {de
            ? `${drafts.length} Entwürfe zum Gegenlesen. Nicht veröffentlicht, nicht in der Sitemap, für Suchmaschinen gesperrt.`
            : `${drafts.length} drafts to read through. Not published, not in the sitemap, blocked for search engines.`}
        </p>
        {kinds.map((k) => {
          const rows = drafts.filter((p) => (p.kind || "blog") === k.key);
          if (rows.length === 0) return null;
          return (
            <div key={k.key} className="mb-10">
              <h2 className="font-semibold mb-4" style={{ fontSize: "var(--text-h2)" }}>
                {k.label} ({rows.length})
              </h2>
              <ul className="flex flex-col gap-3">
                {rows.map((p) => (
                  <li key={p.slug} className="rounded-lg border border-white/10 px-4 py-3">
                    <Link to={localizedPath(`/blog/${p.slug}`)} className="font-semibold underline underline-offset-4">
                      {p.title}
                    </Link>
                    <p className="text-white/50 font-light" style={{ fontSize: "var(--text-small)" }}>
                      {[p.keyword, p.week, p.readTime].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
      <Footer />
    </div>
  );
}
