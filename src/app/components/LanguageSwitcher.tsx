import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { LOCALES, swapLocale, useLocale } from "@/app/locale";

export function LanguageSwitcher() {
  const { lang } = useLocale();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {LOCALES.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span className="text-white/30">/</span>}
          <Link
            to={swapLocale(location.pathname, locale) + location.hash}
            className={
              locale === lang
                ? "text-white"
                : "text-white/50 hover:text-white transition-colors"
            }
          >
            {t(`languageSwitcher.${locale}`)}
          </Link>
        </span>
      ))}
    </div>
  );
}
