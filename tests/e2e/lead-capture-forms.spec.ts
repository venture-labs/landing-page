/**
 * 20261016-leistungen-funnel-capture-leads-that-do-not-book
 *
 * Criteria 1-4, 6, 7, 18: the Pulse Score quiz's optional lead box and the
 * contact form's Netlify Forms submission, proven independent of a live
 * Netlify backend by intercepting the POST to `/` (per the spec's Test plan)
 * and reading back its exact body.
 *
 * Run instructions: see tests/e2e/playwright.config.ts (needs `pnpm build`
 * then `vite preview --port 4173`). Nothing leaves the machine: the POST to
 * `/` never reaches a real server, and plausible.io/calendar.app.google are
 * aborted at the context level.
 */
import { test, expect, type Page, type Request } from "@playwright/test";

/** Option buttons inside the quiz dialog (excludes the Radix close button). */
const OPTION_BUTTONS = '[role="dialog"] button.text-left';

async function blockThirdParties(page: Page): Promise<void> {
  await page.context().route("**://plausible.io/**", (route) => route.abort());
  await page.context().route("**://calendar.app.google/**", (route) => route.abort());
}

/** Intercepts the POST to "/" and fulfills it with `status`, capturing every
 * intercepted request so the test can assert on the exact body sent. */
async function mockFormPost(page: Page, status: number): Promise<{ requests: Request[] }> {
  const captured: Request[] = [];
  await page.route(
    (url) => url.pathname === "/",
    async (route, request) => {
      if (request.method() === "POST") {
        captured.push(request);
        await route.fulfill({ status, contentType: "text/plain", body: "" });
      } else {
        await route.continue();
      }
    }
  );
  return { requests: captured };
}

function parseBody(request: Request): Record<string, string> {
  const body = request.postData() ?? "";
  const params = new URLSearchParams(body);
  return Object.fromEntries(params.entries());
}

async function answerAllQuestions(page: Page): Promise<void> {
  await page.goto("/de");
  await page.getByRole("button", { name: "Kostenlosen Pulse Score starten" }).first().click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.locator(OPTION_BUTTONS).first().click();
  }
  await expect(page.getByText("/ 100 Pulse Score")).toBeVisible();
}

/** The e-mail form only exists after the "Ergebnis festhalten" toggle. */
async function openLeadForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Ergebnis festhalten" }).click();
  await expect(page.getByPlaceholder("Deine E-Mail-Adresse")).toBeVisible();
}

