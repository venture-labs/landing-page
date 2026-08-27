import { useRef } from "react";
import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight, Code2, Building2, Palette, Bot, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useCasesData, useServicesData } from "@/data/live";
import { useLocale } from "@/app/locale";
import { caseDetailsMap as caseDetailsMapDe } from "@/data/de/caseDetails";
import { caseDetailsMap as caseDetailsMapEn } from "@/data/en/caseDetails";

const caseDetailsMapByLocale = { de: caseDetailsMapDe, en: caseDetailsMapEn };

function CasesHero() {
  const { t } = useTranslation();
  return (
    <section
      className="relative pt-40 pb-32 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1E1C27 0%, #1E1C27 40%, #0e0d13 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-250px] left-[-200px] w-[700px] h-[500px] rounded-full bg-[#8129ff]/10 blur-[120px]" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8 max-w-3xl"
        >
          <h1
            className="font-['sofia-pro',sans-serif] font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {t("cases.heroTitle")}
          </h1>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("cases.heroSubheading")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

const iconMap = {
  code: <Code2 size={32} strokeWidth={1.5} className="text-white/80" />,
  grid: <Building2 size={32} strokeWidth={1.5} className="text-white/80" />,
  palette: <Palette size={32} strokeWidth={1.5} className="text-white/80" />,
  bot: <Bot size={32} strokeWidth={1.5} className="text-white/80" />,
};

const serviceGradients: Record<string, string> = {
  development: "linear-gradient(268.344deg, rgba(163, 24, 248, 0.15) 0%, rgba(163, 24, 248, 0) 100%)",
  "company-building": "linear-gradient(268.344deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 100%)",
  "ui-ux": "linear-gradient(44.336deg, rgba(43, 149, 246, 0.15) 0%, rgba(43, 149, 246, 0) 100%)",
  "ai-consulting": "linear-gradient(-56.458deg, rgba(253, 167, 0, 0.15) 0%, rgba(253, 167, 0, 0) 100%)",
};

function ServiceTile({ service, index }: { service: any; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { localizedPath } = useLocale();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden p-6 bg-[#1c1a27]/50 border border-white/10 hover:border-white/20 transition-colors"
      style={{
        backgroundImage: serviceGradients[service.slug],
        minHeight: "280px",
      }}
    >
      <Link to={localizedPath(`/leistungen/${service.slug}`)} className="flex flex-col justify-between h-full">
        <div className="flex flex-col gap-4">
          {iconMap[service.icon as keyof typeof iconMap]}
          <div>
            <h3
              className="font-semibold text-white leading-tight mb-2"
              style={{ fontSize: "var(--text-card)" }}
            >
              {service.title}
            </h3>
            <p
              className="text-white/60 font-light leading-snug"
              style={{ fontSize: "var(--text-body)" }}
            >
              {service.description}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <ArrowRight size={16} className="text-white/40" />
        </div>
      </Link>
    </motion.div>
  );
}

function CaseGridCard({ c, index }: { c: { slug: string; title: string; subtitle: string; image: string }; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { localizedPath, lang } = useLocale();
  const detail = caseDetailsMapByLocale[lang][c.slug];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: (index % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={localizedPath(`/cases/${c.slug}`)}
        className="group cursor-pointer flex flex-col overflow-hidden"
      >
        {/* Hero Image - Top */}
        <div className="relative overflow-hidden bg-gray-800 h-[280px]">
          <img
            src={c.image}
            alt={c.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content - Bottom */}
        <div className="bg-[#1c1a27] p-8 flex flex-col justify-between flex-1">
          {/* Title & Subtitle */}
          <div className="mb-8">
            <h3
              className="font-semibold text-white leading-tight mb-3"
              style={{ fontSize: "1.5rem", lineHeight: "1.2" }}
            >
              {c.title}
            </h3>
            <p
              className="text-white/70 font-light leading-relaxed max-w-sm"
              style={{ fontSize: "0.95rem" }}
            >
              {c.subtitle}
            </p>
          </div>

          {/* Stats */}
          {detail?.stats && detail.stats.length > 0 && (
            <div className="space-y-3 mb-6">
              {detail.stats.slice(0, 3).map((stat, idx) => (
                <div key={idx} className="flex items-center gap-3 h-6 overflow-hidden">
                  <TrendingUp size={16} className="text-white/60 flex-shrink-0" />
                  <div className="overflow-hidden truncate whitespace-nowrap">
                    <span className="text-white font-semibold">{stat.value}</span>
                    <span className="text-white/60 text-sm ml-2">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Arrow CTA */}
          <div className="flex justify-end">
            <ArrowRight size={24} className="text-white/80 group-hover:text-white transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CasesOverview() {
  const glowRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!glowRef.current) return;
    glowRef.current.style.setProperty("--gx", `${e.clientX}px`);
    glowRef.current.style.setProperty("--gy", `${e.clientY}px`);
    glowRef.current.style.opacity = "1";
  }

  const { featuredCases, gridCases } = useCasesData();
  const allCases = [...featuredCases, ...gridCases];
  const services = useServicesData();

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
      <CasesHero />
      <section className="bg-[#0e0d13] pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {allCases.map((c, i) => (
              <CaseGridCard key={c.slug} c={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0e0d13] py-24 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-16">
            <h2
              className="font-semibold text-white leading-none mb-4"
              style={{ fontSize: "var(--text-h2)" }}
            >
              {t("cases.relatedServices")}
            </h2>
            <p
              className="text-white/60 font-light"
              style={{ fontSize: "var(--text-body)" }}
            >
              {t("cases.relatedServicesDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {services.map((service, i) => (
              <ServiceTile key={service.slug} service={service} index={i} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
