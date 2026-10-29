import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

export type RateLimitPolicy = { name: string; limit: number; window: Window };

export const rateLimitPolicies = {
    signupIp: { name: "signup-ip", limit: 5, window: "1 h" },
    signupEmail: { name: "signup-email", limit: 3, window: "1 h" },
    loginIp: { name: "login-ip", limit: 20, window: "10 m" },
    loginEmail: { name: "login-email", limit: 8, window: "10 m" },
    oauthIp: { name: "oauth-ip", limit: 20, window: "10 m" },
    orgCreateUser: { name: "org-create-user", limit: 3, window: "1 d" },
    orgDocumentUser: { name: "org-document-user", limit: 20, window: "1 h" },
    listingCreateUser: { name: "listing-create-user", limit: 20, window: "1 d" },
    listingPhotoUser: { name: "listing-photo-user", limit: 60, window: "1 h" },
    inquiryCreateUser: { name: "inquiry-create-user", limit: 8, window: "1 d" },
    inquiryCreateIp: { name: "inquiry-create-ip", limit: 20, window: "1 h" },
    inquiryMessageUser: { name: "inquiry-message-user", limit: 40, window: "1 h" },
} as const satisfies Record<string, RateLimitPolicy>;

const limiters = new Map<string, Ratelimit>();

function getLimiter(policy: RateLimitPolicy): Ratelimit | null {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        return null;
    }

    let limiter = limiters.get(policy.name);
    if (!limiter) {
        limiter = new Ratelimit({
            redis: new Redis({ url, token }),
            limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
            prefix: `rl:${policy.name}`,
        });
        limiters.set(policy.name, limiter);
    }
    return limiter;
}

// Returns true when the request may proceed.
export async function checkRateLimit(policy: RateLimitPolicy, key: string): Promise<boolean> {
    const limiter = getLimiter(policy);
    if (!limiter) {
        // Fail closed in production when Redis is not configured.
        return process.env.NODE_ENV !== "production";
    }

    try {
        const { success } = await limiter.limit(key);
        return success;
    } catch {
        // A Redis outage must not open the door in production.
        return process.env.NODE_ENV !== "production";
    }
}

export async function getClientIp(): Promise<string | null> {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || requestHeaders.get("x-real-ip") || null;
}
