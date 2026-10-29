// Only same-origin relative paths are allowed, to prevent open redirects.
export function safeNextPath(value: unknown, fallback = "/account"): string {
    if (typeof value !== "string" || value.length === 0 || value.length > 500) {
        return fallback;
    }
    if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
        return fallback;
    }
    if (/[\u0000-\u001f\u007f]/.test(value)) {
        return fallback;
    }
    return value;
}
