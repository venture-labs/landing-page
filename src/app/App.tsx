import { useRef, useCallback, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { LangGuard, DEFAULT_LOCALE } from "./locale";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ProfileSection } from "./components/ProfileSection";
import { Services } from "./components/Services";
import { ProjectsFeatured } from "./components/ProjectsFeatured";
import { ProjectsMore } from "./components/ProjectsMore";
import { Footer } from "./components/Footer";
import { Leistungen } from "./pages/Leistungen";
import { LeistungenDetail } from "./pages/LeistungenDetail";
import CaseDetail from "./pages/CaseDetail";
import { CasesOverview } from "./pages/CasesOverview";
import { Kontakt } from "./pages/Kontakt";
import { Blog } from "./pages/Blog";
import { BlogDetail } from "./pages/BlogDetail";
import { UeberUns } from "./pages/UeberUns";

function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  return { glowRef };
}

function HomePage() {
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!glowRef.current) return;
    glowRef.current.style.setProperty("--gx", `${e.clientX}px`);
    glowRef.current.style.setProperty("--gy", `${e.clientY}px`);
    glowRef.current.style.opacity = "1";
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0e0d13] text-white relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
      <Hero />
      <ProfileSection />
      <Services />
      <ProjectsFeatured />
      <ProjectsMore />
      <Footer />
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <BrowserRouter>
      <RoutedErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />
        <Route
          path="/:lang"
          element={
            <LangGuard>
              <HomePage />
            </LangGuard>
          }
        />
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
              <LeistungenDetail />
            </LangGuard>
          }
        />
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
        <Route
          path="/:lang/blog"
          element={
            <LangGuard>
              <Blog />
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
          path="/:lang/ueber-uns"
          element={
            <LangGuard>
              <UeberUns />
            </LangGuard>
          }
        />
      </Routes>
      </RoutedErrorBoundary>
    </BrowserRouter>
  );
}