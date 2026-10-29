"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { initialAuthFormState } from "@/lib/auth/state";
import { authContent } from "@/lib/content/auth";
import { signIn } from "@/server/actions/auth";

const { login, fields } = authContent;

export function LoginForm({ next }: { next: string }) {
    const [state, action, pending] = useActionState(signIn, initialAuthFormState);

    return (
        <>
            <form action={action} className="auth-form" noValidate>
                {state.status === "error" && state.message ? (
                    <p className="auth-alert" role="alert">
                        {state.message}
                    </p>
                ) : null}

                <input type="hidden" name="next" value={next} />

                <div className="auth-field">
                    <label className="auth-label" htmlFor="login-email">
                        {fields.email}
                    </label>
                    <input
                        id="login-email"
                        name="email"
                        type="email"
                        className="auth-input"
                        autoComplete="email"
                        defaultValue={state.values?.email}
                        required
                    />
                </div>

                <div className="auth-field">
                    <label className="auth-label" htmlFor="login-password">
                        {fields.password}
                    </label>
                    <input
                        id="login-password"
                        name="password"
                        type="password"
                        className="auth-input"
                        autoComplete="current-password"
                        required
                    />
                </div>

                <TurnstileField resetKey={state.attempt} />

                <button type="submit" className="auth-button" disabled={pending}>
                    {pending ? login.submitting : login.submit}
                </button>
            </form>

            <p className="auth-footer">
                {login.noAccount}{" "}
                <Link className="auth-link" href={`/signup?next=${encodeURIComponent(next)}`}>
                    {login.noAccountLink}
                </Link>
            </p>
        </>
    );
}
