import { z } from "zod";
import { organizationVerification } from "@/lib/compliance";
import { organizationContent } from "@/lib/content/organizations";

const { errors } = organizationContent;

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max, errors.tooLong)
        .optional()
        .transform((value) => value ?? "");

export const createOrganizationSchema = z.object({
    type: z.enum(organizationVerification.selfServiceTypes, { error: errors.type }),
    name: z.string({ error: errors.name }).trim().min(2, errors.name).max(120, errors.name),
    region: z.string({ error: errors.region }).trim().min(2, errors.region).max(80, errors.region),
    city: z.string({ error: errors.city }).trim().min(2, errors.city).max(80, errors.city),
    description: optionalText(2000),
    legalName: optionalText(200),
    registrationNumber: optionalText(80),
    contactEmail: z
        .string()
        .trim()
        .toLowerCase()
        .max(200, errors.tooLong)
        .optional()
        .transform((value) => value ?? "")
        .refine((value) => value === "" || z.email().safeParse(value).success, errors.email),
    contactPhone: optionalText(40),
});

export const uploadDocumentSchema = z.object({
    docType: z.enum(organizationVerification.documentTypes, { error: errors.docType }),
});

export const reviewOrganizationSchema = z
    .object({
        decision: z.enum(["verified", "rejected"], { error: errors.decision }),
        reason: z.string().trim().max(1000, errors.tooLong).optional().transform((value) => value ?? ""),
    })
    .refine((value) => value.decision === "verified" || value.reason.length >= 5, {
        path: ["reason"],
        error: errors.reasonRequired,
    });
