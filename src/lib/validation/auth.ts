import { z } from "zod";
import { authContent } from "@/lib/content/auth";

const { errors } = authContent;

const email = z
    .string({ error: errors.required })
    .trim()
    .toLowerCase()
    .max(254, errors.invalidEmail)
    .pipe(z.email({ error: errors.invalidEmail }));

// 72 is the bcrypt input limit; the shape matches `password_requirements = "letters_digits"`.
const password = z
    .string({ error: errors.required })
    .min(8, errors.passwordShape)
    .max(72, errors.passwordShape)
    .regex(/[A-Za-z]/, errors.passwordShape)
    .regex(/[0-9]/, errors.passwordShape);

export const loginSchema = z.object({
    email,
    password: z.string({ error: errors.required }).min(1, errors.required).max(72),
});

export const signupSchema = z.object({
    email,
    password,
    displayName: z
        .string({ error: errors.displayName })
        .trim()
        .min(2, errors.displayName)
        .max(80, errors.displayName),
    acceptTerms: z.literal("on", { error: errors.terms }),
});
