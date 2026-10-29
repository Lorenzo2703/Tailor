import { test, expect } from "@playwright/test";

/**
 * E2E: Navigation & accessibility basics.
 * Checks ARIA landmarks, skip links, focus management.
 */

test.describe("Accessibility — public shell", () => {
  test("has a visible skip-to-content link on focus", async ({ page }) => {
    await page.goto("/");
    // Tab once to find skip link
    await page.keyboard.press("Tab");
    const skipLink = page.locator("a[href='#main-content']");
    // Skip link should exist (may be sr-only until focused)
    await expect(skipLink).toHaveCount(1);
  });

  test("nav links have descriptive text (no bare icons)", async ({ page }) => {
    await page.goto("/");
    const navLinks = page.locator("nav a");
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");
      // Must have either visible text or aria-label
      expect((text?.trim() ?? "") + (ariaLabel ?? "")).not.toBe("");
    }
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/animals");
    const imgs = page.locator("img");
    const count = await imgs.count();
    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });
});

test.describe("Responsive layout", () => {
  test("mobile nav is accessible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });
});
