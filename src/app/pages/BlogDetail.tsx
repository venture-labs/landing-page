import { Fragment, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useLocale } from "@/app/locale";
import { useBlogDetail } from "@/data/content";
import { PulseCheckModal } from "@/app/components/PulseCheckModal";

const topicAccent: Record<string, string> = {
  "ai-automation": "#fda700",
  "ai-products": "#a318f8",
  "ai-experience": "#2b95f6",
  "venture-building": "#ef4444",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Renders `**bold**` spans within otherwise-plain block text. */
function renderInline(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-white font-semibold">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const glowRef = useRef<HTMLDivElement>(null);
  const post = useBlogDetail(slug);
  const [quizOpen, setQuizOpen] = useState(false);

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
    .filter((block): block is typeof block & { text: string } => block.type === "heading" && !!block.text)
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
            className="font-['sofia-pro',sans-serif] font-semibold text-white leading-[1.15] mb-8 max-w-4xl"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {post.title}
          </h1>

          {post.image && (
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-12">
              <img src={post.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ boxShadow: `inset 0 0 0 1px ${accent}33` }}
              />
            </div>
          )}

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
              <div className="flex flex-col gap-6 max-w-3xl">
                {post.content.map((block, i) => {
                  if (block.type === "heading" && block.text) {
                    return (
                      <h2
                        key={i}
                        id={slugify(block.text)}
                        className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight mt-4 scroll-mt-32"
                        style={{ fontSize: "var(--text-h2)" }}
                      >
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.type === "list" && block.items) {
                    return (
                      <ul key={i} className="flex flex-col gap-3">
                        {block.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <Check size={15} strokeWidth={3} style={{ color: accent }} className="mt-1.5 shrink-0" />
                            <span
                              className="text-white/70 font-['sofia-pro',sans-serif] font-light leading-relaxed"
                              style={{ fontSize: "var(--text-body)" }}
                            >
                              {renderInline(item)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === "image" && block.src) {
                    return (
                      <div key={i} className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden my-2">
                        <img
                          src={block.src}
                          alt={block.text ?? ""}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 1px ${accent}33` }} />
                      </div>
                    );
                  }
                  if (block.text) {
                    return (
                      <p
                        key={i}
                        className="text-white/70 font-['sofia-pro',sans-serif] font-light leading-relaxed"
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {renderInline(block.text)}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>

              {/* ─── direct contact ──────────────────────────────────── */}
              <div className="flex flex-col gap-5 border-t border-white/10 pt-8 mt-4 max-w-3xl">
                <p
                  className="text-white/60 font-['sofia-pro',sans-serif] font-light"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {t("blog.ctaText")}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-xl p-5 bg-white/[0.02]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-['sofia-pro',sans-serif] font-semibold shrink-0"
                    style={{ backgroundColor: `${accent}22`, color: accent }}
                  >
                    CW
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white font-['sofia-pro',sans-serif] font-semibold" style={{ fontSize: "var(--text-body)" }}>
                      Christian Wenzel
                    </span>
                    <span className="text-white/50 font-['sofia-pro',sans-serif] font-light" style={{ fontSize: "var(--text-small)" }}>
                      {t("kontakt.team.christianRole")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:ml-auto">
                    <a
                      href="tel:+49156778387064"
                      className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                      style={{ fontSize: "var(--text-small)" }}
                    >
                      <Phone size={13} /> +49 156778 387064
                    </a>
                    <a
                      href="mailto:christian.wenzel@venturelabs.team"
                      className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                      style={{ fontSize: "var(--text-small)" }}
                    >
                      <Mail size={13} /> christian.wenzel@venturelabs.team
                    </a>
                  </div>
                </div>
                <Link
                  to={localizedPath("/kontakt")}
                  className="inline-flex items-center gap-2 w-fit font-['sofia-pro',sans-serif] font-semibold px-5 py-3 rounded-full transition-colors"
                  style={{ backgroundColor: accent, color: "#0e0d13" }}
                >
                  {t("blog.ctaButton")} <ArrowRight size={16} />
                </Link>
              </div>

              {/* ─── pulse score ─────────────────────────────────────── */}
              <div
                className="flex flex-col gap-4 rounded-2xl p-8 max-w-3xl"
                style={{ background: `linear-gradient(135deg, ${accent}1f 0%, ${accent}08 100%)`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
              >
                <h3
                  className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight"
                  style={{ fontSize: "var(--text-h3)" }}
                >
                  {t("blog.pulseScoreHeading")}
                </h3>
                <p
                  className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {t("blog.pulseScoreBody")}
                </p>
                <button
                  type="button"
                  onClick={() => setQuizOpen(true)}
                  className="self-start inline-flex items-center gap-2 font-['sofia-pro',sans-serif] font-semibold px-5 py-3 rounded-full transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: accent, color: "#0e0d13" }}
                >
                  {t("leistungen.pulseCta")} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
      <Footer />
      <PulseCheckModal open={quizOpen} onOpenChange={setQuizOpen} />
    </div>
  );
}
