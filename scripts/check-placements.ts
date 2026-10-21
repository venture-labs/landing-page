/**
 * Shared by scripts/check-analytics.ts (criterion 15, run via `pnpm
 * check:analytics`) and scripts/prerender.ts (wired into `pnpm build` itself
 * — see assertPlacementIds() there), so there is exactly one definition of
 * "a booking CTA is missing its Plausible placement id" and the build fails
 * on it, not just a separately invoked check.
 *
 * 20261017-tracking-every-booking-contact-button-identifiab, Reviewer finding
 * 1 (round 3): the previous version only lived in check-analytics.ts, which
 * `pnpm build` never runs, so an unattributed CTA still shipped.
 *
 * Round 4, Reviewer finding 1: the previous version of the two checks below
 * missed two valid-JavaScript ways to end up with no real placement:
 *   - `trackEvent(EVENTS.callLinkClicked,)` / `trackEvent(link.track!,)` — a
 *     trailing comma with nothing after it is still only ONE argument in JS,
 *     but the old regex required the closing `)` to immediately follow the
 *     first argument, so it missed this form entirely.
 *   - Footer's config-row form: deleting `placement: PLACEMENTS.footer` from
 *     a `{ track: EVENTS.callLinkClicked, ... }` row leaves the call site
 *     `trackEvent(link.track!, link.placement)` syntactically untouched (two
 *     arguments are still there) — `link.placement` just evaluates to
 *     `undefined` at runtime. Neither regex, which only ever looked at the
 *     call site, could catch that; this needs to look at the config row
 *     itself.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const CODE_EXTENSIONS = /\.(ts|tsx)$/;

/** Every .ts/.tsx file under `dir`, recursively. */
function findSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findSourceFiles(full));
    else if (CODE_EXTENSIONS.test(entry)) out.push(full);
  }
  return out;
}

/**
 * The smallest `{ ... }` object literal that encloses `index`, or null when
 * `index` sits outside any object literal (or the braces are unbalanced).
 */
