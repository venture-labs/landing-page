---
task: 20260927-pnpm-supportedarchitectures-include-the-current-
company: venturelabs
status: ready
size: S
branch: fix/pnpm-supportedarchitectures-include-the-current-
base: dev
design: none
---

# pnpm supportedArchitectures: add `current` so a plain frozen-lockfile install builds on Windows

## Goal
`supportedArchitectures` in this repo lists `os: [linux, darwin]`, `cpu: [x64, arm64]`,
`libc: [glibc]`. A plain `pnpm install --frozen-lockfile` on a Windows checkout therefore prunes
the Windows rollup/esbuild binaries, and `vite build` (inside `pnpm build`) crashes; the Dev
Manager works around this by appending `--os=current --cpu=current` to every install. Add
`current` to all three lists so an install on Windows, macOS and Linux CI always gets its own
platform's binaries, while keeping every existing entry so the Netlify (Linux/glibc/x64) install
set is bit-for-bit the same as today. The lockfile is touched only if pnpm itself demands it.

## Assumptions
- The setting lives in `pnpm-workspace.yaml` (lines 9-18), **not** in `package.json` or `.npmrc`
  as the brief says: `package.json` has no `pnpm`/`supportedArchitectures` key and `.npmrc`
  contains only `registry=...`. The fix is one file: `pnpm-workspace.yaml`.
- Changing `supportedArchitectures` does not invalidate `pnpm-lock.yaml`, so no lockfile change is
  expected: the lockfile already carries every platform's optional binaries
  (`@rollup/rollup-win32-x64-msvc`, `@esbuild/win32-x64`, … at `pnpm-lock.yaml` lines 636-666,
  1574-1593, 2945-2960, 3797-3806, 4130-4132, 4590-4593) and its `settings:` block records
  `autoInstallPeers`/`excludeLinksFromLockfile` and `overrides:` but *not*
  `supportedArchitectures`. The setting filters what is extracted into `node_modules`, not what is
  resolved. **Confirmed by the run (2026-09-27, decision 6-S1-Q1)**: the flag-free
  `pnpm install --frozen-lockfile` did not print `ERR_PNPM_OUTDATED_LOCKFILE`, so `pnpm-lock.yaml`
  stays untouched.
- `current` is a value pnpm accepts for `os`, `cpu` and `libc` (pnpm docs). **Confirmed by the run
  (2026-09-27)**: pnpm 10.30.3 accepted `current` for all three keys on Windows without a
  complaint. The exact minimum pnpm version remains unverified, and Netlify's pnpm accepting it is
  proven by the Netlify run in "Verification and evidence", not asserted here.
- Adding `current` to `libc` is harmless on Windows and macOS even though those platforms have no
  libc: pnpm only applies the libc filter to packages that declare a `libc` field, and the Windows
  and macOS binaries declare none. **Confirmed for Windows with pnpm 10.30.3 (2026-09-27)**; still
  unverified for macOS and for the glibc side on Netlify — if an install there disagrees, see
  "Stop conditions".
- The Tester/Implementer **may run `pnpm install --frozen-lockfile` once in this worktree**, even
  though the task note says not to install: the worktree has its own real `node_modules`
  (`installMode install`, not a junction link), and that exact command is the acceptance criterion
  — it cannot be proven any other way. Correct me at gate 1 if the verification must instead run in
  a throwaway clone outside the worktree.
- The worktree's current `node_modules` was installed *with* `--os=current --cpu=current`, so the
  Windows binaries are present right now; the meaningful check is that they are still present after
  a flag-free `--frozen-lockfile` install, which prunes anything outside the supported set.
- "No other file changed" means: on this branch, the only changed tracked file is
  `pnpm-workspace.yaml` (plus this spec file under `docs/specs/`). `pnpm-lock.yaml` is **not**
  changed — the lockfile exception under "Stop conditions" did not fire (decision 6-S1-Q1). No
  source, content, script, `.npmrc` or `package.json` edit is part of this task.
- The Netlify preview is checked by a human after the PR is opened; no agent pushes or merges, so
  the preview-green criterion (and with it the remaining glibc check) is a gate-3 close-out item,
  not something the Tester can produce.
Correct me at gate 1, otherwise I proceed with these.

