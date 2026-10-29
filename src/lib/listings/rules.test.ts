import { describe, expect, it } from "vitest";
import {
    ageInDays,
    detectPhotoMime,
    isOldEnough,
    isValidMicrochip,
    normalizeMicrochip,
    requiresMicrochip,
} from "@/lib/listings/rules";
import {
    animalBasicsSchema,
    healthSchema,
    newListingSchema,
    photoMetaSchema,
    storySchema,
} from "@/lib/validation/listings";

const bytes = (...values: number[]) => new Uint8Array(values);

describe("microchip rules", () => {
    it("normalizes separators and validates 15 digits", () => {
        expect(normalizeMicrochip("380 260 100-123 456")).toBe("380260100123456");
        expect(isValidMicrochip("380260100123456")).toBe(true);
        expect(isValidMicrochip("38026010012345")).toBe(false);
        expect(isValidMicrochip("38026010012345A")).toBe(false);
    });

    it("requires a microchip for dogs but not for cats", () => {
        expect(requiresMicrochip("dog")).toBe(true);
        expect(requiresMicrochip("cat")).toBe(false);
    });
});

describe("minimum age", () => {
    const today = new Date("2026-10-28T12:00:00Z");

    it("computes whole days from the birth date", () => {
        expect(ageInDays("2026-10-27", today)).toBe(1);
        expect(ageInDays("2026-08-29", today)).toBe(60);
    });

    it("blocks animals younger than 60 days", () => {
        expect(isOldEnough("2026-08-29", today)).toBe(true);
        expect(isOldEnough("2026-08-30", today)).toBe(false);
    });
});

describe("detectPhotoMime", () => {
    it("recognizes JPEG, PNG and WebP by signature", () => {
        expect(detectPhotoMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
        expect(detectPhotoMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
        expect(
            detectPhotoMime(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50)),
        ).toBe("image/webp");
    });

    it("rejects PDFs, executables and RIFF files that are not WebP", () => {
        expect(detectPhotoMime(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBeNull();
        expect(detectPhotoMime(bytes(0x4d, 0x5a))).toBeNull();
        expect(detectPhotoMime(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45))).toBeNull();
        expect(detectPhotoMime(bytes())).toBeNull();
    });
});

describe("listing schemas", () => {
    const basics = {
        name: " Poldo ",
        species: "dog",
        sex: "M",
        birthDate: "2022-05-14",
        size: "medium",
        city: "Roma",
    };

    it("accepts valid basics and trims text", () => {
        const result = animalBasicsSchema.safeParse(basics);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe("Poldo");
            expect(result.data.breed).toBe("");
        }
    });

    it("rejects future or implausible birth dates", () => {
        expect(animalBasicsSchema.safeParse({ ...basics, birthDate: "2999-01-01" }).success).toBe(false);
        expect(animalBasicsSchema.safeParse({ ...basics, birthDate: "1900-01-01" }).success).toBe(false);
        expect(animalBasicsSchema.safeParse({ ...basics, birthDate: "14/05/2022" }).success).toBe(false);
    });

    it("only accepts the supported species, sexes and listing types", () => {
        expect(animalBasicsSchema.safeParse({ ...basics, species: "rabbit" }).success).toBe(false);
        expect(newListingSchema.safeParse({ ...basics, owner: "personal", listingType: "sale" }).success).toBe(false);
        expect(newListingSchema.safeParse({ ...basics, owner: "personal", listingType: "gift" }).success).toBe(true);
    });

    it("normalizes the microchip and keeps it optional while drafting", () => {
        const withChip = healthSchema.safeParse({ origin: "stray_rescued", microchip: "380 260 100 123 456" });
        expect(withChip.success && withChip.data.microchip).toBe("380260100123456");
        expect(healthSchema.safeParse({ origin: "stray_rescued" }).success).toBe(true);
        expect(healthSchema.safeParse({ origin: "stray_rescued", microchip: "123" }).success).toBe(false);
        expect(healthSchema.safeParse({ origin: "unknown" }).success).toBe(false);
    });

    it("maps trait answers to true, false or unknown", () => {
        const result = storySchema.safeParse({
            goodWithKids: "yes",
            goodWithDogs: "no",
            goodWithCats: "unknown",
            story: "Una storia abbastanza lunga da superare il minimo richiesto.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.goodWithKids).toBe(true);
            expect(result.data.goodWithDogs).toBe(false);
            expect(result.data.goodWithCats).toBeNull();
            expect(result.data.apartmentOk).toBeNull();
        }
    });

    it("requires a real story and an alt text", () => {
        expect(storySchema.safeParse({ story: "troppo corta" }).success).toBe(false);
        expect(photoMetaSchema.safeParse({ altText: "  " }).success).toBe(false);
        expect(photoMetaSchema.safeParse({ altText: "Cane marrone sul prato" }).success).toBe(true);
    });
});
