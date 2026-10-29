"use client";

import { useActionState } from "react";
import { organizationContent } from "@/lib/content/organizations";
import { initialOrganizationFormState } from "@/lib/organizations/state";
import { uploadOrganizationDocument } from "@/server/actions/organizations";

const { manage } = organizationContent;

export function DocumentUploadForm({ organizationId }: { organizationId: string }) {
    const [state, action, pending] = useActionState(
        uploadOrganizationDocument.bind(null, organizationId),
        initialOrganizationFormState,
    );
    const fileError = state.fieldErrors?.file?.[0];

    return (
        // The key remounts the form after each attempt so the file input is cleared.
        <form key={state.attempt} action={action} className="auth-form" noValidate>
            {state.status === "error" && state.message && !fileError ? (
                <p className="auth-alert" role="alert">
                    {state.message}
                </p>
            ) : null}
            {state.status === "success" && state.message ? (
                <p className="auth-alert" data-tone="success" role="status">
                    {state.message}
                </p>
            ) : null}

            <div className="auth-field">
                <label className="auth-label" htmlFor="doc-type">
                    {manage.docType}
                </label>
                <select id="doc-type" name="docType" className="auth-input" defaultValue="registration" required>
                    {(["registration", "statute", "other"] as const).map((type) => (
                        <option key={type} value={type}>
                            {organizationContent.documentTypes[type]}
                        </option>
                    ))}
                </select>
            </div>

            <div className="auth-field">
                <label className="auth-label" htmlFor="doc-file">
                    {manage.file}
                </label>
                <input
                    id="doc-file"
                    name="file"
                    type="file"
                    className="auth-input"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    aria-invalid={fileError ? true : undefined}
                    aria-describedby={fileError ? "doc-file-error" : undefined}
                    required
                />
                {fileError ? (
                    <p id="doc-file-error" className="auth-field-error">
                        {fileError}
                    </p>
                ) : null}
            </div>

            <button type="submit" className="auth-button" disabled={pending}>
                {pending ? manage.uploading : manage.upload}
            </button>
        </form>
    );
}
