"use client";

import { useActionState, useEffect, useRef } from "react";
import { inquiryContent } from "@/lib/content/inquiries";
import { initialInquiryFormState } from "@/lib/inquiries/state";
import { postInquiryMessage } from "@/server/actions/inquiries";

const { thread } = inquiryContent;

export function ReplyForm({ inquiryId }: { inquiryId: string }) {
    const [state, action, pending] = useActionState(
        postInquiryMessage.bind(null, inquiryId),
        initialInquiryFormState,
    );
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.status === "success") {
            formRef.current?.reset();
        }
    }, [state]);

    return (
        <form ref={formRef} action={action} className="auth-form" noValidate>
            {state.status === "error" && state.message ? (
                <p className="auth-alert" role="alert">
                    {state.message}
                </p>
            ) : null}
            {state.status === "success" && state.message ? (
                <p className="auth-hint" role="status">
                    {state.message}
                </p>
            ) : null}

            <div className="auth-field">
                <label className="auth-label" htmlFor="reply-message">
                    {thread.reply}
                </label>
                <textarea
                    id="reply-message"
                    name="message"
                    className="auth-input"
                    rows={4}
                    maxLength={2000}
                    defaultValue={state.values?.message}
                    required
                />
            </div>

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? thread.sending : thread.send}
            </button>
        </form>
    );
}
