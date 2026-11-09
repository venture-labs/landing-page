import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useLocale } from "@/app/locale";
import { useWissenData, useWissenDrafts, postPath } from "@/data/content";
import { type BlogPost } from "@/data/de/blog";

const ACCENT = "#fda700";

/** Sort key for the A-Z list: the term itself, without the "Was ist ein" / "What is an" lead-in. */
function termKey(title: string): string {
  return title.replace(/^(was ist|was sind|what is|what are)\s+(ein(e|en)?\s+|der\s+|die\s+|das\s+|an?\s+|the\s+)?/i, "").toLowerCase();
}

function EntryCard({ post, draft }: { post: BlogPost; draft?: boolean }) {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  return (
    <Link
      to={localizedPath(postPath(post))}
      className="group flex flex-col gap-3 bg-[#1c1a27] p-6 h-full transition-colors hover:bg-[#232031]"
    >
      <h3 className="font-semibold text-white leading-snug" style={{ fontSize: "1.15rem" }}>
        {post.title}
      </h3>
      <p className="text-white/60 font-light leading-relaxed flex-1" style={{ fontSize: "var(--text-small)" }}>
        {post.excerpt}
      </p>
      {draft && (
        <p className="text-[#fda700]" style={{ fontSize: "var(--text-small)" }}>
          {t("wissen.draftsNote")}
        </p>
      )}
      <span
        className="inline-flex items-center gap-2 font-semibold"
        style={{ fontSize: "var(--text-small)", color: ACCENT }}
      >
        {t("wissen.readEntry")} <ArrowRight size={13} />
      </span>
    </Link>
  );
}

function Grid({ posts, draft }: { posts: BlogPost[]; draft?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((p) => (
        <EntryCard key={p.slug} post={p} draft={draft} />
      ))}
    </div>
  );
}

/**
 * Knowledge hub: the published glossary entries (A-Z) and deep articles.
 * Drafts are not listed (and not in the sitemap) unless the review link
 * `?entwuerfe=1` is used; that part renders on the client only.
 */
export function Wissen() {
  const { t } = useTranslation();
  const { localizedPath, lang } = useLocale();
  const published = useWissenData();
  const drafts = useWissenDrafts();
  const [showDrafts, setShowDrafts] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowDrafts(new URLSearchParams(window.location.search).has("entwuerfe"));
  }, []);

  const deep = published.filter((p) => p.kind === "tiefenartikel");
  const glossary = published
    .filter((p) => p.kind === "glossar")
    .sort((a, b) => termKey(a.title).localeCompare(termKey(b.title), lang));
  const draftRows = [...drafts].sort((a, b) => termKey(a.title).localeCompare(termKey(b.title), lang));

  return (
    <div className="min-h-screen bg-[#0e0d13] text-white">
      <Navbar />
      <section
        className="relative pt-40 pb-16"
        style={{ background: "linear-gradient(180deg, #1E1C27 0%, #1E1C27 40%, #0e0d13 100%)" }}
      >
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-6">
          <h1 className="font-semibold text-white leading-[1.05]" style={{ fontSize: "var(--text-hero)" }}>
            {t("wissen.heroTitle")}
          </h1>
          <p className="text-white/60 font-light leading-relaxed max-w-2xl" style={{ fontSize: "var(--text-body)" }}>
            {t("wissen.heroSubtitle")}
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-14">
          {deep.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="font-semibold" style={{ fontSize: "var(--text-h2)" }}>
                {t("wissen.deepHeading")}
              </h2>
              <Grid posts={deep} />
            </div>
          )}
          {glossary.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="font-semibold" style={{ fontSize: "var(--text-h2)" }}>
                {t("wissen.glossaryHeading")}
              </h2>
              <Grid posts={glossary} />
            </div>
          )}
          {showDrafts && draftRows.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="font-semibold" style={{ fontSize: "var(--text-h2)" }}>
                {t("wissen.draftsHeading")} ({draftRows.length})
              </h2>
              <Grid posts={draftRows} draft />
            </div>
          )}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-8">
            <h2 className="font-semibold" style={{ fontSize: "var(--text-h2)" }}>
              {t("wissen.moreHeading")}
            </h2>
            <Link
              to={localizedPath("/leistungen/ki-agenten-unternehmen")}
              className="w-fit font-semibold underline underline-offset-4"
              style={{ color: ACCENT }}
            >
              {t("wissen.serviceLink")}
            </Link>
            <Link
              to={localizedPath("/leistungen/ki-potenzialanalyse")}
              className="w-fit font-semibold underline underline-offset-4"
              style={{ color: ACCENT }}
            >
              {t("wissen.checkLink")}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
