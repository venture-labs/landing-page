import { useParams, Navigate } from "react-router";
import { useEffect } from "react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { getCaseDetail } from "@/data/caseDetails";

const accentColor = "#2b95f6";

function CaseHero({ detail }: { detail: any }) {
  const ref = useRef(null);
  return (
    <section className="relative pt-36 pb-0 bg-[#1E1C27] overflow-hidden" ref={ref}>
      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-150px] left-[-200px] w-[800px] h-[800px] rounded-full blur-[140px]"
          style={{ background: `${accentColor}18` }}
        />
        <div
          className="absolute top-[200px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: `${accentColor}10` }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto">
        {/* TEXT BLOCK */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8 px-6 lg:px-12 pb-12"
        >
          <p
            className="font-['Sofia_Pro',sans-serif] font-light"
            style={{ fontSize: "var(--text-body)", color: accentColor }}
          >
            Case Study · {detail.category.split(" ").slice(0, 3).join(" ")}
          </p>
          <h1
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {detail.heroHeadline}
          </h1>
          <p
            className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {detail.heroSubline}
          </p>
          <a
            href="/#kontakt"
            className="self-start inline-flex items-center gap-2 text-white font-['Sofia_Pro',sans-serif] font-semibold px-[24px] pt-[14px] pb-[8px] rounded-lg transition-all hover:scale-[1.02]"
            style={{ fontSize: "var(--text-btn)", backgroundColor: accentColor }}
          >
            Jetzt anfragen
            <ArrowRight size={15} />
          </a>
        </motion.div>

        {/* IMAGE */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mx-6 lg:mx-8 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 mb-12"
        >
          <img
            src={detail.heroImage}
            alt={detail.heroHeadline}
            className="w-full object-cover"
            style={{ maxHeight: "560px" }}
          />
        </motion.div>
      </div>
    </section>
  );
}

function OverviewSection({ detail }: { detail: any }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-20 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white mb-12"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Übersicht
        </motion.h2>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <h3
            className="text-white/80 font-['Sofia_Pro',sans-serif] font-light mb-6"
            style={{ fontSize: "var(--text-body)" }}
          >
            Was wir gemacht haben
          </h3>
          <p
            className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed max-w-3xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {detail.description}
          </p>
        </motion.div>

        {/* Three columns: Hintergrund, Problem, Lösung */}
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3
              className="text-white font-['Sofia_Pro',sans-serif] font-semibold mb-4"
              style={{ fontSize: "var(--text-card)" }}
            >
              Hintergrund
            </h3>
            <p
              className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {detail.background}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3
              className="text-white font-['Sofia_Pro',sans-serif] font-semibold mb-4"
              style={{ fontSize: "var(--text-card)" }}
            >
              Problem
            </h3>
            <p
              className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {detail.problem}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3
              className="text-white font-['Sofia_Pro',sans-serif] font-semibold mb-4"
              style={{ fontSize: "var(--text-card)" }}
            >
              Lösung
            </h3>
            <p
              className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {detail.solution}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ResultsSection({ detail }: { detail: any }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-20 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white mb-12"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Ergebnisse
        </motion.h2>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {detail.stats.map((stat: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="text-center"
            >
              <p
                className="font-['Sofia_Pro',sans-serif] font-semibold text-white mb-2"
                style={{ fontSize: "var(--text-hero)", color: accentColor }}
              >
                {stat.value}
              </p>
              <p
                className="text-white/60 font-['Sofia_Pro',sans-serif] font-light"
                style={{ fontSize: "var(--text-body)" }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mockup Gallery - 2 column */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {detail.mockupImages.slice(0, 2).map((img: string, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
              className="min-h-[300px] flex items-center justify-center"
            >
              <img
                src={img}
                alt={`Mockup ${idx + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>
          ))}
        </div>

        {/* Full width mockup */}
        {detail.mockupImages[2] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center py-12"
          >
            <img
              src={detail.mockupImages[2]}
              alt="Full mockup"
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-20 px-6 lg:px-12 border-t border-white/10">
      <div className="max-w-[1400px] mx-auto text-center" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white mb-8"
          style={{ fontSize: "var(--text-card)" }}
        >
          Interessiert an einer Zusammenarbeit für dein Projekt?
          <br />
          Nimm jetzt Kontakt auf!
        </motion.h2>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          href="/#kontakt"
          className="inline-flex items-center gap-2 text-white font-['Sofia_Pro',sans-serif] font-semibold px-[24px] pt-[14px] pb-[8px] rounded-lg transition-all hover:scale-[1.02]"
          style={{ fontSize: "var(--text-btn)", backgroundColor: accentColor }}
        >
          Kontakt aufnehmen
          <ArrowRight size={15} />
        </motion.a>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/60 font-['Sofia_Pro',sans-serif] font-light mt-8"
          style={{ fontSize: "var(--text-body)" }}
        >
          Du möchtest eine kostenlose Erstberatung?
          <br />
          Wir helfen gern. Bei Fragen oder dem Wunsch, melden uns zurück.
        </motion.p>
      </div>
    </section>
  );
}

export default function CaseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const detail = slug ? getCaseDetail(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!detail) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0e0d13] text-white">
      <Navbar />
      <CaseHero detail={detail} />
      <OverviewSection detail={detail} />
      <ResultsSection detail={detail} />
      <CTASection />
      <Footer />
    </div>
  );
}
