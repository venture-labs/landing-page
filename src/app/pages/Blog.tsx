import { useRef } from "react";
import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight, Code2, Building2, Palette, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useLocale } from "@/app/locale";
import { useBlogData } from "@/data/live";
import { type BlogPost } from "@/data/de/blog";

const topicAccent: Record<string, string> = {
  development: "#a318f8",
  "company-building": "#ef4444",
  webdesign: "#2b95f6",
  "ki-strategie": "#fda700",
};

const topicIcon: Record<string, React.ReactNode> = {
  development: <Code2 size={28} strokeWidth={1.5} className="text-white/80" />,
  "company-building": <Building2 size={28} strokeWidth={1.5} className="text-white/80" />,
  webdesign: <Palette size={28} strokeWidth={1.5} className="text-white/80" />,
  "ki-strategie": <Bot size={28} strokeWidth={1.5} className="text-white/80" />,
};

/* ─── hero ───────────────────────────────────────────────────────────── */

function BlogHero() {
  const { t } = useTranslation();
  return (
    <section
      className="relative pt-40 pb-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #1E1C27 0%, #1E1C27 40%, #0e0d13 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-250px] left-[-200px] w-[700px] h-[500px] rounded-full bg-[#8129ff]/10 blur-[120px]" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 max-w-3xl"
        >
          <h1
            className="font-['sofia-pro',sans-serif] font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {t("blog.heroTitle")}
          </h1>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("blog.heroSubtitle")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── cards ──────────────────────────────────────────────────────────── */

function PostTile({ post, tall }: { post: BlogPost; tall: boolean }) {
  const accent = topicAccent[post.topicSlug] ?? "#8129ff";
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${tall ? "h-[260px] lg:h-[340px]" : "h-[180px]"}`}
      style={{
        background: `linear-gradient(146deg, ${accent}33 0%, ${accent}08 100%)`,
      }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${accent}22`, border: `1px solid ${accent}44` }}
      >
        {topicIcon[post.topicSlug]}
      </div>
    </div>
  );
}

function FeaturedPostCard({ post, index }: { post: BlogPost; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const accent = topicAccent[post.topicSlug] ?? "#8129ff";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="md:col-span-2"
    >
      <Link to={localizedPath(`/blog/${post.slug}`)} className="group flex flex-col overflow-hidden">
        <PostTile post={post} tall />
        <div className="bg-[#1c1a27] p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span
              className="font-['sofia-pro',sans-serif] font-semibold px-3 py-1 rounded-full"
              style={{ fontSize: "var(--text-small)", color: accent, backgroundColor: `${accent}1a` }}
            >
              {post.topic}
            </span>
            <span
              className="text-white/40 font-['sofia-pro',sans-serif] font-light"
              style={{ fontSize: "var(--text-small)" }}
            >
              {post.readTime}
            </span>
          </div>
          <h3
            className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight group-hover:text-white/80 transition-colors"
            style={{ fontSize: "var(--text-card)" }}
          >
            {post.title}
          </h3>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {post.excerpt}
          </p>
          <span
            className="inline-flex items-center gap-2 font-['sofia-pro',sans-serif] font-semibold mt-2"
            style={{ fontSize: "var(--text-small)", color: accent }}
          >
            {t("blog.readArticle")} <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function NormalPostCard({ post, index }: { post: BlogPost; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const accent = topicAccent[post.topicSlug] ?? "#8129ff";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: (index % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={localizedPath(`/blog/${post.slug}`)} className="group flex flex-col overflow-hidden h-full">
        <PostTile post={post} tall={false} />
        <div className="bg-[#1c1a27] p-6 flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-3">
            <span
              className="font-['sofia-pro',sans-serif] font-semibold px-3 py-1 rounded-full"
              style={{ fontSize: "var(--text-small)", color: accent, backgroundColor: `${accent}1a` }}
            >
              {post.topic}
            </span>
            <span
              className="text-white/40 font-['sofia-pro',sans-serif] font-light"
              style={{ fontSize: "var(--text-small)" }}
            >
              {post.readTime}
            </span>
          </div>
          <h3
            className="font-['sofia-pro',sans-serif] font-semibold text-white leading-snug group-hover:text-white/80 transition-colors"
            style={{ fontSize: "1.15rem" }}
          >
            {post.title}
          </h3>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed flex-1"
            style={{ fontSize: "var(--text-small)" }}
          >
            {post.excerpt}
          </p>
          <span
            className="inline-flex items-center gap-2 font-['sofia-pro',sans-serif] font-semibold mt-1"
            style={{ fontSize: "var(--text-small)", color: accent }}
          >
            {t("blog.readArticle")} <ArrowRight size={13} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── page ───────────────────────────────────────────────────────────── */

export function Blog() {
  const glowRef = useRef<HTMLDivElement>(null);
  const posts = useBlogData();
  const featured = posts.filter((p) => p.featured);
  const normal = posts.filter((p) => !p.featured);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!glowRef.current) return;
    glowRef.current.style.setProperty("--gx", `${e.clientX}px`);
    glowRef.current.style.setProperty("--gy", `${e.clientY}px`);
    glowRef.current.style.opacity = "1";
  }

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
      <BlogHero />
      <section className="bg-[#0e0d13] pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((post, i) => (
              <FeaturedPostCard key={post.slug} post={post} index={i} />
            ))}
            {normal.map((post, i) => (
              <NormalPostCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
