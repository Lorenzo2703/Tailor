import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/redirect";

describe("safeNextPath", () => {
    it("accepts same-origin relative paths", () => {
        expect(safeNextPath("/account")).toBe("/account");
        expect(safeNextPath("/animals/abc?tab=health")).toBe("/animals/abc?tab=health");
    });

    it("falls back for missing or non-string values", () => {
        expect(safeNextPath(undefined)).toBe("/account");
        expect(safeNextPath(null)).toBe("/account");
        expect(safeNextPath(["/a"])).toBe("/account");
        expect(safeNextPath("")).toBe("/account");
    });

    it("rejects absolute and protocol-relative URLs", () => {
        expect(safeNextPath("https://evil.test")).toBe("/account");
        expect(safeNextPath("//evil.test")).toBe("/account");
        expect(safeNextPath("/\\evil.test")).toBe("/account");
        expect(safeNextPath("javascript:alert(1)")).toBe("/account");
    });

    it("rejects control characters and oversized values", () => {
        expect(safeNextPath("/ok\r\nSet-Cookie: x=1")).toBe("/account");
        expect(safeNextPath(`/${"a".repeat(600)}`)).toBe("/account");
    });

    it("uses a custom fallback", () => {
        expect(safeNextPath("//x", "/app")).toBe("/app");
    });
});
