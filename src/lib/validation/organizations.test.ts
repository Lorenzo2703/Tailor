import { describe, expect, it } from "vitest";
import { detectDocumentMime, sanitizeFileName } from "@/lib/validation/documents";
import {
    createOrganizationSchema,
    reviewOrganizationSchema,
} from "@/lib/validation/organizations";

const bytes = (...values: number[]) => new Uint8Array(values);

describe("detectDocumentMime", () => {
    it("recognizes allowed formats from their signature", () => {
        expect(detectDocumentMime(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31))).toBe("application/pdf");
        expect(detectDocumentMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
        expect(detectDocumentMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    });

    it("rejects anything else, including executables and HTML", () => {
        expect(detectDocumentMime(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull();
        expect(detectDocumentMime(new TextEncoder().encode("<html><script>"))).toBeNull();
        expect(detectDocumentMime(bytes())).toBeNull();
    });
});

describe("sanitizeFileName", () => {
    it("removes path separators and control characters", () => {
        expect(sanitizeFileName("../../etc/passwd")).not.toMatch(/[/\\]/);
        expect(sanitizeFileName("a\u0000b\nc.pdf")).toBe("abc.pdf");
    });

    it("keeps readable names and limits length", () => {
        expect(sanitizeFileName("Statuto è valido.pdf")).toBe("Statuto è valido.pdf");
        expect(sanitizeFileName("x".repeat(500)).length).toBe(120);
    });

    it("falls back for empty names", () => {
        expect(sanitizeFileName("///")).toBe("documento");
    });
});

describe("createOrganizationSchema", () => {
    const valid = { type: "shelter", name: " Rifugio Test ", region: "Lazio", city: "Roma" };

    it("accepts a minimal valid payload and trims values", () => {
        const result = createOrganizationSchema.safeParse(valid);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("Rifugio Test");
            expect(result.data.contactEmail).toBe("");
        }
    });

    it("does not allow breeders through self-service", () => {
        expect(createOrganizationSchema.safeParse({ ...valid, type: "breeder" }).success).toBe(false);
    });

    it("validates the optional contact email", () => {
        expect(createOrganizationSchema.safeParse({ ...valid, contactEmail: "no" }).success).toBe(false);
        expect(createOrganizationSchema.safeParse({ ...valid, contactEmail: "a@example.test" }).success).toBe(true);
    });
});

describe("reviewOrganizationSchema", () => {
    it("requires a reason only when rejecting", () => {
        expect(reviewOrganizationSchema.safeParse({ decision: "verified" }).success).toBe(true);
        expect(reviewOrganizationSchema.safeParse({ decision: "rejected", reason: "no" }).success).toBe(false);
        expect(reviewOrganizationSchema.safeParse({ decision: "rejected", reason: "Documento scaduto" }).success).toBe(true);
    });

    it("rejects unknown decisions", () => {
        expect(reviewOrganizationSchema.safeParse({ decision: "pending" }).success).toBe(false);
    });
});
