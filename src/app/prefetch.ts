/**
 * Warm the only visible asset of /<lang>/leistungen (the explainer video's poster)
 * before the visitor gets there, so the page does not open with an empty black
 * box. The JS for the route is already in the entry bundle; the poster is the
 * one request a client-side navigation to it still has to make.
 *
 * Uses the same srcset/sizes as ExplainerVideo, so the browser picks (and
 * caches) the very file the page will ask for. Skipped on Save-Data.
 */
const POSTER = { de: "/video/erklaervideo-poster-v5.webp", en: "/video/erklaervideo-poster-v5.en.webp" };
const POSTER_SMALL = { de: "/video/erklaervideo-poster-v5-640.webp", en: "/video/erklaervideo-poster-v5-640.en.webp" };
const SIZES = "(min-width: 1024px) 560px, calc(100vw - 48px)";

let done = false;

export function prefetchLeistungenPoster(): void {
  if (done || typeof window === "undefined") return;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (c?.saveData) return;
  done = true;
  // Each locale has its own poster (burned-in title); the page the visitor is on decides.
  const lang = window.location.pathname.startsWith("/en") ? "en" : "de";
  const img = new Image();
  img.sizes = SIZES;
  img.srcset = `${POSTER_SMALL[lang]} 640w, ${POSTER[lang]} 1280w`;
  img.src = POSTER[lang];
}

/** True for the /<lang>/leistungen link. */
export function isLeistungenHref(href: string): boolean {
  return /^\/(de|en)\/leistungen\/?$/.test(href);
}
