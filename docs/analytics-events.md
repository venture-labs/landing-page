# Plausible analytics events

The four Plausible custom events venturelabs.team fires, and the custom properties attached to
them. The central helper is `src/app/analytics.ts`; every call site imports `EVENTS`, `PLACEMENTS`
and `CTAS` from there — never a duplicated string literal.

## Events and their props

| Event | Fired from | Props |
|---|---|---|
| `Quiz Started` | `PulseQuiz.tsx:530`, when the first quiz question is shown | `page`, `lang`, `placement`, `cta: "quiz"` |
| `Quiz Completed` | `PulseQuiz.tsx:517`, when the result screen renders | `page`, `lang`, `placement`, `cta: "quiz"` |
| `Contact Sent` | the contact form's `200` response (not on click), every `mailto:`/`tel:` link, and every other CTA that navigates to `/kontakt` without being the booking link or the form itself — see the placement table below | `page`, `lang`, `placement`, `cta: "contact" \| "mail" \| "phone"` |
| `Call Link Clicked` | every booking CTA, see the placement table below | `page`, `lang`, `placement`, `cta: "book-call"` |

- `page` — the route **without** its `/de`/`/en` prefix, e.g. `/leistungen/ai-automation` for
  `/de/leistungen/ai-automation`, or `/` for the home page. Derived from `window.location.pathname`
  in `trackEvent()`; no call site passes it.
- `lang` — `de` or `en`, the locale segment of the current path; defaults to `de` if somehow
  absent. Also derived automatically, never passed by a call site.
- `placement` — a stable, hand-picked id per button/link (see table below); the second argument a
  call site passes itself, as `trackEvent(EVENTS.callLinkClicked, PLACEMENTS.xyz, CTAS.bookCall)`.
- `cta` — which **kind** of call-to-action fired the event (20261021-cta-tracking-every-call-to-
  action-fires-a-plausi): one of the five `CTAS` values — `book-call`, `contact`, `quiz`, `mail`,
  `phone`. Three of the five share the `Contact Sent` event (`contact`/`mail`/`phone`); `cta` is
  what tells them apart in Plausible's Properties panel, since the goal total alone no longer
  equals only "form submitted" (see the risk note below). The third, optional argument to
  `trackEvent()`; attached to `props.cta` only when given.

`trackEvent()` is a safe no-op (never throws) when `window.plausible` or even `window.location` is
absent — see `scripts/check-analytics-extra.ts`'s criterion 6, which runs it against a bare
`window = {}` stub.

**Note on `Contact Sent`'s widened scope:** before this task it only ever meant "the contact form's
POST succeeded". It now also fires for a `mailto:`/`tel:` click and for a plain navigation to
`/kontakt` (the Hero secondary button, a `PulseJourney` step, and several per-page "request now" /
"get in touch" CTAs) — click-intent that never necessarily led to an actual email, call or form
submission. The raw goal total in Plausible is therefore higher than before this task; `cta` is the
property that lets it be filtered back down to just `cta: "contact"` + a successful form, if that
distinction is wanted in the dashboard.

## Placement ids — by button/link

**`Call Link Clicked`, always `cta: "book-call"`** (the booking CTA):

