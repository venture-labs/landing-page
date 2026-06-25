import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { Link, useLocation } from "react-router";
import { useSiteData } from "@/data/live";
import { tinaField } from "tinacms/dist/react";
import svgPaths from "@/imports/🖌Homepage/svg-oa0apfkpzr";

function LogoMark() {
  return (
    <svg className="h-11 w-auto" fill="none" viewBox="0 0 239 63" aria-label="VentureLabs">
      <g clipPath="url(#clip-nav-logo)">
        <path d={svgPaths.p36555900} fill="white" />
        <path d={svgPaths.p8830c00} fill="white" />
        <path d={svgPaths.p31cb1900} fill="white" />
        <path d={svgPaths.p3db48d80} fill="white" />
        <path d={svgPaths.p21b8e400} fill="white" />
        <path d={svgPaths.pe473100} fill="white" />
        <path d={svgPaths.p2a2d780} fill="white" />
        <path d={svgPaths.p1141d000} fill="white" />
        <path d={svgPaths.pd9aa300} fill="white" />
        <path d={svgPaths.p34fc9680} fill="white" />
        <path d={svgPaths.p34a98200} fill="white" />
        <path d={svgPaths.p104c2e00} fill="white" />
        <path d={svgPaths.p3b29af00} fill="white" />
        <path d={svgPaths.p8d7d8c0} fill="white" />
      </g>
      <defs>
        <clipPath id="clip-nav-logo">
          <rect fill="white" height="63" width="239" />
        </clipPath>
      </defs>
    </svg>
  );
}

function NavLink({
  item,
  fieldName,
  onClick,
}: {
  item: { label: string; href: string };
  fieldName?: string;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isRoute = item.href.startsWith("/") && !item.href.startsWith("/#");
  const isActive = isRoute && location.pathname === item.href;

  const cls = `transition-colors tracking-[-0.02em] ${
    isActive ? "text-white" : "text-white/70 hover:text-white"
  }`;
  const style = { fontSize: "var(--text-body)" };

  if (isRoute) {
    return (
      <Link to={item.href} className={cls} style={style} onClick={onClick} data-tina-field={fieldName}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={item.href} className={cls} style={style} onClick={onClick} data-tina-field={fieldName}>
      {item.label}
    </a>
  );
}

export function Navbar() {
  const siteData = useSiteData();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e0d13]/90 to-transparent backdrop-blur-[2px]" />
      <nav className="relative max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        <Link to="/" aria-label="VentureLabs home" className="py-3 pr-6">
          <LogoMark />
        </Link>

        <ul className="hidden lg:flex items-center gap-8">
          {siteData.nav.map((item, i) => (
            <li key={item.href}>
              <NavLink item={item} fieldName={tinaField(siteData, "nav", i)} />
            </li>
          ))}
        </ul>

        <a
          href="/#kontakt"
          className="hidden lg:flex items-center gap-2 bg-[#8129ff] hover:bg-[#9140ff] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
          style={{ fontSize: "var(--text-btn)" }}
        >
          Kontakt aufnehmen
        </a>

        <button
          className="lg:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden absolute top-20 left-0 right-0 bg-[#0e0d13]/95 backdrop-blur-md border-b border-white/10 px-6 py-6 flex flex-col gap-4"
        >
          {siteData.nav.map((item, i) => (
            <NavLink
              key={item.href}
              item={item}
              fieldName={tinaField(siteData, "nav", i)}
              onClick={() => setOpen(false)}
            />
          ))}
          <a
            href="/#kontakt"
            className="mt-2 inline-flex items-center justify-center bg-[#8129ff] text-white font-semibold px-5 py-3 rounded-lg"
            style={{ fontSize: "var(--text-btn)" }}
            onClick={() => setOpen(false)}
          >
            Kontakt aufnehmen
          </a>
        </motion.div>
      )}
    </header>
  );
}