test.describe("Pulse Score quiz result: optional lead capture", () => {
  test.beforeEach(async ({ page }) => {
    await blockThirdParties(page);
  });

  test("criterion 1: the score, band, breakdown and booking CTA render without ever touching the email field", async ({
    page,
  }) => {
    await answerAllQuestions(page);

    await expect(page.getByText("/ 100 Pulse Score")).toBeVisible();
    await expect(page.getByRole("link", { name: "Erstgespräch buchen" })).toBeVisible();
    // The toggle renders, the old separate lead heading is gone, and the
    // e-mail form, consent and submit stay folded shut until the toggle is used.
    await expect(page.getByRole("button", { name: "Ergebnis festhalten" })).toBeVisible();
    await expect(page.getByText("Ergebnis festhalten?")).toHaveCount(0);
    await expect(page.getByPlaceholder("Deine E-Mail-Adresse")).toBeHidden();
    await expect(page.getByRole("button", { name: "Absenden" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Datenschutzerklärung" })).toBeHidden();
  });

  test("criterion 2: the email field is blocked by native validation without consent, and the checkbox links to /de/datenschutz", async ({
    page,
  }) => {
    const { requests } = await mockFormPost(page, 200);
    await answerAllQuestions(page);
    await openLeadForm(page);

    const consentLink = page.getByRole("link", { name: "Datenschutzerklärung" });
    await expect(consentLink).toHaveAttribute("href", "/de/datenschutz");

    await page.getByPlaceholder("Deine E-Mail-Adresse").fill("lead@example.com");
    // Consent left unchecked.
    await page.getByRole("button", { name: "Absenden" }).click();

    // Native `required` on the checkbox blocks the submit handler entirely.
    expect(requests).toHaveLength(0);
  });

  test("criterion 3 & 18: a valid submission POSTs form-name=pulse-score-leads with an empty bot-field", async ({
    page,
  }) => {
    const { requests } = await mockFormPost(page, 200);
    await answerAllQuestions(page);
    await openLeadForm(page);

    await page.getByPlaceholder("Deine E-Mail-Adresse").fill("lead@example.com");
    await page.locator('form:has(input[type="email"]) input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Absenden" }).click();

    await expect(page.getByText("Danke! Wir melden uns bei dir.")).toBeVisible();
    expect(requests).toHaveLength(1);

    const body = parseBody(requests[0]);
    expect(body["form-name"]).toBe("pulse-score-leads");
    expect(body.email).toBe("lead@example.com");
    expect(body).toHaveProperty("bot-field", "");
    expect(body.score).toBeTruthy();
    expect(body.band).toBeTruthy();
    expect(body.lang).toBe("de");
  });

  test("criterion 4: a 200 replaces the box with a thank-you; a non-200 shows an inline error and no thank-you", async ({
    page,
  }) => {
    await mockFormPost(page, 500);
    await answerAllQuestions(page);
    await openLeadForm(page);

    await page.getByPlaceholder("Deine E-Mail-Adresse").fill("lead@example.com");
    await page.locator('form:has(input[type="email"]) input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Absenden" }).click();

    await expect(page.getByText("Das hat leider nicht geklappt. Bitte versuch es nochmal.")).toBeVisible();
    await expect(page.getByText("Danke! Wir melden uns bei dir.")).toHaveCount(0);
  });
});

test.describe("Contact form: Netlify Forms submission shape", () => {
  test.beforeEach(async ({ page }) => {
    await blockThirdParties(page);
  });

  test("criterion 6: no mailto: navigation is set on submit", async ({ page }) => {
    await mockFormPost(page, 200);
    await page.goto("/de/kontakt");

    let mailtoAttempted = false;
    page.on("framenavigated", (frame) => {
      if (frame.url().startsWith("mailto:")) mailtoAttempted = true;
    });

    await page.getByPlaceholder("Nachricht*").fill("Hallo, Testnachricht.");
    await page.getByPlaceholder("Dein Name*").fill("Test Person");
    await page.getByPlaceholder("E-Mail*").fill("test@example.com");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Absenden" }).click();

    await expect(page.getByText("Danke für deine Nachricht!")).toBeVisible();
    expect(mailtoAttempted).toBe(false);
    expect(page.url()).not.toContain("mailto:");
  });

  test("criterion 7: a full submission POSTs form-name=contact with message, name, email, company, role, phone", async ({
    page,
  }) => {
    const { requests } = await mockFormPost(page, 200);
    await page.goto("/de/kontakt");

    await page.getByPlaceholder("Nachricht*").fill("Hallo, Testnachricht.");
    await page.getByPlaceholder("Dein Name*").fill("Test Person");
    await page.getByPlaceholder("Unternehmen").fill("Testfirma GmbH");
    await page.getByPlaceholder("Deine Rolle").fill("CEO");
    await page.getByPlaceholder("E-Mail*").fill("test@example.com");
    await page.getByPlaceholder("Telefon").fill("+49 170 0000000");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Absenden" }).click();

    await expect(page.getByText("Danke für deine Nachricht!")).toBeVisible();
    expect(requests).toHaveLength(1);

    const body = parseBody(requests[0]);
    expect(body["form-name"]).toBe("contact");
    expect(body.message).toBe("Hallo, Testnachricht.");
    expect(body.name).toBe("Test Person");
    expect(body.email).toBe("test@example.com");
    expect(body.company).toBe("Testfirma GmbH");
    expect(body.role).toBe("CEO");
    expect(body.phone).toBe("+49 170 0000000");
  });

  test("criterion 18: the contact form's intercepted body carries no bot-field (no honeypot on this form)", async ({
    page,
  }) => {
    const { requests } = await mockFormPost(page, 200);
    await page.goto("/de/kontakt");

    await page.getByPlaceholder("Nachricht*").fill("Hallo.");
    await page.getByPlaceholder("Dein Name*").fill("Test Person");
    await page.getByPlaceholder("E-Mail*").fill("test@example.com");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Absenden" }).click();

    await expect(page.getByText("Danke für deine Nachricht!")).toBeVisible();
    expect(requests).toHaveLength(1);
    const body = parseBody(requests[0]);
    expect(body).not.toHaveProperty("bot-field");
  });
});
