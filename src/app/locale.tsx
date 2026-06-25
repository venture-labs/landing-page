import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router";
import i18n from "@/i18n";

export type Locale = "de" | "en";
export const LOCALES: Locale[] = ["de", "en"];
export const DEFAULT_LOCALE: Locale = "de";

function isLocale(value: string | undefined): value is Locale {
  return value === "de" || value === "en";
}

/** Turns a content-authored path ("/leistungen", "/#kontakt", "/") into a locale-prefixed route. */
export function localizedPath(path: string, lang: Locale): string {
  if (path.startsWith("/#")) return `/${lang}${path.slice(1)}`;
  if (path === "/") return `/${lang}`;
  if (path.startsWith("/")) return `/${lang}${path}`;
  return path;
}

/** Swaps the locale segment of an already-localized pathname, keeping the rest of the path. */
export function swapLocale(pathname: string, lang: Locale): string {
  const swapped = pathname.replace(/^\/(de|en)(?=\/|$)/, `/${lang}`);
  return swapped === pathname && !/^\/(de|en)(?=\/|$)/.test(pathname) ? `/${lang}` : swapped;
}

interface LocaleContextValue {
  lang: Locale;
  localizedPath: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function LocaleProvider({ lang, children }: { lang: Locale; children: ReactNode }) {
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      lang,
      localizedPath: (path: string) => localizedPath(path, lang),
    }),
    [lang]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a <LangGuard>");
  return ctx;
}

/** Validates the :lang route param and provides locale context to its children. */
export function LangGuard({ children }: { children: ReactNode }) {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  if (!isLocale(lang)) {
    const rest = location.pathname.replace(/^\/[^/]*/, "");
    return <Navigate to={`/${DEFAULT_LOCALE}${rest}${location.hash}`} replace />;
  }

  return <LocaleProvider lang={lang}>{children}</LocaleProvider>;
}
