import { describe, expect, it } from "vitest";
import { buildQueryString, hasActiveFilters, parseSearchParams } from "@/lib/search-params";
import { formatAge, slugify, truncate } from "@/lib/text";

describe("parseSearchParams", () => {
    it("parses valid filters", () => {
        const filters = parseSearchParams({
            species: "dog", size: "small", sex: "F", kids: "1", city: " Roma ", radius: "50", page: "2", q: " dolce ",
        });
        expect(filters).toMatchObject({
            species: "dog", size: "small", sex: "F", kids: true, city: "Roma", radiusKm: 50, page: 2, query: "dolce",
        });
    });

    it("ignores unknown or malicious values instead of failing", () => {
        const filters = parseSearchParams({
            species: "rabbit", size: "huge", sex: "X", kids: "yes", radius: "9999", page: "-3", q: "x".repeat(500),
        });
        expect(filters.species).toBeUndefined();
        expect(filters.size).toBeUndefined();
        expect(filters.sex).toBeUndefined();
        expect(filters.kids).toBeUndefined();
        expect(filters.radiusKm).toBeUndefined();
        expect(filters.page).toBe(1);
        expect(filters.query?.length).toBe(80);
    });

    it("takes the first value when a parameter is repeated", () => {
        expect(parseSearchParams({ species: ["cat", "dog"] }).species).toBe("cat");
    });
});

describe("buildQueryString", () => {
    it("round-trips filters and drops defaults", () => {
        const filters = parseSearchParams({ species: "cat", city: "Roma", radius: "25", page: "1" });
        expect(buildQueryString(filters)).toBe("?species=cat&city=Roma&radius=25");
        expect(buildQueryString(filters, { page: 3 })).toBe("?species=cat&city=Roma&radius=25&page=3");
        expect(buildQueryString(parseSearchParams({}))).toBe("");
    });

    it("does not keep a radius without a city", () => {
        expect(buildQueryString({ radiusKm: 50, page: 1 })).toBe("");
    });

    it("detects active filters", () => {
        expect(hasActiveFilters(parseSearchParams({}))).toBe(false);
        expect(hasActiveFilters(parseSearchParams({ kids: "1" }))).toBe(true);
    });
});

describe("text helpers", () => {
    it("slugifies like the database", () => {
        expect(slugify("Sant'Oreste è bella")).toBe("sant-oreste-e-bella");
        expect(slugify("  Città della Pieve!  ")).toBe("citta-della-pieve");
        expect(slugify("Roma")).toBe("roma");
    });

    it("formats ages in Italian", () => {
        const today = new Date("2026-10-28T12:00:00Z");
        expect(formatAge("2026-10-14", today)).toBe("2 settimane");
        expect(formatAge("2026-05-28", today)).toBe("5 mesi");
        expect(formatAge("2024-08-28", today)).toBe("2 anni e 2 mesi");
        expect(formatAge("2022-10-28", today)).toBe("4 anni");
        expect(formatAge("2025-09-20", today)).toBe("13 mesi");
    });

    it("truncates on a word boundary", () => {
        expect(truncate("breve", 50)).toBe("breve");
        const long = "parola ".repeat(40);
        const result = truncate(long, 60);
        expect(result.length).toBeLessThanOrEqual(60);
        expect(result.endsWith("…")).toBe(true);
    });
});
