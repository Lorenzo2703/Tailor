"use client";

import { useActionState } from "react";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { inquiryContent } from "@/lib/content/inquiries";
import { initialInquiryFormState } from "@/lib/inquiries/state";
import { createInquiry } from "@/server/actions/inquiries";

const { contact } = inquiryContent;

export function ContactForm({ listingId, animalSlug }: { listingId: string; animalSlug: string }) {
    const [state, action, pending] = useActionState(
        createInquiry.bind(null, listingId, animalSlug),
        initialInquiryFormState,
    );

    return (
        <form action={action} className="auth-form" noValidate>
            {state.status === "error" && state.message ? (
                <p className="auth-alert" role="alert">
                    {state.message}
                </p>
            ) : null}

            <div className="auth-field">
                <label className="auth-label" htmlFor="contact-message">
                    {contact.messageLabel}
                </label>
                <textarea
                    id="contact-message"
                    name="message"
                    className="auth-input"
                    rows={6}
                    maxLength={2000}
                    placeholder={contact.messagePlaceholder}
                    defaultValue={state.values?.message}
                    aria-describedby="contact-hint"
                    required
                />
                <p id="contact-hint" className="auth-hint">
                    {contact.messageHint}
                </p>
            </div>

            <TurnstileField resetKey={state.attempt} />

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? contact.submitting : contact.submit}
            </button>
        </form>
    );
}
