import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { PulseJourney } from "@/app/components/PulseJourney";
import { SkillMatrix } from "@/app/components/SkillMatrix";
import { PulseCheckModal } from "@/app/components/PulseCheckModal";
import { useLeistungenData } from "@/data/content";
import { useLocale } from "@/app/locale";

const ACCENT = "#8129ff";

/* ─── hero ──────────────────────────────────────────────────────────── */

function LeistungenHero({ onQuizOpen }: { onQuizOpen: () => void }) {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const data = useLeistungenData();

  return (
    <section
      className="relative pt-40 pb-32 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #1E1C27 0%, #1E1C27 45%, #181620 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-250px] left-[-200px] w-[700px] h-[500px] rounded-full bg-[#8129ff]/10 blur-[120px]" />
        <div className="absolute top-[100px] right-[-150px] w-[500px] h-[400px] rounded-full bg-[#2b95f6]/8 blur-[120px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8 max-w-3xl"
        >
          <span
            className="font-semibold uppercase tracking-[0.16em]"
            style={{ fontSize: "var(--text-small)", color: ACCENT }}
          >
            {data.heroEyebrow}
          </span>

          <h1
            className="font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {data.heroTitlePrefix}{" "}
            <span className="relative inline-block">
              <span className="relative z-10">{data.heroTitleHighlight}</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-1 left-0 w-full h-[4px] rounded-full origin-left"
                style={{ background: "linear-gradient(90deg, #2b95f6, #a318f8, #fda700)" }}
              />
            </span>
          </h1>

          <p
            className="text-white/60 font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {data.heroSubheading}
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onQuizOpen}
              className="inline-flex items-center gap-2 text-white font-semibold rounded-lg px-6 py-3 transition-transform hover:scale-[1.02]"
              style={{ fontSize: "var(--text-btn)", backgroundColor: ACCENT }}
            >
              {t("leistungen.pulseCta")}
              <ArrowRight size={16} />
            </button>
            <Link
              to={localizedPath("/kontakt")}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/12 text-white font-medium rounded-lg px-6 py-3 transition-colors"
              style={{ fontSize: "var(--text-btn)" }}
            >
              {t("leistungen.ctaContact")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── closing CTA ────────────────────────────────────────────────────── */

function PulseCallout({ onQuizOpen }: { onQuizOpen: () => void }) {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const data = useLeistungenData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="py-24"
      style={{
        background:
          "linear-gradient(135deg, rgba(43,149,246,0.10) 0%, rgba(163,24,248,0.10) 50%, rgba(253,167,0,0.08) 100%)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-section)" }}
          >
            {data.ctaHeading}
          </h2>
          <p
            className="text-white/70 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {data.ctaBody}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 shrink-0">
          <button
            type="button"
            onClick={onQuizOpen}
            className="inline-flex items-center gap-2 bg-white text-[#1E1C27] font-semibold rounded-lg px-6 py-3 transition-transform hover:scale-[1.02]"
            style={{ fontSize: "var(--text-btn)" }}
          >
            {t("leistungen.pulseCta")}
            <ArrowRight size={16} />
          </button>
          <Link
            to={localizedPath("/kontakt")}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg px-6 py-3 transition-colors"
            style={{ fontSize: "var(--text-btn)" }}
          >
            {t("leistungen.ctaContact")}
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── contact strip ──────────────────────────────────────────────────── */

function ContactStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const data = useLeistungenData();

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-[#1c1a27] py-20"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <p
          className="text-white/50 font-light max-w-xl"
          style={{ fontSize: "var(--text-body)" }}
        >
          {data.contactCallout}
        </p>
        <a
          href="mailto:contact@venturelabs.team"
          className="font-semibold text-[#8129ff] hover:text-[#a318f8] transition-colors"
          style={{ fontSize: "clamp(1.2rem, 2vw, 1.75rem)" }}
        >
          contact@venturelabs.team
        </a>
      </div>
    </motion.section>
  );
}

/* ─── page ───────────────────────────────────────────────────────────── */

export function Leistungen() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      <LeistungenHero onQuizOpen={() => setQuizOpen(true)} />
      <PulseJourney />
      <SkillMatrix />
      <PulseCallout onQuizOpen={() => setQuizOpen(true)} />
      <ContactStrip />
      <Footer />
      <PulseCheckModal open={quizOpen} onOpenChange={setQuizOpen} />
    </div>
  );
}
