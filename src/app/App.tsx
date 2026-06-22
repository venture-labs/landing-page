import { useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ProfileSection } from "./components/ProfileSection";
import { Services } from "./components/Services";
import { ProjectsFeatured } from "./components/ProjectsFeatured";
import { ProjectsMore } from "./components/ProjectsMore";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";
import { Leistungen } from "./pages/Leistungen";
import { LeistungenDetail } from "./pages/LeistungenDetail";
import CaseDetail from "./pages/CaseDetail";

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
      <Pricing />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/leistungen" element={<Leistungen />} />
        <Route path="/leistungen/:slug" element={<LeistungenDetail />} />
        <Route path="/cases/:slug" element={<CaseDetail />} />
      </Routes>
    </BrowserRouter>
  );
}