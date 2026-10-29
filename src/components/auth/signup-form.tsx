"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { initialAuthFormState } from "@/lib/auth/state";
import { authContent } from "@/lib/content/auth";
import { signUp } from "@/server/actions/auth";

const { signup, fields } = authContent;

export function SignupForm({ next }: { next: string }) {
    const [state, action, pending] = useActionState(signUp, initialAuthFormState);
    const errorOf = (name: string) => state.fieldErrors?.[name]?.[0];

    if (state.status === "success") {
        return (
            <>
                <h1 className="auth-title">{signup.checkEmailTitle}</h1>
                <p className="auth-alert" data-tone="success" role="status" style={{ marginTop: "1.5rem" }}>
                    {state.message}
                </p>
                <p className="auth-footer">
                    <Link className="auth-link" href="/login">
                        {signup.haveAccountLink}
                    </Link>
                </p>
            </>
        );
    }

    return (
        <>
            <h1 className="auth-title">{signup.title}</h1>
            <p className="auth-description">{signup.description}</p>

            <form action={action} className="auth-form" noValidate>
                {state.status === "error" && state.message && !state.fieldErrors ? (
                    <p className="auth-alert" role="alert">
                        {state.message}
                    </p>
                ) : null}

                <div className="auth-field">
                    <label className="auth-label" htmlFor="signup-name">
                        {fields.displayName}
                    </label>
                    <input
                        id="signup-name"
                        name="displayName"
                        type="text"
                        className="auth-input"
                        autoComplete="name"
                        defaultValue={state.values?.displayName}
                        aria-invalid={errorOf("displayName") ? true : undefined}
                        aria-describedby={errorOf("displayName") ? "signup-name-error" : "signup-name-hint"}
                        required
                    />
                    {errorOf("displayName") ? (
                        <p id="signup-name-error" className="auth-field-error">
                            {errorOf("displayName")}
                        </p>
                    ) : (
                        <p id="signup-name-hint" className="auth-hint">
                            {fields.displayNameHint}
                        </p>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-label" htmlFor="signup-email">
                        {fields.email}
                    </label>
                    <input
                        id="signup-email"
                        name="email"
                        type="email"
                        className="auth-input"
                        autoComplete="email"
                        defaultValue={state.values?.email}
                        aria-invalid={errorOf("email") ? true : undefined}
                        aria-describedby={errorOf("email") ? "signup-email-error" : undefined}
                        required
                    />
                    {errorOf("email") ? (
                        <p id="signup-email-error" className="auth-field-error">
                            {errorOf("email")}
                        </p>
                    ) : null}
                </div>

                <div className="auth-field">
                    <label className="auth-label" htmlFor="signup-password">
                        {fields.password}
                    </label>
                    <input
                        id="signup-password"
                        name="password"
                        type="password"
                        className="auth-input"
                        autoComplete="new-password"
                        aria-invalid={errorOf("password") ? true : undefined}
                        aria-describedby={errorOf("password") ? "signup-password-error" : "signup-password-hint"}
                        required
                    />
                    {errorOf("password") ? (
                        <p id="signup-password-error" className="auth-field-error">
                            {errorOf("password")}
                        </p>
                    ) : (
                        <p id="signup-password-hint" className="auth-hint">
                            {fields.passwordHint}
                        </p>
                    )}
                </div>

                <div className="auth-field">
                    <label className="auth-option">
                        <input
                            type="checkbox"
                            name="acceptTerms"
                            aria-invalid={errorOf("acceptTerms") ? true : undefined}
                            aria-describedby={errorOf("acceptTerms") ? "signup-terms-error" : undefined}
                            required
                        />
                        <span className="auth-hint">{signup.terms}</span>
                    </label>
                    {errorOf("acceptTerms") ? (
                        <p id="signup-terms-error" className="auth-field-error">
                            {errorOf("acceptTerms")}
                        </p>
                    ) : null}
                </div>

                <TurnstileField resetKey={state.attempt} />

                <button type="submit" className="auth-button" disabled={pending}>
                    {pending ? signup.submitting : signup.submit}
                </button>
            </form>

            <p className="auth-footer">
                {signup.haveAccount}{" "}
                <Link className="auth-link" href={`/login?next=${encodeURIComponent(next)}`}>
                    {signup.haveAccountLink}
                </Link>
            </p>
        </>
    );
}
