import { useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useLocale } from "@/app/locale";

/**
 * Catch-all for any path under a known `:lang` that matches no other route
 * (item 5) — a real page with navigation and a way out, instead of the blank
 * 200 the SPA used to render for an unmatched path.
 */
export function NotFound() {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0d13] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center">
        <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-12 py-40 flex flex-col gap-6">
          <span
            className="font-semibold uppercase tracking-[0.16em] text-[#8129ff]"
            style={{ fontSize: "var(--text-small)" }}
          >
            404
          </span>
          <h1
            className="font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {t("notFound.heading")}
          </h1>
          <p
            className="text-white/60 font-light leading-relaxed max-w-xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("notFound.message")}
          </p>
          <Link
            to={localizedPath("/leistungen")}
            className="self-start inline-flex items-center gap-2 text-white font-semibold rounded-lg px-6 py-3 transition-transform hover:scale-[1.02]"
            style={{ fontSize: "var(--text-btn)", backgroundColor: "#8129ff" }}
          >
            {t("notFound.cta")}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
