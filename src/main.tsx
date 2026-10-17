
  import { createRoot, hydrateRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import i18n from "./i18n.ts";
  import "./styles/index.css";

  // i18n.ts always inits with lng: "de". On an /en/... route LangGuard's
  // LocaleProvider only calls i18n.changeLanguage(lang) inside a useEffect,
  // which runs after the first render — too late for hydrateRoot's initial
  // match against the server-rendered (already-English) markup, and the
  // mismatch throws a real React hydration error (#418/#423/#425), not just
  // a console warning. changeLanguage resolves synchronously here (i18n.ts
  // passes both locales' resources at init, nothing to fetch), so setting it
  // from the URL's own locale segment before the first render keeps the
  // client's initial render in the same language the server already used
  // for that same path — the same segment-based detection entry-server.tsx
  // uses for the server render.
  const urlLang = window.location.pathname.split("/").filter(Boolean)[0] === "en" ? "en" : "de";
  i18n.changeLanguage(urlLang);

  // Every prerendered route (scripts/prerender.ts) ships its #root already
  // filled with the server-rendered markup, so it hydrates; the SPA fallback
  // (dist/index.html, served for any unmatched path incl. the 404 route)
  // leaves #root empty and mounts fresh exactly as before.
  const container = document.getElementById("root")!;
  if (container.firstElementChild) {
    hydrateRoot(container, <App />);
  } else {
    createRoot(container).render(<App />);
  }
