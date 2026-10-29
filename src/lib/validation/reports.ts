import { z } from "zod";
import { reportReasons, reportStatuses } from "@/lib/content/reports";
import { reportContent } from "@/lib/content/reports";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const { errors } = reportContent;

export const createReportSchema = z.object({
    listingId: z.string().trim().refine((val) => UUID_REGEX.test(val), {
        message: errors.invalidListing,
    }),
    reason: z.enum(reportReasons, {
        message: errors.invalidReason,
    }),
    details: z
        .string()
        .trim()
        .min(10, errors.detailsTooShort)
        .max(2000, errors.detailsTooLong),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const resolveReportSchema = z.object({
    reportId: z.string().trim().refine((val) => UUID_REGEX.test(val), {
        message: "ID segnalazione non valido",
    }),
    status: z.enum(reportStatuses, {
        message: "Stato non valido",
    }),
    takedownListing: z
        .string()
        .optional()
        .transform((val) => val === "true"),
    notes: z.string().trim().max(2000, "Le note non possono superare 2000 caratteri").optional().default(""),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