function enclosingObjectLiteral(src: string, index: number): string | null {
  let depth = 0;
  let start = -1;
  for (let i = index; i >= 0; i--) {
    const ch = src[i];
    if (ch === "}") depth++;
    else if (ch === "{") {
      if (depth === 0) {
        start = i;
        break;
      }
      depth--;
    }
  }
  if (start === -1) return null;

  depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * True when `src` fires `EVENTS.callLinkClicked` without a real placement,
 * either:
 *   - directly: `trackEvent(EVENTS.callLinkClicked)` / `trackEvent(link.track!)`,
 *     with or without a trailing comma (`(x,)` is one argument in JS, not two) —
 *     no second argument at all; or
 *   - through a config row (Footer's `FooterLink` table): a `track:
 *     EVENTS.callLinkClicked` field whose enclosing object literal has no
 *     sibling `placement:` field, so the call site's second argument
 *     (`link.placement`) is `undefined` at runtime even though the call site
 *     itself looks fully attributed.
 */
function hasUnattributedCallLinkClicked(src: string): boolean {
  if (/trackEvent\(\s*EVENTS\.callLinkClicked\s*,?\s*\)/.test(src)) return true;
  if (/trackEvent\(\s*link\.track!?\s*,?\s*\)/.test(src)) return true;

  const trackFieldRegex = /\btrack:\s*EVENTS\.callLinkClicked\b/g;
  let match: RegExpExecArray | null;
  while ((match = trackFieldRegex.exec(src))) {
    const row = enclosingObjectLiteral(src, match.index);
    if (!row || !/\bplacement:/.test(row)) return true;
  }

  return false;
}

/**
 * Every file under `srcDir` that fires EVENTS.callLinkClicked (directly, or
 * through Footer's `link.track` table) without a real second (placement)
 * argument. Empty when every booking CTA is attributed.
 */
export function findMissingPlacementCallSites(srcDir: string): string[] {
  return findSourceFiles(srcDir).filter((f) => hasUnattributedCallLinkClicked(readFileSync(f, "utf-8")));
}

/* ─────────────────────────────────────────────────────────────────────────
 * 20261021-cta-tracking-every-call-to-action-fires-a-plausi — the `cta`
 * prop, mailto:/tel: links, PulseCheckModal's placement and the booking/
 * kontakt-link-without-onClick case. Four new, additive checks, in the same
 * regex-over-raw-source style as the placement check above; none of them
 * touch findMissingPlacementCallSites or hasUnattributedCallLinkClicked.
 * ───────────────────────────────────────────────────────────────────────── */

/** Number of top-level, comma-separated arguments in a call's argument text.
 * No trackEvent(...) call site in this codebase nests a function call inside
 * its arguments, so splitting on "," is safe. A lone trailing comma — still
 * one argument in JS, never two — is stripped before splitting. */
function countArgs(argsText: string): number {
  const trimmed = argsText.trim().replace(/,\s*$/, "");
  return trimmed === "" ? 0 : trimmed.split(",").length;
}

/**
 * True when `src` fires EVENTS.callLinkClicked / EVENTS.contactSent (directly,
 * or through Footer's `link.track` indirection) with fewer than three
 * arguments — i.e. no `cta` — or when a `track: EVENTS.callLinkClicked |
 * EVENTS.contactSent` config row has no sibling `cta:` field (the same
 * "call site looks attributed, the config row isn't" gap
 * hasUnattributedCallLinkClicked already guards for `placement`).
 */
function hasMissingCta(src: string): boolean {
  const callRegex = /trackEvent\(([^)]*)\)/g;
  let call: RegExpExecArray | null;
  while ((call = callRegex.exec(src))) {
    const firstArg = call[1].split(",")[0]?.trim() ?? "";
    const isTrackedEventCall =
      /^EVENTS\.(callLinkClicked|contactSent)$/.test(firstArg) || /^link\.track!?$/.test(firstArg);
    if (isTrackedEventCall && countArgs(call[1]) < 3) return true;
  }

  const trackFieldRegex = /\btrack:\s*EVENTS\.(callLinkClicked|contactSent)\b/g;
  let row: RegExpExecArray | null;
  while ((row = trackFieldRegex.exec(src))) {
    const enclosing = enclosingObjectLiteral(src, row.index);
    if (!enclosing || !/\bcta:/.test(enclosing)) return true;
  }

  return false;
}

export function findMissingCtaCallSites(srcDir: string): string[] {
  return findSourceFiles(srcDir).filter((f) => hasMissingCta(readFileSync(f, "utf-8")));
}

/**
 * Every complete JSX opening-tag text (`<TagName ...>` or `<TagName ... />`)
 * in `src` whose tag name matches `tagNameRegex`, found by balancing `{}`
 * depth and string state so a `>` inside an arrow function's `=>` or a
 * `style={{...}}` object, or a `>` sitting inside a template literal, never
 * ends the tag early. Lifted to its own helper because this task's three new
 * JSX-shaped checks below all need it (mailto/tel, PulseCheckModal,
 * booking/kontakt links) and tag text, not line text, is what each needs to
 * inspect — a `placement=`/`onClick=` attribute can sit on a different line
 * than the `href=`/`to=` it has to accompany.
 */
function extractOpeningTags(src: string, tagNameRegex: RegExp): string[] {
  const tags: string[] = [];
  const startRegex = /<([A-Za-z][\w.]*)\b/g;
  let start: RegExpExecArray | null;
  while ((start = startRegex.exec(src))) {
    if (!tagNameRegex.test(start[1])) continue;

    let i = startRegex.lastIndex;
    let depth = 0;
    let inString: string | null = null;
    let end = -1;
    while (i < src.length) {
      const ch = src[i];
      if (inString) {
        if (ch === "\\") {
          i += 2;
          continue;
        }
        if (ch === inString) inString = null;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = ch;
        i++;
        continue;
      }
      if (ch === "{") {
        depth++;
        i++;
        continue;
      }
      if (ch === "}") {
        depth--;
        i++;
        continue;
      }
      if (ch === ">" && depth === 0) {
        end = i;
        break;
      }
      i++;
    }

    if (end === -1) continue; // unbalanced (shouldn't happen) — skip rather than false-positive
    tags.push(src.slice(start.index, end + 1));
    startRegex.lastIndex = end + 1;
  }
  return tags;
}

/**
 * True when `src` has an `<a>` tag whose href is a `mailto:`/`tel:` literal
 * (plain string or a template literal, e.g. `` `mailto:${person.email}` ``)
 * with no `onClick=` on that same tag, or a Footer-style config row whose
 * `href:` field is a `mailto:`/`tel:` literal with no sibling `track:` /
 * `placement:` / `cta:` fields.
 */
function hasUntrackedMailtoOrTel(src: string): boolean {
  const directOffender = extractOpeningTags(src, /^a$/).some(
    (tag) => /mailto:|tel:/.test(tag) && !/\bonClick=/.test(tag)
  );
  if (directOffender) return true;

  const hrefFieldRegex = /\bhref:\s*["'`](?:mailto|tel):[^"'`]*["'`]/g;
  let row: RegExpExecArray | null;
  while ((row = hrefFieldRegex.exec(src))) {
    const enclosing = enclosingObjectLiteral(src, row.index);
    if (!enclosing || !/\btrack:/.test(enclosing) || !/\bplacement:/.test(enclosing) || !/\bcta:/.test(enclosing))
      return true;
  }

  return false;
}

export function findUntrackedMailtoTelLinks(srcDir: string): string[] {
  return findSourceFiles(srcDir).filter((f) => hasUntrackedMailtoOrTel(readFileSync(f, "utf-8")));
}

/** True when `src` renders `<PulseCheckModal ...>` with no `placement=` attribute. */
function hasUntrackedPulseCheckModal(src: string): boolean {
  return extractOpeningTags(src, /^PulseCheckModal$/).some((tag) => !/\bplacement=/.test(tag));
}

export function findUntrackedPulseCheckModalUsages(srcDir: string): string[] {
  return findSourceFiles(srcDir).filter((f) => hasUntrackedPulseCheckModal(readFileSync(f, "utf-8")));
}

/**
 * True when `src` has an `<a>`, `<Link>` or `<CtaButton>` tag whose
 * `href`/`to` is the booking URL (`BOOKING_URL`) or a `/kontakt` path
 * (including the `?topic=` variant, carried in a template literal) with no
 * `onClick=` on that same tag. A tag whose destination is built from a
 * variable (Navbar's generic nav-item renderer, Footer's `link.href`,
 * CtaButton's own internal `<a href={href}>`) never contains the literal
 * text `BOOKING_URL` or `/kontakt` and is correctly never flagged here —
 * those are covered by findMissingPlacementCallSites / findMissingCtaCallSites
 * / hasMailtoTelRowMissingTracking instead, at the config-row level.
 */
function hasUntrackedKontaktOrBookingLink(src: string): boolean {
  const tags = [
    ...extractOpeningTags(src, /^a$/),
    ...extractOpeningTags(src, /^Link$/),
    ...extractOpeningTags(src, /^CtaButton$/),
  ];
  return tags.some(
    (tag) => (/\bBOOKING_URL\b/.test(tag) || /\/kontakt\b/.test(tag)) && !/\bonClick=/.test(tag)
  );
}

export function findUntrackedKontaktOrBookingLinks(srcDir: string): string[] {
  return findSourceFiles(srcDir).filter((f) => hasUntrackedKontaktOrBookingLink(readFileSync(f, "utf-8")));
}
