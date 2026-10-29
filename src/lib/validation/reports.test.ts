import { describe, expect, it } from "vitest";
import { createReportSchema, resolveReportSchema } from "./reports";

describe("reports validation", () => {
    it("accepts valid report payload", () => {
        const res = createReportSchema.safeParse({
            listingId: "11111111-1111-1111-1111-111111111111",
            reason: "suspected_scam",
            details: "Questo annuncio richiede un bonifico anticipato prima della visita.",
        });
        expect(res.success).toBe(true);
    });

    it("rejects too short details", () => {
        const res = createReportSchema.safeParse({
            listingId: "11111111-1111-1111-1111-111111111111",
            reason: "other",
            details: "Truffa",
        });
        expect(res.success).toBe(false);
    });

    it("rejects invalid reason", () => {
        const res = createReportSchema.safeParse({
            listingId: "11111111-1111-1111-1111-111111111111",
            reason: "unknown_reason",
            details: "Dettagli sufficientemente lunghi per passare la validazione.",
        });
        expect(res.success).toBe(false);
    });

    it("parses resolve report schema", () => {
        const res = resolveReportSchema.safeParse({
            reportId: "11111111-1111-1111-1111-111111111111",
            status: "resolved_takedown",
            takedownListing: "true",
            notes: "Confermata violazione policy cuccioli sotto 60gg.",
        });
        expect(res.success).toBe(true);
        if (res.success) {
            expect(res.data.takedownListing).toBe(true);
        }
    });
});
