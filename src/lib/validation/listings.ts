import { z } from "zod";
import { animalOrigins } from "@/lib/compliance";
import { listingContent } from "@/lib/content/listings";
import { isValidMicrochip, normalizeMicrochip } from "@/lib/listings/rules";

const { errors } = listingContent;

const checkbox = z
    .string()
    .optional()
    .transform((value) => value === "on");

const triState = z
    .enum(["yes", "no", "unknown"])
    .optional()
    .transform((value) => (value === "yes" ? true : value === "no" ? false : null));

const birthDate = z
    .string({ error: errors.birthDate })
    .regex(/^\d{4}-\d{2}-\d{2}$/, errors.birthDate)
    .refine((value) => {
        const time = Date.parse(`${value}T00:00:00Z`);
        return Number.isFinite(time) && time <= Date.now() && time > Date.parse("1990-01-01T00:00:00Z");
    }, errors.birthDate);

export const animalBasicsSchema = z.object({
    name: z.string({ error: errors.name }).trim().min(1, errors.name).max(60, errors.name),
    species: z.enum(["dog", "cat"], { error: errors.species }),
    sex: z.enum(["M", "F"], { error: errors.sex }),
    birthDate,
    size: z.enum(["small", "medium", "large"], { error: errors.size }),
    breed: z
        .string()
        .trim()
        .max(80, errors.tooLong)
        .optional()
        .transform((value) => value ?? ""),
    city: z.string({ error: errors.city }).trim().min(2, errors.city).max(80, errors.city),
});

export const newListingSchema = animalBasicsSchema.extend({
    owner: z.string({ error: errors.owner }).min(1, errors.owner),
    listingType: z.enum(["adoption", "gift"], { error: errors.type }),
});

export const healthSchema = z
    .object({
        vaccinated: checkbox,
        sterilized: checkbox,
        healthNotes: z
            .string()
            .trim()
            .max(2000, errors.tooLong)
            .optional()
            .transform((value) => value ?? ""),
        origin: z.enum(animalOrigins, { error: errors.origin }),
        microchip: z
            .string()
            .optional()
            .transform((value) => normalizeMicrochip(value ?? "")),
    })
    .refine((value) => value.microchip === "" || isValidMicrochip(value.microchip), {
        path: ["microchip"],
        error: errors.microchip,
    });

export const storySchema = z.object({
    goodWithKids: triState,
    goodWithDogs: triState,
    goodWithCats: triState,
    apartmentOk: triState,
    story: z
        .string({ error: errors.storyShort })
        .trim()
        .min(30, errors.storyShort)
        .max(5000, errors.tooLong),
});

export const photoMetaSchema = z.object({
    altText: z.string({ error: errors.altText }).trim().min(3, errors.altText).max(300, errors.altText),
});

export const listingActionSchema = z.enum(["reserve", "reopen", "adopted", "withdraw", "extend", "delete"]);
