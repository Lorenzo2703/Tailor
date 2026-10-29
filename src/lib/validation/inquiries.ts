import { z } from "zod";
import { inquiryContent } from "@/lib/content/inquiries";

const { errors } = inquiryContent;

export const MAX_LINKS = 2;

export function countLinks(text: string): number {
    return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

export const inquiryMessageSchema = z.object({
    message: z
        .string({ error: errors.messageInvalid })
        .trim()
        .min(1, errors.messageInvalid)
        .max(2000, errors.messageInvalid)
        .refine((value) => countLinks(value) <= MAX_LINKS, errors.tooManyLinks),
});

export const inquiryStatusSchema = z.enum(["open", "closed", "blocked"]);

export const notificationPrefsSchema = z.object({
    emailInquiries: z
        .string()
        .optional()
        .transform((value) => value === "on"),
});
