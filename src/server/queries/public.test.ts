import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    rpc: vi.fn(),
    from: vi.fn(),
    select: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
}));

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/lib/supabase/anon", () => ({
    createAnonClient: () => ({ rpc: mocks.rpc, from: mocks.from }),
}));

import { getPublicListing, searchPublicListings } from "./public";

beforeEach(() => {
    vi.resetAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ in: mocks.in });
    mocks.in.mockReturnValue({ order: mocks.order });
});

describe("public listing details", () => {
    beforeEach(() => {
        mocks.select.mockReturnValue({ eq: mocks.eq });
        mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle, order: mocks.order });
    });

    it("returns a listing and its photos", async () => {
        mocks.maybeSingle.mockResolvedValue({
            data: { listing_id: "luna", birth_date: null },
            error: null,
        });
        mocks.order.mockResolvedValue({ data: [{ id: "photo", alt_text: "Luna" }], error: null });

        expect(await getPublicListing("luna")).toEqual({
            listing: { listing_id: "luna", birth_date: null, age: null },
            photos: [{ id: "photo", alt_text: "Luna" }],
        });
    });

    it("returns null only when the listing is absent", async () => {
        mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
        expect(await getPublicListing("missing")).toBeNull();
    });

    it("surfaces listing query failures instead of returning a 404", async () => {
        mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
        await expect(getPublicListing("luna")).rejects.toThrow("Public listing query failed");
    });

    it("surfaces photo query failures instead of returning an empty gallery", async () => {
        mocks.maybeSingle.mockResolvedValue({
            data: { listing_id: "luna", birth_date: null },
            error: null,
        });
        mocks.order.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
        await expect(getPublicListing("luna")).rejects.toThrow("Public listing photos query failed");
    });
});

describe("public card photos", () => {
    it("loads ordered photos in one anonymous batch, exposing only id and alt text", async () => {
        mocks.rpc.mockResolvedValue({
            data: [
                { listing_id: "luna", birth_date: null, total_count: 2 },
                { listing_id: "thor", birth_date: null, total_count: 2 },
            ],
            error: null,
        });
        mocks.order.mockResolvedValue({
            data: [
                { id: "luna-1", listing_id: "luna", alt_text: "Prima foto" },
                { id: "thor-1", listing_id: "thor", alt_text: "Foto di Thor" },
                { id: "luna-2", listing_id: "luna", alt_text: "Seconda foto" },
            ],
            error: null,
        });
        const { rows, total } = await searchPublicListings({ page: 1 });
        expect(total).toBe(2);
        expect(mocks.from).toHaveBeenCalledExactlyOnceWith("listing_photos");
        expect(mocks.in).toHaveBeenCalledWith("listing_id", ["luna", "thor"]);
        expect(mocks.order).toHaveBeenCalledWith("position", { ascending: true });
        expect(rows[0].photos).toEqual([
            { id: "luna-1", alt_text: "Prima foto" },
            { id: "luna-2", alt_text: "Seconda foto" },
        ]);
        expect(rows[1].photos).toEqual([{ id: "thor-1", alt_text: "Foto di Thor" }]);
    });

    it("does not fetch photos for empty results", async () => {
        mocks.rpc.mockResolvedValue({ data: [], error: null });
        expect(await searchPublicListings({ page: 1 })).toEqual({ rows: [], total: 0 });
        expect(mocks.from).not.toHaveBeenCalled();
    });

    it("preserves listings without photos and surfaces query failures", async () => {
        mocks.rpc.mockResolvedValue({ data: [{ listing_id: "luna", birth_date: null }], error: null });
        mocks.order.mockResolvedValue({ data: [], error: null });
        expect((await searchPublicListings({ page: 1 })).rows[0].photos).toEqual([]);
        mocks.order.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
        await expect(searchPublicListings({ page: 1 })).rejects.toThrow("Public listing photos query failed");
    });
});
