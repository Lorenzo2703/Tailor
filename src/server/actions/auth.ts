"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth/redirect";
import type { AuthFormState } from "@/lib/auth/state";
import { authContent } from "@/lib/content/auth";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation/auth";
import { checkRateLimit, getClientIp, rateLimitPolicies } from "@/server/rate-limit";
import { verifyTurnstile } from "@/server/turnstile";

const { errors } = authContent;

function fail(
    prev: AuthFormState,
    message: string,
    fieldErrors?: AuthFormState["fieldErrors"],
    values?: AuthFormState["values"],
): AuthFormState {
    return { status: "error", message, fieldErrors, values, attempt: prev.attempt + 1 };
}

function text(value: FormDataEntryValue | null): string {
    return typeof value === "string" ? value.slice(0, 254) : "";
}

// Emails are hashed so raw addresses are never stored in the rate-limit store.
function emailKey(email: string): string {
    return createHash("sha256").update(email).digest("hex");
}

export async function signUp(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
    const values = {
        email: text(formData.get("email")),
        displayName: text(formData.get("displayName")),
        accountType: text(formData.get("accountType")),
    };
    const parsed = signupSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        displayName: formData.get("displayName"),
        accountType: formData.get("accountType"),
        acceptTerms: formData.get("acceptTerms"),
    });
    if (!parsed.success) {
        return fail(prev, errors.generic, z.flattenError(parsed.error).fieldErrors, values);
    }
    const { email, password, displayName, accountType } = parsed.data;

    const ip = await getClientIp();
    const allowed =
        (await checkRateLimit(rateLimitPolicies.signupIp, ip ?? "unknown")) &&
        (await checkRateLimit(rateLimitPolicies.signupEmail, emailKey(email)));
    if (!allowed) {
        return fail(prev, errors.rateLimited, undefined, values);
    }

    if (!(await verifyTurnstile(formData.get("cf-turnstile-response"), ip))) {
        return fail(prev, errors.captcha, undefined, values);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${getSiteUrl()}/auth/callback`,
            data: {
                display_name: displayName,
                account_type: accountType,
                terms_accepted_at: new Date().toISOString(),
            },
        },
    });

    if (error) {
        if (error.code === "weak_password") {
            return fail(prev, errors.weakPassword, undefined, values);
        }
        if (error.status === 429) {
            return fail(prev, errors.rateLimited, undefined, values);
        }
        return fail(prev, errors.generic, undefined, values);
    }

    // Same response whether or not the address already exists, to avoid account enumeration.
    return { status: "success", message: authContent.signup.checkEmailBody, attempt: prev.attempt + 1 };
}

export async function signIn(prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
    const values = { email: text(formData.get("email")) };
    const parsed = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });
    if (!parsed.success) {
        return fail(prev, errors.invalidCredentials, undefined, values);
    }
    const { email, password } = parsed.data;

    const ip = await getClientIp();
    const allowed =
        (await checkRateLimit(rateLimitPolicies.loginIp, ip ?? "unknown")) &&
        (await checkRateLimit(rateLimitPolicies.loginEmail, emailKey(email)));
    if (!allowed) {
        return fail(prev, errors.rateLimited, undefined, values);
    }

    if (!(await verifyTurnstile(formData.get("cf-turnstile-response"), ip))) {
        return fail(prev, errors.captcha, undefined, values);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        if (error.code === "email_not_confirmed") {
            return fail(prev, errors.emailNotConfirmed, undefined, values);
        }
        if (error.status === 429) {
            return fail(prev, errors.rateLimited, undefined, values);
        }
        return fail(prev, errors.invalidCredentials, undefined, values);
    }

    redirect(safeNextPath(formData.get("next")));
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
    if (process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH !== "true") {
        redirect("/login?error=google");
    }

    const ip = await getClientIp();
    if (!(await checkRateLimit(rateLimitPolicies.oauthIp, ip ?? "unknown"))) {
        redirect("/login?error=rate");
    }

    const next = safeNextPath(formData.get("next"));
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
    });

    if (error || !data.url) {
        redirect("/login?error=google");
    }
    redirect(data.url);
}

export async function signOut(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}
