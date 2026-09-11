/**
 * Playwright config for the analytics e2e checks.
 *
 * Playwright is deliberately NOT a dependency of this repo ("no new
 * dependencies"), so these tests are run ad hoc against a local production
 * preview:
 *
 *   1. pnpm build                       # CONTEXT unset, so the tag is injected
 *   2. pnpm exec vite preview --port 4173
 *   3. pnpm dlx --package @playwright/test playwright install chromium
 *   4. pnpm dlx --package @playwright/test playwright test --config tests/e2e/playwright.config.ts
 *
 * Fallback if `pnpm dlx` cannot resolve the bin:
 *   npx --yes @playwright/test@latest test --config tests/e2e/playwright.config.ts
 *
 * Nothing in the build imports this file; it is inert for `pnpm build`.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  reporter: "list",
  use: {
    // PW_BASE_URL lets the same specs run against `pnpm dev` (:5173), where the
    // tag is absent and trackEvent() must no-op instead of throwing.
    baseURL: process.env.PW_BASE_URL ?? "http://localhost:4173",
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
