import { useEffect, useRef } from "react";
import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Code2, Building2, Palette, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useLocale } from "@/app/locale";
import { blogPosts as blogPostsDe } from "@/data/de/blog";
import { blogPosts as blogPostsEn } from "@/data/en/blog";

const blogPostsByLocale = { de: blogPostsDe, en: blogPostsEn };

const topicAccent: Record<string, string> = {
  development: "#a318f8",
  "company-building": "#ef4444",
  webdesign: "#2b95f6",
  "ki-strategie": "#fda700",
};

const topicIcon: Record<string, React.ReactNode> = {
  development: <Code2 size={40} strokeWidth={1.5} className="text-white/80" />,
  "company-building": <Building2 size={40} strokeWidth={1.5} className="text-white/80" />,
  webdesign: <Palette size={40} strokeWidth={1.5} className="text-white/80" />,
  "ki-strategie": <Bot size={40} strokeWidth={1.5} className="text-white/80" />,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { lang, localizedPath } = useLocale();
  const glowRef = useRef<HTMLDivElement>(null);
  const posts = blogPostsByLocale[lang];
  const post = posts.find((p) => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!glowRef.current) return;
    glowRef.current.style.setProperty("--gx", `${e.clientX}px`);
    glowRef.current.style.setProperty("--gy", `${e.clientY}px`);
    glowRef.current.style.opacity = "1";
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0e0d13] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 font-['sofia-pro',sans-serif] mb-4">{t("blog.notFound")}</p>
          <Link to={localizedPath("/blog")} className="text-[#8129ff] hover:underline font-['sofia-pro',sans-serif]">
            {t("blog.backToOverview")}
          </Link>
        </div>
      </div>
    );
  }

  const accent = topicAccent[post.topicSlug] ?? "#8129ff";
  const headings = post.content
    .filter((block) => block.type === "heading")
    .map((block) => ({ text: block.text, id: slugify(block.text) }));

  return (
    <div
      className="min-h-screen bg-[#0e0d13] text-white relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => glowRef.current && (glowRef.current.style.opacity = "0")}
    >
      <div
        ref={glowRef}
        className="pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-300"
        style={{
          opacity: 0,
          background:
            "radial-gradient(600px circle at var(--gx, 50%) var(--gy, 50%), rgba(129, 41, 255, 0.08) 0%, rgba(163, 24, 248, 0.04) 40%, transparent 70%)",
        }}
        aria-hidden
      />
      <Navbar />
      <section className="pt-40 pb-24 px-6 lg:px-12 max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link
            to={localizedPath("/blog")}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-10"
            style={{ fontSize: "var(--text-small)" }}
          >
            <ArrowLeft size={14} />
            {t("blog.backToOverview")}
          </Link>

          <h1
            className="font-['sofia-pro',sans-serif] font-semibold text-white leading-[1.1] mb-12 max-w-4xl"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {post.title}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12">
            {/* ─── sidebar ─────────────────────────────────────────── */}
            <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-8">
              <span
                className="font-['sofia-pro',sans-serif] font-semibold px-3 py-1 rounded-full w-fit"
                style={{ fontSize: "var(--text-small)", color: accent, backgroundColor: `${accent}1a` }}
              >
                {post.topic}
              </span>

              <p
                className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed"
                style={{ fontSize: "var(--text-small)" }}
              >
                {post.excerpt}
              </p>

              <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
                <div>
                  <p className="text-white/40 font-['sofia-pro',sans-serif] font-light text-xs uppercase tracking-wide mb-1">
                    {t("blog.publishedLabel")}
                  </p>
                  <p className="text-white/80 font-['sofia-pro',sans-serif]" style={{ fontSize: "var(--text-small)" }}>
                    {post.publishedDate}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 font-['sofia-pro',sans-serif] font-light text-xs uppercase tracking-wide mb-1">
                    {t("blog.byLabel")}
                  </p>
                  <p className="text-white/80 font-['sofia-pro',sans-serif]" style={{ fontSize: "var(--text-small)" }}>
                    {post.author}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 font-['sofia-pro',sans-serif] font-light text-xs uppercase tracking-wide mb-1">
                    {t("blog.readTimeLabel")}
                  </p>
                  <p className="text-white/80 font-['sofia-pro',sans-serif]" style={{ fontSize: "var(--text-small)" }}>
                    {post.readTime}
                  </p>
                </div>
              </div>

              {headings.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
                  <p className="text-white/40 font-['sofia-pro',sans-serif] font-light text-xs uppercase tracking-wide mb-1">
                    {t("blog.tableOfContents")}
                  </p>
                  <nav className="flex flex-col gap-2">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className="text-white/60 hover:text-white transition-colors font-['sofia-pro',sans-serif] font-light leading-snug"
                        style={{ fontSize: "var(--text-small)" }}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </aside>

            {/* ─── content ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-8 min-w-0">
              <div
                className="w-full h-[280px] lg:h-[360px] flex items-center justify-center"
                style={{ background: `linear-gradient(146deg, ${accent}33 0%, ${accent}08 100%)` }}
              >
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${accent}22`, border: `1px solid ${accent}44` }}
                >
                  {topicIcon[post.topicSlug]}
                </div>
              </div>

              <div className="flex flex-col gap-6 max-w-3xl">
                {post.content.map((block, i) =>
                  block.type === "heading" ? (
                    <h2
                      key={i}
                      id={slugify(block.text)}
                      className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight mt-4 scroll-mt-32"
                      style={{ fontSize: "var(--text-h2)" }}
                    >
                      {block.text}
                    </h2>
                  ) : (
                    <p
                      key={i}
                      className="text-white/70 font-['sofia-pro',sans-serif] font-light leading-relaxed"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {block.text}
                    </p>
                  ),
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 pt-8 mt-4 max-w-3xl">
                <p
                  className="text-white/60 font-['sofia-pro',sans-serif] font-light"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {t("blog.ctaText")}
                </p>
                <Link
                  to={localizedPath("/kontakt")}
                  className="inline-flex items-center gap-2 w-fit font-['sofia-pro',sans-serif] font-semibold px-5 py-3 rounded-full transition-colors"
                  style={{ backgroundColor: accent, color: "#0e0d13" }}
                >
                  {t("blog.ctaButton")} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
      <Footer />
    </div>
  );
}
