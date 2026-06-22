import { Link } from "react-router";
import svgPaths from "@/imports/🖌Homepage/svg-oa0apfkpzr";

function FooterLogo() {
  return (
    <svg className="h-10 w-auto" fill="none" viewBox="0 0 239 63" aria-label="VentureLabs">
      <g clipPath="url(#clip-footer-logo)">
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
        <clipPath id="clip-footer-logo">
          <rect fill="white" height="63" width="239" />
        </clipPath>
      </defs>
    </svg>
  );
}

const footerColumns = [
  {
    title: "Leistungen",
    links: [
      { label: "Produktentwicklung", href: "/leistungen/development" },
      { label: "Company Building", href: "/leistungen/company-building" },
      { label: "Webdesign & UX", href: "/leistungen/webdesign" },
      { label: "KI Strategie", href: "/leistungen/ki-strategie" },
    ],
  },
  {
    title: "Projekte",
    links: [
      { label: "Tap2Link", href: "#projekte" },
      { label: "Brylliant", href: "#projekte" },
      { label: "Moerschen", href: "#projekte" },
      { label: "MachineMaster", href: "#projekte" },
    ],
  },
  {
    title: "Über uns",
    links: [
      { label: "Team", href: "#" },
      { label: "Jobs", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Presse", href: "#" },
    ],
  },
  {
    title: "Kontakt",
    links: [
      { label: "Gespräch buchen", href: "#kontakt" },
      { label: "hello@venturelabs.de", href: "mailto:hello@venturelabs.de" },
      { label: "LinkedIn", href: "#" },
      { label: "Instagram", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="kontakt" className="bg-[#0e0d13] border-t border-white/8 pt-16 pb-10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-1">
            <FooterLogo />
            <p
              className="mt-4 text-white/40 font-light leading-relaxed max-w-[200px]"
              style={{ fontSize: "var(--text-small)" }}
            >
              Digitale Produkte, die wirklich funktionieren.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <p
                className="text-white font-semibold"
                style={{ fontSize: "var(--text-small)" }}
              >
                {col.title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") && !link.href.startsWith("/#") ? (
                      <Link
                        to={link.href}
                        className="text-white/40 hover:text-white/80 transition-colors font-light"
                        style={{ fontSize: "var(--text-small)" }}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-white/40 hover:text-white/80 transition-colors font-light"
                        style={{ fontSize: "var(--text-small)" }}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            className="text-white/30 font-light"
            style={{ fontSize: "var(--text-small)" }}
          >
            © {new Date().getFullYear()} VentureLabs. Alle Rechte vorbehalten.
          </p>
          <div className="flex gap-6">
            {["Impressum", "Datenschutz", "AGB"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-white/30 hover:text-white/60 transition-colors font-light"
                style={{ fontSize: "var(--text-small)" }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
