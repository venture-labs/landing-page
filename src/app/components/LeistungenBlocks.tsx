import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight, ArrowUpRight, Database, Plus } from "lucide-react";
import { INTEGRATION_LOGOS } from "@/app/components/brandLogos";
import { Link } from "react-router";
import { useLeistungenData } from "@/data/content";
import { useLocale } from "@/app/locale";

/**
 * The content blocks the /leistungen page adds around its existing sections
 * (SEO rework, 2026-11-24): a proof strip under the hero, the tools the
 * automation connects to, the FAQ (also emitted as FAQPage JSON-LD by
 * scripts/prerender.ts from the same content field) and a "read on" block
 * that links the landing pages and blog articles. Every text comes from
 * content/site/leistungen{,.en}.md.
 */

function useReveal() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return { ref, inView };
}

/* ─── proof strip ────────────────────────────────────────────────────── */

export function ProofStrip() {
  const { proofHeading, proofStats } = useLeistungenData();
  const { localizedPath } = useLocale();
  const { ref, inView } = useReveal();
  if (proofStats.length === 0) return null;

  return (
    <section ref={ref} className="bg-[#181620] border-y border-white/[0.06] py-12" aria-labelledby="proof-heading">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-8">
        <h2
          id="proof-heading"
          className="font-semibold uppercase tracking-[0.16em] text-white/45"
          style={{ fontSize: "var(--text-small)" }}
        >
          {proofHeading}
        </h2>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
          {proofStats.map((stat, i) => (
            <motion.li
              key={stat.source}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-1.5"
            >
              <span
                className="font-semibold leading-none bg-clip-text text-transparent"
                style={{
                  fontSize: "clamp(2rem, 3.6vw, 3rem)",
                  backgroundImage: "linear-gradient(90deg, #2b95f6, #a318f8 60%, #fda700)",
                }}
              >
                {stat.value}
              </span>
              <span className="text-white/75 font-light leading-snug" style={{ fontSize: "var(--text-body)" }}>
                {stat.label}
              </span>
              <Link
                to={localizedPath(stat.href)}
                className="self-start inline-flex items-center gap-1 text-white/45 hover:text-white transition-colors"
                style={{ fontSize: "var(--text-small)" }}
              >
                {stat.source}
                <ArrowUpRight size={13} />
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── integrations ───────────────────────────────────────────────────── */

export function IntegrationsSection() {
  const { integrationsHeading, integrationsIntro, integrations, integrationsNote } = useLeistungenData();
  const { ref, inView } = useReveal();
  if (integrations.length === 0) return null;

  return (
    <section ref={ref} className="bg-[#181620] py-24" id="integrationen">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 max-w-2xl"
        >
          <h2 className="font-semibold text-white leading-tight" style={{ fontSize: "var(--text-section)" }}>
            {integrationsHeading}
          </h2>
          <p className="text-white/60 font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
            {integrationsIntro}
          </p>
        </motion.div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {integrations.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-3 rounded-2xl p-6 bg-white/[0.02]"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}
            >
              <span className="flex items-center gap-4 h-8 text-white" aria-hidden>
                {(INTEGRATION_LOGOS[item.id] ?? []).length > 0
                  ? INTEGRATION_LOGOS[item.id].map((mark) => (
                      <svg key={mark.title} viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                        <title>{mark.title}</title>
                        <path d={mark.path} />
                      </svg>
                    ))
                  : <Database size={26} strokeWidth={1.5} />}
              </span>
              <h3 className="font-semibold text-white leading-tight" style={{ fontSize: "var(--text-h3)" }}>
                {item.label}
              </h3>
              <p className="text-white/55 font-light leading-snug" style={{ fontSize: "var(--text-body)" }}>
                {item.body}
              </p>
            </motion.li>
          ))}
        </ul>

        {integrationsNote && (
          <p className="text-white/45 font-light" style={{ fontSize: "var(--text-body)" }}>
            {integrationsNote}
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────── */

/**
 * Native <details>: every answer is in the prerendered HTML (a Radix
 * accordion unmounts closed panels), keyboard and screen-reader support come
 * from the browser, and no JavaScript is needed to open one.
 */
export function FaqSection() {
  const { faqHeading, faq } = useLeistungenData();
  const { ref, inView } = useReveal();
  if (faq.length === 0) return null;

  return (
    <section ref={ref} className="bg-[#0e0d13] py-24" id="faq">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-12 flex flex-col gap-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-semibold text-white leading-tight"
          style={{ fontSize: "var(--text-section)" }}
        >
          {faqHeading}
        </motion.h2>
        <div className="flex flex-col border-t border-white/10">
          {faq.map((item) => (
            <details key={item.question} className="group border-b border-white/10">
              <summary className="flex items-start justify-between gap-6 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white rounded-sm">
                <h3 className="font-medium text-white leading-snug" style={{ fontSize: "var(--text-h3)" }}>
                  {item.question}
                </h3>
                <Plus
                  size={20}
                  aria-hidden
                  className="mt-1 shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p
                className="pb-6 pr-10 text-white/65 font-light leading-relaxed max-w-3xl"
                style={{ fontSize: "var(--text-body)" }}
              >
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── read on ────────────────────────────────────────────────────────── */

export function ResourcesSection() {
  const { resourcesHeading, resourcesIntro, resources } = useLeistungenData();
  const { localizedPath } = useLocale();
  const { ref, inView } = useReveal();
  if (resources.length === 0) return null;

  return (
    <section ref={ref} className="bg-[#181620] py-24" id="weiterlesen">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 max-w-2xl"
        >
          <h2 className="font-semibold text-white leading-tight" style={{ fontSize: "var(--text-section)" }}>
            {resourcesHeading}
          </h2>
          <p className="text-white/60 font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
            {resourcesIntro}
          </p>
        </motion.div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((r) => (
            <li key={r.href}>
              <Link
                to={localizedPath(r.href)}
                className="group h-full flex flex-col gap-2 rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}
              >
                <span
                  className="font-semibold text-white leading-snug flex items-start justify-between gap-4"
                  style={{ fontSize: "var(--text-h3)" }}
                >
                  {r.label}
                  <ArrowRight
                    size={18}
                    aria-hidden
                    className="mt-1 shrink-0 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                  />
                </span>
                <span className="text-white/55 font-light leading-snug" style={{ fontSize: "var(--text-body)" }}>
                  {r.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
