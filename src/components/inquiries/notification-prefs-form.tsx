"use client";

import { useActionState } from "react";
import { inquiryContent } from "@/lib/content/inquiries";
import { initialInquiryFormState } from "@/lib/inquiries/state";
import { updateNotificationPrefs } from "@/server/actions/inquiries";

const { prefs } = inquiryContent;

export function NotificationPrefsForm({ emailInquiries }: { emailInquiries: boolean }) {
    const [state, action, pending] = useActionState(updateNotificationPrefs, initialInquiryFormState);

    return (
        <form action={action} className="auth-form">
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
            <label className="auth-label" style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <input type="checkbox" name="emailInquiries" defaultChecked={emailInquiries} />
                {prefs.emailInquiries}
            </label>
            <button type="submit" className="auth-button" data-variant="secondary" disabled={pending}>
                {prefs.save}
            </button>
        </form>
    );
}
