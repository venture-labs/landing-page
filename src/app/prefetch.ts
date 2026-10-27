/**
 * Warm the only visible asset of /de/leistungen (the explainer video's poster)
 * before the visitor gets there, so the page does not open with an empty black
 * box. The JS for the route is already in the entry bundle; the poster is the
 * one request a client-side navigation to it still has to make.
 *
 * Uses the same srcset/sizes as ExplainerVideo, so the browser picks (and
 * caches) the very file the page will ask for. Skipped on Save-Data.
 */
const POSTER = "/video/erklaervideo-poster-v5.webp";
const POSTER_SMALL = "/video/erklaervideo-poster-v5-640.webp";
const SIZES = "(min-width: 1024px) 560px, calc(100vw - 48px)";

let done = false;

export function prefetchLeistungenPoster(): void {
  if (done || typeof window === "undefined") return;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (c?.saveData) return;
  done = true;
  const img = new Image();
  img.sizes = SIZES;
  img.srcset = `${POSTER_SMALL} 640w, ${POSTER} 1280w`;
  img.src = POSTER;
}

/** True for the /<lang>/leistungen link. */
export function isLeistungenHref(href: string): boolean {
  return /^\/(de|en)\/leistungen\/?$/.test(href);
}
