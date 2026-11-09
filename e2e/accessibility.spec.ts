import { test, expect } from "@playwright/test";

/**
 * E2E: Navigation & accessibility basics.
 * Checks ARIA landmarks, skip links, focus management.
 */

test.describe("Accessibility — public shell", () => {
  test("has a visible skip-to-content link on focus", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator("a[href='#main-content']");
    await expect(skipLink).toHaveCount(1);
    const restingSize = await skipLink.evaluate((element) => ({
      width: getComputedStyle(element).width,
      height: getComputedStyle(element).height,
    }));
    expect(restingSize).toEqual({ width: "1px", height: "1px" });

    let isFocused = false;
    for (let attempt = 0; attempt < 8 && !isFocused; attempt++) {
      await page.keyboard.press("Tab");
      isFocused = await skipLink.evaluate((element) => element === element.ownerDocument.activeElement);
    }
    expect(isFocused).toBe(true);
    const focusSize = await skipLink.boundingBox();
    expect(focusSize?.height).toBeGreaterThanOrEqual(44);
  });

  test("nav links have descriptive text (no bare icons)", async ({ page }) => {
    await page.goto("/");
    const navLinks = page.locator("nav a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");
      expect((text?.trim() ?? "") + (ariaLabel ?? "")).not.toBe("");
    }
  });

  test("safety navigation link appears only in the footer", async ({ page }) => {
    await page.goto("/safety");
    await expect(page.locator(".public-nav a[href='/safety']")).toHaveCount(0);
    await expect(page.locator(".public-footer a[href='/safety']")).toHaveCount(1);
  });

  test("login exposes credential autocomplete for password managers", async ({ page }) => {
    await page.goto("/login");
    const form = page.locator("form.auth-form");
    await expect(form).toHaveAttribute("autocomplete", "on");
    await expect(page.locator("#login-email")).toHaveAttribute("name", "email");
    await expect(page.locator("#login-email")).toHaveAttribute("autocomplete", "username");
    await expect(page.locator("#login-password")).toHaveAttribute("name", "password");
    await expect(page.locator("#login-password")).toHaveAttribute("autocomplete", "current-password");
  });

  test("search filters collapse on mobile and stay open on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/animals");

    const filterContent = page.locator("#pub-filter-options");
    const toggle = page.getByRole("button", { name: "Mostra filtri" });
    await expect(page.locator(".pub-filter-search-control svg")).toHaveCount(1);
    await expect(page.locator(".pub-filter-submit svg")).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(filterContent).toBeHidden();

    await toggle.click();
    await expect(page.getByRole("button", { name: "Nascondi filtri" })).toHaveAttribute("aria-expanded", "true");
    await expect(filterContent).toBeVisible();
    await page.locator("#f-species").selectOption("cat");
    await page.getByRole("button", { name: "Applica filtri" }).click();
    await expect(page).toHaveURL(/species=cat/);
    await expect(page.locator(".pub-grid > li")).toHaveCount(2);

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(filterContent).toBeVisible();
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

  test("safety page keeps readable contrast and a touch-sized action in both themes", async ({ page }) => {
    await page.goto("/safety");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator(".safety-rule h2")).toHaveCount(4);

    const action = page.getByRole("link", { name: "Esplora gli annunci" });
    const actionBox = await action.boundingBox();
    expect(actionBox?.height).toBeGreaterThanOrEqual(44);

    const themeButton = page.getByRole("button", { name: "Cambia tema di visualizzazione" });
    for (const theme of ["light", "dark"] as const) {
      const isDark = await page.locator("html").evaluate((element) => element.classList.contains("dark"));
      if (isDark !== (theme === "dark")) {
        await themeButton.click();
      }

      const ratios = await page.locator(".safety-page").evaluate((root) => {
        const selectors = [
          ".safety-eyebrow",
          ".safety-title",
          ".safety-subtitle",
          ".safety-rule h2",
          ".safety-rule p",
          ".safety-rule-number",
          ".safety-alert h2",
          ".safety-alert p",
          ".safety-action",
        ];
        const context = root.ownerDocument.createElement("canvas").getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas 2D context unavailable");

        const toRgba = (color: string) => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data];
        };
        const composite = (front: number[], back: number[]) => {
          const frontAlpha = front[3] / 255;
          const backAlpha = back[3] / 255;
          const alpha = frontAlpha + backAlpha * (1 - frontAlpha);
          return [
            ...[0, 1, 2].map((index) =>
              alpha
                ? Math.round((front[index] * frontAlpha + back[index] * backAlpha * (1 - frontAlpha)) / alpha)
                : 0,
            ),
            Math.round(alpha * 255),
          ];
        };
        const luminance = (color: number[]) =>
          color.slice(0, 3)
            .map((value) => {
              const normalized = value / 255;
              return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
            })
            .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

        return selectors.flatMap((selector) =>
          [...root.querySelectorAll(selector)].map((element) => {
            const backgroundLayers: number[][] = [];
            for (let node: Element | null = element; node; node = node.parentElement) {
              backgroundLayers.push(toRgba(getComputedStyle(node).backgroundColor));
            }
            let background = [0, 0, 0, 0];
            for (const layer of backgroundLayers.reverse()) {
              background = composite(layer, background);
            }

            const foreground = toRgba(getComputedStyle(element).color);
            const foregroundLuminance = luminance(composite(foreground, background));
            const backgroundLuminance = luminance(background);
            return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
              (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
          }),
        );
      });

      expect(Math.min(...ratios), `${theme} theme contrast ratios: ${ratios.join(", ")}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

test.describe("Responsive layout", () => {
  test("mobile nav is accessible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    const mobileNav = page.getByRole("navigation", { name: "Navigazione mobile" });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/animals");
    await expect(mobileNav.getByRole("link", { name: "Chat" })).toHaveAttribute("href", "/inquiries");
    await expect(mobileNav.getByRole("link", { name: "Profilo" })).toHaveAttribute("href", "/account");
  });
});