## Context found
- `pnpm-workspace.yaml`: the single source of `supportedArchitectures` (`os: [linux, darwin]`,
  `cpu: [x64, arm64]`, `libc: [glibc]`), next to `packages: ['.']`, `overrides: {vite: 6.3.5}` and
  `allowBuilds` for `@tailwindcss/oxide`, `core-js`, `esbuild`. This is the file to change.
- `.npmrc`: one line, `registry=https://registry.npmjs.org/`. No architecture settings — stays as is.
- `package.json`: `build` = `tsx scripts/generate-content.ts && vite build && tsx scripts/prerender.ts`;
  `check:analytics` = `tsx scripts/check-analytics.ts`. `vite build` is the step that needs the
  platform rollup/esbuild binary, so `pnpm build` is the real regression test. `devDependencies`
  pin `@esbuild/darwin-arm64` and `@rollup/rollup-darwin-arm64` explicitly — an older workaround
  for the same class of problem, left alone here (see "Out of scope").
- `pnpm-lock.yaml`: `lockfileVersion: '9.0'`; contains all win32/linux/darwin rollup and esbuild
  snapshots already, which is why no lockfile change is expected.
- `CLAUDE.md` (repo): documents `pnpm install` / `pnpm dev` / `pnpm build` and the `allowBuilds`
  approval mechanism; it never mentions architecture flags, i.e. the documented happy path is
  exactly the plain install this fix repairs.
- `scripts/check-analytics.ts`: the repo's stand-in for a test runner ("The repo has no test runner
  and adding one is out of scope") — a `tsx` script that prints `PASS`/`FAIL` per criterion and
  exits non-zero. It reads `dist/`, so it also proves the build produced output.

## Approach
Extend the existing `supportedArchitectures` block in `pnpm-workspace.yaml` by appending `current`
to each of the three lists, leaving every existing entry in place and in order:

```yaml
supportedArchitectures:
  os:
    - linux
    - darwin
    - current
  cpu:
    - x64
    - arm64
    - current
  libc:
    - glibc
    - current
```

Purely additive, so the resolved set on Netlify (linux/x64/glibc) is identical to today's — nothing
is removed, and `current` there resolves to values already listed. On the Windows PC the set widens
by win32/x64, which is exactly the missing rollup/esbuild binary. Three lines, one file.

Rejected: (a) hard-coding `win32` instead of `current` — fixes this machine but leaves the next
platform (an arm64 Windows or musl Linux runner) broken, and the goal explicitly asks for the
platform-agnostic form; (b) `os: ['*']` / dropping the block entirely — installs every platform's
binaries for everyone, inflating the Netlify install for no benefit and discarding a deliberate
setting; (c) keeping the `--os=current --cpu=current` workaround and documenting it — leaves a
documented `pnpm install` (repo `CLAUDE.md`) that does not work, and every new clone hits it;
(d) removing the `@esbuild/darwin-arm64` / `@rollup/rollup-darwin-arm64` devDependencies now that
`current` covers them — a lockfile-churning cleanup that is not needed for the goal.

## Files to change
| File | Change | Why |
|---|---|---|
| `pnpm-workspace.yaml` | Append `- current` to `supportedArchitectures.os`, `.cpu` and `.libc` | The single place the platform filter is defined; makes a flag-free frozen-lockfile install fetch the host platform's binaries |
| `pnpm-lock.yaml` | **No change.** Confirmed 2026-09-27 (decision 6-S1-Q1): no stop condition fired, pnpm accepted `--frozen-lockfile` after the edit, so the lockfile stays untouched | The goal allows a lockfile update "only if pnpm requires it" — pnpm did not require it |

## Acceptance criteria
1. `pnpm-workspace.yaml` → `supportedArchitectures.os` contains exactly `linux`, `darwin`, `current`.
2. `pnpm-workspace.yaml` → `supportedArchitectures.cpu` contains exactly `x64`, `arm64`, `current`.
3. `pnpm-workspace.yaml` → `supportedArchitectures.libc` contains exactly `glibc`, `current`.
4. The diff of `pnpm-workspace.yaml` against `dev` adds lines only: no existing entry (`linux`,
   `darwin`, `x64`, `arm64`, `glibc`) is removed, renamed or reordered, and `packages`, `overrides`
   and `allowBuilds` are byte-identical to `dev`.
5. `pnpm install --frozen-lockfile` (no `--os`, no `--cpu`, no other flag) run in the task worktree
   exits 0 and does not print `ERR_PNPM_OUTDATED_LOCKFILE`.
