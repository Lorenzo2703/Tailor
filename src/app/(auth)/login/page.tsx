import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/redirect";
import { authContent } from "@/lib/content/auth";
import { getCurrentUser } from "@/server/queries/session";

export const metadata: Metadata = { title: "Accedi | Tailor" };

const errorMessages: Record<string, string> = {
    callback: authContent.errors.callback,
    google: authContent.errors.google,
    rate: authContent.errors.rateLimited,
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
    return (
        <>
            <h1 className="auth-title">{authContent.login.title}</h1>
            <p className="auth-description">{authContent.login.description}</p>
            <Suspense fallback={null}>
                <LoginContent searchParams={searchParams} />
            </Suspense>
        </>
    );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
    const params = await searchParams;
    const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);
    const errorKey = Array.isArray(params.error) ? params.error[0] : params.error;
    const urlError = errorKey ? errorMessages[errorKey] : undefined;

    if (await getCurrentUser()) {
        redirect(next);
    }

    return (
        <>
            {urlError ? (
                <p className="auth-alert" role="alert" style={{ marginTop: "1.5rem" }}>
                    {urlError}
                </p>
            ) : null}
            <LoginForm next={next} />
            <GoogleButton next={next} />
        </>
    );
}
