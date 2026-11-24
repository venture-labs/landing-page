import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router";
import { LangGuard, DEFAULT_LOCALE } from "./locale";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Leistungen } from "./pages/Leistungen";
import { LeistungenDetail } from "./pages/LeistungenDetail";
import { SeoLanding } from "./pages/SeoLanding";
import { useLandingPage } from "@/data/content";
import CaseDetail from "./pages/CaseDetail";
import { CasesOverview } from "./pages/CasesOverview";
import { Kontakt } from "./pages/Kontakt";
import { Blog } from "./pages/Blog";
import { BlogDetail } from "./pages/BlogDetail";
import { EntwurfReview } from "./pages/EntwurfReview";
import { Wissen } from "./pages/Wissen";
import { UeberUns } from "./pages/UeberUns";
import { Impressum } from "./pages/Impressum";
import { Datenschutz } from "./pages/Datenschutz";
import { Playbook } from "./pages/Playbook";
import { StartNeu } from "./pages/StartNeu";
import { NotFound } from "./pages/NotFound";

/** /leistungen/<slug>: an SEO landing page (content/landing/) when one exists for the slug, else the service detail. */
function LeistungenSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const landing = useLandingPage(slug);
  return landing ? <SeoLanding page={landing} /> : <LeistungenDetail />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const lang = location.pathname.startsWith("/en") ? "en" : "de";
  return (
    <ErrorBoundary key={location.pathname} lang={lang}>
      {children}
    </ErrorBoundary>
  );
}

/** Redirects a retired path (e.g. "/ai-pulse") to its replacement, keeping the current :lang. */
function LegacyRedirect({ to }: { to: string }) {
  const { lang } = useParams<{ lang: string }>();
  return <Navigate to={`/${lang ?? DEFAULT_LOCALE}${to}`} replace />;
}

/**
 * The whole route tree, shared verbatim between the client (wrapped in
 * `<BrowserRouter>` below) and the server entry (wrapped in `<StaticRouter>`
 * in src/entry-server.tsx) — one definition, so the prerendered HTML and the
 * hydrated client can never drift apart.
 */
export function AppRoutes() {
  return (
    <RoutedErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />
        <Route
          path="/:lang"
          element={
            <LangGuard>
              <StartNeu />
            </LangGuard>
          }
        />
        {/* The homepage draft lived here until it replaced the old homepage. */}
        <Route path="/:lang/start-neu" element={<LegacyRedirect to="" />} />
        <Route
          path="/:lang/leistungen"
          element={
            <LangGuard>
              <Leistungen />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/leistungen/:slug"
          element={
            <LangGuard>
              <LeistungenSlugPage />
            </LangGuard>
          }
        />
        <Route path="/:lang/leistungen/webdesign" element={<LegacyRedirect to="/leistungen/ai-experience" />} />
        <Route path="/:lang/leistungen/ki-strategie" element={<LegacyRedirect to="/leistungen/ai-automation" />} />
        <Route path="/:lang/leistungen/ai-consulting" element={<LegacyRedirect to="/leistungen/ai-automation" />} />
        <Route path="/:lang/leistungen/development" element={<LegacyRedirect to="/leistungen/ai-products" />} />
        <Route path="/:lang/leistungen/ui-ux" element={<LegacyRedirect to="/leistungen/ai-experience" />} />
        <Route path="/:lang/leistungen/company-building" element={<LegacyRedirect to="/leistungen/venture-building" />} />
        <Route
          path="/:lang/cases"
          element={
            <LangGuard>
              <CasesOverview />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/cases/:slug"
          element={
            <LangGuard>
              <CaseDetail />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/kontakt"
          element={
            <LangGuard>
              <Kontakt />
            </LangGuard>
          }
        />
        <Route path="/:lang/ai-pulse" element={<LegacyRedirect to="/leistungen" />} />
        <Route
          path="/:lang/blog"
          element={
            <LangGuard>
              <Blog />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/entwurf-review"
          element={
            <LangGuard>
              <EntwurfReview />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/blog/:slug"
          element={
            <LangGuard>
              <BlogDetail />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/wissen"
          element={
            <LangGuard>
              <Wissen />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/wissen/:slug"
          element={
            <LangGuard>
              <BlogDetail section="wissen" />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/ueber-uns"
          element={
            <LangGuard>
              <UeberUns />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/playbook"
          element={
            <LangGuard>
              <Playbook />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/impressum"
          element={
            <LangGuard>
              <Impressum />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/datenschutz"
          element={
            <LangGuard>
              <Datenschutz />
            </LangGuard>
          }
        />
        <Route
          path="/:lang/*"
          element={
            <LangGuard>
              <NotFound />
            </LangGuard>
          }
        />
      </Routes>
    </RoutedErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}