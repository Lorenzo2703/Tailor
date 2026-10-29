import { test, expect } from "@playwright/test";

/**
 * E2E: Public pages accessibility & SEO.
 * These tests run without authentication and verify core public flows.
 */

test.describe("Home page", () => {
  test("loads and shows adoption headline", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Tailor/i);
    // Must have a main landmark
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Animal discovery", () => {
  test("shows animal listings", async ({ page }) => {
    await page.goto("/animals");
    await expect(page).toHaveTitle(/Tailor/i);
    // Page renders without error
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Shelter directory", () => {
  test("renders shelter list", async ({ page }) => {
    await page.goto("/shelters");
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
    // Clear localStorage to simulate first visit
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("tailor_cookie_consent"));
    await page.reload();

    const banner = page.getByRole("complementary", {
      name: /cookie/i,
    });
    await expect(banner).toBeVisible();

    // Accept
    await page.getByRole("button", { name: /accetto|accetta/i }).click();
    await expect(banner).not.toBeVisible();

    // Persists after reload
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