| `PLACEMENTS` key | id | Component | Call site |
|---|---|---|---|
| `navbarDesktop` | `navbar-desktop` | `Navbar` (desktop "Book a call" button) | `src/app/components/Navbar.tsx:101` |
| `navbarMobile` | `navbar-mobile` | `Navbar` (mobile menu "Book a call" link) | `src/app/components/Navbar.tsx:141` |
| `finalCta` | `final-cta` | `FinalCTA` (homepage closing section) | `src/app/components/FinalCTA.tsx:44` |
| `footer` | `footer` | `Footer` ("Book a call" row in the contact column) | `src/app/components/Footer.tsx:87-93` (config row), `133`/`142` (click handlers) |
| `quizResult` | `quiz-result` | `PulseQuiz` (booking CTA on the result screen) | `src/app/components/PulseQuiz.tsx:620` |
| `kontakt` | `kontakt` | `Kontakt` page (booking CTA in the bottom contact strip) | `src/app/pages/Kontakt.tsx:479` |
| `leistungenDetailCta` | `leistungen-detail-cta` | `LeistungenDetail` (service CTA block, next to the Pulse-check button) | `src/app/pages/LeistungenDetail.tsx:327` |
| `leistungenDetailContact` | `leistungen-detail-contact` | `LeistungenDetail` (bottom contact strip, same page, different section) | `src/app/pages/LeistungenDetail.tsx:440` |
| `situations` | `situations` | `SituationsSection` ("Ihre Situation" block on `/leistungen`) | `src/app/components/SituationsSection.tsx:135` |
| `toolProfile` | `tool-profile` | `ToolProfile` ("Im Einsatz: Beleg-Inbox" Steckbrief on `/leistungen`) | `src/app/components/ToolProfile.tsx` (`ToolProfileCard`'s `CtaButton`) |

`leistungen-detail-cta` and `leistungen-detail-contact` sit on the same page/route, so `page` alone
cannot tell them apart — the distinct `placement` id is what does.

**`Contact Sent`, `cta: "mail"` or `cta: "phone"`** (every `mailto:`/`tel:` link under `src/app/`,
pages and components, both locales — legal pages included):

| `PLACEMENTS` key | id | `cta` | Component | Call site |
|---|---|---|---|---|
| `kontaktTeamMail` | `kontakt-team-mail` | `mail` | `Kontakt` (team member email) | `src/app/pages/Kontakt.tsx:139` |
| `kontaktTeamPhone` | `kontakt-team-phone` | `phone` | `Kontakt` (team member phone) | `src/app/pages/Kontakt.tsx:148` |
| `kontaktBottomMail` | `kontakt-bottom-mail` | `mail` | `Kontakt` (bottom CTA strip) | `src/app/pages/Kontakt.tsx:487` |
| `footerJobsMail` | `footer-jobs-mail` | `mail` | `Footer` ("Jobs" row) | `src/app/components/Footer.tsx:74-80` |
| `footerContactMail` | `footer-contact-mail` | `mail` | `Footer` (contact column, bottom row) | `src/app/components/Footer.tsx:94-100` |
| `leistungenDetailMail` | `leistungen-detail-mail` | `mail` | `LeistungenDetail` (bottom contact strip) | `src/app/pages/LeistungenDetail.tsx:448` |
| `leistungenMail` | `leistungen-mail` | `mail` | `Leistungen` (contact strip) | `src/app/pages/Leistungen.tsx:194` |
| `impressumMail` | `impressum-mail` | `mail` | `Impressum` (DE + EN contact sections) | `src/app/pages/Impressum.tsx:32,123` |
| `datenschutzMail` | `datenschutz-mail` | `mail` | `Datenschutz` (sections I and VIII, DE + EN) | `src/app/pages/Datenschutz.tsx:22,116,147,235` |

**`Contact Sent`, `cta: "contact"`** (a CTA that navigates to `/kontakt` without being the booking
link or the contact form itself):

| `PLACEMENTS` key | id | Component | Call site |
|---|---|---|---|
| `kontaktForm` | `kontakt-form` | `Kontakt` contact form's own successful-submission fire (unchanged timing — still on the `200`, not the click) | `src/app/pages/Kontakt.tsx:216` |
| `heroContact` | `hero-contact` | `Hero` (secondary "Kontakt" button) | `src/app/components/Hero.tsx:176` |
| `pulseJourney` | `pulse-journey` | `PulseJourney` (per-step CTA, rendered three times — Check/Build/Care — one shared placement, see Risks in the spec) | `src/app/components/PulseJourney.tsx:223` |
| `leistungenHeroContact` | `leistungen-hero-contact` | `Leistungen` hero's secondary "Kontakt" link | `src/app/pages/Leistungen.tsx:92` |
| `leistungenPulseCalloutContact` | `leistungen-pulse-callout-contact` | `Leistungen`'s closing `PulseCallout` secondary link | `src/app/pages/Leistungen.tsx:158` |
| `leistungenDetailHeroCta` | `leistungen-detail-hero-cta` | `LeistungenDetail` hero's "jetzt anfragen" CTA | `src/app/pages/LeistungenDetail.tsx:89` |
| `caseDetailCta` | `case-detail-cta` | `CaseDetail` hero's "jetzt anfragen" CTA | `src/app/pages/CaseDetail.tsx:62` |
| `caseDetailBottomCta` | `case-detail-bottom-cta` | `CaseDetail`'s closing contact CTA | `src/app/pages/CaseDetail.tsx:285` |
| `blogDetailCta` | `blog-detail-cta` | `BlogDetail`'s end-of-post CTA | `src/app/pages/BlogDetail.tsx:216` |
| `ueberUnsCta` | `ueber-uns-cta` | `UeberUns`'s closing CTA | `src/app/pages/UeberUns.tsx:277` |

The last five rows (`leistungenHeroContact` through `ueberUnsCta`) were not in the spec's own
inventory — found by grepping every `/kontakt` destination in `src/app/` once the guard's rule for
"an untracked booking/kontakt link" was written; see the Implementer's report, "Needs a decision",
for why they were tracked the same way rather than left out.

**`Quiz Started` / `Quiz Completed`, always `cta: "quiz"`** (the placement is the button that
*opened* the modal, threaded through `PulseCheckModal`'s required `placement` prop):

| `PLACEMENTS` key | id | Opener | Call site |
|---|---|---|---|
| `heroQuiz` | `hero-quiz` | `Hero`'s Pulse Score button | `src/app/components/Hero.tsx:223` |
| `aiPulseTeaser` | `ai-pulse-teaser` | `AIPulseTeaser` section (homepage) | `src/app/components/AIPulseTeaser.tsx:57` |
| `leistungenHero` | `leistungen-hero` | `Leistungen` hero's Pulse button, and the `#pulse-score`/`#quiz` deep link | `src/app/pages/Leistungen.tsx:225,257` |
| `leistungenPulseCallout` | `leistungen-pulse-callout` | `Leistungen`'s closing `PulseCallout` Pulse button | `src/app/pages/Leistungen.tsx:262` |
| `leistungenDetailQuiz` | `leistungen-detail-quiz` | `LeistungenDetail`'s one Pulse button | `src/app/pages/LeistungenDetail.tsx:335` |

`Leistungen.tsx` has two distinct openers feeding one `<PulseCheckModal>` instance; the clicked
opener's placement travels with the component's own open state (`quizPlacement: string | null`, see
`src/app/pages/Leistungen.tsx`) so the two openers produce two different `placement` values for the
same event, never one collapsed id.

`scripts/check-placements.ts` (shared by `scripts/check-analytics.ts`'s criteria 15/18-21 and
`scripts/prerender.ts`) fails the build if any of the following exists under `src/`: a
`trackEvent(EVENTS.callLinkClicked | EVENTS.contactSent, …)` call site with no placement or no
`cta`; an untracked `mailto:`/`tel:` href; a `<PulseCheckModal>` usage with no `placement=`; or a
link to the booking host or to `/kontakt` (including `?topic=`) with no tracked `onClick` — so a new
unattributed CTA cannot ship, in `pnpm build` itself, not only in the separately run
`pnpm check:analytics`.

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
   `placement`, `page`, `lang` **and `cta`** (20261021-cta-tracking-every-call-to-action-fires-a-
   plausi) as allowed property keys so the dashboard's Properties panel can break down any of the
   four events by them — `cta` in particular is what separates `Contact Sent`'s three distinct
   triggers (`contact`/`mail`/`phone`) back out from one goal total.
3. After both are enabled, trigger one real click on each booking CTA, one `mailto:`/`tel:` link,
   one `/kontakt`-navigation CTA and the quiz from two different openers on the live site, and
   confirm each appears in Plausible's **Realtime** view (or via the Events API) with the expected
   `placement`/`page`/`lang`/`cta` values — this is the step that actually proves the long-standing
   zero count is fixed, and it needs the dashboard login this task does not have.
