# Plausible analytics events

The four Plausible custom events venturelabs.team fires, and the custom properties attached to
them. The central helper is `src/app/analytics.ts`; every call site imports `EVENTS` (and
`PLACEMENTS` for booking CTAs) from there — never a duplicated string literal.

## Events and their props

| Event | Fired from | Props |
|---|---|---|
| `Quiz Started` | `PulseQuiz.tsx:530`, when the first quiz question is shown | `page`, `lang` |
| `Quiz Completed` | `PulseQuiz.tsx:517`, when the result screen renders | `page`, `lang` |
| `Contact Sent` | `Kontakt.tsx:214`, after the contact form POST resolves `200` (not on click) | `page`, `lang` |
| `Call Link Clicked` | every booking CTA, see the placement table below | `placement`, `page`, `lang` |

- `page` — the route **without** its `/de`/`/en` prefix, e.g. `/leistungen/ai-automation` for
  `/de/leistungen/ai-automation`, or `/` for the home page. Derived from `window.location.pathname`
  in `trackEvent()`; no call site passes it.
- `lang` — `de` or `en`, the locale segment of the current path; defaults to `de` if somehow
  absent. Also derived automatically, never passed by a call site.
- `placement` — a stable, hand-picked id per booking button (see table below); the only prop a
  call site passes itself, as `trackEvent(EVENTS.callLinkClicked, PLACEMENTS.xyz)`.

`trackEvent()` is a safe no-op (never throws) when `window.plausible` or even `window.location` is
absent — see `scripts/check-analytics-extra.ts`'s criterion 6, which runs it against a bare
`window = {}` stub.

## Placement ids — "Call Link Clicked" by button

| `PLACEMENTS` key | id | Component | Call site |
|---|---|---|---|
| `navbarDesktop` | `navbar-desktop` | `Navbar` (desktop "Book a call" button) | `src/app/components/Navbar.tsx:101` |
| `navbarMobile` | `navbar-mobile` | `Navbar` (mobile menu "Book a call" link) | `src/app/components/Navbar.tsx:141` |
| `finalCta` | `final-cta` | `FinalCTA` (homepage closing section) | `src/app/components/FinalCTA.tsx:44` |
| `footer` | `footer` | `Footer` ("Book a call" row in the contact column) | `src/app/components/Footer.tsx:77-83` (config), `118`/`127` (click handlers) |
| `quizResult` | `quiz-result` | `PulseQuiz` (booking CTA on the result screen) | `src/app/components/PulseQuiz.tsx:616` |
| `kontakt` | `kontakt` | `Kontakt` page (booking CTA in the bottom contact strip) | `src/app/pages/Kontakt.tsx:477` |
| `leistungenDetailCta` | `leistungen-detail-cta` | `LeistungenDetail` (service CTA block, next to the Pulse-check button) | `src/app/pages/LeistungenDetail.tsx:326` |
| `leistungenDetailContact` | `leistungen-detail-contact` | `LeistungenDetail` (bottom contact strip, same page, different section) | `src/app/pages/LeistungenDetail.tsx:439` |
| `situations` | `situations` | `UseCasesSection` ("Mögliche Use Cases" carousel on `/leistungen`, renamed from `SituationsSection` by VL-11-S3) | `src/app/components/UseCasesSection.tsx` |
| `toolProfile` | `tool-profile` | **Retired** (VL-11-S3) — the "Im Einsatz: Beleg-Inbox" Steckbrief this placement belonged to (`ToolProfileCard`'s `CtaButton` in `ToolProfile.tsx`) was deleted; no call site uses this placement any more. `PLACEMENTS.toolProfile` itself is left in `analytics.ts` (out of this task's scope). | — |

`leistungen-detail-cta` and `leistungen-detail-contact` sit on the same page/route, so `page` alone
cannot tell them apart — the distinct `placement` id is what does.

`scripts/check-analytics.ts` (criterion 15) fails the build if any `trackEvent(EVENTS.callLinkClicked…)`
or `trackEvent(link.track!…)` call site in `src/` is missing its placement argument, so a new
booking CTA cannot ship unattributed.

## Why Plausible has counted zero "Call Link Clicked" events so far

Code audit (2026-10-17, task 20261017-tracking-every-booking-contact-button-identifiab): every one
of the 9 call sites above already opens the booking link with `target="_blank"` (the external
`BOOKING_URL`) or navigates with a React Router `<Link>` (in-app, no full page reload). Neither
case unloads the current page before the Plausible request fires, so "the event is lost to page
navigation" — the working theory this task was asked to check — does not apply to any current call
site; no `sendBeacon`/navigation-callback change was needed.

The zero count is therefore most likely a Plausible **dashboard/site-setting** issue, not a client
bug. Checked candidates, in order of likelihood, for whoever has the Plausible login to verify:

1. **No Goal registered for `Call Link Clicked`** (or the other 3 event names) in Plausible's
   Site Settings → Goals. A custom event still needs a matching Goal to show up in most dashboard
   views.
2. **Custom Properties not enabled** for the site/goal (see the dashboard note below) — without it,
   the `placement`/`page`/`lang` props this task adds would be silently dropped even once a Goal
   exists.
3. **An apex vs `www` mismatch** — `data-domain="venturelabs.team"` (vite.config.ts) vs the site
   actually being reached via `www.venturelabs.team` for some visitors; worth a one-time check in
   Site Settings that both resolve to the same Plausible site.

This repo cannot fix or verify any of the three from the outside — they all need the Plausible
login. What this task *can* and does prove, mechanically:

- A local production build (`pnpm build`, `CONTEXT` unset) injects the loader tag and queue stub
  into every shell (`pnpm check:analytics`, criteria 1-5).
- `trackEvent()` calls `window.plausible(name, { props: { placement, page, lang } })` with the
  exact values a booking CTA click should produce — verified at the **Node level**
  (`scripts/check-analytics-extra.ts`, criterion 16: imports `src/app/analytics.ts` directly,
  stubs `window.plausible` to record its arguments, and asserts the exact payload for a DE route
  with a placement, an EN route without one, both home routes, and `window.location` missing
  entirely). This is a stubbed call to the function, not a captured HTTP request.

**Still pending, not performed here:** opening the built site in an actual browser, clicking a
booking CTA, and watching the real request to `https://plausible.io/api/event` in the Network tab
(or Plausible's Realtime/Events API) to confirm the exact bytes a browser sends match what the
Node-level check above predicts, and that Plausible's backend accepts them. That step needs either
a manual run with a browser, or Christian's/the front desk's Plausible login for the dashboard
side — neither was available in this session, so it is not claimed as done.

## Plausible dashboard settings to enable (needs Christian's or the front desk's login)

In the Plausible dashboard, for the `venturelabs.team` site, under **Site Settings**:

1. **Goals** — confirm a Custom Event goal exists for each of: `Quiz Started`, `Quiz Completed`,
   `Contact Sent`, `Call Link Clicked`. Add any that are missing (type "Custom event", exact name).
2. **Properties** (shown as "Custom Properties" / "Props" depending on the Plausible version) —
   enable custom properties for the site if not already on (this is a paid-plan feature), then add
   `placement`, `page`, and `lang` as allowed property keys so the dashboard's Properties panel can
   break down `Call Link Clicked` (and the other events) by them.
3. After both are enabled, trigger one real click on each booking CTA on the live site and confirm
   it appears in Plausible's **Realtime** view (or via the Events API) with the expected
   `placement`/`page`/`lang` values — this is the step that actually proves the long-standing zero
   count is fixed, and it needs the dashboard login this task does not have.
