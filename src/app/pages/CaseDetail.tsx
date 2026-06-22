import { useParams, Navigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { getCaseDetail } from "@/data/caseDetails";

const accentColor = "#2b95f6";

function CaseHero({ detail }: { detail: any }) {
  return (
    <section className="relative pt-36 pb-0 bg-[#0e0d13] overflow-hidden">
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
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-8 px-6 lg:px-12 pb-12"
        >
          <p
            className="font-['Sofia_Pro',sans-serif] font-light text-sm md:text-base"
            style={{ color: accentColor }}
          >
            Case Study · {detail.category.split(" ").slice(0, 2).join(" ")}
          </p>
          <h1
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-[1.05]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {detail.heroHeadline}
          </h1>
          <p
            className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed max-w-2xl text-sm md:text-base"
          >
            {detail.heroSubline}
          </p>
          <a
            href="/#kontakt"
            className="self-start inline-flex items-center gap-2 text-white font-['Sofia_Pro',sans-serif] font-semibold px-6 py-3 rounded-lg transition-all hover:scale-[1.02]"
            style={{ backgroundColor: accentColor }}
          >
            Kontakt aufnehmen
            <ArrowRight size={16} />
          </a>
        </motion.div>

        {/* IMAGE */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
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
  return (
    <section className="bg-[#0e0d13] py-20 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white text-3xl md:text-4xl mb-12"
        >
          Übersicht
        </motion.h2>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <h3 className="text-white/80 font-['Sofia_Pro',sans-serif] font-light text-base md:text-lg mb-6">
            Was wir gemacht haben
          </h3>
          <p className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed max-w-3xl">
            {detail.description}
          </p>
        </motion.div>

        {/* Three columns: Hintergrund, Problem, Lösung */}
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-white font-['Sofia_Pro',sans-serif] font-semibold text-lg mb-4">
              Hintergrund
            </h3>
            <p className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed text-sm">
              {detail.background}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-white font-['Sofia_Pro',sans-serif] font-semibold text-lg mb-4">
              Problem
            </h3>
            <p className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed text-sm">
              {detail.problem}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-white font-['Sofia_Pro',sans-serif] font-semibold text-lg mb-4">
              Lösung
            </h3>
            <p className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed text-sm">
              {detail.solution}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ResultsSection({ detail }: { detail: any }) {
  return (
    <section className="bg-[#0e0d13] py-20 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white text-3xl md:text-4xl mb-12"
        >
          Ergebnisse
        </motion.h2>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {detail.stats.map((stat: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="text-center"
            >
              <p
                className="font-['Sofia_Pro',sans-serif] font-semibold text-white text-4xl md:text-5xl mb-4"
                style={{ color: accentColor }}
              >
                {stat.value}
              </p>
              <p className="text-white/60 font-['Sofia_Pro',sans-serif] font-light text-sm">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mockup Gallery */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {detail.mockupImages.slice(0, 2).map((img: string, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
              className="rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 p-6 min-h-[300px] flex items-center justify-center"
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
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 p-8 flex items-center justify-center"
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
  return (
    <section className="bg-[#0e0d13] py-20 px-6 lg:px-12 border-t border-white/10">
      <div className="max-w-[1400px] mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white text-2xl md:text-3xl mb-8"
        >
          Interessiert an einer Zusammenarbeit für dein Projekt?
          <br />
          Nimm jetzt Kontakt auf!
        </motion.h2>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          href="/#kontakt"
          className="inline-flex items-center gap-2 text-white font-['Sofia_Pro',sans-serif] font-semibold px-8 py-4 rounded-lg transition-all hover:scale-[1.05]"
          style={{ backgroundColor: accentColor }}
        >
          Kontakt aufnehmen
          <ArrowRight size={18} />
        </motion.a>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/60 font-['Sofia_Pro',sans-serif] font-light text-sm mt-8"
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
