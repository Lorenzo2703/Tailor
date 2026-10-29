import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validation/auth";

const validSignup = {
    email: "  Persona@Example.TEST ",
    password: "abcdef12",
    displayName: "  Anna  ",
    accountType: "adopter",
    acceptTerms: "on",
};

describe("signupSchema", () => {
    it("normalizes email and name", () => {
        const result = signupSchema.safeParse(validSignup);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.email).toBe("persona@example.test");
            expect(result.data.displayName).toBe("Anna");
        }
    });

    it("rejects passwords without letters or digits, or too short/long", () => {
        for (const password of ["abcdefgh", "12345678", "a1", `a1${"x".repeat(80)}`]) {
            expect(signupSchema.safeParse({ ...validSignup, password }).success).toBe(false);
        }
    });

    it("only allows self-service account types", () => {
        expect(signupSchema.safeParse({ ...validSignup, accountType: "private" }).success).toBe(true);
        for (const accountType of ["admin", "shelter_member", ""]) {
            expect(signupSchema.safeParse({ ...validSignup, accountType }).success).toBe(false);
        }
    });

    it("requires accepting the terms and a valid email", () => {
        expect(signupSchema.safeParse({ ...validSignup, acceptTerms: null }).success).toBe(false);
        expect(signupSchema.safeParse({ ...validSignup, email: "not-an-email" }).success).toBe(false);
    });
});

describe("loginSchema", () => {
    it("accepts a normal login and rejects empty passwords", () => {
        expect(loginSchema.safeParse({ email: "a@example.test", password: "x" }).success).toBe(true);
        expect(loginSchema.safeParse({ email: "a@example.test", password: "" }).success).toBe(false);
    });
});