6. After that install, on this Windows host, `node_modules/@rollup/rollup-win32-x64-msvc` and
   `node_modules/@esbuild/win32-x64` both exist as directories containing their native binary.
7. `pnpm build` exits 0 after that install and writes `dist/index.html` plus one HTML shell per
   prerendered route.
8. `pnpm check:analytics` exits 0 after that build and prints no `FAIL` line.
9. `git status --porcelain` on the branch lists no modified tracked file other than
   `pnpm-workspace.yaml` (plus the new `docs/specs/<task-id>.md`).
10. `.npmrc`, `package.json` and `pnpm-lock.yaml` are byte-identical to `dev`.
11. The Netlify build of this branch (branch deploy / deploy preview, site `vl-home`) finishes
    green and its build log shows the pnpm install step succeeding without architecture flags.
12. The deployed preview serves the German start page at `/de` and the English one at `/en` with no
    blank page and no console error about a missing native module — i.e. the build output is not
    just green but usable.

## Test plan
There is no test runner in this repo (`scripts/check-analytics.ts` header states it, and adding one
stays out of scope). The mechanical suite for this fix is the three commands the goal names, run in
this order in the worktree, each checked by its **exit code**, never by matching its output text:

```
pnpm install --frozen-lockfile
pnpm build
pnpm check:analytics
```

The Test Writer adds no new test file: a static assertion that `pnpm-workspace.yaml` contains the
string `current` would only restate the diff, while the install/build pair is the actual behaviour
under test. Criteria 1-4, 9 and 10 are checked by reading the file and the diff (`git diff dev --
pnpm-workspace.yaml`, `git status --porcelain`); 5-8 by the commands above; 6 by listing the two
directories; 11-12 by a human on the Netlify preview after the PR is opened ("What to click").

## What to click
1. Netlify → site `vl-home` → the deploy for branch `fix/pnpm-supportedarchitectures-include-the-current-`:
   state is "Published"/green, and the install step in the log shows no `--os`/`--cpu` flag and no
   libc/glibc complaint.
2. Open the preview URL `/de`: the start page renders fully (hero, sections, footer) — not a blank
   page or an error overlay.
3. Open the preview URL `/en`: the English start page renders, confirming the prerender step ran
   for both locales.
4. Browser console on `/de`: no error mentioning a native/rollup/esbuild module.

## Verification and evidence
- Criteria 1-3: the close-out quotes the final `supportedArchitectures` block from
  `pnpm-workspace.yaml` (10 lines) verbatim.
- Criterion 4 + 9 + 10: the close-out pastes the full output of `git diff --stat dev` and of
  `git status --porcelain`. Expected: one modified file (`pnpm-workspace.yaml`, +3 lines, -0) plus
  the new spec file, and no `pnpm-lock.yaml` line.
- Criterion 5: the close-out states the exit code of `pnpm install --frozen-lockfile`, the pnpm
  version used, and the exact command line, so it is visible that no architecture flag was passed.
  Recorded on 2026-09-27: pnpm 10.30.3 accepted `current` for `os`, `cpu` and `libc` on Windows and
  printed no `ERR_PNPM_OUTDATED_LOCKFILE` — i.e. neither lockfile-related stop condition fired.
- Criterion 6: the close-out shows the read-back of the two directories, e.g. the output of
  `Get-ChildItem node_modules/@rollup/rollup-win32-x64-msvc, node_modules/@esbuild/win32-x64`
  (PowerShell), naming the `.node`/`.exe` binary found in each.
- Criteria 7-8: exit codes of `pnpm build` and `pnpm check:analytics`, plus the last line of each.
  For `check:analytics` the close-out states the PASS count and that no `FAIL` line appeared.
- Optional but valuable (report it if it was run): the same `pnpm install --frozen-lockfile` on the
  unfixed state failing to keep the win32 binaries, i.e. the before/after that shows the fix is the
  cause. Only run this in a scratch copy, never by reverting the worktree mid-verification.
- Criteria 11-12: after the PR is opened by a human, the close-out carries the Netlify deploy URL
  and deploy state, and one screenshot of the preview `/de` start page. This Netlify run is also
  the remaining glibc check (decision 6-S1-Q1) and belongs to gate 3.
