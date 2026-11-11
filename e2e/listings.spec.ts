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

test("advances through listing steps 2 to 5 after saving details and uploading a photo", async ({ page, request }) => {
    const config = getLocalAuthConfig();
    test.skip(!config, "Richiede Supabase locale e la service-role key locale.");
    if (!config) return;

    const email = `tailor-e2e-listing-${randomUUID()}@example.com`;
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
        await page.goto("/login?next=%2Fmy-animals%2Fnew");
        await page.locator("#login-email").fill(email);
        await page.locator("#login-password").fill(testPassword);
        await page.getByRole("button", { name: "Accedi" }).click();
        await expect(page).toHaveURL(/\/my-animals\/new$/);

        await page.locator("#animal-name").fill("Micio Test");
        await page.locator("#animal-species-cat").check();
        await page.locator("#animal-sex-M").check();
        await page.locator("#animal-birth").fill("2020-01-01");
        await page.locator("#animal-size-small").check();
        await page.locator("#animal-city").fill("Roma");
        await page.getByRole("button", { name: "Salva e continua" }).click();
        await expect(page).toHaveURL(/\/my-animals\/[0-9a-f-]+\?step=2$/);

        await page.locator("#health-origin-family_pet").check();
        await page.getByRole("button", { name: "Salva e continua" }).click();

        await expect(page).toHaveURL(/\/my-animals\/[0-9a-f-]+\?step=3$/);
        await expect(page.getByRole("heading", { name: /Passo 3 di 5/ })).toBeVisible();

        await page.locator("#trait-kids-yes").check();
        await expect(page.locator("#trait-kids-yes")).toBeChecked();
        await page.locator("#trait-dogs-no").check();
        await expect(page.locator("#trait-dogs-no")).toBeChecked();
        await page.locator("#story").fill("Micio Test è curioso, tranquillo e cerca una famiglia amorevole.");
        await page.getByRole("button", { name: "Salva e continua" }).click();
        await expect(page).toHaveURL(/\/my-animals\/[0-9a-f-]+\?step=4$/);
        await expect(page.getByRole("heading", { name: /Passo 4 di 5/ })).toBeVisible();

        await page.locator("#photo-file").setInputFiles("public/images/gatto-01.webp");
        await page.locator("#photo-alt-0").fill("Gatto di prova seduto");
        await page.getByRole("button", { name: "Aggiungi foto" }).click();
        await expect(page).toHaveURL(/\/my-animals\/[0-9a-f-]+\?step=5$/);
        await expect(page.getByRole("heading", { name: /Passo 5 di 5/ })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Anteprima nella home" })).toBeVisible();
        await expect(page.locator(".listing-preview .pub-card h3")).toHaveText("Micio Test");
        await expect(page.locator(".listing-preview .pub-card img")).toHaveAttribute("alt", "Gatto di prova seduto");

        await page.getByRole("button", { name: "Pubblica l'annuncio" }).click();
        await expect(page.locator(".status-badge")).toHaveText("Pubblicato");
        await page.getByRole("button", { name: "Segna come affidato" }).click();
        await expect(page.locator(".status-badge")).toHaveText("Affidato");
        await page.getByRole("button", { name: "Annulla affidamento" }).click();
        await expect(page.locator(".status-badge")).toHaveText("Pubblicato");

        await page.getByRole("link", { name: /4\. Foto/ }).click();
        await page.getByRole("button", { name: "Rimuovi" }).click();
        await expect(page.locator(".photo-grid li")).toHaveCount(0);
    } finally {
        await removeUserByEmail(request, config, email);
    }
});