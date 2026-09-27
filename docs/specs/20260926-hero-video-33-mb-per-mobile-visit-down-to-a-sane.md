---
task: 20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane
company: venturelabs
status: ready
size: S
branch: fix/hero-video-33-mb-per-mobile-visit-down-to-a-sane
base: dev
design: none
---

# Hero video: compress to under 3 MB, poster frame first, playback after paint

## Goal
The homepage hero ships `src/assets/venturelabs reel.mp4` at 37.4 MB, autoplays it, has no
`poster`, and Netlify serves it `Cache-Control: public,max-age=0,must-revalidate`, so it
re-downloads on every visit — 33.7 MB transferred on a 390 px cold load, 33.5 MB of it the video
(audit finding F3 / task D4). Replace the asset with a single-pass, audio-free re-encode under
3 MB, add a poster frame so the first paint needs no video, set `preload="none"` and start
playback only after the poster has loaded — keeping the existing play/pause control and
respecting `prefers-reduced-motion`. The long-lived immutable cache header is prepared as a
`netlify.toml` block for a human to paste; no role in this task edits that file.

## Assumptions
- `ffmpeg`/`ffprobe` are installed on this machine (the cluster's Producer pipeline uses them) — unverified from this session, the Bash tool is disabled here.
- The 37.4 MB file in `src/assets/` is the only master available in the repo; re-encoding from it (lossy on lossy) is acceptable for a muted background loop.
- The clip's content and length stay exactly as they are — only resolution, frame rate, bitrate and the audio track change. No re-cut, no trim.
- The hero video itself stays on the start page (ADR 0001, answer 2: nine start-page sections *with* the hero video).
- The video element keeps `muted`, `loop`, `playsInline`, its `object-cover` sizing (`minHeight: 480px`, `maxHeight: 640px`) and the scroll-scale animation — the hero must look unchanged apart from the first frame now being a poster.
- `src/app/components/Hero.tsx` is the only consumer of the asset (grepped: no other `src/` file references `.mp4`).
- Renaming the asset to `venturelabs-reel.mp4` (no space) is acceptable and preferred — the current name reaches the browser URL-encoded as `venturelabs%20reel-<hash>.mp4`, which makes every manual cache check awkward.
- A JPEG poster is acceptable (universally supported, no `<picture>` gymnastics possible on `poster`); WebP only if it is clearly smaller at the same quality.
- Netlify emits all Vite-hashed assets under `/assets/`, so `/assets/*` is a safe immutable pattern. `netlify.toml` is a denied path for every role in this task, so its current header rules are **unverified**.
- "A repeat visit fetches the video from cache" cannot be produced by this task's code change alone; it is verified after a human applies the header block in "Verification and evidence".
- The play/pause control is currently `md:hidden` (mobile only). Because reduced-motion users end up on a paused video at any width, the control must also be visible on ≥ md **while the video is paused** — this is part of the fix, not scope creep.
- There is no automated test suite in this repo; verification is `pnpm build`, a local preview and DevTools measurements, each reported explicitly.

Correct me at gate 1, otherwise I proceed with these.

## Gate 1 outcome (approved 2026-09-26)
Approved by Christian Wenzel with a `white_check_mark` reaction on the gate-1 post (ts
`1790395564.787189`, `#dev-agent`) — a structured signal on that specific post, applied by the
front desk 2026-09-26 19:05 because the Dev Manager did not pick the reaction up. No assumption
above was corrected; all stand as written. Two execution instructions come with the approval:

- **Whole, not split.** The task runs as one change, exactly as specified here — no slicing, and no
  narrowing of the goal or of the acceptance criteria.
- **Night run 2026-09-26/27: PR against dev, no merge, morning list.** The run happens overnight,
  unattended. It ends with the feature branch pushed and a pull request open against `dev`,
  explicitly **not** merged, plus a short morning list for Christian: the measured numbers, what is
  still unproven (criterion 15), and the one human `netlify.toml` step. Merging is gate 3 — a human
  on GitHub, in the morning. Because nobody is awake to answer, every stop condition below ends the
  run and goes onto the morning list instead of guessing.

## Amendment 2026-09-27 (Tester verdict `spec`, two criteria)
The Tester's run raised two criteria as having more than one reading. Both are resolved here from
the approved spec's own scope statements and the audit; nothing else in this spec changes, and the
Implementer's code needs no change for either.

- **Criterion 13** ("cold load under 4 MB in total") is rewritten to the video's own measured
  contribution plus a *reported* page total. The 4 MB figure in audit task D4 rests on the audit's
  measurement of "33.7 MB across 18 requests, 33.5 MB of it the video", i.e. an implied ~0.2 MB
  non-video baseline. That baseline does not hold: measured cold at 390 × 844 the page transfers
  8,623,233 B over 16 requests with the video at 1,486,455 B, and the seven eager
  `public/uploads/cases/*.png` case cards alone at 6,865,921 B — on production too
  (`moerschen-card.png` → 200, 2,048,764 B). This spec already puts those images out of scope and
  already says image trimming is a separate task, so the literal whole-page reading was never
  reachable inside this task's write range. The video part of the goal is met with room to spare
  (33.5 MB → 1.49 MB). The residual page weight becomes a named follow-up recommendation under
  "Risks and open questions"; it is Christian's to schedule, not this task's to absorb.
- **Criterion 4** (the old filename is gone) is rewritten with the path-scoped `git grep` command.
  The repo-wide form can never be empty, because this spec file and the criterion-4 guard test in
  `tests/assets/hero-video.test.mjs` must both contain the string they talk about. Cosmetic only —
  the parenthetical reading ("no reference to the old filename remains") already held.

## Context found
- `src/app/components/Hero.tsx` (lines 54-186): imports `heroVideo from "@/assets/venturelabs reel.mp4"`, renders `<video autoPlay muted loop playsInline preload="metadata">` with no `poster`; `isPlaying` is initialised to `true` and only ever changed by `togglePlay()`, so the icon can already disagree with reality; the play/pause button is `flex md:hidden`.
- `src/assets/venturelabs reel.mp4`: the 37.4 MB asset; the only `.mp4` in the repo.
- `src/locales/{de,en}.json` → `hero.videoPlay` / `hero.videoPause`: the existing labels for the control. No new strings are needed.
- `vite.config.ts`: `figmaAssetResolver` maps `figma:asset/` to `src/assets/`; `.mp4` is a default Vite asset type, so the file is emitted content-hashed into `dist/assets/` — which is what makes an `immutable` header safe.
- `src/app/components/PulseJourney.tsx:61`: the repo's existing reduced-motion pattern is `useReducedMotion()` from `motion/react` (already a dependency). `src/styles/theme.css:176` kills the CSS pulse animations under `prefers-reduced-motion: reduce`.
- `package.json`: `pnpm build` = `generate-content` → `vite build` → `prerender`. No test script.
- `C:\code\venturelabs\knowledge-base\marketing\website-agency-topics-2026-09-26.md` §1d F3 and §5 D4: the finding and the task goal, including the measured numbers.
- `C:\code\venturelabs\design\CHECKLIST.md:19`: the same item, open since 2026-09-05 ("compress … and consider a poster image + lazy start").

## Approach
Three changes, all inside the existing hero component and the assets folder; no new dependency,
no new component, no design round.

**1. The asset.** Re-encode the existing file once with ffmpeg: strip the audio track (`-an`),
scale to 1280 px wide, cap at 24 fps, H.264 High / `yuv420p`, `-preset slow -crf 28`, single pass,
`-movflags +faststart` so the moov atom is at the front and playback can start on the first
bytes. Write it as `src/assets/venturelabs-reel.mp4` and delete the old file. If the result is
still over 3 MB, tighten in this order — CRF 30, then 20 fps, then 1080 px wide — never by
shortening or re-cutting the clip. Rejected: shipping a second WebM/AV1 source (two encodes to
maintain for a marginal win on one element), an external video host or CDN (new third party, new
privacy surface on a site that is deliberately cookieless), and separate mobile/desktop encodes
(one 1280 px file at ≤ 3 MB is already inside the 4 MB budget).

**2. The element.** Extract the first frame of the *compressed* file as `src/assets/hero-poster.jpg`
(same framing, so the swap from poster to first video frame is invisible), import it, and set it as
`poster`. Drop `autoPlay`, set `preload="none"`. In `Hero.tsx`, preload the poster with
`new Image()` on the same hashed URL (it resolves against the entry the `<video poster>` already
requested, so it costs no second download) and, one animation frame after it resolves, call
`videoRef.current.play()` — with `preload="none"` that call is what starts the network fetch, so
no video byte is requested before the poster is on screen. If the poster fails to load, fall back
to the window `load` event. Under `useReducedMotion()` the auto-start is skipped entirely: the
poster stays, the video is never fetched, and the user can start it with the control.
Rejected: an IntersectionObserver (the hero is above the fold on every load — pure ceremony) and a
separate `<img>` layer behind the video (the `poster` attribute already honours `object-cover`).

**3. State and control.** Initialise `isPlaying` to `false` and drive it from the element's own
`onPlay`/`onPause` events instead of from the click handler, so the icon can never disagree with
the element; `togglePlay()` keeps calling `play()`/`pause()` and swallows a rejected play promise.
Keep the control's current mobile styling, and additionally show it at ≥ md while the video is
paused, so a reduced-motion or paused desktop visitor has a way to start the video.

**4. The cache header.** Out of every role's write range by guard (`netlify.toml` is a denied
path). The exact block a human pastes is in "Verification and evidence"; no role attempts it and
no role routes around it via `public/_headers`.

