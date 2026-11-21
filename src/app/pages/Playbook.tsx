import { useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useLocale } from "@/app/locale";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";

/** The guide lives in public/downloads, so the file is served as is: a direct download, no form, no e-mail. */
const PDF_HREF = "/downloads/playbook-rolle-oder-eigener-agent.pdf";
const COVER_SRC = "/downloads/playbook-cover.png";

/**
 * Lead magnet page `/:lang/playbook` (reached from Instagram: comment "Playbook", link in the DM).
 * Direct download without a form on purpose: no personal data is collected here, so the
 * Datenschutz page needs no change. The download is counted as the Plausible custom event
 * "Playbook Downloaded" (a goal Christian creates in Plausible).
 */
export function Playbook() {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const inside = t("playbook.inside", { returnObjects: true }) as string[];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0d13] text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section
          className="relative pt-40 pb-20 overflow-hidden"
          style={{ background: "linear-gradient(180deg, #1E1C27 0%, #1E1C27 40%, #0e0d13 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-250px] right-[-200px] w-[700px] h-[500px] rounded-full bg-[#8129ff]/10 blur-[120px]" />
          </div>
          <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-20 items-center">
            <div className="flex flex-col gap-6">
              <span
                className="font-semibold uppercase tracking-[0.16em] text-[#d9aeff]"
                style={{ fontSize: "var(--text-small)" }}
              >
                {t("playbook.eyebrow")}
              </span>
              <h1 className="font-semibold text-white leading-[1.05]" style={{ fontSize: "var(--text-hero)" }}>
                {t("playbook.heroTitle")}
              </h1>
              <p className="text-white/60 font-light leading-relaxed max-w-2xl" style={{ fontSize: "var(--text-body)" }}>
                {t("playbook.heroSubtitle")}
              </p>
              <div className="flex flex-col gap-3 items-start">
                <a
                  href={PDF_HREF}
                  download
                  onClick={() => trackEvent(EVENTS.playbookDownloaded, PLACEMENTS.playbookDownload)}
                  className="inline-flex items-center gap-2 bg-[#8129ff] hover:bg-[#a318f8] border border-[#8129ff] text-white font-semibold px-[24px] py-[12px] rounded-lg transition-all"
                  style={{ fontSize: "var(--text-btn)" }}
                >
                  <Download size={18} aria-hidden />
                  {t("playbook.download")}
                </a>
                <span className="text-white/50" style={{ fontSize: "var(--text-small)" }}>
                  {t("playbook.downloadMeta")}
                </span>
              </div>
            </div>
            <img
              src={COVER_SRC}
              alt={t("playbook.coverAlt")}
              width={640}
              height={800}
              className="w-full max-w-[420px] justify-self-center rounded-2xl border border-white/10 shadow-[0_30px_80px_rgba(129,41,255,0.25)]"
            />
          </div>
        </section>

        <section className="border-t border-white/8 py-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-white" style={{ fontSize: "var(--text-h2)" }}>
                {t("playbook.insideTitle")}
              </h2>
              <ul className="flex flex-col gap-3 text-white/70 font-light list-disc pl-5" style={{ fontSize: "var(--text-body)" }}>
                {inside.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-white" style={{ fontSize: "var(--text-h2)" }}>
                {t("playbook.forWhoTitle")}
              </h2>
              <p className="text-white/70 font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
                {t("playbook.forWho")}
              </p>
              <p className="text-white/40" style={{ fontSize: "var(--text-small)" }}>
                {t("playbook.note")}
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-white/8 py-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-5 max-w-3xl">
            <h2 className="font-semibold text-white" style={{ fontSize: "var(--text-h2)" }}>
              {t("playbook.ctaTitle")}
            </h2>
            <p className="text-white/70 font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
              {t("playbook.ctaText")}
            </p>
            <Link
              to={localizedPath("/kontakt")}
              onClick={() => trackEvent(EVENTS.contactSent, PLACEMENTS.playbookCta, CTAS.contact)}
              className="self-start inline-flex items-center gap-2 bg-[#8129ff] hover:bg-[#a318f8] border border-[#8129ff] text-white font-semibold px-[24px] py-[11px] rounded-lg transition-all"
              style={{ fontSize: "var(--text-btn)" }}
            >
              {t("playbook.ctaButton")}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
