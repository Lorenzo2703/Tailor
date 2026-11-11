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

test("sends a first inquiry and opens its conversation", async ({ page, request }) => {
    const config = getLocalAuthConfig();
    test.skip(!config, "Richiede Supabase locale e la service-role key locale.");
    if (!config) return;

    const email = `tailor-e2e-inquiry-${randomUUID()}@example.com`;
    const createResponse = await request.post(`${config.url}/auth/v1/admin/users`, {
        headers: adminHeaders(config),
        data: {
            email,
            password: testPassword,
            email_confirm: true,
            user_metadata: { display_name: "Utente Test Tailor" },
        },
    });
    expect(createResponse.ok()).toBe(true);

    try {
        await page.goto("/login?next=%2Fanimals%2Fluna-pastore-maremmano-roma%2Fcontact");
        await page.locator("#login-email").fill(email);
        await page.locator("#login-password").fill(testPassword);
        await page.getByRole("button", { name: "Accedi" }).click();
        await expect(page).toHaveURL(/\/animals\/luna-pastore-maremmano-roma\/contact$/);

        const message = `Richiesta di prova ${randomUUID()}`;
        await page.locator("#contact-message").fill(message);
        await page.getByRole("button", { name: "Invia il messaggio" }).click();
        const formAlert = page.locator(".auth-form .auth-alert");
        await Promise.race([
            page.waitForURL(/\/inquiries\/[0-9a-f-]+$/),
            formAlert.waitFor({ state: "visible" }),
        ]);
        if (await formAlert.isVisible().catch(() => false)) {
            throw new Error(`Contact form returned: ${await formAlert.innerText()}`);
        }

        await expect(page).toHaveURL(/\/inquiries\/[0-9a-f-]+$/);
        await expect(page.getByText(message, { exact: true })).toBeVisible();
    } finally {
        await removeUserByEmail(request, config, email);
    }
});