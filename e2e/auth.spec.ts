import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

if (!process.env.CI) {
    loadEnvConfig(process.cwd());
}

type LocalAuthConfig = {
    url: string;
    serviceRoleKey: string;
};

const testPassword = "TailorTest2026!";

function getLocalAuthConfig(): LocalAuthConfig | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) return null;

    try {
        const parsedUrl = new URL(url);
        if (
            parsedUrl.protocol !== "http:" ||
            (parsedUrl.hostname !== "localhost" && parsedUrl.hostname !== "127.0.0.1") ||
            parsedUrl.port !== "54321"
        ) {
            return null;
        }
    } catch {
        return null;
    }

    return { url, serviceRoleKey };
}

function adminHeaders(config: LocalAuthConfig) {
    return {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
    };
}

async function removeUserByEmail(request: APIRequestContext, config: LocalAuthConfig, email: string) {
    const response = await request.get(`${config.url}/auth/v1/admin/users?page=1&per_page=1000`, {
        headers: adminHeaders(config),
    });
    if (!response.ok()) return;

    const payload = await response.json() as { users?: { id: string; email?: string }[] };
    const user = payload.users?.find((candidate) => candidate.email === email);
    if (user) {
        await request.delete(`${config.url}/auth/v1/admin/users/${user.id}`, {
            headers: adminHeaders(config),
        });
    }
}

async function createConfirmedUser(
    request: APIRequestContext,
    config: LocalAuthConfig,
    email: string,
) {
    return request.post(`${config.url}/auth/v1/admin/users`, {
        headers: adminHeaders(config),
        data: {
            email,
            password: testPassword,
            email_confirm: true,
            user_metadata: { display_name: "Utente Test Tailor" },
        },
    });
}

test.describe("Autenticazione locale", () => {
    test("registra un nuovo account e mostra la conferma email", async ({ page, request }) => {
        const config = getLocalAuthConfig();
        test.skip(!config, "Richiede Supabase locale e la service-role key locale.");
        if (!config) return;

        const email = `tailor-e2e-signup-${randomUUID()}@example.com`;
        try {
            await page.goto("/signup");
            await page.locator("#signup-name").fill("Utente Test Tailor");
            await page.locator("#signup-email").fill(email);
            await page.locator("#signup-password").fill(testPassword);
            await page.locator('input[name="acceptTerms"]').check();
            await page.getByRole("button", { name: "Registrati" }).click();

            await expect(page.getByRole("heading", { name: "Controlla la tua email" })).toBeVisible();
            await expect(page.getByRole("status")).toContainText("abbiamo inviato un link");
        } finally {
            await removeUserByEmail(request, config, email);
        }
    });

    test("mostra la stessa conferma se l'email esiste già", async ({ page, request }) => {
        const config = getLocalAuthConfig();
        test.skip(!config, "Richiede Supabase locale e la service-role key locale.");
        if (!config) return;

        const email = `tailor-e2e-existing-${randomUUID()}@example.com`;
        const createResponse = await createConfirmedUser(request, config, email);
        expect(createResponse.ok()).toBe(true);

        try {
            await page.goto("/signup");
            await page.locator("#signup-name").fill("Utente Test Tailor");
            await page.locator("#signup-email").fill(email);
            await page.locator("#signup-password").fill(testPassword);
            await page.locator('input[name="acceptTerms"]').check();
            await page.getByRole("button", { name: "Registrati" }).click();

            await expect(page.getByRole("heading", { name: "Controlla la tua email" })).toBeVisible();
            await expect(page.getByRole("status")).toContainText("abbiamo inviato un link");
        } finally {
            await removeUserByEmail(request, config, email);
        }
    });

    test("accede con credenziali di test confermate", async ({ page, request }) => {
        const config = getLocalAuthConfig();
        test.skip(!config, "Richiede Supabase locale e la service-role key locale.");
        if (!config) return;

        const email = `tailor-e2e-login-${randomUUID()}@example.com`;
        const createResponse = await createConfirmedUser(request, config, email);
        expect(createResponse.ok()).toBe(true);

        try {
            await page.goto("/login?next=%2Faccount");
            await page.locator("#login-email").fill(email);
            await page.locator("#login-password").fill(testPassword);
            await page.getByRole("button", { name: "Accedi" }).click();

            await expect(page).toHaveURL(/\/account$/);
            await expect(page.getByRole("heading", { name: "Il tuo account" })).toBeVisible();
            await expect(page.locator(".account-profile")).toBeVisible();
            await expect(page.locator(".account-shortcut")).toHaveCount(3);
            await expect(page.getByRole("heading", { name: "Preferenze" })).toBeVisible();
            await expect(page.getByText(email)).toBeVisible();
            const exportInfo = page.locator("#gdpr-export-info");
            await expect(exportInfo).toBeHidden();
            const exportInfoButton = page.locator(".account-gdpr-info-trigger").first();
            await exportInfoButton.hover();
            await expect(exportInfo).toBeVisible();
            const deleteInfo = page.locator("#gdpr-delete-info");
            await page.locator(".account-gdpr-info-trigger").nth(1).click();
            await expect(deleteInfo).toBeVisible();
            expect(await page.locator("body").evaluate((body) => body.scrollWidth > body.clientWidth)).toBe(false);
        } finally {
            await removeUserByEmail(request, config, email);
        }
    });
});