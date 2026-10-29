import { describe, expect, it } from "vitest";
import { deleteAccountSchema, favoriteToggleSchema } from "./favorites";

describe("favorites validation", () => {
    it("validates valid uuid listingId", () => {
        const res = favoriteToggleSchema.safeParse({
            listingId: "11111111-1111-1111-1111-111111111111",
        });
        expect(res.success).toBe(true);
    });

    it("rejects invalid uuid", () => {
        const res = favoriteToggleSchema.safeParse({
            listingId: "invalid-uuid",
        });
        expect(res.success).toBe(false);
    });

    it("requires ELIMINA for account deletion", () => {
        expect(deleteAccountSchema.safeParse({ confirmation: "ELIMINA" }).success).toBe(true);
        expect(deleteAccountSchema.safeParse({ confirmation: "elimina" }).success).toBe(false);
        expect(deleteAccountSchema.safeParse({ confirmation: "" }).success).toBe(false);
    });
});
