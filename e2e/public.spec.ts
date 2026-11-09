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

  test("shows mobile navigation on public and authentication pages", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/animals");
    await expect(page.getByRole("navigation", { name: "Navigazione mobile" })).toBeVisible();
    const filters = page.getByRole("search", { name: "Filtri" });
    await filters.getByRole("button", { name: "Mostra filtri" }).click();
    const searchInput = filters.locator('input[name="q"]');
    const searchIcon = filters.locator(".pub-filter-search-control > svg");
    const inputBox = await searchInput.boundingBox();
    const iconBox = await searchIcon.boundingBox();
    const inputPaddingLeft = await searchInput.evaluate((input) =>
      Number.parseFloat(getComputedStyle(input).paddingLeft),
    );
    if (!inputBox || !iconBox) {
      throw new Error("The mobile search icon and input must be visible.");
    }
    expect(inputBox.x + inputPaddingLeft).toBeGreaterThanOrEqual(iconBox.x + iconBox.width + 8);

    await page.goto("/login");
    await expect(page.getByRole("navigation", { name: "Navigazione mobile" })).toBeVisible();
  });
});

test.describe("Animal discovery", () => {
  test("cycles listing card photos without navigating, then opens the detail", async ({ page, isMobile }) => {
    await page.goto("/animals?q=Luna");
    const card = page.locator(".pub-card").filter({ has: page.getByRole("heading", { name: "Luna", exact: true }) });
    const carousel = card.getByRole("region", { name: "Foto di Luna" });
    await expect(carousel.locator('[data-slot="carousel-item"]')).toHaveCount(3);
    const previous = carousel.getByRole("button", { name: "Foto precedente", exact: true });
    const next = carousel.getByRole("button", { name: "Foto successiva", exact: true });
    const counter = carousel.locator(".listing-photo-count");
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
    expect((await next.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await next.click();
    await expect(counter).toHaveText("Foto 2 di 3");
    await expect(page).toHaveURL(/\/animals\?q=Luna$/);
    await next.focus();
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText("Foto 3 di 3");
    await expect(next).toBeDisabled();
    await previous.click();
    await expect(counter).toHaveText("Foto 2 di 3");
    await expect(previous).toBeEnabled();
    const second = carousel.locator('[data-slot="carousel-item"]').nth(1);
    await expect(second.getByRole("img")).toBeVisible();
    await expect.poll(() => second.locator("img").evaluate((image: HTMLImageElement) =>
      image.complete && image.naturalWidth > 0,
    )).toBe(true);

    if (isMobile) {
      await second.getByRole("link").click({ trial: true });
      const box = await second.boundingBox();
      if (!box) throw new Error("The current slide must be visible.");
      const session = await page.context().newCDPSession(page);
      const y = box.y + box.height * 0.3;
      const x = box.x + box.width * 0.8;
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let step = 1; step <= 8; step++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove", touchPoints: [{ x: x - box.width * 0.6 * step / 8, y }],
        });
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await session.detach();
      await expect(counter).toHaveText("Foto 3 di 3");
      await previous.click();
      await expect(counter).toHaveText("Foto 2 di 3");
    }

    await second.getByRole("link").click();
    await expect(page).toHaveURL(/\/animals\/luna-pastore-maremmano-roma$/);
  });

  test("keeps single-photo cards free of carousel controls", async ({ page }) => {
    await page.goto("/animals?q=Thor");
    const card = page.locator(".pub-card").filter({ has: page.getByRole("heading", { name: "Thor", exact: true }) });
    await expect(card.locator('[data-slot="carousel-item"]')).toHaveCount(1);
    await expect(card.getByRole("button", { name: /Foto precedente|Foto successiva/ })).toHaveCount(0);
    await expect(card.locator(".listing-photo-count")).toHaveCount(0);
    await expect(card.locator(".pub-card-body")).toHaveAttribute("href", /\/animals\//);
  });

  test("opens and closes the restyled report button without submitting", async ({ page }) => {
    await page.goto("/animals/luna-pastore-maremmano-roma");
    const report = page.getByRole("button", { name: "Segnala annuncio", exact: true });
    await expect(report).toHaveClass(/listing-report-button/);
    await report.scrollIntoViewIfNeeded();
    expect((await report.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await expect(report).toHaveAttribute("aria-expanded", "false");
    await report.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(report).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("button", { name: "Chiudi finestra", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(report).toHaveAttribute("aria-expanded", "false");
  });

  test("shows health values as informational chips", async ({ page }) => {
    await page.goto("/animals/luna-pastore-maremmano-roma");
    const health = page.getByRole("region", { name: "Salute", exact: true });
    const chips = health.locator(".health-chip");
    await expect(chips).toHaveCount(2);
    await expect(chips.nth(0)).toHaveText("Vaccinato");
    await expect(chips.nth(1)).toHaveText("Sterilizzato");
    for (const chip of await chips.all()) {
      await expect(chip).toHaveAttribute("data-active", "true");
      const box = await chip.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await expect(health.getByRole("button")).toHaveCount(0);
  });

  test("opens photos full screen with zoom and restores focus on close", async ({ page, isMobile }) => {
    await page.goto("/animals/luna-pastore-maremmano-roma");
    const thumbnail = page.getByRole("button", { name: /^Apri foto:/ }).first();
    await expect(thumbnail).toBeVisible();
    await thumbnail.click();
    const viewer = page.getByRole("dialog", { name: "Foto a tutto schermo" });
    await expect(viewer).toBeVisible();
    const activeSlide = viewer.locator(".yarl__slide_current");
    const image = activeSlide.locator("img");
    const imageArea = activeSlide.locator(".yarl__slide_wrapper");
    const scale = () => imageArea.evaluate((element) =>
      new DOMMatrix(getComputedStyle(element).transform).a,
    );
    await expect.poll(() => image.evaluate((image: HTMLImageElement) =>
      image.complete && image.naturalWidth > 0,
    )).toBe(true);
    const box = await viewer.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.width).toBe(viewport?.width);
    expect(box?.height).toBe(viewport?.height);
    await expect(viewer.getByRole("button", { name: "Riduci", exact: true })).toBeDisabled();
    await viewer.getByRole("button", { name: "Ingrandisci", exact: true }).click();
    await expect.poll(scale).toBeGreaterThan(1.5);
    const beforeDrag = await imageArea.getAttribute("style");
    const area = await activeSlide.boundingBox();
    if (!area) throw new Error("The photo viewport must be visible.");
    await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2 - 40, { steps: 4 });
    await page.mouse.up();
    await expect.poll(() => imageArea.getAttribute("style")).not.toBe(beforeDrag);
    await viewer.getByRole("button", { name: "Riduci", exact: true }).click();
    await expect.poll(scale).toBe(1);
    if (isMobile) {
      const session = await page.context().newCDPSession(page);
      const x = area.x + area.width / 2;
      const y = area.y + area.height / 2;
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart", touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove", touchPoints: [{ x: x - 60, y, id: 1 }, { x: x + 60, y, id: 2 }],
      });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect.poll(scale).toBeGreaterThan(1.1);
      await session.detach();
    }
    await page.keyboard.press("Escape");
    await expect(viewer).not.toBeVisible();
    await expect(thumbnail).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    await thumbnail.click();
    await expect.poll(scale).toBe(1);
    await viewer.getByRole("button", { name: "Chiudi foto" }).click();
    await expect(viewer).not.toBeVisible();
  });

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