**5. Landing (night run).** The whole change is committed on
`fix/hero-video-33-mb-per-mobile-visit-down-to-a-sane` — one commit, or a small series, in the
task's commit format — then pushed to `origin` with an explicit refspec and opened as a pull
request against `dev` carrying the evidence from "Verification and evidence" in its body. The PR
stays open and unmerged; the run's last act is the morning list.

## Files to change
| File | Change | Why |
|---|---|---|
| `src/assets/venturelabs reel.mp4` | Delete | Replaced by the compressed encode; 37.4 MB leaves the working tree |
| `src/assets/venturelabs-reel.mp4` | New (ffmpeg output, ≤ 3 MB, no audio track) | The actual page-weight fix |
| `src/assets/hero-poster.jpg` | New (first frame of the compressed file, ≤ 150 KB) | First paint needs no video |
| `src/app/components/Hero.tsx` | Import the new asset + poster; `poster`, `preload="none"`, no `autoPlay`; start playback after the poster loads; skip auto-start under `prefers-reduced-motion`; `isPlaying` driven by `onPlay`/`onPause`; control also visible at ≥ md while paused | The lazy-start, reduced-motion and control behaviour |

## Acceptance criteria
1. `src/assets/` contains no `.mp4` larger than 3,145,728 bytes (3 MiB), and exactly one `.mp4` file.
2. The shipped hero video has **no audio stream**: `ffprobe -show_streams` on it lists no stream with `codec_type=audio`.
3. The shipped hero video is H.264 in `yuv420p` and plays in Chrome, Firefox and Safari-family (WebKit) engines without a codec error in the console.
4. No file under `src/`, `content/`, `public/`, `scripts/` or `index.html` references the old asset name: `git grep -n "venturelabs reel" -- src content public scripts index.html` returns no match (exit status 1, no output). Deliberately path-scoped: this spec file and the criterion-4 guard test in `tests/assets/hero-video.test.mjs` must quote the old string in order to talk about it, so a repo-wide grep can never be empty and is not the check.
5. A poster image asset exists, is ≤ 153,600 bytes (150 KiB), and its first frame matches the video's first frame (no visible jump when playback starts).
6. The rendered hero `<video>` element has a non-empty `poster` attribute, `preload="none"`, and **no** `autoplay` attribute, while keeping `muted`, `loop` and `playsinline`.
7. On a normal load of `/de/` (reduced motion off), no network request for the `.mp4` is issued before the poster image request has completed.
8. On a normal load of `/de/`, playback has started within 3 s of the poster being painted: `document.querySelector('video').paused === false`.
9. With `prefers-reduced-motion: reduce` emulated, no request for the `.mp4` is issued on load, the video stays paused and the poster stays visible.
10. With `prefers-reduced-motion: reduce` emulated, the play control is visible at 390 px **and** at ≥ 1024 px, and clicking it starts playback (`video.paused === false`).
11. The play/pause icon always matches the element's real state: after `video.pause()` from the console the button shows the play icon; after `video.play()` it shows the pause icon.
12. At 390 px width the hero renders at the same size and framing as before the change (same `min-height: 480px` / `max-height: 640px` box, no letterboxing, no layout shift when the poster is replaced by the video).
13. On a cold load of `/de/` at a 390 × 844 viewport with the cache disabled, **exactly one `.mp4` request is made and it transfers at most 3,145,728 bytes (3 MiB)** — that request is the hero video's entire contribution to page weight. The page total is measured and reported as a number alongside its three largest requests by size, but is **not** asserted against the 4 MB figure of audit task D4: that figure assumed a ~0.2 MB non-video baseline which does not hold (the seven eager `public/uploads/cases/*.png` transfer ~6.55 MiB on the preview and on production alike), and trimming those images is out of scope here. This criterion is met when the `.mp4` figure holds and both numbers are reported.
14. `pnpm build` completes and `dist/assets/` contains exactly one content-hashed `.mp4` of the same ≤ 3 MB size, plus the hashed poster.
15. After the `netlify.toml` block below has been applied by a human, the deployed video URL responds with `Cache-Control: public, max-age=31536000, immutable`, and a repeat visit to `/de/` serves the video from cache rather than re-transferring it. Until the header is applied, this criterion is reported as "pending human paste" and is not counted as failed.
16. No role has modified `netlify.toml`, `public/_headers`, or any file under `src/data/{de,en}/`.
17. Every change of this task sits on `fix/hero-video-33-mb-per-mobile-visit-down-to-a-sane`, in commits whose subject starts `20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane:` and whose body ends with the `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` line.
18. That branch is pushed to `origin` and exactly one pull request against base `dev` exists for it, whose body carries the evidence listed under "Verification and evidence".
19. When the run ends, the pull request is **open and unmerged**, and `origin/dev` and `origin/main` carry no commit from this task (`git log origin/dev --oneline -5` shows no task commit; nothing was merged, rebased or force-pushed).
20. The run ends with a morning list for Christian that states, in one short block: the measured video size, the measured `.mp4` transfer on a cold load, the measured page total for that same load with its three largest requests by size, the PR link, which criteria are proven, criterion 15 as "pending human paste", and the `netlify.toml` block as the one human step.

