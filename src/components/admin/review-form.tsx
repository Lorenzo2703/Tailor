"use client";

import { useActionState } from "react";
import { organizationContent } from "@/lib/content/organizations";
import { initialOrganizationFormState } from "@/lib/organizations/state";
import { reviewOrganization } from "@/server/actions/organizations";

const { admin } = organizationContent;

export function ReviewForm({ organizationId }: { organizationId: string }) {
    const [state, action, pending] = useActionState(
        reviewOrganization.bind(null, organizationId),
        initialOrganizationFormState,
    );
    const reasonError = state.fieldErrors?.reason?.[0];
    const decisionError = state.fieldErrors?.decision?.[0];

    return (
        <form action={action} className="auth-form" style={{ marginTop: 0 }} noValidate>
            {state.status === "error" && state.message && !state.fieldErrors ? (
                <p className="auth-alert" role="alert">
                    {state.message}
                </p>
            ) : null}
            {state.status === "success" && state.message ? (
                <p className="auth-alert" data-tone="success" role="status">
                    {state.message}
                </p>
            ) : null}

            <fieldset className="auth-fieldset">
                <legend className="auth-label">{admin.decision}</legend>
                {(["verified", "rejected"] as const).map((decision) => (
                    <label key={decision} className="auth-option">
                        <input type="radio" name="decision" value={decision} required />
                        <span className="auth-option-title">{decision === "verified" ? admin.verify : admin.reject}</span>
                    </label>
                ))}
                {decisionError ? <p className="auth-field-error">{decisionError}</p> : null}
            </fieldset>

            <div className="auth-field">
                <label className="auth-label" htmlFor={`reason-${organizationId}`}>
                    {admin.reason}
                </label>
                <textarea
                    id={`reason-${organizationId}`}
                    name="reason"
                    className="auth-input"
                    maxLength={1000}
                    defaultValue={state.values?.reason}
                    aria-invalid={reasonError ? true : undefined}
                    aria-describedby={`reason-${organizationId}-note`}
                />
                <p
                    id={`reason-${organizationId}-note`}
                    className={reasonError ? "auth-field-error" : "auth-hint"}
                >
                    {reasonError ?? admin.reasonHint}
                </p>
            </div>

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? admin.submitting : admin.submit}
            </button>
        </form>
    );
}
