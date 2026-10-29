import { z } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const favoriteToggleSchema = z.object({
    listingId: z.string().trim().refine((val) => UUID_REGEX.test(val), {
        message: "ID annuncio non valido",
    }),
});

export type FavoriteToggleInput = z.infer<typeof favoriteToggleSchema>;

export const deleteAccountSchema = z.object({
    confirmation: z.string().trim().refine((val) => val === "ELIMINA", {
        message: "Digita 'ELIMINA' per confermare",
    }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