- Reviewer: confirms the change is additive-only and that nothing in `package.json`, `.npmrc` or
  `pnpm-lock.yaml` moved.

## Will not do
- No `git push`, no PR creation, no merge, no rebase; `main` and `dev` are untouched.
- No change in the agent-cluster repo — dropping `--os=current --cpu=current` from the Dev Manager's
  install command is the front desk's own follow-up, in its own repo, after this lands.
- No `pnpm update`, no `pnpm dedupe`, no dependency version bump, and **no lockfile regeneration at
  all**: the narrow "Stop conditions" exception did not fire, so `pnpm-lock.yaml` stays untouched.
- No edit to `package.json` (including the `@esbuild/darwin-arm64` / `@rollup/rollup-darwin-arm64`
  devDependencies) or `.npmrc`.
- No new test runner, no new check script, no CI workflow change (`.github/workflows` and
  `netlify.toml` are out of read and write range for this task).
- No Netlify UI/site-setting change, no environment-variable change, no restart of anything.
- No content, locale or `src/` edit; `src/data/{de,en}/` stays generated and untouched.

## Stop conditions
- `pnpm install --frozen-lockfile` fails with `ERR_PNPM_OUTDATED_LOCKFILE`: stop and report before
  touching the lockfile. **Did not fire on 2026-09-27** (decision 6-S1-Q1) — it stays here only as a
  guard for a re-run. If it ever does fire, the allowed next step is one
  `pnpm install --no-frozen-lockfile`, then re-running `--frozen-lockfile` — but only after the
  close-out has said so, and only if the resulting `pnpm-lock.yaml` diff changes no resolved version
  of any package. Any lockfile diff that moves a version stops the task and goes to Christian.
- The install fails with a complaint about the `current` value (unknown value, or a libc/detect
  failure on Windows or macOS): stop and report the exact error. **Did not fire on Windows with pnpm
  10.30.3 (2026-09-27)**; it still applies to the Netlify/glibc install. Do **not** silently drop
  `current` from `libc`, and do not substitute `win32` for `current` — that is a spec change and
  Christian's call.
- `pnpm install --frozen-lockfile` succeeds but `pnpm build` still fails on a missing native
  module: stop and report which module, with the error; the premise of the fix is then wrong.
- Any file outside `pnpm-workspace.yaml` (and this spec) turns out to need a change to satisfy a
  criterion: stop and ask instead of widening the diff.
- The verification would require installing outside this worktree, unlinking a junction, or a
  network install of a different pnpm version: stop and ask.

## Risks and open questions
- Criteria 11 and 12 cannot be produced by an agent: nobody pushes, so the Netlify preview only
  exists once a human opens the PR. They are covered by "What to click" and close out at gate 3,
  not by the Tester. The Tester says explicitly that it could not verify them.
- The libc list was the one genuinely unverified piece. The Windows half is now settled: pnpm 10.30.3
  accepted `libc: [glibc, current]` on Windows without a complaint (2026-09-27). What remains is the
  glibc side — a green Netlify (linux/glibc) build — which is the human's gate-3 close-out item, plus
  macOS, which no run in this task covers.
- Widening the install set means a Windows install now also downloads the linux and darwin binaries
  (they were already downloaded on macOS/Linux). Cost is disk and install time only; Netlify's set
  does not grow, so the production build time is unaffected.
- Repo `CLAUDE.md` still documents a plain `pnpm install`, which this fix makes true again — so no
  doc change is *needed*. A one-line note that the platform's binaries are pulled via
  `supportedArchitectures: current` would be a nice-to-have; it conflicts with "no other file
  changed" and is left for Christian to ask for at gate 1.
- The `@esbuild/darwin-arm64` / `@rollup/rollup-darwin-arm64` devDependency pins become redundant
  once `current` is in place. Leaving them is harmless; removing them touches the lockfile and is
  deliberately not part of this task.

## Out of scope
- Removing the `--os=current --cpu=current` workaround from the Dev Manager's install command
  (agent-cluster repo).
- Cleaning up the redundant darwin binary pins in `package.json`.
- Introducing a test runner, a `check:*` script for build tooling, or any CI configuration.
- Pinning a `packageManager` / pnpm version for the repo, or adding an `.nvmrc`/`engines` field.
- Anything about the `pulse-landing-page` repo or the other Venture Labs repos, even though they
  may carry the same pattern.
