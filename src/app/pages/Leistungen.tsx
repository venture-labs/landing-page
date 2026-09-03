import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight, Code2, Building2, Palette, Bot, Check } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useServicesData, useLeistungenData } from "@/data/content";
import { useLocale } from "@/app/locale";
import { type Service } from "@/data/de/services";

/* ─── hero ──────────────────────────────────────────────────────────── */

function LeistungenHero() {
  const { t } = useTranslation();
  const leistungenData = useLeistungenData();
  return (
    <section
      className="relative pt-40 pb-48 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1E1C27 0%, #1E1C27 40%, #0e0d13 100%)"
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
            {leistungenData.heroTitlePrefix}{" "}
            <span className="relative inline-block">
              <span className="relative z-10">{leistungenData.heroTitleHighlight}</span>
              <span
                className="absolute bottom-0 left-0 w-full h-[3px] rounded-full"
                style={{ background: "linear-gradient(90deg, #8129ff, #a318f8)" }}
              />
            </span>
          </h1>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {leistungenData.heroSubheading}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── service row ────────────────────────────────────────────────────── */

const iconMap: Record<Service["icon"], React.ReactNode> = {
  code: <Code2 size={28} strokeWidth={1.5} className="text-white" />,
  grid: <Building2 size={28} strokeWidth={1.5} className="text-white" />,
  palette: <Palette size={28} strokeWidth={1.5} className="text-white" />,
  bot: <Bot size={28} strokeWidth={1.5} className="text-white" />,
};

const accentColors: Record<string, string> = {
  development: "#a318f8",
  "company-building": "#ef4444",
  "ui-ux": "#2b95f6",
  "ai-consulting": "#fda700",
};

function ServiceRow({ service, index }: { service: Service; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const accent = accentColors[service.slug] ?? "#8129ff";
  const bullets = service.tags ?? [];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="group border-t border-white/8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24"
    >
      {/* Left: icon + title */}
      <div className="flex flex-col gap-8">
        <div
          className="w-14 h-14 flex items-center justify-center shrink-0"
          style={{ backgroundColor: accent + "22", border: `1px solid ${accent}44` }}
        >
          {iconMap[service.icon]}
        </div>
        <h2
          className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight"
          style={{ fontSize: "var(--text-h2)" }}
        >
          {service.title}
        </h2>
        <p
          className="text-white/50 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-sm"
          style={{ fontSize: "var(--text-body)" }}
        >
          {service.description}
        </p>
      </div>

      {/* Right: bullets + CTA */}
      <div className="flex flex-col justify-between gap-10">
        <ul className="flex flex-col gap-4">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <div
                className="mt-1 w-4 h-4 flex items-center justify-center shrink-0"
                style={{ backgroundColor: accent + "22" }}
              >
                <Check size={10} style={{ color: accent }} strokeWidth={3} />
              </div>
              <span
                className="text-white/80 font-['sofia-pro',sans-serif] font-light leading-snug"
                style={{ fontSize: "var(--text-body)" }}
              >
                {b}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Link
            to={localizedPath(`/leistungen/${service.slug}`)}
            className="inline-flex items-center gap-2 text-white font-['sofia-pro',sans-serif] font-semibold px-[24px] py-[11px] rounded-lg transition-all hover:scale-[1.02] border"
            style={{
              fontSize: "var(--text-btn)",
              backgroundColor: accent + "22",
              borderColor: accent + "44"
            }}
          >
            {t("leistungen.learnMore")}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── contact strip ──────────────────────────────────────────────────── */

function ContactStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { t } = useTranslation();
  const leistungenData = useLeistungenData();

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-[#1c1a27] py-20"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="flex flex-col gap-4 max-w-xl">
          <p
            className="text-white/50 font-['sofia-pro',sans-serif] font-light"
            style={{ fontSize: "var(--text-body)" }}
          >
            {leistungenData.contactCallout}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <a
            href="tel:+4914874f18f6"
            className="font-['sofia-pro',sans-serif] font-semibold text-[#8129ff] hover:text-[#a318f8] transition-colors"
            style={{ fontSize: "clamp(1.2rem, 2vw, 1.75rem)" }}
          >
            +49 148 74f 18f 6
          </a>
          <a
            href="mailto:contact@venturelabs.team"
            className="font-['sofia-pro',sans-serif] font-semibold text-[#8129ff] hover:text-[#a318f8] transition-colors"
            style={{ fontSize: "clamp(1.2rem, 2vw, 1.75rem)" }}
          >
            contact@venturelabs.team
          </a>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── page ───────────────────────────────────────────────────────────── */

export function Leistungen() {
  const glowRef = useRef<HTMLDivElement>(null);
  const services = useServicesData();

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
      <LeistungenHero />
      <section className="bg-[#0e0d13] py-4">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {services.map((s, i) => (
            <ServiceRow key={s.slug} service={s} index={i} />
          ))}
        </div>
      </section>
      <ContactStrip />
      <Footer />
    </div>
  );
}
