/**
 * Server entry used only at build time by scripts/prerender.ts (via the
 * `vite build --ssr` bundle in dist/server/) — never shipped to the browser
 * and never run at request time. Renders the exact same route tree the
 * client hydrates (src/app/App.tsx's AppRoutes), under react-router's
 * <StaticRouter> instead of <BrowserRouter>, so the markup prerender.ts
 * injects into each route's #root is byte-identical to what the client would
 * have rendered for that same URL.
 *
 * i18n.changeLanguage(lang) is awaited before the render: the one shared
 * i18next instance drives every <useTranslation()> chrome string, and
 * LocaleProvider's own useEffect (src/app/locale.tsx) never runs during
 * renderToString, so without this the render would use whatever language
 * i18n was last set to. Safe only because prerender.ts renders routes one at
 * a time (never Promise.all) — see the comment at its call site.
 */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { AppRoutes } from "./app/App";
import i18n from "./i18n";

export async function renderApp(path: string): Promise<string> {
  const lang = path.split("/").filter(Boolean)[0] === "en" ? "en" : "de";
  await i18n.changeLanguage(lang);
  return renderToString(
    <StaticRouter location={path}>
      <AppRoutes />
    </StaticRouter>
  );
}
