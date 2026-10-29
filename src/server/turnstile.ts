import "server-only";

// Cloudflare publishes always-pass test keys for development only.
export async function verifyTurnstile(token: unknown, remoteIp: string | null): Promise<boolean> {
    // In development or when bypassed, always succeed to streamline local testing.
    if (process.env.NODE_ENV !== "production") {
        return true;
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
        // Fail closed in production when the secret is missing.
        return false;
    }
    if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
        return false;
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) {
        body.set("remoteip", remoteIp);
    }

    try {
        const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body,
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
            return false;
        }
        const result = (await response.json()) as { success?: boolean };
        return result.success === true;
    } catch {
        return false;
    }
}
