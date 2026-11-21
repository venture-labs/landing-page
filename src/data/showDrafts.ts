/**
 * Preview switch for the article drafts (`draft: true` in content/blog).
 *
 * Production (Netlify context `production`, or a plain local build) keeps drafts
 * out of the blog list, the knowledge hub and the sitemap, and they stay noindex.
 * A Netlify branch deploy or deploy preview (the dev site that Christian reads
 * through) lists every draft with an "Entwurf" badge and puts it into the sitemap,
 * so all articles are reachable there. The page itself stays `noindex`.
 * `SHOW_DRAFTS=1` forces it for a local build. Free of React and Node-only APIs
 * so vite.config.ts, scripts/prerender.ts and the app can all read it.
 */
export function previewDraftsEnabled(env: { CONTEXT?: string; SHOW_DRAFTS?: string }): boolean {
  if (env.SHOW_DRAFTS === "1") return true;
  return env.CONTEXT === "branch-deploy" || env.CONTEXT === "deploy-preview";
}

declare const __SHOW_DRAFTS__: boolean | undefined;

export const SHOW_DRAFTS: boolean =
  typeof __SHOW_DRAFTS__ !== "undefined"
    ? __SHOW_DRAFTS__
    : previewDraftsEnabled(typeof process !== "undefined" ? process.env : {});