## Test plan
There is no test suite in this repo. Verification is mechanical commands plus a measured preview,
each reported explicitly:

- `cd "C:\ai\dev-worktrees\venturelabs\landing\20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane" ; pnpm install --prefer-offline ; pnpm build` — must exit 0, content generation + vite build + prerender of every route.
- File size and codec read-back on the built asset (`dist/assets/venturelabs-reel-*.mp4`) with `Get-Item` and `ffprobe` (commands below) — criteria 1-3, 14.
- `git grep -n "venturelabs reel" -- src content public scripts index.html` — criterion 4 (expect no output; the unscoped repo-wide form is not the check, see the criterion).
- A DOM read-back on the running preview for the `<video>` attributes — criterion 6.
- `pnpm dev` (http://localhost:5173) with Chrome DevTools: device 390 × 844, Network tab with "Disable cache", reload `/de/` — request order (criteria 7, 8), the `.mp4` row's own transferred size and the page total with its three largest rows (criterion 13; a CDP `encodedDataLength` sum per request is the same measurement and is equally acceptable). Repeat with Rendering → "Emulate CSS prefers-reduced-motion: reduce" (criteria 9, 10).
- `git log --format='%s%n%b' origin/dev..HEAD` and `git status --short` — criterion 17 (commit format, nothing uncommitted).
- `gh pr view --json url,baseRefName,state,mergedAt` plus `git log origin/dev --oneline -5` — criteria 18, 19 (base `dev`, state OPEN, `mergedAt` null, no task commit on `dev`).
- The Tester states the measured video file size, the measured `.mp4` transferred bytes and the measured page total as numbers, not as "looks fine".

## What to click
1. Open `/de/` on a 390 px preview: the hero shows a still frame immediately, then starts moving on its own within a second or two — no black box, no jump in framing at the switch.
2. Tap the round button in the middle of the hero video: it pauses, the icon turns into a play triangle, tap again and it resumes.
3. With "prefers-reduced-motion: reduce" on, reload `/de/` on a desktop width: the hero stays a still image, the play button is visible, and clicking it starts the video.
4. Watch the hero for one full loop: the loop still restarts seamlessly and has no sound.
5. Scroll down from the hero: the video still scales up with the scroll exactly as before.

## Verification and evidence
The close-out — which for this night run *is* the morning list — must show, as literal output or
numbers:

- `pnpm build` exit code 0 and the emitted asset line for the `.mp4`.
- The byte size of `src/assets/venturelabs-reel.mp4` and of `src/assets/hero-poster.jpg`.
- The `ffprobe` stream list proving there is no audio stream.
- The empty result of `git grep -n "venturelabs reel" -- src content public scripts index.html`.
- A screenshot of the DevTools Network panel for a cold `/de/` load at 390 × 844 showing the video request appearing *after* the poster, its own **transferred** size (≤ 3 MiB), and the page's **total transferred** figure as a number with the three largest requests — the total is reported, not asserted (criterion 13).
- A screenshot of the hero with reduced motion emulated, showing the poster plus a visible play control.
- The pull request URL, its base branch (`dev`), its state (`OPEN`, `mergedAt: null`), and the `git log origin/dev --oneline -5` output showing no task commit on `dev` — the proof that the night run pushed and opened, but did not merge.
- The `netlify.toml` block below, quoted verbatim in the report as the one remaining human step.
- A morning list of at most ten lines: the measured numbers of criterion 20, the PR link, "criterion 15: pending human paste", the `netlify.toml` step, and anything that stopped (with the criterion it leaves unproven). No conclusion is claimed that the outputs above do not show.

Commands for the Implementer / Tester (worktree paths, run from the worktree root):

```
Windows — PowerShell:
ffmpeg -i "C:\ai\dev-worktrees\venturelabs\landing\20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane\src\assets\venturelabs reel.mp4" -an -vf "scale=1280:-2,fps=24" -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 28 -movflags +faststart "C:\ai\dev-worktrees\venturelabs\landing\20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane\src\assets\venturelabs-reel.mp4"

Windows — PowerShell:
ffmpeg -i "C:\ai\dev-worktrees\venturelabs\landing\20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane\src\assets\venturelabs-reel.mp4" -frames:v 1 -q:v 4 "C:\ai\dev-worktrees\venturelabs\landing\20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane\src\assets\hero-poster.jpg"

Windows — PowerShell:
Get-Item "C:\ai\dev-worktrees\venturelabs\landing\20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane\src\assets\venturelabs-reel.mp4","C:\ai\dev-worktrees\venturelabs\landing\20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane\src\assets\hero-poster.jpg" | Select-Object Name,Length

Windows — PowerShell:
ffprobe -v error -show_entries stream=index,codec_type,codec_name,width,height,avg_frame_rate -of default=noprint_wrappers=1 "C:\ai\dev-worktrees\venturelabs\landing\20260926-hero-video-33-mb-per-mobile-visit-down-to-a-sane\src\assets\venturelabs-reel.mp4"

macOS — Terminal (zsh): not available (this worktree lives on the Windows PC).

What they do: the first re-encodes the hero clip without audio; the second pulls its first frame
as the poster; the third prints both file sizes in bytes; the fourth prints the stream list, which
must contain one video stream and no audio stream.
```

**The one human step (Christian, by hand — `netlify.toml` is a denied path for every agent role).**
Open `C:\code\venturelabs\landing-page\netlify.toml` and add:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

Every file under `/assets/` is content-hashed by Vite, so a year-long immutable header is safe —
a changed file gets a new URL. If a `[[headers]]` rule for `/assets/*` or `/*` already sets
`Cache-Control`, edit that rule instead of adding a second one (the current file could not be read
from this session). After the deploy, criterion 15 is checked with:
`curl -sI https://venturelabs.team/assets/<hashed-video-file>.mp4 | findstr /i cache-control`.

## Will not do
- Edit `netlify.toml`, or route around the guard with `public/_headers`, `_redirects` or a build-time header injection.
- Merge the pull request, merge anything into `dev` or `main`, rebase, force-push, or commit to any branch other than `fix/hero-video-33-mb-per-mobile-visit-down-to-a-sane`. Pushing that feature branch and opening the PR against `dev` is explicitly part of this night run (gate 1 note, 2026-09-26); merging it is gate 3, a human on GitHub.
- Trigger a Netlify deploy, change a Netlify site setting, or touch the `pulse-landing-page` repo.
- Re-cut, trim, re-order or re-colour the clip; change what the hero says or which sections the start page has.
- Add a dependency (no video player library, no lazy-load library), change the Vite plugins, or touch `src/data/{de,en}/`.
- Rewrite git history to drop the old 37 MB blob.
- Edit any component other than `Hero.tsx`.
- Touch, re-encode or add `loading`/`decoding` attributes to the case-card images under `public/uploads/cases/` or the components that render them — that is the separate follow-up named under "Risks and open questions", not this task (amendment 2026-09-27).
- Split the task into slices, or defer any acceptance criterion to a follow-up task — gate 1 said whole, not split.
- Wake anybody during the night run, or wait for an answer: a stop condition below ends the run and goes on the morning list instead.

## Stop conditions
- `ffmpeg`/`ffprobe` is not available on the machine → stop and report; do not commit an uncompressed or hand-shrunk file, and do not upload the clip to an online converter.
- The encode cannot get under 3 MB at CRF 30 / 20 fps / 1080 px without visible degradation → stop and report the best achieved size with a frame grab, and ask whether to accept a larger file or shorten the clip (an editorial decision).
- The re-encode shows obvious artefacts (banding, mush in the gradients) at the agreed settings → stop and ask, rather than shipping a cheap-looking hero.
- The cold-load measurement shows the `.mp4` itself transferring more than 3 MiB → stop and report the measured figure. A page total above 4 MB that is **not** caused by the video is a known, out-of-scope condition as of the 2026-09-27 amendment: report it as a number with the top-five requests by size (criterion 13) and continue; it neither stops the run nor fails a criterion.
- `pnpm build` or `pnpm install` fails for a reason unrelated to this change → report it, do not "fix" unrelated files.
- Any step appears to require writing `netlify.toml` → stop, that file is a guard boundary, not an obstacle.
- The push or the PR creation fails (auth, protected branch, missing `origin/dev`) → stop with the commits left local on the feature branch, and say so on the morning list; never merge locally, never push to `dev` or `main` instead, never open the PR against another base.
- A criterion is still unproven when the night run ends → the morning list names it as unproven; nothing is merged and nothing is reported as done to make the list look clean.

## Risks and open questions
- `netlify.toml` cannot be read by any role in this task, so whether it already carries a conflicting `Cache-Control` rule is **unverified**. If it does, the paste instruction above ("edit that rule instead") is what protects criterion 15.
- Criterion 15 (repeat visit from cache) is provable by neither an automated check nor a click on the preview until the header exists; the manual check is the `curl -sI … | findstr /i cache-control` read-back named above, run after Christian's paste. This is the one undertested criterion in the spec, by design of the guard.
- An alternative that *is* inside the agent write range exists — a `public/_headers` file, which Vite copies into `dist/` — but the precedence between `_headers` and `netlify.toml` is unverified and the brief explicitly forbids working around the guard. Mentioned only so Christian can choose it deliberately.
- Re-encoding an already-compressed 37.4 MB H.264 file is lossy-on-lossy; the dark gradient-heavy footage is the kind that bands first. The frame-grab evidence exists so this is judged, not assumed.
- The 37 MB blob stays in git history, so a fresh clone stays large. Out of scope here (history rewrite is a repo-wide decision).
- After the fix a mobile visitor still downloads ~3 MB shortly after first paint. That is inside the stated 4 MB budget and deliberate; a "tap to play" hero that never autoloads would be a design decision, not a bug fix.
- **Recommended follow-up task, Christian's to schedule (amendment 2026-09-27):** with the video at 1.49 MB the same cold load still transfers ~8.2 MB, because the seven case-card images in `public/uploads/cases/` total 6,865,921 B (`moerschen-card.png` 2,049,035 · `tap2link-card.png` 1,284,359 · `scanservice-card.png` 1,246,623 · `neuer-look-card.png` 1,022,917 · rest), carry no `loading` attribute although they sit 5,867–9,399 px down a 12,061 px page, and are served `max-age=0, must-revalidate` on production. Re-encoding them at card size plus `loading="lazy"` is what would bring the page under the audit's 4 MB figure — a separate S task, not a slice of this one.
- The night run's judgement calls on encode quality (artefacts, banding) happen with nobody awake to look at the frame grab. The stop conditions resolve that by stopping rather than shipping; the cost is a possible morning list that says "encode needs your eyes" instead of a finished PR.

## Out of scope
- A second `<source>` in WebM/AV1, or separate mobile and desktop encodes.
- Moving the video to an external host or CDN.
- The other page-weight items from the audit (below-the-fold images in `public/uploads/`, `og:image`, the prerender-only HTML shell of F10).
- The other D-tasks that touch the same pages (D3 fonts, D5 area pages, D6 case facts).
- Any copy change in the hero (headline, subline, CTAs) and any price change.
