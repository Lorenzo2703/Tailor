import { test, expect } from "@playwright/test";

/**
 * E2E: Public pages accessibility & SEO.
 * These tests run without authentication and verify core public flows.
 */

test.describe("Home page", () => {
  test("loads and shows adoption headline", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tailor/i);
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Animal discovery", () => {
  test("shows animal listings", async ({ page }) => {
    await page.goto("/animals");
    await expect(page).toHaveTitle(/Tailor/i);
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Shelter directory", () => {
  test("renders shelter detail page", async ({ page }) => {
    await page.goto("/shelters/rifugio-muratella");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Legal pages", () => {
  test("terms of service page renders", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText(/Termini/i);
  });

  test("privacy policy page renders", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText(/Privacy/i);
  });

  test("safety guide page renders", async ({ page }) => {
    await page.goto("/safety");
    await expect(page.locator("h1")).toContainText(/Sicurezza/i);
  });
});

test.describe("Cookie consent banner", () => {
  test("shows on first visit and hides after accept", async ({ page }) => {
    // Navigate with clean state
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.removeItem("tailor_cookie_consent");
    });
    // Reload so component mounts with clean localStorage
    await page.reload();

    const banner = page.locator("aside[aria-label='Informativa Cookie']");
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Click accept button ("Ho capito" is the actual button text)
    await banner.getByRole("button", { name: /ho capito/i }).click();
    await expect(banner).not.toBeVisible();

    // Verify localStorage has been set
    const consent = await page.evaluate(() => window.localStorage.getItem("tailor_cookie_consent"));
    expect(consent).toBe("accepted");

    // Reloading the page should keep the banner hidden
    await page.reload();
    await expect(banner).not.toBeVisible();
  });
});

test.describe("404 page", () => {
  test("shows not-found page for unknown routes", async ({ page }) => {
    const response = await page.goto("/questa-pagina-non-esiste-mai");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText(/non trovata/i);
  });
});

test.describe("Auth redirect", () => {
  test("redirects unauthenticated users from /account to /login", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects unauthenticated users from /favorites to /login", async ({
    page,
  }) => {
    await page.goto("/favorites");
    await expect(page).toHaveURL(/\/login/);
  });
});
